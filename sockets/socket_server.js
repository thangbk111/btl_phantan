function createSocket() {
    var socketServer = require('http').createServer();
    var io = require('socket.io')(socketServer);
    socketServer.listen(8080, () => console.log('Socket Server listening port 8080'));
    return io;
}

module.exports.createSocket = createSocket;