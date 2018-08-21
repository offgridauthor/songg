// Es6ified 8.12.18
import parser from 'note-parser';
import Song from './Song.js';
import {Chord} from 'tonal';
import Frase from './Frase.js';

const
  absoTimeIdx = 'absoTime',
  relativeTimeIdx = 'relativeTime';

let song;

/**
 * Given the basic theoretical data of a song, this class
 * makes the entire default set of bars.
 */
class Inflator {
  constructor () {
    this.name = 'Inflator';
  }

  /**
   * Inflate song according to blueprint data in the "phases" object
   * of the song's json.
   *
   * @param  {object} dat POJO taken as the entirety of the song's json file
   *
   * @return {object} Inflated song
   */
  inflate (songDat) {
    return this.makeDefaultBars(songDat);
  }

  makeDefaultBars (dat) {
    song = new Song(dat);

    if (typeof (song.get('disableArpeg')) !== 'boolean') {
      throw new Error('bool required for "disableArpeg" property of song.');
    }

    const chords = dat.chords,
      that = this;

    let phsTime = 0;

    _.each(dat.phases, (phase, index) => {
      const phaseSongDat = cloanPhaseSongDat(dat),
        strKey = app.songAttributesKey;

      phase[strKey] = phaseSongDat;

      _._.verifySongOpts(phase);
      Object.freeze(phase[strKey].chords);
      var phsDat = that.inflatePhase(phase, phsTime, chords);
      song.addPhase(phsDat.frases, index, phsDat.phraseParams);
      phsTime += phsDat.time;
    });

    return song;
  }

