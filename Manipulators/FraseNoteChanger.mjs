/**
 * Snazzify a frase ; add or remove notes for that frase, for example.
 */

import FraseManipulator from './FraseManipulator.mjs';

class FraseNoteChanger extends FraseManipulator {
  constructor () {
    super();
    this.algos = ['change-in-order'];
  }

  /**
   *
   */
  ['change-in-order'] (rawNotes) {
    const cloned = this.clone(rawNotes);
    const nts = this.wrapNotes(cloned);
    _.each(this.config.data, (datum, idx) => {

      let nt = nts[idx];

      _.each(datum, (val, key) => {
        nt.ntAttrs[key] = val;
      });

      // let nt = nts.shift();
      // nt.octave = nt.octave + datum.octaves;
      // nts.push(nt);
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
export default FraseNoteChanger;
