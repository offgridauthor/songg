
import FraseManipulator from './FraseManipulator.mjs';

/**
 * Within a speciried Frase, split the note into a couplet, triplet,
 * quadruplet, etc. Arrange the sliced pieces according to specified "scale",
 * which can be a scale from tonal.js or series of specified notes.
 */
class FraseSnazzifier extends FraseManipulator {
  /**
   * Build instance
   */
  constructor () {
    super();
    this.name = 'FraseSnazzifier';
    this.algos = [
      'add', 'split-last'
    ];
  }

  /**
   * Beginning with the last, moving back to first, do the "snazzifying" (splitting
   * each note according to its respective data from the song composition file).
   *
   * @param  {Array} rawNotes   A deep clone of notes.
   * @return {Array}          Notes to replace Frase notes
   */
  ['split-last'] (rawNotes) {
    // to be safe, clone the notes--though they are already
    // cloned before passing in.
    const cloned = this.clone(rawNotes),
      nts = this.wrapNotes(cloned),
      precedentScales = this.getPrecedentScales(),
      dat = this.config;

    let splitNotes;

    // First, take off the old notes, put them aside....line them up
    // with the data from the song file that fueles ths FraseManipulator.
    // configuration "data" Array.
    dat.data = this.popAndCouple(dat.data, nts);
    dat.data.reverse();

    splitNotes = this.splitNotes(dat, precedentScales);
    return nts.concat(splitNotes);
  }

  splitNotes (dat, precedentScales) {
    const that = this;
    let returnArray = [];

    _.each(dat.data, (cutDat) => {
      const originalNt = cutDat.originalNt,
        cuts = cutDat.cuts,
        precScalesInner = this.clone(precedentScales),
        noteDataScale = that.parseScale(cutDat.scale, dat),
        doLimitOct = cutDat.directives && cutDat.directives.limitOctave;

      precScalesInner.unshift(noteDataScale);

      let notelingsArr =
        // Given the manipulator's params, now we split the note
        // into multiple notes.
        that.splitNote(
          cuts,
          originalNt,
          precScalesInner,
          doLimitOct ? cutDat.directives.limitOctave : false
        );

      returnArray = returnArray.concat(
        notelingsArr
      );
    });
    return returnArray;
  }

  /**
   * Split a single note and adjust the pitch of its pieces.
   *
   * @param  {Number} cuts           number of cuts to create (2 for triplet, etc)
   * @param  {Object} originalNt     original note
   * @param  {Array} precScalesInner The precedent chain of scales available (song, phase, chord, cut)
   * @param  {Array} octLimits       upper and lower limit to which to constrain octave
   *
   * @return {Array}                 The array of notes resulting from cuts
   */
  splitNote (cuts, originalNt, precScalesInner, octLimits) {
    const returnArray = [],
      applicableScale = this.findEffectiveScale(precScalesInner),
      newLastNotes = this.defaultNotesArray(originalNt, cuts);

    _.each(newLastNotes,
      (nt, idx) => {
        // dur will always be the same
        nt.multiplyDuration(1 / (cuts + 1));

        // for timing make it this of the "last" note (prior last note),
        // with idx * newDur added.durcool
        nt.relativeTime = originalNt.relativeTime + (idx * nt.duration);
        let changeBy = (cuts - idx);

        const tonalAdjustments =
          this.calcSplitterAdjustments(
            originalNt.letter,
            originalNt.oct,
            0 - changeBy,
            precScalesInner
          ),
          tokenized =
          super.tonalNote().tokenize(
            this.noteFromCustomScale(tonalAdjustments, applicableScale)
          );

        nt.letter = tokenized[0] + tokenized[1];
        nt.oct = tokenized[2];

        // origOct, limits, notesArr
        // This is causing an error by passing it all notes; dont
        // pass the whole array.
        if (octLimits) {
          this.reinOctave(
            originalNt.oct,
            octLimits,
            nt
          );
        }
        returnArray.push(nt);
      }
    );
    return returnArray;
  }

  /**
   * Obtain the adjustments appropriate for the specified original note
   * (letter, original octave, and desired change), based also on the
   * constraining scale.
   *
   * @param  {String} letter  Original note letter
   * @param  {Number} lo      Original octave
   * @param  {Number} change  Number of steps up (+) or down (-) to adjust note
   * @param  {Array} pScales  Precedent-ordered scales to choose from
   *
   * @return {Object}
   */
  calcSplitterAdjustments (letter, lo, change, pScales) {
    const effectiveScale = this.findEffectiveScale(pScales),
      scaleLen = effectiveScale.notes.length;

    let ls = this.getStepFromScale(letter, effectiveScale.notes),
      soughtStepOperation,
      octChangeOp,
      soughtStep = ls + change,
      octChange = 0;

    if (change <= 0) {
      soughtStepOperation = (ss) => { return ss + scaleLen; };
      octChangeOp = (oc) => { return oc - 1; };
    } else {
      soughtStepOperation = (ss) => { return ss - scaleLen; };
      octChangeOp = (oc) => { return oc + 1; };
    }

    while (undefined === effectiveScale.notes[soughtStep] && Math.abs(octChange + lo) < 6) {
      soughtStep = soughtStepOperation(soughtStep);
      octChange = octChangeOp(octChange);
    }

    return {
      step: soughtStep,
      oct: lo + octChange
    };
  }
}

export default FraseSnazzifier;
