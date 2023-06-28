// initialize express server
var express = require("express");
let bodyparser  = require('body-parser');
var cors = require('cors')
var app = express();
const { Interface } = require("readline");
const { Server } = require("socket.io");

const { connect } = require("http2");
app.use(cors())
app.use(bodyparser.json())

// create http server from express instance
var httpServer = require("http").createServer(app);
 
// include socket IO
var io = require("socket.io")(httpServer, {
    path: '/socket.io',
    transports: ['websocket',  'polling'],
    origins: '*',
});
 

let messages = [];

   

io.on('connection', socket =>{
    console.log(`Socket connected:  ${socket.id}`);
    
    socket.emit('previousMessages', messages);

    socket.on('sendMessage', data =>{
        console.log(data);
        messages.push(data);
        socket.broadcast.emit('receivedMessage', data);
    })


})


   // start the HTTP server at port 3000
httpServer.listen(process.env.PORT || 4000, function () {
    console.log("Server started running...");
});      
