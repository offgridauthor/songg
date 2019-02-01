import FraseManipulator from './FraseManipulator.mjs';

/**
 * Change the individual notes of an array in a basic fashion according to the
 * JSON specification for this manipulator's "data" array. That array has a
 * note for each entry.
 */
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
      nts = this.wrapNotes(cloned),
      ret = [];

    _.each(nts, (nt, idx) => {
      const datum = this.config.data[idx]; // repition config for note at that index.
      if (!datum) {
        ret.push(nt);
        return;
      }

      if (datum && datum.remove && datum.remove === true) {
        return;
      }

      _.each(datum, (val, key) => {
        nt.ntAttrs[key] = val;
      });

      ret.push(nt);
    });
    return ret;
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
