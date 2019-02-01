
import FraseManipulator from './FraseManipulator.mjs';

/**
 * Add notes into a frase which will be a repetition of the specified note
 * already in the frase.
 */
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
      nts = this.wrapNotes(cloned),
      manipTimeUnit = this.config['time-unit'],
      removals = [];

    console.log('rep config.data:', this.config.data);

    _.each(this.config.data, (datum, datumIndex) => {
      console.log('repeating:', datum, datumIndex);
      let idx = datum.index - 1,
        howMany = datum.count,
        changeMap = datum['change-map'],
        timeUnit = datum['time-unit'] || manipTimeUnit,
        doRemove = datum['remove'],
        loopVar;

      if (doRemove) {
        removals.push(idx);
        return;
      }

      if (howMany === undefined) {
        howMany = 1;
      }

      loopVar = 0;

      while (loopVar < howMany) {
        let nn = nts[idx].clone();
        if (changeMap && changeMap[loopVar]) {
          const newAttribs = changeMap[loopVar];
          _.each(newAttribs, (val1, key1) => {
            if (key1 === 'rep-time') {
              console.log('result time:', val1 + nn['relativeTime']);
              nn['relativeTime'] += val1;
              return;
            } else if (key1 === 'proportional-time') {
              if (!timeUnit) {
                throw new Error('Time unit is required for proportional time.');
              }
              nn['relativeTime'] += (timeUnit * val1);
            }
            console.log('key and val', key1, val1);
            nn[key1] = val1;
          });
        }

        // _.each(
        //   datum,
        //   (val, key) => {
        //     console.log('old key / val', val, key);
        //     if (key === 'index') {
        //       return;
        //     }
        //     // use the 0-indexed val; for now, just one key->val
        //     // option per note.
        //     nn[key] = val[0];
        //   }
        // );

        nts.push(
          nn
        );
        loopVar++;
      }
    });
    return nts.filter((_, idx) => removals.indexOf(idx) === -1);
  }
}

export default FraseNoteRepeater;
