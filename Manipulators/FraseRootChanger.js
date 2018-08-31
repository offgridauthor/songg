/**
 * Snazzify a frase ; add or remove notes for that frase, for example.
 */

import FraseManipulator from './FraseManipulator.js';

class FraseRootChanger extends FraseManipulator {
  constructor () {
    super();
    this.name = 'FraseRootChanger';
  }

  /**
   *
   */
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

  /**
   * Alter the frase
   *
   */
  alterFrase (fr) {
    let fr2 = fr.clone();
    // fr2.setDuration(fr.getDuration() * 2);
    return fr2;
  }
}
module.exports = FraseRootChanger;
