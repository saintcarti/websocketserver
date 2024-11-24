const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let cachedEventos = [];
let cachedUsuarios = [];
let cachedParticipacion = [];

// Función para obtener solo los eventos nuevos
async function obtenerEventosActualizados() {
  try {
    const respuesta = await axios.get('https://repojson-zdrg.onrender.com/events');
    const eventosActualizados = respuesta.data.filter(evento => evento.updatedAt > lastUpdatedEventos);
    cachedEventos = eventosActualizados;
    return eventosActualizados;
  } catch (error) {
    console.error('Error al obtener los eventos:', error);
  }
  return [];
}

// Función similar para usuarios y participación...
async function obtenerUsuariosActualizados(lastUpdateTime) {
  try {
    const respuesta = await axios.get('https://repojson-zdrg.onrender.com/usuarios');
    const usuariosActualizados = respuesta.data.filter(usuario => usuario.updatedAt > lastUpdateTime);
    cachedUsuarios = usuariosActualizados;
    return usuariosActualizados;
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    return [];
  }
}

async function obtenerParticipacionActualizada(lastUpdateTime) {
  try {
    const respuesta = await axios.get('https://repojson-zdrg.onrender.com/Participacion');
    const participacionActualizada = respuesta.data.filter(participacion => participacion.updatedAt > lastUpdateTime);
    cachedParticipacion = participacionActualizada;
    return participacionActualizada;
  } catch (error) {
    console.error('Error al obtener la participación:', error);
    return [];
  }
}

// Emitir actualizaciones solo cuando haya cambios
io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado');

  // Enviar los datos actuales cuando el cliente se conecta
  socket.emit('datos-iniciales', { eventos: cachedEventos, usuarios: cachedUsuarios, participacion: cachedParticipacion });

  // Recibir la fecha de la última actualización desde el cliente
  socket.on('obtenerDatosActualizados', async (lastUpdateTime) => {
    const eventos = await obtenerEventosActualizados(lastUpdateTime);
    const usuarios = await obtenerUsuariosActualizados(lastUpdateTime);
    const participacion = await obtenerParticipacionActualizada(lastUpdateTime);

    // Enviar solo los datos actualizados
    socket.emit('datos-actualizados', { eventos, usuarios, participacion });
  });

  socket.on('disconnect', () => {
    console.log('Un cliente se ha desconectado');
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Servidor WebSocket escuchando en puerto ${port}`);
});
