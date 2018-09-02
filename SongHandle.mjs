import parser from 'note-parser';
import Song from './Song.mjs';
import Frase from './Frase.mjs';
import SongFile from './SongFile.mjs';
import tonal from 'tonal';

const secondsDivisor = 256,
  Chord = tonal.Chord;

/**
 * Class to create a song from the model, store it as midi, and produce links
 * to it.
 *
 * Given the basic theoretical data of a song, this class makes the entire default set of bars.
 * It then orchestrates the defined Manipulators.
 *
 */
class SongHandle {

  /**
   * Construct song; make JSON into a usable, live object, augmenting
   * theoretical data and distributing default timing (where "default"
   * means pre-Manipulator).
   *
   * @param {Object} songDat parsed JSON file
   */
  constructor (songDat) {
    let sf;
    // each element is the iterated phase, e.g. aphrodite x 3 measures (iterations)
    this.writeableTracks = [];

    // directory in which to save Midi
    this.outputDir = './public/outputMidi';

    // name for file
    this.fileName = songDat.name || 'nameless-song';

    // Midi extension to use
    this.ext = 1;

    sf = new SongFile(
      this.fileName, this.outputDir
    );

    this.set('songFile', sf);

    // run main process
    this.inflate(songDat);

  }

  /**
   * Inflate song according to blueprint data in the "phases" object
   * of the song's json.
   *
   * @param  {Object} dat POJO taken as the entirety of the song's json file
   *
   * @return {Object} Inflated song
   */
  inflate (songDat) {
    this.compose(songDat);
  }

  /**
   *
   */
  compose (songGlobalDat) {
    let tracks = songGlobalDat.composition,
      indexInSong = 0,
      trackContainer = this.writeableTracks;

    // For each track . . . a series of phase names from global data.
    _.each(tracks, (songComp) => {
      let song = new Song(songGlobalDat, songComp, indexInSong, songGlobalDat.manipParams);

      // for each phase on each track (each song)
      _.each(songComp, (phaseName) => {
        let
          cnts = {};

        if (cnts[phaseName] === undefined) {
          cnts[phaseName] = 0;
        } else {
          cnts[phaseName]++;
        }

        const phase = songGlobalDat.phases[phaseName],
          songDatForPhase = cloneForPhase(songGlobalDat),
          inflated = this.inflatePhase(phase, indexInSong, songDatForPhase);

        song.addPhase(inflated.frases, phaseName, inflated.phraseParams);
      });
      trackContainer[indexInSong] = song.getTrack();
      indexInSong++;
    });
  }

  manipulateTracks () {
    _.each (this.writeableTracks, (someSong) => {
      someSong.runHooks();
    });
  }

  compileTrackEvents () {
    _.each(this.writeableTracks, (songTrack) => {
      let writeableEvents = this.makeWriteableEvents(songTrack);
      this.songFile.pushEventTrack(writeableEvents);
    });
  }

  trackHooks () {
    // here, run hooks designated for each track
    // _.each (this.songFile.eventTracks (eventTrack) . . . . .
  }

  /**
   * Given some default parameters and phase-specific parameters, create a default-
   * timed phase instance (not yet going to be manipulated).
   *
   * @param  {Object} phase         primary phase data (from JSON Song file, with a little massaging done)
   * @param  {Number} index         index in song
   * @param  {Object} phaseSongDat  phase data from JSON or DB
   *
   * @return {type}                 description
   */
  inflatePhase (phase, index, phaseSongDat) {
    const that = this,
      strKey = app.songAttributesKey;

    phase[strKey] = phaseSongDat;

    _._.verifySongOpts(phase);

    // @todo: freeze here may be redundant with freeze of "dat" in calling func.
    Object.freeze(phase[strKey].chords);

    this.validateChordNames(
      phase.composition, phase[strKey].chords
    );

    return that.inflateMeasures(phase);
  }

  /**
   * Extract phase data and in the process time it correctly
   * with relation to other phases.
   * Go through each Song (track) and get its writeable events into
   * the file.
   *
   * @return {Object} Song class
   */
  saveMidi () {
    this.get('songFile').save();
  }

