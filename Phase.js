
import Segment from './Segment.js';
import fs from 'fs';

/**
 * Largest constituent member for a Song instance; contains frases.
 */
class Phase extends Segment {
  /**
   * Construct!
   *
   * @param  {Array}     frases      Song data and phase data
   * @param  {String}    nm          Name of this phase
   * @param  {Number}    order       Order within the song's phase array for this phase
   * @param  {Object}    phaseParams Options related to
   *
   * @return {Undefined}
   */
  constructor (frases, nm, order, phaseParams) {
    super();
    this.allowedProps = [
      'imposedFraseLength',
      'frases',
      'name',
      'fraseDuration',
      'index',
      'phaseDelay',
      'manipParams',
      'chords',
      'duration',
      'startTime'
    ];

    this.frases = null;
    this.imposedFraseLength = null;
    this.initialize(frases, nm, order, phaseParams);
  }

  /**
   * Work from constructor
   *
   * @param  {Array}     frases      Song data and phase data
   * @param  {String}    nm          Name of this phase
   * @param  {Number}    order       Order within the song's phase array for this phase
   * @param  {Object}    phaseParams Options related to
   *
   * @return {Undefined}
   */
  initialize (frases, nm, order, phaseParams) {
    // @todo: dont pass in song-related data; only for this phase.
    this.verifySongOpts(phaseParams);
    this.set('frases', frases);
    this.set('name', nm);
    this.set('index', order);
    this.set('imposedFraseLength', phaseParams.imposedFraseLength);
    this.set('fraseDuration', phaseParams.fraseDuration);
    this.set('manipParams', phaseParams.manipParams);
    this.set('chords', phaseParams[app.songAttributesKey]['chords']);
  }

  get (propName) {
    if (this.allowedProps.indexOf(propName) === -1) {
      throw new Error('Disallowed property name : ' + propName);
    }
    return this[propName];
  }

  set (propName, propVal) {
    if (this.allowedProps.indexOf(propName) === -1) {
      throw new Error('Disallowed property name: ' + propName);
    }

    if (propVal === undefined) {
      this[propName] = null;
    }
    this[propName] = propVal;
  }

  forEachFrase (fn) {
    _.each(this.referToFrases(), fn);
  }

  referToFrases () {
    return this.frases;
  }

  getImposedFraseLength () {
    return this.imposedFraseLength;
  }

  getFirstNote () {
    var fraseArray = this.referToFrases();

    return fraseArray[0]['notes'][0];
  }

  getName () {
    return this.get('name');
  }

  /**
   * Simple verification for the options passed in.
   *
   */
  verifySongOpts (opts) {
    if (!opts || !opts.songAttributes || !opts.songAttributes.chords) {
      throw new Error('"songAttributes.chords" prop is required');
    }
    _._.verifySongOpts(opts);
  }

  /**
   * Run hooks for this phase
   */
  hooks () {
    var
      that = this,
      manipParams = this.get('manipParams');

    _.each(
      manipParams,
      function (dat, nm) {
        that.runManip(dat, nm);
      }
    );
  }

  /**
  * Run a manipulator on this phase
  */
  runManip (dat, nm) {
    const childClass = './Manipulators/' + nm + '.js',
      parentClass = './Manipulators/PhaseManipulator.js',
      childClassExists = fs.existsSync(childClass);

    let className = childClassExists
        ? childClass : parentClass,
      Class = require(className),
      manip = new Class(nm);

    manip.phase = this;
    manip.go(dat);
  }

  /**
   * First find the frases of the specified name. Within that subset of the
   * phase's frases, find all those in the specified ranges (keys var).
   * Returns an array of indexes (but the index values are indexed from 1, not 0).
   */
  findFrasesInRange (nm, keys) {
    let byName = this.fraseWhereNamed(nm),
      matches = {},
      intersectingIndexes,
      singleRangeMethod,
      returnableFrases;

    _.each(keys, (k) => {
      singleRangeMethod = this.deriveRangeMethod(k);
      matches[k] =
        singleRangeMethod.method(
          singleRangeMethod.argument, byName
        );
    });

    intersectingIndexes = matches[keys[0]];

    for (let i = 1; i < keys.length; i++) {
      let mergeMe = matches[keys[i]];
      intersectingIndexes = this.getIntersection(intersectingIndexes, mergeMe);
      if (intersectingIndexes.size === 0) {
        break;
      }
    }

    returnableFrases = this.itemsAtIndexes(byName, intersectingIndexes);
    return returnableFrases;
  }

