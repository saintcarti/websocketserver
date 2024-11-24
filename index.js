const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:8100", // Cambia la URL si es necesario
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        credentials: true
    }
});

// Datos en caché para evitar solicitudes repetitivas
let cachedEventos = [];
let cachedUsuarios = [];
let cachedParticipacion = [];

// Funciones para obtener los datos completos
async function obtenerEventosDesdeApi() {
    try {
        const respuesta = await axios.get('https://repojson-zdrg.onrender.com/events');
        cachedEventos = respuesta.data;
    } catch (error) {
        console.error('Error al obtener los eventos:', error);
    }
}

async function obtenerUsuariosDesdeApi() {
    try {
        const respuesta = await axios.get('https://repojson-zdrg.onrender.com/usuarios');
        cachedUsuarios = respuesta.data;
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
    }
}

async function obtenerParticipacionDesdeApi() {
    try {
        const respuesta = await axios.get('https://repojson-zdrg.onrender.com/Participacion');
        cachedParticipacion = respuesta.data;
    } catch (error) {
        console.error('Error al obtener la participación:', error);
    }
}

// Cuando un cliente se conecta
io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado');

    // Enviar todos los datos cuando el cliente se conecta
    Promise.all([
        obtenerEventosDesdeApi(),
        obtenerUsuariosDesdeApi(),
        obtenerParticipacionDesdeApi()
    ]).then(() => {
        socket.emit('datos-iniciales', {
            eventos: cachedEventos,
            usuarios: cachedUsuarios,
            participacion: cachedParticipacion
        });
    });

    // Manejar solicitud de detalles específicos por id
    socket.on('obtenerDetallesPorId', (id, tipo) => {
        let datos = [];
        switch (tipo) {
            case 'evento':
                datos = cachedEventos.filter(evento => evento.id === id);
                break;
            case 'usuario':
                datos = cachedUsuarios.filter(usuario => usuario.id === id);
                break;
            case 'participacion':
                datos = cachedParticipacion.filter(participacion => participacion.id === id);
                break;
        }
        socket.emit('detalles-obtenidos', { id, tipo, datos });
    });

    socket.on('disconnect', () => {
        console.log('Un cliente se ha desconectado');
    });
});

// Iniciar el servidor WebSocket
const port = process.env.PORT || 10000;
server.listen(port, () => {
    console.log(`Servidor WebSocket escuchando en puerto ${port}`);
});
