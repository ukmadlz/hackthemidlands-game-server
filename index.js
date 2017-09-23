'use strict';

//
// App setup
//
const express = require('express');
const app = express();
const server = require('http').Server(app);

const io = require('socket.io')(server);

app.use(require('morgan')('combined'));

//
// Timestamps
//

const Moment = require('moment');
const moment = new Moment();

//
// In memory store
//

const NodeCache = require('node-cache');
const gameCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });

//
// Routes
//
app.get('/', (req, res) => {
  res.send({
    state: gameCache.get('game-state')
      ? gameCache.get('game-state').state
      : 'not-started'
  });
});

// Start a game
app.get('/start', (req, res) => {
  const gameStatus = {
    state: 'start',
    timestamp: moment.format()
  };
  gameCache.set('game-state', gameStatus, (err, success) => {
    io.on('connection', socket => {
      socket.emit('game', gameStatus);
    });
    res.send(gameStatus);
  });
});

// End a game
app.get('/end', (req, res) => {
  const gameStatus = {
    state: 'end',
    timestamp: moment.format()
  };
  gameCache.set('game-state', gameStatus, (err, success) => {
    io.on('connection', socket => {
      socket.emit('game', gameStatus);
    });
    res.send(gameStatus);
  });
});

// Server

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log('Running on port %s', port);
});