  /**
   * Method that conducts a basic construction according to the blueprint data.
   * Manipulators are introduced elsewhere.
   *
   */
  inflateMeasures (phase) {
    let completedFrases = [],
      elapsedMsrTime = 0,
      measureCntr = 0;

    // We are within a phase; and this is the loop for the number of iterations
    // of a specific phase.
    while (measureCntr < phase.measureCount) {
      let measureIteration = this.inflateMeasure(measureCntr, phase);

      // Totting up the overall phrases as measures (or iterations) get inflated...
      completedFrases = completedFrases.concat(measureIteration.frases);
      measureCntr++;
    } // This ends the loop per measure count in phase

    _._.verifySongOpts(phase);
    return {
      frases: completedFrases,
      phraseParams: phase,
      time: elapsedMsrTime
    };
  }

  /**
   * Each phase has 1+ iterations; this creates an iteration of that kind,
   *  aka "measure" in some places.
   */
  inflateMeasure (measureCntr, phase) {
    let barCntr = 0,
      inflatedBars = [],
      that = this,
      fraseDefaults = {
        imposedLength: phase.imposedFraseLength,
        noteDuration: phase.noteDuration,
        manipParams: phase.manipParams
      };

    // This is the loop that goes
    // through each "composition" item for the phase
    // (for this iteration/measure instance).
    while (barCntr < phase.composition.length) {
      const bluePrint =
        this.getChordBlueprint(
          barCntr,
          // chord composition for this phase
          phase.composition,
          phase[app.songAttributesKey].chords
        ),
        barToAdd = this.inflateBar(bluePrint);

      let indexInPhase = this.defaultFraseIndex(barCntr, phase.composition.length, measureCntr),
        newFr = that.fraseFromParams(barToAdd, indexInPhase, fraseDefaults, measureCntr);

      inflatedBars.push(newFr);
      barCntr++;
    }

    return {
      frases: inflatedBars
    };
  }

  /**
   * Calculate a bar's index within the entire (default / before-Manipulator) phrase.
   *
   * @param  {Number} barIdx       This frase's index in the formative iteration
   * @param  {Number} measureIndex the iteration's index in the formative phase
   * @param  {Number} phaseLength  number of frases generically in the phase
   *
   * @return {Number}              The index where this frase will fall within the
   *                               entire set of iterations (not just its own iteration)
   */
  defaultFraseIndex (barIdx, measureIndex, phaseLength) {
    return barIdx + (phaseLength * measureIndex);
  }

  fraseFromParams (obj, index, phaseDefaults, measureCntr) {
    let frParams =
      {
        notes: obj.notes,
        duration: obj.duration,
        originalIndex: index,
        phaseDefaults,
        name: obj.name,
        noteDuration: obj.noteDuration
      },
      fr;

    fr = new Frase(frParams);
    return fr;
  }

  getChordBlueprint (idx, measureChords, chords) {
    const chordDat = this.chordDat(measureChords[idx]),
      chordNm = chordDat.name,
      composedChord = _.findWhere(chords, {name: chordNm}),
      chordConfig = _.extend(composedChord, chordDat);

    return chordConfig;
  }

  /**
   * Based on the blueprint from phase.composition:
   * Return a bar with the default timing (i.e., timing derived from phase and without
   * any minipulation yet).
   **/
  inflateBar (composedChord) {
    const that = this,
      timelessNoteArr = this.getTimelessBar(parser, composedChord),
      timedArr = that.addBarOffsets(timelessNoteArr);
    composedChord.notes = timedArr;

    return composedChord;
    // at this point, the "bar" (timedToBar) has information on it about its
    // time within the phase, and also time about its own internal notes'
    // timings. Those are combined at a later stage.
    // There are two ways that timing is finalized, relative time and
    // absolute time. Both are used because the player requires one and
    // the midi file writer requires the other.
  }

  chordDat (crd) {
    var retData = {
      'name': null
    };

    if (typeof crd === 'string') {
      retData.name = crd;
    }

    if (typeof crd === 'object') {
      retData = crd;
    }

    return retData;
  }

  getTimelessBar (parser1, chord) {
    let that = this,
      chordNoteList = this.getTonalNotes(
        chord
      ),
      timeless = [];

    chordNoteList.forEach((itm) => {
      /**
       * Given name of a single note, create those as tonal-formatted
       * note objects. These are collected in timless.
       */
      var timelessNote1 = that.timelessNote(itm, parser1);
      timeless.push(timelessNote1);
    });
    return timeless;
  }

  /**
   * Given an array of note names and arpegLib from song's json, makes midi
   * data in a format consumable by the player, MIDI.js.
   *
   * @param  {Array} nts List of note names
   * @param  {Object} params POJO; structure example:
    *    {
    *      pl: { //object from arpeg lib
          "offset": 0,
          "arr": [0.2, 0.2, 0.2, 0.2, 0.2]
    *    }
    *
    * }
    * @return {Object}
   */
  timelessNote (ntNm, prs) {
    var pc = prs.parse(ntNm);
    pc.phaseStart = null;
    pc.strumTime = null;
    pc.delay = null;
    return pc;
  }

