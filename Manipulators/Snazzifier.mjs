
import PhaseManipulator from './PhaseManipulator.mjs';

/**
 * Snazzify a frase from the perspective of a phase; for example, find a
 * frase by chord name and order within the phase, then add or remove notes
 * for that frase.
 *
 */
class Snazzifier extends PhaseManipulator {
  constructor () {
    super();
    this.name = 'Snazzifier';
    this.fraseSnazzifiers = [];

    // override this with something more specific in the child classes, probably.
    // or, it can be used to cut directly to frase manipulators
    this.action = 'runFraseManipulators';
    this.manipName = 'Frase' + this.name;
  }
}

export default Snazzifier;
