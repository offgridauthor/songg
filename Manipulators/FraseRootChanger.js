/**
 * Snazzify a frase ; add or remove notes for that frase, for example.
 */

import FraseManipulator from './FraseManipulator.js';

class FraseRootChanger extends FraseManipulator {
  constructor () {
    super();
    this.name = 'FraseRootChanger';
  }

  simple (rawNotes) {
    const cloned = this.clone(rawNotes),
      nts = this.wrapNotes(cloned);

    _.each(this.config.data, (datum, idx) => {
      let nt = nts.shift();
      nt.octave = nt.octave + datum.octaves;
      nts.push(nt);
    });

    return nts;
  }
}
module.exports = FraseRootChanger;
