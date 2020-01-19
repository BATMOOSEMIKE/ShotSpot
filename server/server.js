// dependencies
var express = require('express');
var http = require('http');
const request = require('request');
var fs = require('fs');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// serve front-end website
app.use(express.static('../client'));

function readJsonFileSync(filepath, encoding){
  if (typeof (encoding) == 'undefined'){
      encoding = 'utf8';
  }

  var file = fs.readFileSync(filepath, encoding);
  return JSON.parse(file);
}

// locationId is id corresponding to location w/ respect to Google Places API
function getPhotos(locationId){
  var filepath = __dirname + '/locations/' + locationId + ".json";
  return readJsonFileSync(filepath);
}

io.on('connection', function(socket){
  socket.on('load_city', function(locationId){
    var json = getPhotos(locationId);
    socket.json.emit('load_finish', json);
    console.log(json);
  });
});

server.listen(3000, function () {
  console.log('server running on port 3000');
});
