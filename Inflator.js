var util = require('util'),
  parser = require('note-parser'),
  t = require('tonal'),
  Song = require('./Song.js'),
  tc = require('tonal-chord'),
  Frase = require('./Frase.js'),
  absoTimeIdx = 'absoTime',
  relativeTimeIdx = 'relativeTime',
  song

/**
 * Given the basic theoretical data of a song, this class
 * makes the entire default set of bars.
 */
var Inflator = function () {
  this.name = 'Inflator'
}

Inflator.getTonalNotes = function (chordLibDat) {
  // import chord from 'tonal-chord';
  var chordName = chordLibDat.chord,
    oct = chordLibDat.octave,
    rawChord = tc.build(chordName, oct)

    // use tonal.js to fetch a midi-composed chord
  return rawChord
}

/**
 * Inflate song according to blueprint data in the "phases" object
 * of the song's json.
 *
 * @param  {object} dat POJO taken as the entirety of the song's json file
 *
 * @return {object} Inflated song
 */
Inflator.inflate = function (songDat) {
  return this.makeDefaultBars(songDat)
}

Inflator.makeDefaultBars = function (dat) {
  song = new Song(dat)

  if (dat.disableArpeg) {
    if (typeof (dat.disableArpeg) !== 'boolean') {
      throw new Error('bool required')
    }
    song.set('disableArpeg', dat.disableArpeg)
  }

  var chords = dat.chords,
    phsCnt = 0,
    phsTime = 0,
    that = this

  _.forEach(dat.phases, function (a, b, c) {
    var phaseSongDat = cloanPhaseSongDat(dat)
    strKey = app.songAttributesKey

    a[strKey] = phaseSongDat
    _._.verifySongOpts(a)

    var lengthOfAddedPhase = that.forEachPhase(a, b, phsTime, chords, phsCnt)

    phsCnt++
    phsTime += lengthOfAddedPhase
  })

  return song
}

/**
 * Method that conducts a basic construction according to the blueprint data.
 * Manipulators are introduced elsewhere.
 *
 */
Inflator.forEachPhase = function (phase, phaseIdxInSong, phaseTimeInSong, chords, phsCnt) {
  var // cache a few properties for convenience
    measureChords = phase.composition,
    // phase.measureLength,
    demoBeatLength = phase.demoBeatLength, /* This beat length is for the in-browser demo only. */
    measureCntr = 0,
    betweenFrases = phase.fraseDelay, /* default for how long between notes; should not be stored per note, really */
    dur = phase.fraseDuration /* how long keys are held down. */
  validateChordNames(measureChords, chords),
  phaseReceptacle = [],
  elapsedMsrTime = 0

  while (measureCntr < phase.measureCount) {
    var that = this,
      barCntr = 0,
      measure = new String(measureCntr + 1),
      measureReceptacle = []

    while (barCntr < measureChords.length) {
      // an unresolved issue: composition (chord names)
      // len may differ from measure length

      // get name of chord from composed data
      var chordDat = this.chordDat(measureChords[barCntr]),

        chordNm = chordDat.name,

        // get get chord as defined in the song file
        composedChord = _.where(chords, {name: chordNm})[0],

        // Get a kind of shell to which we will add both global and
        // internal timing
        timelessBar = this.getTimelessBar(parser, composedChord),

        // get some very arbitrary data about the chord
        noteMetaData = this.makeNoteMetaData(chordDat),
        that = this

      var timedToBar = that.addBarOffsets(timelessBar, barCntr * demoBeatLength, betweenFrases, dur)

      timedToBar.config = chordDat
      // at this point, the "bar" (timedToBar) has information on it about its
      // time within the phase, and also time about its own internal notes'
      // timings. Those are combined at a later phase.
      // There are two ways that timing is finalized, relative time and
      // absolute time. Both are used because the player requires one and
      // the midi file writer requires the other.

      addBarToMeasure(measureReceptacle, timedToBar)

      barCntr++
    }

    var elapsedTime = (elapsedMsrTime + phaseTimeInSong)

    measureReceptacle = addMeasureOffsets(measureReceptacle, elapsedTime)

    withOffsets = measureReceptacle

    withOffsets.forEach(
      function (obj, idx) {
        var frParams = {
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
        }

        var fr = new Frase(frParams)
        phaseReceptacle.push(fr)
      }
    )

    measureCntr++

    // These variables illustrate inflator structure.
    var barsThisMeasure = measureChords.length,
      beatsThisMeasure = barsThisMeasure,
      msrLength = beatsThisMeasure * demoBeatLength

    elapsedMsrTime += msrLength
  }

  _._.verifySongOpts(phase)
  song.addPhase(phaseReceptacle, phaseIdxInSong, phsCnt, phase)

  return elapsedMsrTime
}

Inflator.chordDat = function (crd) {
  var retData = {
    'name': null
  }

  if (typeof crd === 'string') {
    retData.name = crd
  }

  if (typeof crd === 'object') {
    retData = crd
  }

  return retData
}

Inflator.stampNote = function (nt, meta) {
  nt.note.meta = meta
}

Inflator.getTimelessBar = function (parser1, chords) {
  // measureChords = M
  var that = this,
    chordNoteList = this.getTonalNotes(
      chords // long array of items such as { name: '+add#9', chord: '+add#9', octave: 'C4' },
    ) // empty

  var whichNote = 0,
    timeless = []

  chordNoteList.forEach(function (itm) {
    /**
         * Given name of a single note, create those as tonal-formatted
         * note objects. These are collected in timless.
         *
         */

    var timelessNote1 = that.timelessNote(itm, parser1)
    timeless.push(timelessNote1)
  })
  return timeless
}

