import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import express from 'express';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const app = express();
const PORT = 3000;
const server = http.createServer(app);
let users = {};
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const io = new Server(server);

app.use(cors());
app.use(express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => {
  res.sendFile('index.html');
  // res.sendFile(path.join(__dirname, '/public', '/index.html'));
});

io.on('connection', (client) => {
  initializeClient(client);
  client.on('mouse-move', ({ id, x, y }) => {
    users[id].x = x;
    users[id].y = y;

    client.broadcast.emit('update-users', users);
    client.emit('update-users', users);
  });
  client.on('get-users', () => {
    client.broadcast.emit('update-users', users);
    client.emit('update-users', users);
  });
  client.on('disconnect', clientDisconnected(client));
});

function initializeClient(client) {
  users[client.id] = {
    id: client.id,
    x: null,
    y: null
  };
  client.emit('client-connected', users);
  client.broadcast.emit('client-connected', users);
}

function clientDisconnected(client) {
  return () => {
    if (users[client.id]) {
      delete users[client.id];
    }
  }
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});