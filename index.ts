import express from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import routes from './routes';

import { EVENT_TYPES } from './constants';
import { IQueryOnConnect } from './types';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 8001;
let connectedClients: { [key: string]: any } = {};

app.use('/', routes);

const saveClientInfo = (socket: Socket) => {
  const clientId = socket.id;
  const { uid, expoToken, extras, metadata }: IQueryOnConnect = socket.handshake
    .query as any;

  if (!uid) return null;

  connectedClients[uid] = {
    socketId: clientId,
    expoToken,
    extras: extras ? JSON.parse(extras) : {},
    metadata: metadata ? JSON.parse(metadata) : {},
    lastConnected: new Date().toISOString(),
  };

  console.log(`Client connected: ${uid}`, connectedClients[uid]);

  io.emit('updateClients', connectedClients);
};

io.on('connection', (socket) => {
  const uid: string = socket.handshake.query.uid as any;

  saveClientInfo(socket);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${uid}`);

    if (connectedClients[uid]) {
      delete connectedClients[uid].socketId;

      console.log(`Client socketId removed: ${uid}`, connectedClients[uid]);

      io.emit('updateClients', connectedClients);
    }
  });

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
