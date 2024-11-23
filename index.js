const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server,{
    cors:{
        origin:"http://localhost:8100",
        methods:["GET","POST"],
        allowedHeaders:["Content-Type"],
        credentials:true
    }
});

// Función para hacer una petición HTTP al servicio REST y obtener eventos
async function obtenerEventosDesdeApi() {
  try {
    const respuesta = await axios.get('https://repojson-zdrg.onrender.com/events');
    return respuesta.data;
  } catch (error) {
    console.error('Error al obtener los eventos:', error);
    return [];
  }
}

// Cuando un cliente se conecta
io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado');

  // Enviar eventos actuales al cliente cuando se conecta
  obtenerEventosDesdeApi().then((eventos) => {
    socket.emit('evento-actualizado', eventos);
  });

  // Puedes emitir datos cuando los eventos cambian o son actualizados
  setInterval(() => {
    obtenerEventosDesdeApi().then((eventos) => {
      io.emit('evento-actualizado', eventos); // Emitir evento actualizado a todos los clientes
    });
  }, 10000); // Actualizar cada 5 segundos (por ejemplo)

  socket.on('disconnect', () => {
    console.log('Un cliente se ha desconectado');
  });
});

// Iniciar el servidor WebSocket
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Servidor WebSocket escuchando en puerto ${port}`);
});
