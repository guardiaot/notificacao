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

function check_key(v)
{
    
	var val = '';	

	for(var key in usernames)
    {
        var dados = JSON.stringify(usernames[key]);
        let data = JSON.parse(dados);
		if(data.id == v){
            val = data.id;
        }
        
		
	}
	return val;
}

const myDate = new Date(Date.now()).toLocaleString().split(',')[0];
// start the HTTP server at port 3000
http.listen(process.env.PORT || 4000, function () {
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


    async function verificaUsuario(data){
           
        const conn = await database();
        const sql  = 'SELECT * FROM chat_usuarios where usuario_id = ?';
        const value = [data.id_user_de];
        const [rows] = await conn.query(sql, value);
    
        return await rows[0];
       
    }
    async function ativaUsuario(data, chat_id) {
        const conn = await database();
                
        const sql  = "UPDATE chat_usuarios SET online= '1', chat_id = ? WHERE id = ?";
        const value = [chat_id, data.id];
        const [rows] = await conn.query(sql, value);
        return rows;
    }
    async function desatviaUsuario(data) {
        const conn = await database();              
        const sql  = "UPDATE chat_usuarios SET online= '0', chat_id = '0' WHERE usuario = ?";
        const value = [data];
        const [rows] = await conn.query(sql, value);

        return true;
    }
    async function cadastraUsuario(data,  chat_id){
        const conn = await database();

        const sql  = "INSERT INTO chat_usuarios ( usuario, usuario_id, online, tipo_usuario, chat_id) VALUES( ?, ?, ?, ?, ?)";
        const value = [data.chat_user, data.chat_user_id, 1, data.tipo_usuario, data.chat_id, chat_id];
        await conn.query(sql, value);

        return {
            usuario: data.chat_user,
            id_user_de: data.id_user_de,
            id_user_para: data.id_user_para,
            online: 1,
            tipo_usuario: data.tipo_usuario
        }

    
    }
    async function buscachaveParceiro(id){
        const conn = await database();
        const sql  = 'SELECT chat_id FROM chat_usuarios where usuario_id = ?';
        const value = [id];
        const [rows] = await conn.query(sql, value);
        
        return rows[0];
    }
    async function buscaUsuario(){
        const conn = await database();
        const sql  = 'SELECT * FROM chat_usuarios where tipo_usuario = ?';
        const value = ['u'];
        const [rows] = await conn.query(sql, value);
        
        return rows;
    }
    async function buscaUsuarioSuporte(){
        const conn = await database();
        const sql  = 'SELECT * FROM chat_usuarios where tipo_usuario = ?';
        const value = ['s'];
        const [rows] = await conn.query(sql, value);
        
        return rows;
    }
    async function buscaUsuarioFinanceiro(){
       const conn = await database();
       const sql  = 'SELECT * FROM chat_usuarios where tipo_usuario = ?';
       const value = ['f'];
       const [rows] = await conn.query(sql, value);

       return rows; 
    }
    async function buscaUsuarioAtendimento(){
        const conn = await database();
        const sql  = 'SELECT * FROM chat_usuarios where tipo_usuario = ?';
        const value = ['a'];
        const [rows] = await conn.query(sql, value);

        return rows;
    }
    async function salvaMensagem(data){
        const conn = await database();
        const sql  = "INSERT INTO chat ( nome, mensagem, id_user_from, id_user_to, lido, data_now) VALUES( ?, ?, ?, ?, ?, ?)";
        const value = [data.usuario, data.chat_message, data.id_user_de, data.id_user_para, 0, 'now()'];
        await conn.query(sql, value);

        return data;

    }
    async function buscaHistorico(data){
      
        const conn =  await database();
        const sql = 'SELECT chat.id, chat.nome, chat.mensagem, chat.id_user_from, chat.id_user_to, chat.lido, chat.data_now FROM chat WHERE id_user_from = ? and id_user_to = ? OR (id_user_from = ? and id_user_to = ?)';
        const value = [data.id_consulta, data.id_user_parceiro, data.id_user_parceiro, data.id_consulta]
        const [rows] = await conn.query(sql, value);

        return rows;

    }
   
