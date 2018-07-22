module.exports = function (kibana) {
  return new kibana.Plugin({
    name: 'timelion-influxdb',
    require: ['timelion'],
    init: function (server) {
      server.plugins.timelion.addFunction(require('./functions/influxdb'));
    }
  });
};
