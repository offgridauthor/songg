
import PhaseManipulator from './PhaseManipulator.mjs';
import tonalNote from 'tonal-note';

/**
 * This class (when finished) will insert a melody, a specialized frase that is not
 * in the composition. Base on its algorithm, it will insert it before or after the
 * specified query frase.
 */
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

  // @todo: insertAfter is clumsy for some situations; make insertAtIndex, insertFirst, insertBefore or functions like those.

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
    // @todo: Create a melody class, probably extending frase
    // @todo: It's haphazard to just clone a Frase and use it as a vessel for melody creation

    const melody = this.createMelody(fr[0], phaseManipData.data.notes, phaseManipData.data['time-unit'], phaseManipData.data.duration);
    cloned.notes = melody;
    cloned.duration = phaseManipData.data.duration;
    this.phase.insertAfter(fr[0], cloned);
  }

  createMelody (vessel, melody, timeUnit, duration) {
    const ret = [];
    melody.forEach((noteDat, idx) => {
      const newNote = this.makeNote(vessel.notes[0], noteDat, timeUnit, duration, idx);
      ret.push(newNote);
    });
    return ret;
  }

  makeNote (blueprint, data, timeUnit, duration, idx) {
    // @todo: It's haphazard to just clone a note assets and use it as a vessel for melody creation
    const noteVessel = JSON.parse(JSON.stringify(blueprint)),
      tokenized = tonalNote.tokenize(data.note),
      letter = tokenized[0] + tokenized[1],
      oct = tokenized[2];

    noteVessel.note.letter = letter;
    noteVessel.note.oct = oct;
    noteVessel.note.duration =
      typeof (data.duration) === 'number'
        ? (timeUnit * data.duration)
        : (timeUnit);

    noteVessel.note.relativeTime =
      typeof (data.time) === 'number'
        ? (timeUnit * data.time)
        : timeUnit * idx;

    return noteVessel;
  }
}

export default Melody;
