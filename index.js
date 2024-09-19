const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const routes = require('./routes');

const { EVENT_TYPES } = require('./constants');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 8001;
let connectedClients = {};

app.use('/', routes);

const saveClientInfo = (socket) => {
  const clientId = socket.id;
  const { uid, metadata } = socket.handshake.query;

  // Store or update the client info
  connectedClients[uid] = {
    socketId: clientId,
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
  socket.on('broadcastMessage', (message) => {
    io.emit('receiveMessage', message);
  });
});

// ================

app.get('/event-keys', (req, res) => {
  res.send(EVENT_TYPES);
});

// api for backend to call on new request
app.post('/api/emit-new-request', (req, res) => {
  const data = req?.body;
  console.log('data', data);
  io.emit(EVENT_TYPES.NEW_DELIVERY_REQUEST, data);

  res.sendStatus(200);
});

// api for backend to call on status update
app.post('/api/emit-status-update', (req, res) => {
  const data = req?.body;
  console.log('data', data);
  io.emit(EVENT_TYPES.DELIVERY_STATUS_UPDATE, data);

  res.sendStatus(200);
});

// api for backend to call on payment update
app.post('/api/emit-payment-update', (req, res) => {
  const data = req?.body;
  console.log('data', data);
  io.emit(EVENT_TYPES.PAYMENT_UPDATE, data);

  res.sendStatus(200);
});

// socket io event handling
io.on('connection', (socket) => {
  console.log(`${socket?.id} new user connected`);

  // FOR TESTING: MANUAL PING PONG
  socket.on('ping', (data) => {
    console.log('ping: ' + data);
    io.emit('pong', data);
  });

  socket.on('disconnect', () => {
    console.log(`${socket?.id} user disconnected`);
  });
});

// run server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
