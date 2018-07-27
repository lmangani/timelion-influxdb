# InfluxDB plugin for Timelion

[Timelion](https://www.elastic.co/blog/timelion-timeline) (part of [Kibana](https://www.elastic.co/products/kibana)) provides a plugin mechanism by which you can create your own connectors to external datasets.

This plugin allows you to render data from the [TICK](https://portal.influxdata.com/downloads) stack inside the Kibana web interface, without having to duplicate timeseries into Elasticsearch.

![image](https://user-images.githubusercontent.com/1423657/43320289-4f1074d0-91a8-11e8-9c4e-7964002a7f16.png)




## Installation instructions

* Extract the contents of this repository into kibana/plugins/timelion-influxdb
* remove the file "gulpfile.js" (it's only needed for development purposes)
* Add *OPTIONAL* InfluxDB hostname, username and password to src/core_plugins/timelion/timelion.json, e.g.
```
"influxdb": {
    "hostname": "my.influx.db",
    "port": 8086,
    "username": "username",
    "password": "password"
  },
```
* restart Kibana


## Usage (within Kibana's Timelion)
#### Parameters
![image](https://user-images.githubusercontent.com/1423657/43320300-560a576a-91a8-11e8-9ad7-45cc6993c254.png)

#### Example:
```
.influxdb(hostname='my.influx.db', db='telegraf', label='mem',metric='cpu', groupBy="1m", policy="autogen", field="usage_system")
```

## Versions

The plugin is intended for use with Kibana 5 and 6

If you are using a version of Kibana, you will need to edit kibana.version in the "package.json" file.


## Development/Debugging instructions.

Install the code using "npm install" and "npm start" as described in the demo plugin, [timelion-random](https://github.com/rashidkpc/timelion-random)


## Other plugins that might be of interest

* [Random](https://github.com/rashidkpc/timelion-random) (by the author of Timelion) - A demo showing how to create a timelion plugin
* [USAFacts](https://github.com/rashidkpc/timelion-usafacts) (by the author of Timelion) - grabs series data from [usafacts.org](http://usafacts.org)
* [Google Analytics](https://github.com/bahaaldine/timelion-google-analytics) - brings Google Analytics data to Timelion
* [Mathlion](https://github.com/fermiumlabs/mathlion) (from Fermium Labs) - enables equation parsing and advanced maths

## Credits

This project is sponsored by [QXIP BV](http://qxip.net)
