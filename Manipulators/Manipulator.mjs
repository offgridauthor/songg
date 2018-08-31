// Base class for a manipulator
import Note from '../Note.mjs';

class Manipulator {

  constructor () {
    this.name = 'Manipulator';
  }

  /**
   * This method couples data from the song file (for the
    particular Manipulator as configured, there) with the originary
    note that is supposed to be altered by that data. An enriched
    manip paramaters array is returned for alteration.
  */
  popAndCouple (paramsData, nts, direction) {
    if (!direction) {
      direction = 'last-to-first';
    }

    let operation;

    // In the calling manipulator, the applicability direction for
    // the "paramsData" array (instructions per-note) will have been set;
    // use that, here, so that the right notes are coupled with the right
    // directives / instructions.
    if (direction === 'last-to-first') {
      operation = 'pop';
    } else if (direction === 'first-to-last') {
      operation = 'shift';
    }

    _.each(paramsData, (cutDat) => {
      cutDat.originalNt = nts[operation]();
      Object.freeze(cutDat.originalNt);
    });

    return paramsData;
  }

  set songData (sd) {
    if (!_.isArray(sd)) {
      throw new Error('Object is required');
    }

    if (!Object.isFrozen(sd)) {
      throw new Error('Non-frozen objects disallowed');
    }
    this._songData = sd;
  }

  get songData () {
    return this._songData;
  }

  setSongData (songDat) {
    this.songData = songDat;
  }

  getSongData () {
    return this.songData;
  }

  clone (µ) {
    return JSON.parse(JSON.stringify(µ));
  }

  wrapNotes (ntsArray) {
    return _.map(ntsArray, (nt) => { return new Note(nt); });
  }

  unwrapNotes (ntsArray) {
    return _.map(ntsArray, (ntObj) => { return { note: ntObj.ntAttrs }; });
  }
}

export default Manipulator;
