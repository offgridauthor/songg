/**
 * Snazzify a frase ; add or remove notes for that frase, for example.
 */

import FraseManipulator from './FraseManipulator.js';
// const FraseManipulator = require('./FraseManipulator.js');

class FraseSnazzifier extends FraseManipulator {
  constructor () {
    super();
    this.name = 'FraseSnazzifier';
    this.algos = [
      'add', 'split-last'
    ];
  }

  go () {
    super.go();
  }

  /**
   * @todo: make into its own manipulator, with related functions possibly.
   */
  add (nts, dat) {
    _.each(nts, (nt) => {
      nt.note.duration = nt.note.duration * 4;
    });
  }

  // @todo: instead of passing "dat", we can now access config
  splitLast (rawNotes, dat) {
    const
      cloned = this.clone(rawNotes),
      nts = this.wrapNotes(cloned),
      precedentScales = this.getPrecedentScales();
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
        noteDataScale = that.parseScale(cutDat.scale, cutDat, dat),
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

  splitNote (cuts, originalNt, precScalesInner, octLimits) {
    const that = this,
      returnArray = [],
      applicableScale = this.findEffectiveScale(precScalesInner),
      newLastNotes = that.defaultNotesArray(originalNt, cuts);

    _.each(newLastNotes,
      (nt, idx) => {
        // dur will always be the same
        nt.multiplyDuration(1 / (cuts + 1));

        // for timing make it that of the "last" note (prior last note),
        // with idx * newDur added.durcool
        nt.relativeTime = originalNt.relativeTime + (idx * nt.duration);
        console.log('original:', originalNt.letter, originalNt.relativeTime);
        console.log('new note:', nt.relativeTime);
        let changeBy = (cuts - idx);

        const tonalAdjustments =
          that.calcSplitterAdjustments(
            originalNt.letter,
            originalNt.oct,
            0 - changeBy,
            precScalesInner
          ),
          tokenized =
          super.tonalNote().tokenize(
            that.noteFromCustomScale(tonalAdjustments, applicableScale)
          );

        nt.letter = tokenized[0] + tokenized[1];
        nt.oct = tokenized[2];

        // origOct, limits, notesArr
        // This is causing an error by passing it all notes; dont
        // pass the whole array.
        if (octLimits) {
          that.reinOctave(
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

  getPrecedentScales () {
    const dat = this.config,
      genScale = dat.scale ? super.tonalScale().notes(dat.scale) : [],
      defScale = super.tonalScale().notes('C major'),
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

module.exports = FraseSnazzifier;
