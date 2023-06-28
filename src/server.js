// initialize express server
var express = require("express");
let bodyparser  = require('body-parser');
var cors = require('cors')
var app = express();
const { Interface } = require("readline");
import http from "http";


const { connect } = require("http2");





app.use(cors())
app.use(bodyparser.json())
// create http server from express instance
var server  = http.createServer(app);
 
// include socket IO
var io = require("socket.io")(server, {
    handlePreflightRequest: (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
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
       
        
        socket.on('testeUser', function(data) {
            console.log(data);
            io.emit('teste', "data teste___" + id);
        });
    

    });


    
