
import FraseManipulator from './FraseManipulator.mjs';

/**
 * Change the frase in a basic way, such as increasing its duration.
 * The "data" property from the manipulator's composition (JSON file entry)
 * will override the original.
 *
 */
class FraseChanger extends FraseManipulator {
  constructor () {
    super();
    this.algos = [
      'simple'
    ];
  }

  simple (rawNotes) {
    const cloned = this.clone(rawNotes),
      nts = this.wrapNotes(cloned);
    return nts;
  }

  alterFrase (fr) {
    fr.setDuration(this.config.data.duration);
    return fr;
  }
}

export default FraseChanger;
