const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const routes = require('./routes');

const { sendExpoPushNotification } = require('./expo');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 8001;
let connectedClients = {};

const emitExpo = (data) => {
  if (data?.title || data?.message) {
    let targetTokens = [];

    if (data?.uid) {
      targetTokens = [connectedClients[data?.uid]?.expoToken];
    } else {
      targetTokens = Object.keys(connectedClients)?.map(
        (uid) => connectedClients[uid]?.expoToken,
      );
    }

    sendExpoPushNotification(
      data?.title || data?.message,
      data?.message || data?.title,
      targetTokens,
    );
  }
};

app.use('/', routes);

const saveClientInfo = (socket) => {
  const clientId = socket.id;
  const { uid, expoToken, extras, metadata } = socket.handshake.query;

  // Store or update the client info
  connectedClients[uid] = {
    socketId: clientId,
    expoToken,
    extras: extras ? JSON.parse(extras) : {},
    metadata: metadata ? JSON.parse(metadata) : {},
    lastConnected: new Date().toISOString(),
  };

  console.log(`Client connected: ${uid}`, connectedClients[uid]);

  // Send updated list of clients to all connected clients
  io.emit('updateClients', connectedClients);
};

// Socket.IO connection
io.on('connection', (socket) => {
  const uid = socket.handshake.query.uid;

  // Store or update the client info on connection
  saveClientInfo(socket);

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${uid}`);

    if (connectedClients[uid]) {
      // Remove the socketId on disconnect, keep the metadata
      delete connectedClients[uid].socketId;

      console.log(`Client socketId removed: ${uid}`, connectedClients[uid]);

      // Send updated list of clients to all connected clients
      io.emit('updateClients', connectedClients);
    }
  });

  // Broadcast message to all clients
  socket.on('broadcastMessage', (data, callback) => {
    const { title, message, uid } = data;
    if (uid) {
      // Broadcast to specific uid
      io.to(connectedClients[uid]?.socketId).emit('receiveMessage', data);
    } else {
      // Broadcast to all connected clients
      io.emit('receiveMessage', data);
    }

    emitExpo({ title, message, uid });

    if (callback) {
      callback();
    }
  });

  // on receiving location updates from the clients
  socket.on('updateLocationToServer', (data, callback) => {
    const { uid, lat, lon } = data;

    if (lat && lon) {
      connectedClients[uid].location = { lat, lon };
      io.emit('updateLocationToClients', data);
    }

    if (callback) {
      callback();
    }
  });
});

// run server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
