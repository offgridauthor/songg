
var util = require('util'),
  Segment = require('./Segment.js'),
  fs = require('fs'),
  phsStart,
  Phase = function (data, nm, order, opts) {
    Segment.apply(this, arguments);
    this.name = 'Phase';
    util.inherits(Phase, Segment);

    var songAttribsInPhase = app.songAttributesKey,
      allowedProps = [
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

    this.getManipParam = function (manipName) {
      var confDat = this.get('manipParams');
      if (confDat) {
        if (confDat[manipName] !== undefined) {
          return confDat[manipName];
        }
      }
    };

    this.initialize = function (data, nm, order, optParams) {
      this.verifySongOpts(optParams);
      this.set('frases', data);
      this.set('name', nm);
      this.setOptionals(optParams);
      this.set('index', order);
    };

    this.getIndex = function () {
      return this.get('index');
    };

    this.referToFrases = function () {
      return this.get('frases');
    };

    this.setOptionals = function (opts) {
      this.set('imposedFraseLength', opts.imposedFraseLength);
      this.set('fraseDuration', opts.fraseDuration);
      this.set('manipParams', opts.manipParams);
      this.set('chords', opts[songAttribsInPhase]['chords']);

      var disArp = this.calcDisableArpeg(opts);
      _._.requireBoolean(disArp);

      // You can set the arpeggiation in a phase--but as of
      // this note, it is only enforced at song level
      this.set('disableArpeg', disArp);
    };

    this.get = function (propName) {
      if (allowedProps.indexOf(propName) === -1) {
        throw new Error('Disallowed property name');
      }
      return this[propName];
    };

    this.set = function (propName, propVal) {
      if (allowedProps.indexOf(propName) === -1) {
        throw new Error('Disallowed property name');
      }

      if (propVal === undefined) {
        this[propName] = null;
      }
      this[propName] = propVal;
    };

    this.calcDisableArpeg = function (opts) {
      _._.verifySongOpts(opts);
      var disArpp = null;

      if (_.isBoolean(opts.disableArpeg)) {
        disArpp = opts.disableArpeg;
      }

      if (disArpp === null) {
        if (opts[songAttribsInPhase]['disableArpeg'] && opts[songAttribsInPhase]['disableArpeg'] === true) {
          disArpp = true;
        } else {
          disArpp = false;
        }
      }

      _._.requireBoolean(disArpp);

      return disArpp;
    };

    this.forEachFrase = function (fn) {
      _.each(this.referToFrases(), fn);
    };

    this.referToFrases = function () {
      return this.frases;
    };

    this.getImposedFraseLength = function () {
      return this.imposedFraseLength;
    };

    this.getFirstNote = function () {
      var fraseArray = this.referToFrases();

      return fraseArray[0]['notes'][0];
    };

    /**
     * Based on previous phrase, give this one its
     * start position in the overall song.
     *
     * Don't use this function on the first phase
     * of the song; no reason to do so.
     *
     * @param  {object} previousPhase previous phase data
     */
    this.hookTo = function (previousPhase) {
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
    };

    this.timeFrases = function (isFirstPhase) {
      var that = this;

      this.forEachFrase(function (frase, idx) {
        if (idx !== frase.getIndex()) {
          throw new Error('Badly indexed frases exist');
        }
        phsStart = that.getFirstNote().note['phaseDelay'];
        frase.hookTo(phsStart);
      });
    };

    this.getArp = function () {
      return this.get('arpeggiation') || false;
    };

    this.getFollowingTime = function () {
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
    };

    this.getName = function () {
      return this.get('name');
    };

    /**
     * Simple verification for the options passed in.
     *
     */
    this.verifySongOpts = function (opts) {
      if (!opts || !opts.songAttributes || !opts.songAttributes.chords) {
        throw new Error('"songAttributes.chords" prop is required');
      }
      _._.verifySongOpts(opts);
    };

    /**
     *
     */
    this.hooks = function () {
      var
        that = this,
        manipParams = this.get('manipParams');

      _.each(
        manipParams,
        function (dat, nm) {
          that.runManip(dat, nm);
        }
      );
    };

    /**
   * Run a manipulator on this phase
   */
    this.runManip = function (dat, nm) {
      console.log('phase.runManip', dat, nm);
      const childClass = './Manipulators/' + nm + '.js',
        parentClass = './Manipulators/PhaseManipulator.js',
        childClassExists = fs.existsSync(childClass);

      let className = childClassExists
          ? childClass : parentClass,
        Class = require(className),
        manip = new Class(nm);

      manip.phase = this;
      manip.go(dat);
    };

    /**
     * First find the frases of the specified name. Within that subset of the
     * phase's frases, find all those in the specified ranges (keys var).
     * Returns an array of indexes (but the index values are indexed from 1, not 0).
     */
    this.findFrasesInRange = function (nm, keys) {
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
    };

    this.getIntersection = (set1, set2) => {
      let merger = [...set1].filter((set1item) => {
        return set2.has(set1item);
      });
      return merger;
    };

    this.deriveRangeMethod = (rangeKey) => {
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
    };

    this.isLessThan = (sought, fraseSubset) => {
      let endPoint = (fraseSubset.length) < sought
          ? fraseSubset.length
          : sought,
        arr = _.range(1, endPoint);

      const matches = new Set(arr);
      return matches;
    };

    this.isGreaterThan = (sought, fraseSubset) => {
      let arr;
      if (sought > fraseSubset.length) {
        arr = [];
      } else {
        arr = _.range(sought + 1, fraseSubset.length + 1);
      }

      const matches = new Set(arr);
      return matches;
    };

    /**
     * Given an array of elements ("frasesSubset") and another, "indexes",
       which is 1-indexed, return all items in the first array
       ("somefrasesSubsetSubset") that fall at one of the indexes.
     */
    this.itemsAtIndexes = (frasesSubset, indexes) => {
      const idxArr = Array.from(indexes);
      return _.map(
        idxArr,
        (indexVal) => {
          return frasesSubset[indexVal - 1];
        }
      );
    };

    this.findFraseByIndex = function (nm, idx) {
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
    };

    this.fraseWhereNamed = function (nm) {
      if (nm === 'ALL') {
        return this.frases;
      }

      let byName = _.filter(this.frases, function (obj) {
        let retBool = obj.config.name === nm;
        return retBool;
      });
      return byName;
    };

    this.initialize(data, nm, order, opts);
  };

module.exports = Phase;
