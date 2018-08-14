/**
 * Snazzify a frase from the perspective of a phase; for example, find a
 * frase by chord name and order within the phase, then add or remove notes
 * for that frase.
 *
 */

import PhaseManipulator from './PhaseManipulator.js';
import FraseSnazzifier from './FraseSnazzifier.js';

class Snazzifier extends PhaseManipulator {
  constructor () {
    super();
    this.name = 'Snazzifier';
    this.fraseSnazzifiers = [];
  }

  /**
   * @todo: right now, only handles a single frase; needs
   * to handle multiple locatable within here (move code
   * for multiple into here)
   */
  findAndSnazz (dat) {
    let methodCall = (someFrases) => {

      this.snazzify(someFrases, dat);
    };
    this.forMatchingFrases(dat['chord'], dat['location'], methodCall);
  };

  /**
   * Apply Snazzification.
   *
   * Locate the bar within the phase.
   * Use its data to add and remove notes.
   *
   * @param  {Array}  dat   Dat from the specified phs
   *
   * @return {undefined}
   */
  go (dat) {
    const that = this,
      phs = this.phase;
    this.setSongData(this.phase.get('chords'));
    _.each(dat, (assets) => {
      that.findAndSnazz.call(this, assets);
    });
  }

  snazzify (frArray, dat) {
    _.each(frArray, (fr) => {

      this.snazzifyFrase(fr, dat);
    });
  };

  snazzifyFrase (fr, dat) {
    const frSnazzifier = new FraseSnazzifier();

    frSnazzifier.setSongData(this.getSongData());
    frSnazzifier.notes = fr.frozenNotes();
    frSnazzifier.config = dat;
    console.log('before alter:', frSnazzifier.notes);
    frSnazzifier.go();
    console.log('after alter:', frSnazzifier.notes);
    fr.set('notes', frSnazzifier.notes);

    this.fraseSnazzifiers.push();
  };

}

module.exports = Snazzifier;
