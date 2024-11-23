const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();

const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket)=>{
    console.log('Un cliente se ha conectado');
    
    socket.emit('message', 'Bienvenido al servidor websocket');

    socket.on('message',(msg)=>{
        console.log('Mensaje recibido',msg);
        io.emit('message',msg);
    });

    socket.on('disconnect',()=>{
        console.log('Un cliente se ha desconectado');
    });

});

const port = process.env.PORT || 3000;
server.listen(port,()=>{
    console.log('Servidor corriendo en el puerto',port);
});