/**
 * Given an array of note names and arpegLib from song's json, makes midi
 * data in a format consumable by the player, MIDI.js.
 *
 * @param  {array} nts List of note names
 * @param  {object} params POJO; structure example:
 *                          {
 *                              pl: { //object from arpeg lib
                                     "offset": 0,
                                     "arr": [0.2, 0.2, 0.2, 0.2, 0.2]
 *                                      }
 *
 *                          }
 * @return {[type]}        [description]
 */
Inflator.timelessNote = function (ntNm, prs) {
  var pc = prs.parse(ntNm)
  pc.phaseStart = null
  pc.strumTime = null
  pc.delay = null
  return pc
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
Inflator.addBarOffsets = function (bar, absoTime, tweenNotes, midiDur) {
  var barCopied = copyBar(bar),
    offsetToMeasure = addBarTime(barCopied, absoTime),
    barCopiedAgain = copyBar(offsetToMeasure),
    withRelativeTimes = addRelBarTimes(barCopiedAgain, tweenNotes, midiDur),
    retVar = { 'notes': withRelativeTimes }

  return retVar
}

function addBarTime (bar123, bTm) {
  var newBar = []
  bar123.forEach(
    function (offsettable) {
      offsettable[absoTimeIdx] = bTm
      newBar.push({'note': offsettable})
    }
  )
  return newBar
}

function addRelBarTimes (bar123, tween, dur) {
  var newBar = []
  bar123.forEach(
    function (obj) {
      var offsettable = obj.note
      offsettable[relativeTimeIdx] = tween // how long between notes
      offsettable['duration'] = dur // how long held down
      newBar.push({'note': offsettable})
    }
  )
  return newBar
}

function copyBarObj (bar1) {
  var retBar = {}
  _.each(
    bar1,
    function (offsetItm1, idx) {
      var tn2 = JSON.parse(JSON.stringify(offsetItm1))
      retBar[idx] = tn2
    }
  )
  return retBar
}

function copyBar (bar1) {
  var retBar = []
  _.each(
    bar1,
    function (offsetItm1, idx) {
      var tn2 = JSON.parse(JSON.stringify(offsetItm1))
      retBar.push(tn2)
    }
  )
  return retBar
}

/**
 *
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
    offsetToMeasure = addMeasureTime(copied, timeToAdd)

  return offsetToMeasure

  /**
     * Add specified time to each note in the specified measure
     *
     * @param {Object} msr_ The Measure
     * @param {Number} mTm  Time to add to each note in the measure
     *
     * @return {undefined} _
     */
  function addMeasureTime (msr_, mTm) {
    var newMsr_ = []
    msr_.forEach(
      function (barItm) {
        var newBar = copyBarObj(barItm)
        newBar.notes = []

        barItm.notes.forEach(
          function (offsettable) {
            offsettable.note[absoTimeIdx] += mTm
            newBar.notes.push(offsettable)
          }
        )
        newMsr_.push(newBar)
      }
    )
    return newMsr_
  }

  /**
     * Copy the specified measure; deep copy
     *
     * @param  {Object} m1 Measure to copy
     * @return {undefined} _
     */
  function copyMeasure (m1) {
    var retM = []
    m1.forEach(
      function (offsetItm1) {
        var tn2 = JSON.parse(JSON.stringify(offsetItm1))
        retM.push(tn2)
      }
    )
    return retM
  }
}

/**
 *
 * @param {[type]} receptacle       [description]
 * @param {[type]} measure          [description]
 * @param {[type]} p1               [description]
 * @param {[type]} relTime          [description]
 * @param {[type]} relTime          [description]

 *
 * measureReceptacle,measure, parser
 */
function addBarToMeasure (receptacle, bar) {
  receptacle.push(bar)
}

Inflator.makeNoteMetaData = function (bn) {
  return {'composition': bn}
}

function showPhaseNotes (phsData) {
  var n = 0
  phsData.forEach(
    function (arr) {
      var nNt = 0
      arr.forEach(function (noteObj) {
        nNt++
      })
      n++
    }
  )
}

/**
 *
 *
 * @param  {[type]} phsData [description]
 * @return {[type]}         [description]
 */
function showBarNotes (barData) {
  var n = 0
  barData.forEach(
    function (obj) {
      var nNt = obj.note
    }
  )
}

function validateCountedTime (cntd, calcd) {
  if (cntd !== calcd) {
    throw new Error('Counted phase time does not match projected phase time')
  }
}

function validateChordNames (cordz, songChords) {
  var invalidCordz = []

  cordz.forEach(function (cordzItm, cordzIdx) {
    var chordInfo = Inflator.chordDat(cordzItm),
      crdDat = _.where(songChords, {name: chordInfo.name})

    if (crdDat.length <= 0) {
      invalidCordz.push(cordzItm)
    }
  })

  if (invalidCordz.length > 0) {
    throw new Error('Invalid chords found; not in the library: ', invalidCordz)
  }
}

function cloanPhaseSongDat (data1) {
  var data2 = JSON.parse(JSON.stringify(data1))

  delete data2.phases
  delete data2.chords

  return data2
}

module.exports = Inflator
