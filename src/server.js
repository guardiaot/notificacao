// initialize express server
var cors = require('cors')
var express = require("express");
let bodyparser  = require('body-parser');


const origin =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_PROD_URL
    : process.env.FRONTEND_LOCAL_URL;



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
        socket.broadcast.emit('teste', 'teste.....');
    })

})


app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", true);
  
    if (req.method === "OPTIONS") {
      res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
      return res.status(200).json({});
    }
    next();
  })

  
   // start the HTTP server at port 3000
   server.listen(process.env.PORT || 4000, function () {
    console.log("Server started running...");
});      
