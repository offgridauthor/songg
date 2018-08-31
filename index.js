import Inflator from './Inflator.js';

const express = require('express'),
  app = express(),
  fs = require('fs'),
  dat = fs.readFileSync('./Songs/Example-1.json'),
  _ = require('underscore'),
  utilExt = require('./codelibs/utilsExtension.js'),
  path = require('path');
_._ = utilExt;

/** As of this note, run the server with "npm run mon", which accesses
  a command defined in package.json

  The code is being converted to ES6/7 via Babel, and the "mon"
  script includes that directive.

*/

global._ = _;
global.app = app;
global.app.songAttributesKey = 'songAttributes';

app.set('port', (process.env.PORT || 5000));
app.use(express.static(path.join(__dirname, '../public')));

app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

app.get('/', (request, response) => {
  response.render('pages/index');
});

// Data route , which supplies the song data to the client's ajax call
app.get('/songSystem', (request, response) => {
  // The inflator sets up structure for manipulation, based on
  // base levels of the song data.
  let fileModel = new Inflator(),
    songData,
    jsonSong;

  // Inflate to default state.
  fileModel.inflate(JSON.parse(dat));

  // Run all manipulators
  fileModel.manipulateTracks();

  // internally to song, strip out measures and phases , etc, leaving
  // only arrays of note events.
  fileModel.compileTrackEvents();

  // Run the hooks that are made for streams of events (track-holistic manipulators)
  fileModel.trackHooks();

  // The midi file exporter or writer to export them
  fileModel.saveMidi();

  // With file saved, respond with data.
  songData = {
    'song': fileModel.readBars(),
    'midiLink': fileModel.get('outputLink')
  };

  jsonSong = JSON.stringify(songData);
  response.write(jsonSong);
  response.send();
});

// Song playing route, where MIDI.js is loaded and can play the song.
// This is also, then, the page where you'll find the ajax call to songSystem.
app.get('/play2', (req, res, next) => {
  res.render('pages/music/music');
});

// Set up a port
app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'));
});
