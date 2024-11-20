const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const routes = require('./routes');
const { saveUserLocationToDb } = require('./firebase');

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

    targetTokens = Object.keys(connectedClients)
      .filter((uid) => data?.uids?.includes(uid))
      ?.map((uid) => connectedClients[uid]?.expoToken);

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
  const { uid, expoToken, extras, metadata, role } = socket.handshake.query;

  // Store or update the client info
  connectedClients[uid] = {
    socketId: clientId,
    expoToken,
    extras: extras ? JSON.parse(extras) : {},
    metadata: metadata ? JSON.parse(metadata) : {},
    lastConnected: new Date().toISOString(),
    role: role ?? null,
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
    const { title, message, uids, role } = data;

    if (!title || !message) {
      console.log('ERROR: title and message are required');
    }

    if (uids?.length > 0 && roles?.length) {
      console.log(
        'ERROR: Either uids or roles, or none of them can be provided, but not both',
      );
    }

    if (role !== 'DRIVER' && role !== 'CUSTOMER') {
      console.log('ERROR: role must be either DRIVER or CUSTOMER');
    }

    const targetUIDs =
      uids?.length > 0
        ? uids
        : role
          ? Object.keys(connectedClients).filter(
              (key) => connectedClients[key]?.role === role,
            )
          : Object.keys(connectedClients);

    // broadcasting to socket clients
    if (!uids?.length && !role) {
      io.emit('receiveMessage', data);
    } else {
      targetUIDs?.forEach((uid) => {
        io.to(connectedClients[uid]?.socketId).emit('receiveMessage', data);
      });
    }

    emitExpo({
      title,
      message,
      uids: targetUIDs,
    });

    if (callback) {
      callback();
    }
  });

  // on receiving location updates from the clients
  socket.on('updateLocationToServer', (data, callback) => {
    const { latitude, longitude } = data;

    if (latitude && longitude) {
      const uidIndex = Object.keys(connectedClients).findIndex(
        (key) => connectedClients[key]?.socketId === socket.id,
      );

      if (uidIndex === -1) {
        return;
      }

      const uid = Object.keys(connectedClients)[uidIndex];
      connectedClients[uid].location = { latitude, longitude };

      // Save the location to the database
      saveUserLocationToDb(uid, {
        latitude,
        longitude,
      });

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
