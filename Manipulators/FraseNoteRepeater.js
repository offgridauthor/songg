/**
 * Snazzify a frase ; add or remove notes for that frase, for example.
 */

import FraseManipulator from './FraseManipulator.js';
class FraseNoteRepeater extends FraseManipulator {
  constructor () {
    super();
    this.algos = [
      'simple'
    ];
  }

  go () {
    super.go();
  }

  /**
   *  When there is one data entry per note.
   */
  simple (rawNotes) {
    const cloned = this.clone(rawNotes),
      nts = this.wrapNotes(cloned);

    _.each(this.config.data, (datum, datumIndex) => {
      let idx = datum.index - 1,
        howMany = datum.count,
        loopVar;

      if (howMany === undefined) {
        howMany = 1;
      }

      loopVar = 0;

      while (loopVar < howMany) {

        let nn = nts[idx].clone();
        _.each(
          datum,
          (val, key) => {
            if (key === 'index') {
              return;
            }
            nn[key] = val[0];
          }
        );

        nts.push(
          nn
        );
        loopVar++;
      }
    });

    return nts;
  }
}

module.exports = FraseNoteRepeater;
