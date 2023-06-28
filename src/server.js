// initialize express server
var express = require("express");
let bodyparser  = require('body-parser');
var cors = require('cors')
var app = express();
const { Interface } = require("readline");


const { connect } = require("http2");





app.use(cors())
app.use(bodyparser.json())
// create http server from express instance
var http = require("http").createServer(app);
 
// include socket IO
var io = require("socket.io")(http, {
    cors: {
        "origin": "*",
        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
        "preflightContinue": false,
        "optionsSuccessStatus": 204
    }
});
 

var usernames = [];




// start the HTTP server at port 3000
http.listen(process.env.PORT || 4000, function () {
        console.log("Server started running...");
});        

    io.on("connection", socket => {

        console.log("Conexao detectada....");
        let id = socket.id;
        socket.username = data.usuario;
    
                
        socket.on('disconnect', function(){
            delete usernames[socket.username];
            io.emit('updateusers', usernames);
            socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        });
       
        
        socket.on('testeUser', (data) => {
            console.log(data);
            io.emit('teste', "data teste___" + id);
        });
    

    });


    
