'use strict';

//
// App setup
//
const express = require('express');
const app = express();
const server = require('http').Server(app);

const io = require('socket.io')(server);

app.use(require('morgan')('combined'));
app.use(require('cors')());

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
    type: 'game-state',
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
    type: 'game-state',
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

// Player add
app.get('/player-add/:player/:color', (req, res) => {
  const playerAdd = {
    type: 'player-add',
    player: req.params.player,
    color: req.params.color,
    timestamp: moment.format()
  };
  gameCache.set(`player-${req.params.player}`, playerAdd, (err, success) => {
    io.on('connection', socket => {
      socket.emit('game', playerAdd);
    });
    res.send(playerAdd);
  });
});

// Player move
app.get('/player-move/:player/:power/:angle', (req, res) => {
  const playerMove = {
    type: 'player-move',
    player: req.params.player,
    power: req.params.power,
    angle: req.params.angle,
    timestamp: moment.format()
  };
  io.on('connection', socket => {
    socket.emit('game', playerMove);
  });
  res.send(playerMove);
});

// Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Running on port %s', port);
});
