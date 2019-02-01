
import FraseManipulator from './FraseManipulator.mjs';

/**
 * Change a frase's root note.
 * Actually, in technical music terms, I think this is more like an "inversion".
 *
 * Think of this manipulator as acting on a frase before arpeggiation takes place. The first note of the chord will be moved to the back before distributing relativeTimes from arpeg.
 */
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

  /**
   * Alter the frase
   *
   */
  alterFrase (fr) {
    let fr2 = fr.clone();
    return fr2;
  }
}
export default FraseRootChanger;