  /**
   * Method that conducts a basic construction according to the blueprint data.
   * Manipulators are introduced elsewhere.
   *
   */
  inflatePhase (phase, phaseTimeInSong, chords) {
    const // cache a few properties for convenience
      measureChords = phase.composition,
      // phase.measureLength,
      demoBeatLength = phase.demoBeatLength, /* This beat length is for the in-browser demo only. */
      betweenFrases = phase.fraseDelay, /* default for how long between notes; should not be stored per note, really */
      dur = phase.fraseDuration, /* how long keys are held down. */
      completedFrases = [],
      that = this;

    let elapsedMsrTime = 0,
      measureCntr = 0,
      chordDat,
      chordNm,
      barCntr,
      measureReceptacle,
      barsThisMeasure,
      beatsThisMeasure,
      msrLength;

    this.validateChordNames(measureChords, chords);

    while (measureCntr < phase.measureCount) {
      barCntr = 0;
      measureReceptacle = [];

      while (barCntr < measureChords.length) {
        // an unresolved issue: composition (chord names)
        // len may differ from measure length

        // get name of chord from composed data
        chordDat = this.chordDat(measureChords[barCntr]);
        chordNm = chordDat.name;

        // get get chord as defined in the song file
        let composedChord = _.where(chords, {name: chordNm})[0],

          // Get a kind of shell to which we will add both global and
          // internal timing
          timelessBar = this.getTimelessBar(parser, composedChord),
          timedToBar;

        timedToBar = that.addBarOffsets(timelessBar, barCntr * demoBeatLength, betweenFrases, dur);
        timedToBar.config = chordDat;
        // at this point, the "bar" (timedToBar) has information on it about its
        // time within the phase, and also time about its own internal notes'
        // timings. Those are combined at a later stage.
        // There are two ways that timing is finalized, relative time and
        // absolute time. Both are used because the player requires one and
        // the midi file writer requires the other.

        addBarToMeasure(measureReceptacle, timedToBar);

        barCntr++;
      }

      var elapsedTime = (elapsedMsrTime + phaseTimeInSong);

      measureReceptacle = addMeasureOffsets(measureReceptacle, elapsedTime);

      let withOffsets = measureReceptacle;

      withOffsets.forEach(
        (obj, idx) => {
          let frParams =
            {
              notes: obj.notes,
              // withOffsets gets reset per measureCntr
              index: idx + (measureChords.length * measureCntr),
              config: obj.config,
              phaseOptions: {
                imposedLength: phase.imposedFraseLength,
                duration: phase.fraseDuration,
                manipParams: phase.manipParams,
                disableArpeg: phase.disableArpeg
              }
            },
            fr = new Frase(frParams);

          completedFrases.push(fr);
        }
      );

      measureCntr++;

      // These variables illustrate inflator structure.
      barsThisMeasure = measureChords.length;
      beatsThisMeasure = barsThisMeasure;
      msrLength = beatsThisMeasure * demoBeatLength;

      elapsedMsrTime += msrLength;
    }

    _._.verifySongOpts(phase);
    return {
      frases: completedFrases,
      phraseParams: phase,
      time: elapsedMsrTime
    };
    // song.addPhase(completedFrases, phaseIdxInSong, phase);
    // return elapsedMsrTime;
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

  stampNote (nt, meta) {
    nt.note.meta = meta;
  }

  getTimelessBar (parser1, chords) {
    // measureChords = M
    let that = this,
      chordNoteList = this.getTonalNotes(
        chords // item from long array of items such as { name: '+add#9', chord: '+add#9', octave: 'C4' },
      ),
      timeless = [];

    chordNoteList.forEach((itm) => {
      /**
       * Given name of a single note, create those as tonal-formatted
       * note objects. These are collected in timless.
       *
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
   * @param  {array} nts List of note names
   * @param  {object} params POJO; structure example:
    *    {
    *      pl: { //object from arpeg lib
          "offset": 0,
          "arr": [0.2, 0.2, 0.2, 0.2, 0.2]
    *    }
    *
    * }
    * @return {object}
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
   * @param {array} bar        THe bar of notes
   * @param {number} absoTime   Bar's timed placement within the phase
   * @param {number} tweenNotes Time between notes to be used in writing midi, Later
   * @param {number} midiDur    How long the key(s) is/are pressed, so to speak; length of note or notes
   */
  addBarOffsets (bar, absoTime, tweenNotes, midiDur) {
    var barCopied = copyBar(bar),
      offsetToMeasure = addBarTime(barCopied, absoTime),
      barCopiedAgain = copyBar(offsetToMeasure),
      withRelativeTimes = addRelBarTimes(barCopiedAgain, tweenNotes, midiDur),
      retVar = { 'notes': withRelativeTimes };

    return retVar;
  }

  validateChordNames (cordz, songChords) {
    var invalidCordz = [];

    cordz.forEach((cordzItm, cordzIdx) => {
      var chordInfo = this.chordDat(cordzItm),
        crdDat = _.where(songChords, {name: chordInfo.name});

      if (crdDat.length <= 0) {
        invalidCordz.push(cordzItm);
      }
    });

    if (invalidCordz.length > 0) {
      throw new Error('Invalid chords found; not in the library: ', invalidCordz);
    }
  }

  getTonalNotes (chordLibDat) {
    var chordName = chordLibDat.chord,
      oct = chordLibDat.octave,
      rawChord = Chord.notes(oct, chordName);

    return rawChord;
  }

}
// use tonal.js to fetch a midi-composed chord

function addBarTime (bar123, bTm) {
  var newBar = [];
  bar123.forEach(
    (offsettable) => {
      offsettable[absoTimeIdx] = bTm;
      newBar.push({'note': offsettable});
    }
  );
  return newBar;
}

function addRelBarTimes (bar123, tween, dur) {
  var newBar = [];
  bar123.forEach(
    (obj) => {
      var offsettable = obj.note;
      offsettable[relativeTimeIdx] = tween; // how long between notes
      offsettable['duration'] = dur; // how long held down
      newBar.push({'note': offsettable});
    }
  );
  return newBar;
}

function copyBarObj (bar1) {
  var retBar = {};
  _.each(
    bar1,
    (offsetItm1, idx) => {
      var tn2 = JSON.parse(JSON.stringify(offsetItm1));
      retBar[idx] = tn2;
    }
  );
  return retBar;
}

function copyBar (bar1) {
  var retBar = [];
  _.each(
    bar1,
    (offsetItm1, idx) => {
      var tn2 = JSON.parse(JSON.stringify(offsetItm1));
      retBar.push(tn2);
    }
  );
  return retBar;
}

/**
 * Add offset property to each measure (which will be used later to
 * plase the frase in time among other frases.
 * @param {array} msr Measure of bars; each bar = array with "notes" as
 *                    primary property.
 * @param {timeToAdd} timeToAdd Time to add to the pre-existing time
 *
 * addOffsets(bar, phaseTime, measure, strumIdx, demoBeatLength);
 */
function addMeasureOffsets (msr, timeToAdd) {
  var copied = copyMeasure(msr),
    // flatly add the overall time index to the bar, which already
    // has internal time.
    offsetToMeasure = addMeasureTime(copied, timeToAdd);

  return offsetToMeasure;

  /**
   * Add specified time to each note in the specified measure
   *
   * @param {Object} msr_ The Measure
   * @param {Number} mTm  Time to add to each note in the measure
   *
   * @return {undefined} newMsr_
   */
  function addMeasureTime (msr_, mTm) {
    var newMsr_ = [];
    msr_.forEach(
      (barItm) => {
        var newBar = copyBarObj(barItm);
        newBar.notes = [];

        barItm.notes.forEach(
          (offsettable) => {
            offsettable.note[absoTimeIdx] += mTm;
            newBar.notes.push(offsettable);
          }
        );
        newMsr_.push(newBar);
      }
    );
    return newMsr_;
  }

  /**
   * Copy the specified measure; deep copy
   *
   * @param  {Object} m1 Measure to copy
   * @return {undefined} _
   */
  function copyMeasure (m1) {
    var retM = [];
    m1.forEach(
      (offsetItm1) => {
        var tn2 = JSON.parse(JSON.stringify(offsetItm1));
        retM.push(tn2);
      }
    );
    return retM;
  }
}

/**
 * Add a frase ("bar") to the measure.
 * @param {Array} receptacle Receptacle to get pushed into
 * @param {Frase} measure    Frase to push in
 *
 * @return {undefined}
 */
function addBarToMeasure (receptacle, frase) {
  receptacle.push(frase);
}

function showPhaseNotes (phsData) {
  var n = 0;
  phsData.forEach(
    (arr) => {
      var nNt = 0;
      arr.forEach((noteObj) => {
        console.log(noteObj, 'inner iterator:' + nNt, 'outer iterator: ' + n);
        nNt++;
      });
      n++;
    }
  );
}

function showBarNotes (barData) {
  var n = 0;
  barData.forEach(
    (obj) => {
      var nNt = obj.note;
    }
  );
}

function cloanPhaseSongDat (data1) {
  var data2 = JSON.parse(JSON.stringify(data1));
  delete data2.phases;
  return data2;
}

module.exports = Inflator;
