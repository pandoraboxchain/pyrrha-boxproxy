'use strict';
const WebSocketServer = require('websocket').server;
const http = require('http');
const server = http.createServer((request, response) => { });

const connectionList = []

module.exports = function (config) {
  server.listen(config.wsport, () => { });

  const wsServer = new WebSocketServer({
    httpServer: server
  });

  wsServer.on('request', function (request) {
    var connection = request.accept(null, request.origin);
    connectionList.push(connection);
    connection.on('message', function (message) {
      if (message.type === 'utf8') { }
    });

    connection.on('close', function (connection) {
      let index = connectionList.indexOf(connection);
      if (index !== -1) {
        array.splice(index, 1);
      }
    });
  });

  return wsServer;
};

module.exports.pushToWS = (data) => {
  connectionList.map(connection => {
    connection.sendUTF(
      JSON.stringify(data)
    );
  })
};
