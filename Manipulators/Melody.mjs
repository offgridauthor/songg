/**
 * This class (when finished) will insert a melody, a specialized frase that is not
 * in the composition. Base on its algorithm, it will insert it before or after the
 * specified query frase.
 */
import PhaseManipulator from './PhaseManipulator.mjs';

class Melody extends PhaseManipulator {
  /**
   * Melody overrides the parent class because its job is quite unique; it is never
   * going to act across multiple frases, but only seeks an index at which to insert
   * the melody that it specifies.
   *
   * @param  {Object} dat Song data
   *
   * @return {undefined}     acts in-place
   */
  go (dat) {
    dat.forEach((datRow) => {
      this[datRow.action](datRow);
    });
  }

  /**
   * Insert a customized Frase instance, a melody, after the queried frase.
   *
   * @type {Object} the Song data specifying this phase manipulator
   * @return {undefined} acts in-place by reference
   */
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
