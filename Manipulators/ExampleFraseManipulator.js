/**
 * Snazzify a frase ; add or remove notes for that frase, for example.
 */
import FraseSnazzifier from './FraseSnazzifier.js';

class ExampleFraseSnazzifier extends FraseSnazzifier {
  constructor () {
    super();
    this.name = 'FraseSnazzifier';
    this.algos = [
      '', ''
    ];

    this.snazzify = function (fr, dat) {
      let nts = fr.cloneNotes();

      fr.set('notes', nts);
    };
  }
}

module.exports = ExampleFraseSnazzifier;
