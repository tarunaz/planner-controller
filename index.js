// var stompit = require('stompit');
// var http = require('http') ;
var port = 3000;
const express = require('express');
const app = (module.exports = express());
const bodyParser = require('body-parser');

const log = require('tke-logger').getLogger(__filename);

app.use('/publish', require('./publish.js'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

log.info('starting application');


// 404 handler
app.use(function notFoundHandler(req, res) {
  res.status(404).json({
    message: '404 not found'
  });
});

app.listen(port, function onListening() {
  log.info('App started at: ' + new Date() + ' on port: ' + port);
});
