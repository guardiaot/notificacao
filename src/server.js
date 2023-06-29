// initialize express server
var express = require("express");
let bodyparser  = require('body-parser');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        "origin": "*",
        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
        "preflightContinue": false,
        "optionsSuccessStatus": 204
    }
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
   server.listen(process.env.PORT || 4000, function () {
    console.log("Server started running...");
});      
