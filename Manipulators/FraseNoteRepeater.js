/**
 * Snazzify a frase ; add or remove notes for that frase, for example.
 */

import FraseManipulator from './FraseManipulator.js';
class FraseNoteRepeater extends FraseManipulator {
  constructor () {
    super();
    this.name = 'NoteRepeater';
    this.algos = [
      'simple'
    ];
  }

  go () {
    super.go();
  }

  simple (rawNotes) {
    const cloned = this.clone(rawNotes),
      nts = this.wrapNotes(cloned);

    _.each(this.config.data, (datum) => {
      let idx = datum.index - 1,
        howMany = datum.count,
        loopVar;

      if (howMany === undefined) {
        howMany = 1;
      }

      loopVar = 0;
      while (loopVar < howMany) {
        let nn = nts[idx].clone();
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
