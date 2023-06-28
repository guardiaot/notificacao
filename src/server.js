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
    
    allowEIO3: true,
    cors: {
        origin: "*:*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true,
    }
});
 

var usernames = [];

// start the HTTP server at port 3000
httpServer.listen(process.env.PORT || 4000, function () {
        console.log("Server started running...");
});        

    io.on("connection", socket => {

        console.log("Conexao detectada....");
        let id = socket.id;
        socket.username = data.usuario;
    
                
        socket.on('disconnect', function(){
            delete usernames[socket.username];
            socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        });
       
        
        socket.on('testeUser', function(data) {
            console.log(data);
            io.emit('teste', "data teste___" + id);
        });
    

    });


    
