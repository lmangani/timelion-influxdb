var alter = require('../../../src/core_plugins/timelion/server/lib/alter.js');
var Datasource = require('../../../src/core_plugins/timelion/server/lib/classes/datasource');
var fetch = require('node-fetch');
fetch.Promise = require('bluebird');
var _ = require('lodash');

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
      name: 'db',
      types: ['string', 'null'],
      help: 'The database to query.'
    },
    {
      name: 'metric',
      types: ['string', 'null'],
      help: 'The metric to plot.'
    },
    {
      name: 'where',
      types: ['string', 'null'],
      help: 'The where condition to plot, ie: region=west' +
    }
  ],
  help: 'Pull data from InfluxDB.',

  fn: function influxdbFn(args, tlConfig) {
    var config = _.defaults(args.byName, {
      deviceId: 1,
      chartId: 1000,
      label: 'Data from InfluxDB'
    });

    /*
      For details of the URL, see the SL API Documentation.
      beginstamp and endstamp are both required, and need to be in Seconds
      since Epoch (Kibana provides them in milliseconds since Epoch)
    */
    var beginTime = Math.floor(tlConfig.time.from / 1000);
    var endTime = Math.floor(tlConfig.time.to / 1000);
    var username = tlConfig.settings['timelion:influxdb.username'];
    var password = tlConfig.settings['timelion:influxdb.password'];
    var sl_hostname = tlConfig.settings['timelion:influxdb.hostname']
    var sl_hostname = tlConfig.settings['timelion:influxdb.port'] || 8086

    var URL = 'http://' + sl_hostname + ':' + sl_port + '/query';
    var DATA = {
	q: 'SELECT * from ' + config.metric + ' WHERE time > ' +begintime+ ' AND time < ' +endTime+ ',
	db: config.db,
	epoch: 's'
    };
    if(config.where) DATA.q += ' AND ' + config.where;

    if (!sl_hostname) {
      throw new Error('influxdb plugin: hostname, username and password must be configured. ' +
        'Edit the file kibana/src/core_plugins/timelion/timelion.json. ');
    }

    var urlOptions = {
      method: 'POST',
      data: DATA,
      headers: {
        'Pragma': 'no-cache',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'x-em7-guid-paths': 1,
        'Accept-Encoding': 'gzip, deflate'
      }

    if(username && password) {
      var authString = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
      urlOptions.headers['Authorization'] = authString;
    }

    };

    /*
    console.log('influxdb plugin: URL = ' + URL);
    console.log('influxdb plugin: Fetching from https://' + sl_hostname);
    console.log('influxdb plugin: Date range: ' + new Date(tlConfig.time.from).toISOString() +
                ' -> ' + new Date(tlConfig.time.to).toISOString());
    /* */

    return fetch(URL, urlOptions).then(function (resp) {
      return resp.json();
    }).then(function (resp) {

      if (resp.errors) {
        throw new Error('Error connecting to influxdb: ' +
          resp.errors[0].errorcode + ' ' + resp.errors[0].message);
      }
      // SL supplies secs since epoch. Kibana wants ms since epoch
      var data = _.map(resp.resuts.series[0].values[0], function (timestamp, value) {
        return [(timestamp * 1000), value ];
      });
      return {
        type: 'seriesList',
        list: [{
          data: data,
          type: 'series',
          fit: 'nearest',
          label: config.label
        }]
      };
    }).catch(function (e) {
      throw e;
    });
  }
});
