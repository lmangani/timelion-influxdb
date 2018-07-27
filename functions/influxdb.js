var alter = require('../../../src/core_plugins/timelion/server/lib/alter.js')
var Datasource = require('../../../src/core_plugins/timelion/server/lib/classes/datasource')
var fetch = require('node-fetch')
fetch.Promise = require('bluebird')
var _ = require('lodash')
const querystring = require('querystring');
const URL = require('url').Url;
import moment from 'moment';

/*
  This timelion plugin can pull data from you InfluxDB deployment.

  Configure hostname, port and optional auth in the file
  kibana/src/core_plugins/timelion/timelion.json.

  See README.md for instructions
*/

module.exports = new Datasource('influxdb', {
  args: [
    {
      name: 'label',
      types: ['string', 'null'],
      help: 'The label for the chart'
    },
    {
      name: 'hostname',
      types: ['string', 'null'],
      help: 'The InfluxDB host to query.'
    },
    {
      name: 'port',
      types: ['string', 'null'],
      help: 'The InfluxDB port to query.'
    },
    {
      name: 'db',
      types: ['string', 'null'],
      help: 'The database to query.'
    },
    {
      name: 'policy',
      types: ['string', 'autogen'],
      help: 'The retention policy to plot.'
    },
    {
      name: 'metric',
      types: ['string', 'null'],
      help: 'The metric measurement to plot.'
    },
    {
      name: 'field',
      types: ['string', 'null'],
      help: 'The metric field to plot.'
    },
    {
      name: 'where',
      types: ['string', 'null'],
      help: 'The where condition to plot, ie: region=west'
    },
    {
      name: 'groupBy',
      types: ['string', '1m'],
      help: 'Timeseries grouping measure, ie: 1m'
    }
  ],
  help: 'Pull data from InfluxDB.',

  fn: function influxdbFn (args, tlConfig) {
    var config = _.defaults(args.byName, {
      deviceId: 1,
      chartId: 1000,
      label: 'Data from InfluxDB'
    })

    /*
      For details of the URL, see the SL API Documentation.
      beginstamp and endstamp are both required, and need to be in Seconds
      since Epoch (Kibana provides them in milliseconds since Epoch)
    */
    var beginTime = new Date(tlConfig.time.from).toISOString()
    var endTime = new Date(tlConfig.time.to).toISOString()
    var username = tlConfig.settings['timelion:influxdb.username']
    var password = tlConfig.settings['timelion:influxdb.password']
    var sl_hostname = tlConfig.settings['timelion:influxdb.hostname']
    var sl_port = tlConfig.settings['timelion:influxdb.port'] || 8086
    var sl_policy = tlConfig.settings['timelion:influxdb.policy'] || 'autogen'
    var sl_groupBy = tlConfig.settings['timelion:influxdb.groupBy'] || '1m'

    if (!sl_hostname && !config.hostname) {
      throw new Error('influxdb plugin: hostname must be configured! ' +
        'Edit the file kibana/src/core_plugins/timelion/timelion.json or add a hostname parameter.')
    }

    if (!config.db && !config.metric) {
      throw new Error('influxdb plugin: db and metric must be defined!')
    }

    var Q = '';
        Q +=  'SELECT mean("' + config.field + '")';
        Q +=  ' FROM "' + config.db + '"."' +sl_policy + '"."' +config.metric+ '"';
        Q +=  " WHERE time > '" + beginTime + "' AND time < '" + endTime + "'";
        if (config.where) Q += ' AND ' + config.where;
        if (sl_groupBy) Q += ' GROUP BY time('+sl_groupBy+') FILL(0)';

    var PARAMS = {
        q: Q,
	db: config.db
    };
    if (config.username && config.password) { PARAMS.username = config.username; PARAMS.password = config.password; } 
    var QPARAMS = querystring.stringify(PARAMS);

    var url = 'http://' + (config.hostname || sl_hostname) + ':' + (config.port || sl_port) + '/query?' + QPARAMS;
    console.log('INFLUX QUERY URL:',url,PARAMS)

    return fetch(url)
     .then(res => res.json())
     .then(function (resp) {
      // Debug
      console.log('INFLUX RESP:', resp)

      if (resp.errors || !resp) {
        throw new Error('Error connecting to InfluxDB API: ' +
          resp.errors[0].errorcode + ' ' + resp.errors[0].message || resp.code)
      }
      if (!resp.results || !resp.results[0].series[0]) {
        throw new Error('No results from InfluxDB API! ')
      }

      // Format data for timelion
      var data = _.compact(_.map(resp.results[0].series[0].values, function (pair, count) {
	if (pair[1] == null || !pair[1] ) return;
        return [ moment(pair[0]).valueOf(), pair[1] ]
      }));

      return {
        type: 'seriesList',
        list: [{
          data: data,
          type: 'series',
          label: config.label,
	  meta: {
            influxdb_request: Q
          }
        }]
      }
    }).catch(function (e) {
      throw e
    })
  }
})
