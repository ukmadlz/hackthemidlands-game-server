'use strict';

module.exports = server => {
  const io = require('socket.io')(server, { origins: null });
  const Pusher = require('pusher');
  const pusher = new Pusher({
    appId: process.env.PUSHER_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: 'eu',
    encrypted: true
  });
  return eventData => {
    io.on('connection', socket => {
      socket.emit('game', eventData);
    });
    pusher.trigger('game', eventData.type, eventData);
  };
};
