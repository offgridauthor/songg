import Manipulator from './Manipulator.mjs';
import Note from '../Note.mjs';
import tonalNote from 'tonal-note';
import tonalScale from 'tonal-scale';
import tonalChord from 'tonal-chord';

/**
 * Snazzify a frase ; add or remove notes for that frase, for example.
 * In effect this is an abstract class, though not yet syntactically enforced
 * that way.
 */
class FraseManipulator extends Manipulator {
  /**
   * Build instance
   */
  constructor () {
    super();
    // "simple" is run by default if no child class overrides.
    this.algos = ['simple'];
  }

  /**
   * Main manipulator action to alter frase
   * May or may not be
   * @return {undefined} Method works by reference
   */
  go () {
    let wrappedNotes,
      rawNotes;
    this.validateAlgo(this.config.action);
    wrappedNotes = this[this.config.action](this.notes, this.config);
    rawNotes = this.unwrapNotes(wrappedNotes);
    this.notes = rawNotes;
  }

  /**
   * Validate the algorithm is in whitelist.
   */
  validateAlgo (nm) {
    if (this.algos.indexOf(nm) === -1) {
      throw new Error('Invalid algorithm ("' + nm + '") for ' + this.constructor.name);
    }
  }

  /**
   * Obtain note in specified scale at specified step.
   */
  noteFromCustomScale (adjustments, scale) {
    let ltr = scale.notes[adjustments.step],
      ltrWithOct = ltr + ('' + adjustments.oct);

    return ltrWithOct;
  }

  /** Given scales arranged in order of precedence, return the first that is
    useful (as in the future, this determination may be more intelligent).
   */
  findEffectiveScale (scales) {
    return _.find(
      scales, (obj) => {
        return !!obj.name && obj.notes.length > 0;
      }
    );
  }
  /**
   * Limit notes to within limits octave of the Original
   *
   * @param {String} origOct Original note's octave (the splitee)
   * @param {Array}  limits  [limit difference below, limit difference above]
   * @param {note}   notes   Note to alter.
  */
  reinOctave (origOct, limits, notes) {
    const lowerLimit = limits[0],
      upperLimit = limits[1];

    if (origOct === undefined) { throw new Error('Original octave is required'); }

    let diff = Math.abs(notes.oct - origOct);

    if (notes.oct !== origOct) {
      if (notes.oct < origOct) {
        // altered oct is less; check lower limit
        if (diff > lowerLimit) {
          notes.oct = origOct - lowerLimit;
        }
      } else if (notes.oct > origOct) {
        // altered oct is higher; check upper limit
        if (diff > upperLimit) {
          notes.oct = origOct + lowerLimit;
        }
        throw new Error('Should not be possible.');
      }
    }
  }

  /**
   * Though at the time only one custom scale is available, this is a
   * stub where more custom types will be distinguished.
   *
   * @param  {String} sc       [description]
   * @param  {Object} manipDat [description]
   * @return {[type]}          [description]
   */
  getCustomScaleType (sc, manipDat) {
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

  /**
   * Create duplicates of the original note (which we will alter later
   * , in-place, for duration, pitch).
   *
   * @param  {Object} nt   Note we're splitting
   * @param  {Number} cuts Number of cuts to make
   * @return {Array}       Notes to tweak, one for each new sub-note
   */
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

  /**
   * A variety of scale names are available. This method figures out
   * which sacale is desired, and returns the name and notes of the scale.
   *
   * @param  {String} scale    Scale name / indicator
   * @param  {Object} manipDat Data subset needed from manipulator data (from song comp file)
   * @return {Object}          Desired scale
   */
  parseScale (scale, manipDat) {
    const ret = {};
    if (_.isString(scale)) {
      if (tonalScale.exists(scale)) {
        ret.notes = tonalScale.notes(scale);
        ret.name = scale;
      } else {
        return this.getCustomScaleType(scale, manipDat);
      }
    } else if (_.isArray(scale)) {
      ret.notes = scale;
      ret.name = 'CUSTOM';
    }
    return ret;
  }

  // Getters and setters- - - - - - - - - - -

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
  /**
   * Sort notes by relative time; works by reference
   *
   * @param  {Array} notes Notes
   * @return {Undefined}       Works by reference ;no return
   */
  orderNotes (notes) {
    notes.sort(function (a, b) {
      return a.relativeTime > b.relativeTime;
    }).map(function (entry) {
      return entry.score;
    }).reverse();
  }

  /**
   * Get the default scale, song scale, phase scale in order of
   * applicability or salience to this manipulator's frase.
   *
   * @return {Array} scales in order
   */
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

  /** wrap notes in the Note class handler **/
  wrapNotes (ntsArray) {
    return _.map(ntsArray, (nt) => { return new Note(nt); });
  }

  /** Get the data associated with a Note instance **/
  unwrapNotes (ntsArray) {
    return _.map(ntsArray, (ntObj) => { return { note: ntObj.ntAttrs }; });
  }

  // - - - @todo: These tonal js pass-through methods can be eliminated; vestigial of earlier code now removed - - - -
  tonalNote () {
    return tonalNote;
  }

  tonalScale () {
    return tonalScale;
  }

  tonalChord () {
    return tonalChord;
  }
}

export default FraseManipulator;
