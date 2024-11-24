// Datos en caché con fecha de última actualización
let cachedEventos = [];
let cachedUsuarios = [];
let cachedParticipacion = [];

let lastUpdatedEventos = 0;
let lastUpdatedUsuarios = 0;
let lastUpdatedParticipacion = 0;

// Funciones para obtener datos con caché y basadas en la fecha de la última actualización
async function obtenerEventosDesdeApi(lastUpdateTime) {
    try {
        const respuesta = await axios.get('https://repojson-zdrg.onrender.com/events');
        const eventosActualizados = respuesta.data.filter(evento => evento.updatedAt > lastUpdateTime); // Filtramos los eventos actualizados
        cachedEventos = eventosActualizados;
        return eventosActualizados;
    } catch (error) {
        console.error('Error al obtener los eventos:', error);
        return [];
    }
}

async function obtenerUsuariosDesdeApi(lastUpdateTime) {
    try {
        const respuesta = await axios.get('https://repojson-zdrg.onrender.com/usuarios');
        const usuariosActualizados = respuesta.data.filter(usuario => usuario.updatedAt > lastUpdateTime); // Filtramos los usuarios actualizados
        cachedUsuarios = usuariosActualizados;
        return usuariosActualizados;
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        return [];
    }
}

async function obtenerParticipacionDesdeApi(lastUpdateTime) {
    try {
        const respuesta = await axios.get('https://repojson-zdrg.onrender.com/Participacion');
        const participacionActualizada = respuesta.data.filter(participacion => participacion.updatedAt > lastUpdateTime); // Filtramos la participación actualizada
        cachedParticipacion = participacionActualizada;
        return participacionActualizada;
    } catch (error) {
        console.error('Error al obtener la participación:', error);
        return [];
    }
}

// Cuando un cliente se conecta
io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado');

    // Recibir la fecha de la última actualización desde el cliente
    socket.on('obtenerDatosActualizados', (lastUpdateTime) => {
        Promise.all([
            obtenerEventosDesdeApi(lastUpdateTime),
            obtenerUsuariosDesdeApi(lastUpdateTime),
            obtenerParticipacionDesdeApi(lastUpdateTime)
        ]).then(([eventos, usuarios, participacion]) => {
            socket.emit('datos-iniciales', { eventos, usuarios, participacion });
        });
    });

    // Actualizar datos periódicamente solo cuando haya cambios (según el último timestamp)
    setInterval(() => {
        obtenerEventosDesdeApi(lastUpdatedEventos).then(eventos => {
            if (eventos.length > 0) {
                io.emit('evento-actualizado', eventos);
                lastUpdatedEventos = Date.now(); // Actualizar la fecha de la última actualización
            }
        });
    }, 30000); // Cada 30 segundos

    setInterval(() => {
        obtenerUsuariosDesdeApi(lastUpdatedUsuarios).then(usuarios => {
            if (usuarios.length > 0) {
                io.emit('usuario-actualizado', usuarios);
                lastUpdatedUsuarios = Date.now(); // Actualizar la fecha de la última actualización
            }
        });
    }, 30000); // Cada 30 segundos

    setInterval(() => {
        obtenerParticipacionDesdeApi(lastUpdatedParticipacion).then(participacion => {
            if (participacion.length > 0) {
                io.emit('participacion-actualizado', participacion);
                lastUpdatedParticipacion = Date.now(); // Actualizar la fecha de la última actualización
            }
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
