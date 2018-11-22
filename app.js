const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const morgan = require('morgan');
var users = require('./routes/users');
var meetings = require('./routes/meetings');
var roles = require('./routes/roles');
var subContents = require('./routes/sub_contents');
var isAuthenticated = require('./middleware/authenticate');

const app = express();
var socketServer = require('http').createServer();
var io = require('socket.io')(socketServer);
var subContentSocket = require('./sockets/subcontent_socket');
/*
Client Emit ===> 
{
    "user_id"
    "meeting_id"
    "subcontent": {
        "id"
        "author"
        "content"
    }
} 
*/
io.on('connection', (socket) => {
    socket.on('edit_subcontent', subContentSocket.edit_subcontent(data));
});

io.on('connection', (socket) => {
    socket.on('delete_subcontent', subContentSocket.delete_subcontent(data));
});
//Configs
app.set('port', 3000);

//Use Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));

// Route
app.use('/api/users', users);
app.use('/api/meetings',isAuthenticated, meetings);
app.use('/api/sub_contents', isAuthenticated, subContents);
app.use('/api/invite_meeting', isAuthenticated, roles);

socketServer.listen(8080, () => console.log('Socket Server listening port 8080'));
app.listen(app.get('port'), () => console.log(`Listening to port ${app.get('port')}`));