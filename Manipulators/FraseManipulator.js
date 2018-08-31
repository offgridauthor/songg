/**
 * Snazzify a frase ; add or remove notes for that frase, for example.
 */

import Manipulator from './Manipulator.js';
import Note from '../Note.js';

// @todo: change to the import stmt.
const
  tonalNote = require('tonal-note'),
  tonalScale = require('tonal-scale'),
  tonalChord = require('tonal-chord');

// import tonalNote from 'tonal-note';
// import tonalScale from 'tonal-scale';
// import tonalChord from 'tonal-chord';

class FraseManipulator extends Manipulator {
  constructor () {
    super();
    this.name = 'FraseManipulator';
    this.algos = ['simple'];
  }

  tonalNote () {
    return tonalNote;
  }

  tonalScale () {
    return tonalScale;
  }

  tonalChord () {
    return tonalChord;
  }

  go () {
    let wrappedNotes,
      rawNotes;
    this.validateAlgo(this.config.action);
    wrappedNotes = this[this.config.action](this.notes, this.config);
    rawNotes = this.unwrapNotes(wrappedNotes);
    this.notes = rawNotes;
  }

  validateAlgo (nm) {
    if (this.algos.indexOf(nm) === -1) {
      throw new Error('Invalid algorithm ("' + nm + '") for ' + this.constructor.name);
    }
  }

  noteFromCustomScale (adjustments, scale) {
    let ltr = scale.notes[adjustments.step],
      ltrWithOct = ltr + ('' + adjustments.oct);

    return ltrWithOct;
  }

  calcSplitterAdjustments (letter, lo, change, pScales) {
    const effectiveScale = this.findEffectiveScale(pScales),
      scaleLen = effectiveScale.notes.length;

    let
      ls = this.getStepFromScale(letter, effectiveScale.notes),
      soughtStepOperation,
      octChangeOp,
      soughtStep = ls + change,
      octChange = 0; // 7

    if (change <= 0) { // neg case
      soughtStepOperation = (ss) => { return ss + scaleLen; };
      octChangeOp = (oc) => { return oc - 1; };
    } else {
      soughtStepOperation = (ss) => { return ss - scaleLen; };
      octChangeOp = (oc) => { return oc + 1; };
    }

    while (undefined === effectiveScale.notes[soughtStep] && Math.abs(octChange) < 6) {
      soughtStep = soughtStepOperation(soughtStep);
      octChange = octChangeOp(octChange);
    }

    return {
      step: soughtStep,
      oct: lo + octChange
    };
  }

  /** Given scales arranged in order of precedence, return the first that is
    useful.

   */
  findEffectiveScale (scales) {
    return _.find(
      scales, (obj) => {
        return !!obj.name && obj.notes.length > 0;
      }
    );
  }
  /**
   * Limit to within limits octave of the Original
   *
   *
   * @param {String} origOct Original note's octave (the splitee)
   * @param {Array}  limits  [limit difference below, limit difference above]
   * @param {note}   noteå   Note to alter.
  */
  reinOctave (origOct, limits, noteå) {
    const lowerLimit = limits[0],
      upperLimit = limits[1];

    if (origOct === undefined) { throw new Error('Original octave is required'); }

    let diff = Math.abs(noteå.oct - origOct);

    if (noteå.oct !== origOct) {
      if (noteå.oct < origOct) {
        // altered oct is less; check lower limit
        if (diff > lowerLimit) {
          noteå.oct = origOct - lowerLimit;
        }
      } else if (noteå.oct > origOct) {
        // altered oct is higher; check upper limit
        if (diff > upperLimit) {
          noteå.oct = origOct + lowerLimit;
        }
        throw new Error('Should not be possible.');
      }
    }
  }

  /**
   *
   */
  getCustomScaleType (sc, dat, manipDat) {
    if (sc !== 'USE_CHORD') {
      throw new Error('The only algo for custom scales is "USE_CHORD".');
    }

    const chordNm = manipDat.chord,
      chordRef = _.find(this.getSongData(), (chordData) => {
        return chordData.name === chordNm;
      });

    let letterAndNm,
      notes,
      tkn = tonalNote.tokenize(chordRef.octave),
      letter = tkn[0] + tkn[1];

    if (!chordRef) {
      throw new Error('Cannot find chord name in song chord lib: ' + chordNm);
    }
    letterAndNm = letter + chordRef.chord;
    notes = tonalChord.notes(letterAndNm);
    return { notes: notes, name: 'chord-' + letterAndNm };
  }

  getStepFromScale (ltr, scl) {
    let tkn = tonalNote.tokenize(ltr),
      ltr2 = tkn[0] + tkn[1],
      idx = scl.indexOf(ltr2);

    if (idx === -1) {
      console.error('scale used: ' + scl);
      throw new Error('could not get step of ' + ltr + ' from above scale');
    }

    return idx;
  }

  defaultNotesArray (nt, cuts) {
    let start = 0,
      end = cuts + 1,
      clonable = {note: nt.ntAttrs},
      cutsArray = Array(end - start)
        .fill()
        .map(() => new Note(
          this.clone(clonable))
        );

    return cutsArray;
  }

  parseScale (scale, noteData, manipDat) {
    const ret = {};
    if (_.isString(scale)) {
      if (tonalScale.exists(scale)) {
        ret.notes = tonalScale.notes(scale);
        ret.name = scale;
      } else {
        return this.getCustomScaleType(scale, noteData, manipDat);
      }
    } else if (_.isArray(scale)) {
      ret.notes = scale;
      ret.name = 'CUSTOM';
    }
    return ret;
  }

  // Getters and setters
  set notes (notes) {
    if (!this.notesHistory) {
      this.notesHistory = [];
    }

    if (this.notes !== undefined) {
      this.notesHistory.push(this._notes);
    }

    this._notes = notes;
  }

  get notes () {
    return this._notes;
  }

  getPrecedentScales () {
    const dat = this.config,
      genScale = dat.scale ? tonalScale.notes(dat.scale) : [],
      defScale = tonalScale.notes('C major'),
      precedentScales = [];

    precedentScales.unshift({
      notes: defScale,
      name: 'C major'
    });

    precedentScales.unshift({
      notes: genScale,
      name: dat.scale || null
    });

    return precedentScales;
  }
}

module.exports = FraseManipulator;
