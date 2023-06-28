// initialize express server
var express = require("express");
let bodyparser  = require('body-parser');
var cors = require('cors')
var app = express();
const { Interface } = require("readline");


const { connect } = require("http2");


async function database(){

    if(global.connection && global.connection !== 'disconnected')
        return global.connection;

    const mysql = require('mysql2/promise');
    var connection = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "dataseguros"
    });

    global.connection = connection;
    return connection;
}


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



const myDate = new Date(Date.now()).toLocaleString().split(',')[0];
// start the HTTP server at port 3000
http.listen(process.env.PORT || 4000, function () {
        console.log("Server started running...");
});        

    io.sockets.on("connection", function (socket) { 
    console.log("Conexao detectada....");

    socket.on('teste_user', function(){
        socket.emit('teste', 'SERVER 01 - teste', 'teste 02');
    });
            

            

    });


