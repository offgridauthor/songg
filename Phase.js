
import Segment from './Segment.js';
import fs from 'fs';
let phsStart;

class Phase extends Segment {
  constructor (data, nm, order, opts) {
    super();
    this.name = 'Phase';
    this.allowedProps = [
      'imposedFraseLength',
      'frases',
      'name',
      'fraseDuration',
      'disableArpeg',
      'index',
      'phaseDelay',
      'manipParams',
      'chords'
    ];

    this.frases = null;
    this.imposedFraseLength = null;
    this.initialize(data, nm, order, opts);
  }

  getManipParam (manipName) {
    var confDat = this.get('manipParams');
    if (confDat) {
      if (confDat[manipName] !== undefined) {
        return confDat[manipName];
      }
    }
  }

  initialize (data, nm, order, optParams) {
    this.verifySongOpts(optParams);
    this.set('frases', data);
    this.set('name', nm);
    this.setOptionals(optParams);
    this.set('index', order);
  }

  getIndex () {
    return this.get('index');
  }

  setOptionals (opts) {
    this.set('imposedFraseLength', opts.imposedFraseLength);
    this.set('fraseDuration', opts.fraseDuration);
    this.set('manipParams', opts.manipParams);
    this.set('chords', opts[app.songAttributesKey]['chords']);

    var disArp = this.calcDisableArpeg(opts);
    _._.requireBoolean(disArp);

    // You can set the arpeggiation in a phase--but as of
    // this note, it is only enforced at song level
    this.set('disableArpeg', disArp);
  }

  get (propName) {
    if (this.allowedProps.indexOf(propName) === -1) {
      throw new Error('Disallowed property name');
    }
    return this[propName];
  }

  set (propName, propVal) {
    if (this.allowedProps.indexOf(propName) === -1) {
      throw new Error('Disallowed property name');
    }

    if (propVal === undefined) {
      this[propName] = null;
    }
    this[propName] = propVal;
  }

  calcDisableArpeg (opts) {
    _._.verifySongOpts(opts);
    var disArpp = null;

    if (_.isBoolean(opts.disableArpeg)) {
      disArpp = opts.disableArpeg;
    }

    if (disArpp === null) {
      if (opts[app.songAttributesKey]['disableArpeg'] && opts[app.songAttributesKey]['disableArpeg'] === true) {
        disArpp = true;
      } else {
        disArpp = false;
      }
    }

    _._.requireBoolean(disArpp);

    return disArpp;
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

  /**
   * Based on previous phrase, give this one its
   * start position in the overall song.
   *
   * Don't use this function on the first phase
   * of the song; no reason to do so.
   *
   * @param  {object} previousPhase previous phase data
   */
  hookTo (previousPhase) {
    var firstNote = this.getFirstNote();

    if (previousPhase === null) {
      if (this.getIndex() === 0) {
        firstNote.note.phaseDelay = 0;
      }
    }

    if (firstNote.note.phaseDelay === undefined) {
      if (typeof (previousPhase) === 'object') {
        firstNote.note.phaseDelay = previousPhase.getFollowingTime();
      }
    }
  }

  timeFrases (isFirstPhase) {
    var that = this;
    this.forEachFrase(function (frase, idx) {
      if (idx !== frase.getIndex()) {
        throw new Error('Badly indexed frases exist');
      }
      phsStart = that.getFirstNote().note['phaseDelay'];
      frase.hookTo(phsStart);
    });
  }

  getFollowingTime () {
    var followingTime,
      imposed = this.getImposedFraseLength(),
      fraseDur = this.get('fraseDuration');

    if (imposed) {
      followingTime = imposed * this.frases.length;
    } else if (fraseDur) {
      followingTime = fraseDur * this.frases.length;
    } else {
      throw new Error('fraseDuration or imposedFraseLength is required per phase');
    }

    /**
     * To do: Make it so that if there is no imposedFraseLength either, we start on finishing
     * the last note. After that, perhaps even add a relative offset option; minus x ticks
     * till end of last note.
     *
     */

    if (followingTime === undefined) {
      throw new Error('Unable to calculate following time');
    }

    return followingTime;
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
    let endPoint = (fraseSubset.length) < sought
        ? fraseSubset.length
        : sought,
      arr = _.range(1, endPoint);

    const matches = new Set(arr);
    return matches;
  }

  isGreaterThan (sought, fraseSubset) {
    let arr;
    if (sought > fraseSubset.length) {
      arr = [];
    } else {
      arr = _.range(sought + 1, fraseSubset.length + 1);
    }

    const matches = new Set(arr);
    return matches;
  }

  /**
   * Given an array of elements ("frasesSubset") and another, "indexes",
     which is 1-indexed, return all items in the first array
     ("somefrasesSubsetSubset") that fall at one of the indexes.
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
      let retBool = obj.config.name === nm;
      return retBool;
    });
    return byName;
  }
}

module.exports = Phase;
