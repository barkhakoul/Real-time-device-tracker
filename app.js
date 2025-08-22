const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const connectedDevices = {};

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index');
});

io.on('connection', (socket) => {
  console.log(`Device connected: ${socket.id}`);

  socket.on('location-update', (data) => {
    connectedDevices[socket.id] = {
      id: socket.id,
      name: data.name,
      color: data.color,
      lastUpdated: Date.now()
    };

    io.emit('location-update', data);
    io.emit('device-list', Object.values(connectedDevices));
  });

  socket.on('disconnect', () => {
    console.log(`Device disconnected: ${socket.id}`);
    delete connectedDevices[socket.id];
    io.emit('device-list', Object.values(connectedDevices));
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Server running on http://<your-ip>:3000');
});
