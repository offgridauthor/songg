/**
 * Snazzify a frase from the perspective of a phase; for example, find a
 * frase by chord name and order within the phase, then add or remove notes
 * for that frase.
 *
 */

import PhaseManipulator from './PhaseManipulator.mjs';

class Melody extends PhaseManipulator {
  go (dat) {

    dat.forEach((datRow) => {
      this[datRow.action](datRow);
    });
  }


  ['insert-after'] (phaseManipData) {

    let chord = phaseManipData.chord,
      location = phaseManipData.location,
      fr = this.findMatchingFrases(chord, location),
      cloned;

    if (!fr || !fr[0]) {
      throw new Error('Could not find frase for this data:', JSON.stringify({chord, location}, 2, null));
    }
    cloned = fr[0].clone();
    cloned.duration = 1000;
    this.phase.testInsertAfter(fr[0], cloned);

  }
}

export default Melody;
