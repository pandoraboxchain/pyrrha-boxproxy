'use strict';
const debug = require('debug')('boxproxy');
const WebSocketServer = require('websocket').server;
const http = require('http');
const server = http.createServer();

const connectionList = [];

module.exports = config => {
    server.listen(config.wsport, () => { });

    const wsServer = new WebSocketServer({
        httpServer: server
    });

    wsServer.on('request', request => {
        let connection = request.accept(null, request.origin);
        connectionList.push(connection);
        connection.on('message', (message) => {
            
            if (message.type === 'utf8') {

                debug(message);
            }
        });

        connection.on('close', connection => {            
            let index = connectionList.indexOf(connection);

            if (index !== -1) {
                array.splice(index, 1);
            }
        });
    });

    wsServer.push = data => {

        debug('ws:data:', data);

        connectionList.map(connection => connection.sendUTF(
            JSON.stringify(data)
        ));
    };

    wsServer.close = (callback = () => {}) => {
        wsServer.shutDown();
        server.close(callback);
    };

    return wsServer;
};
