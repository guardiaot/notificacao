// initialize express server
var express = require("express");
let bodyparser  = require('body-parser');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);


// create http server from express instance
var httpServer = require("http").createServer(app);
 
// include socket IO

 

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
