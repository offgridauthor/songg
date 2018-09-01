/**
 * Base class for altering phases of Songs.
 *
 * This is not an abstract class; this parent class is used as a default
 * for cases where no child is specified in external app logic or song file.
 */
import Manipulator from './Manipulator.mjs';
import manipulatorFactory from '../manipulatorFactory.mjs';

/**
 * Instantiable class for manipulating phases.
 * Provided a query (the "name" and "location" items fron the song data) and a
 * algo name (which defaults to "simple"), this class applies that manipulator
 * to the queried frases.
 *
 * An important note is that the base class runs as a default class. For example,
 * "Arpeggiator" will be called in the app logic (external; not in this file).
 * There is a "FraseArpeggiator" but no Phase arpeggiator. Therefore, a PhaseManipulator instance is created and the default work
 * is used. (Note that although FraseManipulators are prefixed with "Frase" automatically, PhaseManipulators are not prefixed
 * with Phase; so the phase Arpeggiator would just be called "Arpeggiator", a la Melody and Snazzifier).
 *
 * Snazzifier and Melody are examples of PhaseManipulators, and have their own respective
 * methods for controlling the application of their respective FraseManipulator child class
 * instances.
 */
class PhaseManipulator extends Manipulator {
  constructor (manipName) {
    super();

    // override this with something more specific in the child classes, probably.
    // or, it can be used to cut directly to frase manipulators
    this.action = 'runFraseManipulators';

    if (typeof (manipName) === 'string') {
      this.manipName = 'Frase' + manipName;
    }
  }
  /**
   * Apply manipulation across phase, upon frases according to the
   * chord name and location query.
   * (i.e., locate the frases and then apply the logic of this class's
   * associated frase manipulator).
   *
   * @param  {Array}  dat   Dat from the specified phs
   *
   * @return {undefined} method operates in-place
   */
  go (dat) {
    this.setSongData(this.phase.get('chords'));

    // one FraseManipulator subclass will be called per "asset"
    // In the phase, "dat" originate as an array prop such as
    // manipParms.Snazzifier or manipParams.NoteRepeater.
    _.each(dat, (assets) => {
      // one FraseManipulator instantiation, coming up.
      this.findAndManipulate(assets);
    });
  }

  /**
   * Run a frase manip by finding the frase and executing the code.
   *
   * @todo: right now, only handles a single frase; needs
   * to handle multiple locatable within here (move code
   * for multiple into here)
   *
   */
  findAndManipulate (dat) {
    let action = (this.action || 'simple'),
      method = (fr) => {
        this[action](fr, dat);
      };
    // 'chord' is e.g. "Dm", and "location" is e.g. { range: ['<4'] }
    this.forMatchingFrases(dat['chord'], dat['location'], method);
  }

  /**
   * Default action.
   */
  runFraseManipulators (someFrases, dat) {
    _.each(someFrases, (fr) => {
      this.manipulateFrase(fr, dat);
    });
  }

  /**
   * Manipulate a frase (having isolated one for alteration)
   *
   */
  manipulateFrase (fr, dat) {
    const manipInstance = this.getFraseManipInstance(this.manipName);

    // Carry out manipulations
    manipInstance.setSongData(this.getSongData());
    manipInstance.notes = fr.referToNotes();
    manipInstance.config = dat;

    manipInstance.config.action =
      manipInstance.config.action || 'simple';

    manipInstance.go();

    // for the frase in the actual song, set the notes to the new set of
    // manipulated notes that we obtain from the manipulator.
    fr.set('notes', manipInstance.notes);

    if (manipInstance.alterFrase) {
      fr = manipInstance.alterFrase(fr);
    }
  }

  getFraseManipInstance (nm) {
    const
      manipInstance = manipulatorFactory(nm);
    if (!manipInstance || !manipInstance.setSongData) {
      throw new Error('Frase Manipulator "' + nm + '" does not seem to exist or is malforned.');
    }
    return manipInstance;
  }

  /**
   * given frase query info and a method, run the method upon all
   * the matching frases.
   */
  forMatchingFrases (crdNm, crdQuery, method) {
    let fr = this.findMatchingFrases(crdNm, crdQuery);
    if (!fr) {
      throw new Error('could not find frases ', crdNm, crdQuery);
    }

    // run method on the frase
    method(fr);
  }

  findMatchingFrases (crdNm, crdQuery) {
    // First parse the query that indicates a range of frases to which
    // to apply the specified method.
    let query, fr;
    if (crdNm === undefined) {
      crdNm = 'ALL';
    }
    if (crdQuery === undefined) {
      crdQuery = { range: ['>0'] };
    }

    query = this.parseFraseQuery(crdQuery);

    // use Phase methods to find the frases matched by the query.
    // query.q is e.g. "findFrasesInRange" or "findFraseByIndex"
    // and query.k is the specifying data, several numeric comparators
    // or an index.
    fr = this.phase[query.q](crdNm, query.k);

    return fr;
  }

  /**
   * parse frase query. this is just preprocessing, will not return the queried
   * frases.
   * @return {Object} Example is {q: 'findFraseByIndex', k: [2]}
   *
   * The "q" prop is a method name that exists on Phase.
   * The "k" prop will be the argument (further "query" parameters, the
   * variables in the query method call)
   */
  parseFraseQuery (crdIdx) {
    if (_.isNumber(crdIdx)) {
      return {q: 'findFraseByIndex', k: crdIdx};
    }

    if (!_.isObject(crdIdx)) {
      throw new Error('Improperly formatted locator details');
    }

    if (crdIdx.range) {
      return {q: 'findFrasesInRange', k: crdIdx.range};
    }

    if (crdIdx.index) {
      return {q: 'findFraseByIndex', k: crdIdx.index};
    }

    throw new Error('Improperly formatted locator details (see above)');
  }

  set phase (phs) {
    if (phs.constructor.name) {
      this._phase = phs;
    } else {
      throw new Error('_phase can only be set to instance of class "Phase".');
    }
  }

  get phase () {
    return this._phase;
  }
}

export default PhaseManipulator;
