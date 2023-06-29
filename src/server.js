// initialize express server
var cors = require('cors')
var express = require("express");
let bodyparser  = require('body-parser');


const origin =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_PROD_URL
    : process.env.FRONTEND_LOCAL_URL;
    


const app = express();
app.use(cors({
    origin: origin,
    preflightContinue: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  }))

const server = require('http').createServer(app);
const io = require('socket.io')(server);

 

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
