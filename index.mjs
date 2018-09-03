import SongHandle from './SongHandle';
import express from 'express';
import fs from 'fs';
import _ from 'underscore';
import utilExt from './codelibs/utilsExtension';
import dirs from './fileList';
import url from 'url';

const app = express();
_._ = utilExt;

global._ = _;
global.app = app;
global.app.songAttributesKey = 'songAttributes';

app.set('port', (process.env.PORT || 5000));
app.use(express.static('./public'));

app.set('views', './views');
app.set('view engine', 'ejs');

// Set route for page to be visited by user
app.get('/download', (req, res, next) => {
  res.render('pages/music/music');
});

// Data route , which supplies the song data to the client's ajax call
app.get('/songSystem', (request, response) => {
  compose(request, response);
});

// Set up a port
app.listen(app.get('port'), () => {
  console.log('Node app is running on port', app.get('port'));
});

function requireExistentFile (fn) {
  if (fn.indexOf(fn) === -1) {
    throw new Error('Bad filename');
  }
}

function compose (request, response) {
  let
    urlParts = url.parse(
      request.url, true
    ),
    songHandle,
    fileName,
    songData,
    jsonSong;

  var query = urlParts.query;
  fileName = query.fileName;

  if (query.fileName !== undefined) {
    fileName = query.fileName;
  } else {
    fileName = dirs[0];
  }

  requireExistentFile(fileName);
  const dat = fs.readFileSync(`./Songs/${fileName}`).toString();
  songHandle = new SongHandle(JSON.parse(dat));

  // Run all manipulators
  songHandle.manipulateTracks();

  // internally to song, strip out measures and phases , etc, leaving
  // only arrays of note events.
  songHandle.compileTrackEvents();

  // Run the hooks that are made for streams of events (track-holistic manipulators)
  songHandle.trackHooks();

  // The midi file exporter or writer to export them
  songHandle.saveMidi();

  // With file saved, respond with data.
  songData = {
    'files': dirs,
    'song': songHandle.readBars(),
    'midiLink': songHandle.get('outputLink')
  };

  jsonSong = JSON.stringify(songData);

  response.write(jsonSong);
  response.send();
}
