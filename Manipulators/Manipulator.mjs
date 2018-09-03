// Base class for a manipulator
class Manipulator {
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
    this._songData = sd;
  }

  get songData () {
    return this._songData;
  }

  /**
   * These aliases are really vestigial of earlier phases of development;
   * may be redundant with the es6 stuff above.
   */

  // - - - - - song data getter and setter - - - - - - - -
  setSongData (songDat) {
    this.songData = songDat;
  }

  getSongData () {
    return this.songData;
  }

  clone (µ) {
    return JSON.parse(JSON.stringify(µ));
  }
}

export default Manipulator;