  getIntersection (set1, set2) {
    let merger = [...set1].filter((set1item) => {
      return set2.has(set1item);
    });
    return merger;
  }

  deriveRangeMethod (rangeKey) {
    const char1 = rangeKey.slice(0, 1),
      restOfIt = parseInt(rangeKey.slice(1)),
      retVar = {
        argument: restOfIt
      };

    if (char1 === '<') {
      retVar.method = this.isLessThan;
    } else if (char1 === '>') {
      retVar.method = this.isGreaterThan;
    } else {
      throw new Error('Invalid range: ' + rangeKey);
    }
    return retVar;
  }

  isLessThan (sought, fraseSubset) {
    let matches,
      endPoint = (fraseSubset.length) < sought
        ? fraseSubset.length
        : sought,
      arr = _.range(1, endPoint);

    matches = new Set(arr);
    return matches;
  }

  isGreaterThan (sought, fraseSubset) {
    let arr,
      matches;

    if (sought > fraseSubset.length) {
      arr = [];
    } else {
      arr = _.range(sought + 1, fraseSubset.length + 1);
    }

    matches = new Set(arr);
    return matches;
  }

  /**
  * Given an array of elements ("frasesSubset") and another, "indexes",
  * which is 1-indexed, return all items in the first array
  * ("somefrasesSubsetSubset") that fall at one of the indexes.
   *
   * @param  {Array} frasesSubset description
   * @param  {Object} indexes     description
   *
   * @return {Array}              description
   */
  itemsAtIndexes (frasesSubset, indexes) {
    const idxArr = Array.from(indexes);
    return _.map(
      idxArr,
      (indexVal) => {
        return frasesSubset[indexVal - 1];
      }
    );
  }

  findFraseByIndex (nm, idx) {
    let byName = this.fraseWhereNamed(nm);
    if (!byName || byName.length === 0) {
      return false;
    }

    if (idx === undefined) {
      return [byName[0]];
    }

    if (byName[idx - 1]) {
      return [byName[idx - 1]];
    }
    return false;
  }

  fraseWhereNamed (nm) {
    if (nm === 'ALL') {
      return this.frases;
    }

    let byName = _.filter(this.frases, function (obj) {
      let retBool = obj.name === nm;
      return retBool;
    });
    return byName;
  }

  /**
   * Set timing for the frases in this phase.
   *
   * @return {Undefined}  description
   */
  innerTiming () {
    // initialize as 0 , for first frase.
    let newLen = 0;
    this.forEachFrase(fr => {
      console.log('fr duration');
      console.log(fr.getDuration);
      console.log('start:', newLen + 1);
      // set frase to start on the midi tick following the
      // end of the prior frase's duration.
      fr.setPhaseRelativeStartTime(newLen + 1);
      newLen += fr.getDuration(); // Should this + 1 remain? Brief usage test seems fine.
    });
    console.log('frase duration', newLen);
    // set this phase's duration to the total of all of the frases
    this.set('duration', newLen);
  }

  testInsertAfter (referenceToElement, insertableElement) {
  //myArray.findIndex(x => x.hello === 'stevie')
    let refIndex = this.frases.findIndex(
      (x) => {
        console.log('testing these two (ref and iterated): ', [referenceToElement, x], (x === referenceToElement));
        return (x === referenceToElement);
      }
    );
    console.log('found object at index ', refIndex + 1);
    this.insertFrase(refIndex + 1, insertableElement);
  }

  insertFrase (idx, fr) {
    // if (fr.constructor.name !== 'Frase') {
    //   throw new Error();
    // }
    this.frases.splice(idx, 0, fr);
  }
  /**
   * Update frases with the new phase duration.
   */
  setFraseStartTimes () {
    let phsStartTm = this.get('startTime');
    this.forEachFrase((fr) => {
      let relStartTime = fr.get('phaseRelativeStartTime');
      fr.set('startTime', relStartTime + phsStartTm);
      fr.setInNotes('fraseStartTime', relStartTime + phsStartTm);
    });
  }
}

module.exports = Phase;
