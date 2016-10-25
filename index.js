var express = require('express'),
    app = express(),
    fs = require('fs'),
    Inflator    = require('./Inflator.js'),
    dat = fs.readFileSync('./Songs/AEDDAG.json'),
    songData = JSON.parse(dat),
    Song = require('./Song.js'),
    _ = require('underscore'),
    bb = require('backbone'),
    utilExt = require('./codelibs/utilsExtension.js');
    _._ = utilExt;

/**
 * Get Some constant-ish type values available on the app object.
 *
 * @type {Object} Values useful across the app
 */
app.values = {
    forEachModulators: JSON.parse(fs.readFileSync('./values/ForEachModulators.json').toString())
};

GLOBAL._ = _;
GLOBAL.app = app;

var PhaseElevator = require('./Manipulators/PhaseElevator.js');

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index')
});

app.get('/firstsong', function(request, response) {

    var jsonSong = JSON.stringify(firstSong.play({'tonal':tonal, 'parser': parser}));
    response.write(jsonSong);
    response.send();
});

//Data route , which supplies the song data to the client's ajax call
app.get('/songSystem', function(request, response) {

    // The inflator sort of breathes initial life into the raw song data.
    var song = null,
        song = Inflator.inflate(JSON.parse(dat)),
        // The phase elevator is a song massager that raises some notes,
        // lowers others, depending on which of its functions you use
        // and which args.
        phsElvtr = new PhaseElevator();

    song.portal('verse', phsElvtr.go, {ctxt: phsElvtr});
    // phsElvtr.go(song.portal('chorus'));
    //After the massaging is done, this section obtains the notes in 2 formats
    //for passing to the client.

    var bars = null,
    //For MIDI.js to play the song; and for

    bars = song.readBars();

    //The midi file exporter or writer to export them
    var savedFile = song.saveMidi(),
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

//Song playing route, where MIDI.js is loaded and can play the song.
//This is also, then, the page where you'll find the ajax call to songSystem.
app.get('/play2', function(req, res, next) {
    res.render('pages/music/music');
});

//Set up a port
app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
