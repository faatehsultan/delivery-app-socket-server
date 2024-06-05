const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const { UserSocketMap } = require('./lib');
const { EVENT_TYPES } = require('./constants');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// internal routes for testing
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/test-client', (req, res) => {
  res.sendFile(__dirname + '/public/test-client.html');
});

app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(__dirname + '/node_modules/socket.io/client-dist/socket.io.js');
});

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
const PORT = process.env.PORT || 8001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
