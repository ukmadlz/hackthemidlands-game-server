'use strict';

const express = require('express');
const app = express();
const server = require('http').Server(app);

const io = require('socket.io')(server);

app.get('/', (req, res) => {
  res.send({});
});

io.on('connection', socket => {
  socket.emit('news', { hello: 'world' });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log('Running on port %s', port);
});
