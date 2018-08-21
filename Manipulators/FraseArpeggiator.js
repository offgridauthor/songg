/**
 * For a single bar, temporally spread the notes according to the indicated
 * pattern.
 * @todo: This really needs to be rewritten as a FraseManip that runs in the right way,
 * instead of being a PhaseManip
 */

import FraseManipulator from './FraseManipulator.js';

class FraseArpeggiator extends FraseManipulator {
  constructor () {
    super();
    this.name = 'FraseArpeggiator';
    this.algos = [
      'simple'
    ];
  }

  go () {
    super.go();
  }

  simple (rawNotes) {
    const cloned = this.clone(rawNotes),
      nts = this.wrapNotes(cloned);

    _.each(nts, (nt, idx) => {
      let pegMap = this.config.data;
      if (pegMap[idx] !== undefined) {
        nt.relativeTime = pegMap[idx];
      } else {
        nt.relativeTime = 0;
      }
    });
    this.orderNotes(nts);
    return nts;
  }

  orderNotes (notes) {
    // let nts = JSON.parse(JSON.stringify(notes));
    notes.sort(function (a, b) {
      return a.relativeTime > b.relativeTime;
    }).map(function (entry) {
      return entry.score;
    }).reverse();
  }
}

module.exports = FraseArpeggiator;
