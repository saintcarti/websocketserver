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

let cachedEventos = [];
let cachedUsuarios = [];
let cachedParticipacion = [];

let lastUpdatedEventos = 0;
let lastUpdatedUsuarios = 0;
let lastUpdatedParticipacion = 0;

// Función para verificar si se necesita actualizar los datos
async function obtenerEventosDesdeApi() {
  const now = Date.now();
  // Actualizar solo si han pasado más de 1 minuto (60000 ms)
  if (now - lastUpdatedEventos > 60000) {
    try {
      const respuesta = await axios.get('https://repojson-zdrg.onrender.com/events');
      cachedEventos = respuesta.data;
      lastUpdatedEventos = now;
    } catch (error) {
      console.error('Error al obtener los eventos:', error);
    }
  }
  return cachedEventos;
}

async function obtenerUsuariosDesdeApi() {
  const now = Date.now();
  if (now - lastUpdatedUsuarios > 60000) {
    try {
      const respuesta = await axios.get('https://repojson-zdrg.onrender.com/usuarios');
      cachedUsuarios = respuesta.data;
      lastUpdatedUsuarios = now;
    } catch (error) {
      console.error('Error al obtener los usuarios:', error);
    }
  }
  return cachedUsuarios;
}

async function obtenerParticipacionDesdeApi() {
  const now = Date.now();
  if (now - lastUpdatedParticipacion > 60000) {
    try {
      const respuesta = await axios.get('https://repojson-zdrg.onrender.com/Participacion');
      cachedParticipacion = respuesta.data;
      lastUpdatedParticipacion = now;
    } catch (error) {
      console.error('Error al obtener la participación:', error);
    }
  }
  return cachedParticipacion;
}


// Cuando un cliente se conecta
io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado');

  // Enviar eventos actuales al cliente cuando se conecta
    obtenerEventosDesdeApi().then((eventos) => {
        socket.emit('evento-actualizado', eventos);
    });

    obtenerUsuariosDesdeApi().then((usuarios)=>{
        socket.emit('usuario-actualizado',usuarios);
    });

    obtenerParticipacionDesdeApi().then((participacion)=>{
        socket.emit('participacion-actualizado',participacion);
    });


  // Puedes emitir datos cuando los eventos cambian o son actualizados
  // Cambiar los intervalos de 10s a, por ejemplo, 30s o 1m
setInterval(() => {
  obtenerEventosDesdeApi().then((eventos) => {
    io.emit('evento-actualizado', eventos);
  });
}, 30000); // Actualizar cada 30 segundos (ajusta según sea necesario)

setInterval(() => {
  obtenerUsuariosDesdeApi().then((usuarios) => {
    io.emit('usuario-actualizado', usuarios);
  });
}, 30000);

setInterval(() => {
  obtenerParticipacionDesdeApi().then((participacion) => {
    io.emit('participacion-actualizado', participacion);
  });
}, 30000);

  socket.on('disconnect', () => {
    console.log('Un cliente se ha desconectado');
  });
});

// Iniciar el servidor WebSocket
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Servidor WebSocket escuchando en puerto ${port}`);
});
