import Inflator from './Inflator.js';

const express = require('express'),
  app = express(),
  fs = require('fs'),
  dat = fs.readFileSync('./Songs/unpublished/durne.json'),
  _ = require('underscore'),
  utilExt = require('./codelibs/utilsExtension.js'),
  path = require('path'),
  Arpeggiator = require('./Manipulators/Arpeggiator.js');
_._ = utilExt;

// @todo: del PhaseElevator; it should be a post-processor after "getWriteable" happenes
// in the song class.
//
// const PhaseElevator = require('./Manipulators/PhaseElevator.js');


/**     As of this note, run the server with "npm run mon", which accesses
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

  // The inflator sort of breathes initial life into the raw song data.
  const song = (new Inflator()).inflate(
      JSON.parse(dat)
    ),
    arp = new Arpeggiator();
  let bars,
    savedFile,
    songData;

  song.portal('aphrodite', arp.go, { ctxt: arp });
  song.prepareSave();
  song.freezePhases();
  song.runHooks();

  // After the massaging is done, this section obtains the notes in 2 formats
  // for passing to the client.

  // For MIDI.js to play the song; and for
  bars = song.readBars();
  // The midi file exporter or writer to export them
  savedFile = song.saveMidi();
  songData = {
    'song': bars,
    // 'writeableSong': wrBars, //see song model for further comments; why
    // this is remarked out.
    'midiLink': savedFile.get('outputLink')
  };
  app.jsonSong = JSON.stringify(songData);
  response.write(app.jsonSong);
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