  /**
   * Give the bar timing with relation to its place in the
   * phase. "AbsoTime" is added as a property to the bar,
   * later to be used as the base for adding time to individual
   * notes within the bar.
   *
   * @param {Array}  bar        THe bar of notes
   * @param {Number} absoTime   Bar's timed placement within the phase
   * @param {Number} tweenNotes Time between notes to be used in writing midi, Later
   * @param {Number} midiDur    How long the key(s) is/are pressed, so to speak; length of note or notes
   */
  addBarOffsets (bar, midiDur) {
    var barFormatted = formatBar(bar),
      withRelativeTimes = addRelBarTimes(barFormatted, midiDur);

    return withRelativeTimes;
  }

  validateChordNames (cordz, songChords) {
    var invalidCordz = [];

    // for each chord from left arg....
    cordz.forEach((cordzItm, cordzIdx) => {
      var chordInfo = this.chordDat(cordzItm),
        crdDat = _.where(songChords, {name: chordInfo.name});

      if (crdDat.length <= 0) {
        invalidCordz.push(cordzItm);
      }
    });

    if (invalidCordz.length > 0) {
      throw new Error('Invalid chords found; not in the library: ' + JSON.stringify(invalidCordz, null, 2));
    }
  }

  getTonalNotes (chordLibDat) {
    var chordName = chordLibDat.chord,
      oct = chordLibDat.octave,
      rawChord = Chord.notes(oct, chordName);

    return rawChord;
  }

  set writeableEvents (arg) {
    _._.requireType(arg, ['Object', 'Null']);
    this._writeableEvents = arg;
  }


  /**
   * Get events that can be easily, accurately recorded to file
   *
   * @return {Array}  writeable (yet still relatively timed)
                      events for absolutizing
   */
  makeWriteableEvents (songTrack) {
    let totDelay = 0,
      eventsToWrite = [];

    _.each(songTrack.phases, (phase) => {
      var referee = phase.referToFrases();

      _.each(referee, (fraseArr, fraseIdx) => {

        // for an entire bar:
        _.each(fraseArr.notes, (noteItm, noteIdx) => {
          var nDat = noteItm.note,
            delay,
            renderableNote,
            duration,
            startTick,
            onEvt,
            offEvt;

          if (noteIdx === 0) {
            totDelay = nDat['fraseStartTime'];
          }

          delay = nDat['relativeTime'] || 0;
          renderableNote = this.renderableNote(nDat);
          // relativeTime is needed for note on

          // treated now as a delay since previous start
          // duration for note off (second loop)
          duration = nDat.duration;
          startTick = totDelay + (delay || 0);
          onEvt = {
            type: 'on',
            channel: 0,
            note: renderableNote,
            absoTime: startTick,
            duration: duration
          };

          eventsToWrite.push(onEvt);

          offEvt = {
            type: 'off',
            channel: 0,
            note: renderableNote,
            absoTime: startTick + duration
          };

          eventsToWrite.push(offEvt);
        });
      });
    });
    return eventsToWrite;
  }

  /**
   * Get a note that can be rendered
   *
   * @param  {Object} nDat Note data
   * @return {Object}      Note data renderable
   */
  renderableNote (nDat) {
    return nDat.letter + nDat.acc + nDat.oct.toString();
  }

  readBars () {
    return this.songFile.getFilteredBars();
  }



  set (prop, val) {
    this[prop] = val;
  }

  get (prop) {
    return this[prop];
  }

  get outputLink () {
    return this.songFile.get('outputLink');
  }
}

function addRelBarTimes (bar123, dur) {
  var newBar = [];
  bar123.forEach(
    (obj) => {
      var offsettable = obj.note;
      newBar.push({'note': offsettable});
    }
  );
  return newBar;
}

/**
  Simply reformats that bar's notes in a simple way.
  (adds it as property "note" to itself)
*/
function formatBar (bar1) {
  _.each(
    bar1,
    (offsetItm1, idx) => {
      bar1[idx] = {note: offsetItm1};
    }
  );
  return bar1;
}

/**
 * Deep clone data, erasing clone's copy to proper scope.
 *
 */
function cloneForPhase (data1) {
  return _.omit(data1, (v, k) => { return k === 'phases'; });
}

export default SongHandle;
