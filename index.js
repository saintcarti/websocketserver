const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:8100",  // Cambia la URL si es necesario
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        credentials: true
    }
});

// Datos en caché para evitar solicitudes repetitivas
let cachedEventos = [];
let cachedUsuarios = [];
let cachedParticipacion = [];

let lastUpdatedEventos = 0;
let lastUpdatedUsuarios = 0;
let lastUpdatedParticipacion = 0;

// Funciones para obtener datos con caché
async function obtenerEventosDesdeApi() {
    const now = Date.now();
    if (now - lastUpdatedEventos > 60000) { // Actualizar cada 1 minuto
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

    // Enviar datos iniciales cuando se conecta
    Promise.all([
        obtenerEventosDesdeApi(),
        obtenerUsuariosDesdeApi(),
        obtenerParticipacionDesdeApi()
    ]).then(([eventos, usuarios, participacion]) => {
        socket.emit('datos-iniciales', { eventos, usuarios, participacion });
    });

    // Actualizar datos periódicamente
    setInterval(() => {
        obtenerEventosDesdeApi().then(eventos => {
            io.emit('evento-actualizado', eventos);  // Solo eventos actualizados
        });
    }, 30000); // Cada 30 segundos

    setInterval(() => {
        obtenerUsuariosDesdeApi().then(usuarios => {
            io.emit('usuario-actualizado', usuarios);  // Solo usuarios actualizados
        });
    }, 30000); // Cada 30 segundos

    setInterval(() => {
        obtenerParticipacionDesdeApi().then(participacion => {
            io.emit('participacion-actualizado', participacion);  // Solo participación actualizada
        });
    }, 30000); // Cada 30 segundos

    socket.on('disconnect', () => {
        console.log('Un cliente se ha desconectado');
    });
});

// Iniciar el servidor WebSocket
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Servidor WebSocket escuchando en puerto ${port}`);
});
