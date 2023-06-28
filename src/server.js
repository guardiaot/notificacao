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
    origins: '*',
    allowEIO3: true,
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
    
                
        socket.on('testeUser', function(data) {
            console.log(data);
            io.emit('teste', "data teste___" + id);
        });
    

    });


    
