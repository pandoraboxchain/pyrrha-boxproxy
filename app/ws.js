var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {});
server.listen(1337, function() { });

wsServer = new WebSocketServer({
  httpServer: server
});

let connectionList = []

var wsServer = wsServer.on('request', function(request) {
  var connection = request.accept(null, request.origin);
  connectionList.push(connection);
  connection.on('message', function(message) {
    if (message.type === 'utf8') {}
  });

  connection.on('close', function(connection) {
    let index = connectionList.indexOf(connection);
    if (index !== -1) {
        array.splice(index, 1);
    }
  });
});

function pushToWS(data){
  connectionList.map(connection => {
    connection.sendUTF(
      JSON.stringify(data)
    );
  })
}

exports.wsServer = wsServer;
module.exports.pushToWS = pushToWS;
