
import FraseManipulator from './FraseManipulator.mjs';

/**
 * For a single bar, temporally spread the notes according to the indicated
 * pattern.
 */
class FraseArpeggiator extends FraseManipulator {

  /**
   * Taking the specified raw notes,
   * method depends on composition data (from original JSON) for a "pegMan",
   * arpeggiation map, move the map's specified midi times.
   */
  simple (rawNotes) {
    const cloned = this.clone(rawNotes),
      nts = this.wrapNotes(cloned);
    // @todo: Probably replace with _.map or native Array.map
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
}

export default FraseArpeggiator;
