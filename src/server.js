// initialize express server
var cors = require('cors')
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
    socket.emit('teste', 'Teste-1....');
    socket.on('sendMessage', data =>{
        console.log(data);
        messages.push(data);
        socket.broadcast.emit('receivedMessage', data);
        socket.emit('teste', 'Teste....');
    })

})


const whitelist = ['http://teste.test'];


app.options('*', cors());


app.use(cors());
   // start the HTTP server at port 4000
   server.listen(process.env.PORT || 4000, function () {
    console.log("Server started running...");
});      

