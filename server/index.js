'use strict';

var fs = require('fs')
var app = require('./app');
var db = require('./db');
var https = require("https");

var port = 8443;
var server = https.createServer({
	cert: fs.readFileSync('./cert.pem'),
	key: fs.readFileSync('./key.pem')
}, app).listen(port, function (err) {
  if (err) throw err;
  console.log('HTTP server patiently listening on port', port);
  db.sync()
  .then(function () {
    console.log('Oh and btw the postgres server is totally connected, too');
  });
});

module.exports = server;
