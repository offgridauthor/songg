/**
 * Add notes into a frase which will be a repetition of the specified note
 * already in the frase.
 */
import FraseManipulator from './FraseManipulator.mjs';
class FraseNoteRepeater extends FraseManipulator {
  constructor () {
    super();
    this.algos = [
      'simple'
    ];
  }

  /**
   * Make adjustments.
   * This current version (as of the commit that probably follows
   * 6c4ec7be6e880c0) presumes a single prop change per note.
   */
  simple (rawNotes) {
    const cloned = this.clone(rawNotes),
      nts = this.wrapNotes(cloned);

    _.each(this.config.data, (datum, datumIndex) => {
      let idx = datum.index - 1,
        howMany = datum.count,
        loopVar;

      if (howMany === undefined) {
        howMany = 1;
      }

      loopVar = 0;

      while (loopVar < howMany) {
        let nn = nts[idx].clone();
        _.each(
          datum,
          (val, key) => {
            if (key === 'index') {
              return;
            }
            // use the 0-indexed val; for now, just one key->val
            // option per note.
            nn[key] = val[0];
          }
        );

        nts.push(
          nn
        );
        loopVar++;
      }
    });

    return nts;
  }
}

export default FraseNoteRepeater;
