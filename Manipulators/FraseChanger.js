/**
 * Snazzify a frase ; add or remove notes for that frase, for example.
 *
 */
import FraseManipulator from './FraseManipulator.js';
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

module.exports = FraseChanger;
