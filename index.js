'use strict';
require('dotenv').config();
//
// App setup
//
const path = require('path');
const express = require('express');
let app = express();
const server = require('http').Server(app);
const socketSend = require('./lib/socket')(server);

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
      : 'not-started',
    leaderboard: gameCache.get('leaderboard') || {}
  });
});

// Static content
app.use('/', express.static(path.join(__dirname, 'public')));

// Start a game
app.get('/start', (req, res) => {
  const gameStatus = {
    type: 'game-state',
    state: 'start',
    timestamp: moment.format()
  };
  gameCache.set('game-state', gameStatus, (err, success) => {
    socketSend(gameStatus);
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
    socketSend(gameStatus);
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
    socketSend(playerAdd);
    res.send(playerAdd);
  });
});

// Player move
app.get('/player-move/:player/:power/:angle', (req, res) => {
  const playerId = `player-${req.params.player}`;
  if (gameCache.get(playerId)) {
    const playerMove = {
      type: 'player-move',
      player: req.params.player,
      power: req.params.power,
      angle: req.params.angle,
      timestamp: moment.format()
    };
    socketSend(playerMove);
    res.send(playerMove);
  } else {
    res.send({ error: true, message: 'Player not found' });
  }
});

// Player point
app.get('/player-point/:player', (req, res) => {
  const playerId = `player-${req.params.player}`;
  let playerData = gameCache.get(playerId);
  if (playerData) {
    if (!playerData.points) playerData.points = [];
    playerData.points.push(moment.format());
    playerData.timestamp = moment.format();
    gameCache.set(playerId, playerData, (err, success) => {
      let leaderboard = gameCache.get('leaderboard');
      if (!leaderboard) leaderboard = {};
      leaderboard[playerId] =
        (leaderboard[playerId] ? leaderboard[playerId] : 0) + 1;
      gameCache.set('leaderboard', leaderboard, (err, success) => {
        res.send(playerData);
      });
    });
  } else {
    res.send({ error: true, message: 'Player not found' });
  }
});

// Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Running on port %s', port);
});
