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
    path: '/socket.io',
    transports: ['websocket',  'polling'],
    secure: true,
    origins: '*',
    allowEIO3: true,
});
 

var usernames = [];

// start the HTTP server at port 3000
httpServer.listen(process.env.PORT || 4000, function () {
        console.log("Server started running...");
});        

io.sockets.on("connection", function (socket) { 
    console.log("Conexao detectada....");


    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function (data) {
        // we tell the client to execute 'updatechat' with 2 parameters
        io.sockets.emit('updatechat', socket.username, data);
    });

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', async function(data){

        const verifica = await verificaUsuario(data);
        let id = socket.id;
        if(verifica != ''){
            ativaUsuario(verifica, id);
            notificao(data, socket.id); 
        }else{
            const dados = await cadastraUsuario(data,  id);
            notificao(dados, id);
        }

        const usuarios = await buscaUsuario();
        io.emit('usuariosOn', usuarios);
    


        function notificao(data, id){
            // we store the username in the socket session for this client
            socket.username = data.usuario;
            // add the client's username to the global list
            // usernames[data] = socket.id;
            usernames.push({
                    id: id,
                    usuario: data.usuario,
                    id_user_de: data.id_user_de,
                    id_user_para: 0,
                    tipo_usuario: data.tipo_usuario
            });

            // echo to client they've connected
            socket.emit('updatechat', 'SERVER', 'you have connected');

            var messageJSON = {
                usuario: data.usuario,
                id_user_para: 0,
                id_user_de: data.id_user_de,
                id_parceiro: 0,
                chat_id: id
            };

            // echo to client their username
            socket.emit('store_username', messageJSON);
            // echo globally (all clients) that a person has connected
            socket.broadcast.emit('updatechat', 'SERVER', data.usuario + ' has connected: ' + socket.id);
            // update the list of users in chat, client-side
            io.sockets.emit('updateusers', usernames);

        
        };

        // when the user disconnects.. perform this
        socket.on('disconnect', function(){

            // remove the username from global usernames list
            delete usernames[socket.username];
        
            desatviaUsuario(socket.username);

            // update list of users in chat, client-side
            io.sockets.emit('updateusers', usernames);
            // echo globally that this client has left
            socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        });
    
        socket.on('check_user', async function(data){
            var result = await buscachaveParceiro(data.id_consulta)
            var messageJSON = {
                usuario: data.user,
                id_user_para: data.id_consulta,
                id_user_de: data.id_user_parceiro,
                id_parceiro: result.chat_id,
                chat_id: data.chat_id
            }; 

            io.sockets.in(data.chat_id).emit('msg_user_found', messageJSON);

            var historico = await buscaHistorico(data);

            io.sockets.in(result.chat_id).emit('historico_conversa', historico);

        });        

        // when the user sends a private message to a user.. perform this
        socket.on('msg_user', async function(data) {
            var messageJSON = {
                usuario: data.usuario,
                chat_message:  data.chat_message,
                id_user_para: data.id_user_para,
                id_user_de: data.id_user_de,
                tempo: myDate
            }; 
        
            if(data.chat_message == "/ajuda"){
                    var retorno = {
                        from : "Servidor",
                        msg  : "Digite e clique enviar para ser atendido por nossa equipe<br> /ajuda = listas os comandos<br> /suporte = lista os usuarios do suporte<br>  /status = consulta o status de uma contação digite /status:[numero cotacao] ela retornara o status da cotação <br>  ",
                        tempo: myDate
                    }

                    io.sockets.in(data.myroom).emit('msg_user_handle', retorno);
                }else if(data.chat_message == "/suporte"){
                    var suporte = await buscaUsuarioSuporte();
                
                    var text = '<div class="cx-inform"><br>';
                    var contem = '';
                    var bt = '';
                    for (var i = 0; i < suporte.length; i++) {
                        var on = ''
                        if(suporte[i].online == 1){
                            on = 'Online';
                            bt = `<button class="bt-inform" onclick="enviar_mensagem('${suporte[i].usuario}','${suporte[i].usuario_id}','${suporte[i].chat_id}')">Chamar</button>`;
                        }else{
                            on = 'Offline';
                            bt = '<button class="bt-inform" disabled>Chamar</button>';
                        }
                        //console.log(suporte[i].usuario)
                        text += `<div>${suporte[i].usuario} está ${on} ${bt} </div>`; 
                    }
                    text += '</div>';
                    
                    var retorno = {
                        from : "Servidor",
                        msg  : text,
                        tempo: myDate
                    }


                    io.sockets.in(data.myroom).emit('msg_user_handle', retorno);
                }else if(data.chat_message == "/cotacao"){
                    var retorno = {
                        from : "Servidor",
                        msg  : "Cotação ",
                        tempo: myDate
                    }


                    io.sockets.in(data.myroom).emit('msg_user_handle', retorno);
                }else if(data.chat_message == "/status"){
                

                    var retorno = {
                        from : "Servidor",
                        msg  : "Para visualizar o estatus da sua cotação digite o /status:/00000000000001  ",
                        tempo: myDate
                    }


                    io.sockets.in(data.myroom).emit('msg_user_handle', retorno);
                }else if(data.chat_message.includes("/status:/")){
                    
                    var parte = data.chat_message.split(":/");

                    
                    const conn = await database();
                    const sql  = 'SELECT id, id_pessoa, id_produto, id_imovel, orcamento, nome, apolice, cpf_cnpj, json, json_dados, json_emissao, mensagem, status FROM consultas where orcamento = ?';
                    const value = [parte[1]];
                    const [rows] = await conn.query(sql, value);
                    const result = rows[0]

                    var text = '';
                    if(result){
                        
                        if(result.status == 0){
                            text = `Este orçamento foi "Recusado", para mais informação acesse o painel de cotaçoes para ver o motivo!`;
                        }
                        if(result.status == 1){
                            text = ``; 
                        }
                        if(result.status == 2){
                            text = `Este orçamento foi "Aprovado", para mais informação acesse o painel de cotaçoes !`; 
                        }
                        if(result.status == 3){
                            text = `Este orçamento está em "Análise", para mais informação acesse o painel de cotaçoes para ver o motivo!`;; 
                        }
                        if(result.status == 5){
                            text = `Este orçamento foi "Aprovado e concluido", numero da apólice ${result.apolice} !`;
                        }
                    }else{
                        text = `Desculpe não encontramos nenhum orçamento com este codigo ${parte[1]} verifique e tente novamente!!`; 
                    }
                    var retorno = {
                        from : "Servidor",
                        msg  : text,
                        tempo: myDate
                    }


                    io.sockets.in(data.myroom).emit('msg_user_handle', retorno);
                }else if(data.chat_message == "/apolice"){
                    var retorno = {
                        from : "Servidor",
                        msg  : "apolice ",
                        tempo: myDate
                    }

                    
                    io.sockets.in(data.myroom).emit('msg_user_handle', retorno);
                }

            io.sockets.in(data.room).emit('msg_user_handle', messageJSON);
            
            await salvaMensagem(data);

            /*
            fs.writeFile("chat_data.txt", msg, function(err) {
                if(err) {
                console.log(err);
                } /*else {
                console.log("The file was saved!");
                }*/
            //});

            
            
        });
});

});


    
