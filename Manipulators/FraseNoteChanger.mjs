/**
 * Change the individual notes of an array in a basic fashion according to the
 * JSON specification for this manipulator's "data" array. That array has a
 * note for each entry.
 */

import FraseManipulator from './FraseManipulator.mjs';

class FraseNoteChanger extends FraseManipulator {
  constructor () {
    super();
    this.algos = ['change-in-order'];
  }

  /**
   * Change notes in order (the first "data" entry will map to first note).
   */
  ['change-in-order'] (rawNotes) {
    const cloned = this.clone(rawNotes),
      nts = this.wrapNotes(cloned);
    _.each(this.config.data, (datum, idx) => {
      let nt = nts[idx];
      _.each(datum, (val, key) => {
        nt.ntAttrs[key] = val;
      });
    });
    return nts;
  }

  /**
   * Alter the frase
   *
   */
  alterFrase (fr) {
    let fr2 = fr.clone();
    return fr2;
  }
}
export default FraseNoteChanger;
