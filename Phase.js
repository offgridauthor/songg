
var util = require('util'),
  Segment = require('./Segment.js'),
  parser = require('note-parser'),
  songAttribsInPhase,
  Frase = require('./Frase.js'),
  phsStart;

var Phase = function (data, nm, order, opts) {
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
      'manipParams'
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
     * @param  {[type]} previousPhase [description]
     * @return {[type]}               [description]
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
    var prevFrase = null,
      that = this,
      phsDisArp = that.get('disableArpeg');

    this.forEachFrase(function (frase, idx) {
      if (idx !== frase.getIndex()) {
        throw new Error('Badly indexed frases exist');
      }
      phsStart = that.getFirstNote().note['phaseDelay'];
      frase.hookTo(phsStart);
      prevFrase = frase;
    });
    prevFrase = null;
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

  this.verifySongOpts = function (opts) {
    _._.verifySongOpts(opts);
  };

  this.initialize(data, nm, order, opts);
};

module.exports = Phase;
