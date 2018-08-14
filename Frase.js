var Frase = function (params) {
  var allowedProps = [
    'notes',
    'imposedFraseLength',
    'fraseDuration',
    'index',
    'disableArpeg',
    'config',
    'phaseConfig'
  ];

  this.notes = null;
  this.fraseDuration = null;
  this.imposedFraseLength = null;
  this.disableArpeg = null;

  /**
   * Initialize the object
   *
   * @param  {Object}   parameters  Primary params
   * @return {Undefined}
   */
  this.initialize = function (parameters) {
    this.set('notes', parameters.notes);
    this.set('index', parameters.index);
    this.set('imposedFraseLength', parameters.phaseOptions.imposedLength);
    this.set('fraseDuration', parameters.phaseOptions.duration);
    // importantly, for now you can't set the disableArpeg straight
    // from the bar; only has granularity at song level
    this.set('disableArpeg', parameters.phaseOptions.disableArpeg);
    this.set('config', parameters.config);
    this.set('phaseConfig', parameters.phaseOptions.manipParams);
  };

  /**
   * Get the index of the frase within the song.
   *
   * @return {Number}   Integer (index)
   */
  this.getIndex = function () {
    return this.get('index');
  };

  /**
   * Return a reference to the Frase's notes.
   *
   * @return {Array}
   */
  this.referToNotes = function () {
    return this.get('notes');
  };

  /**
   * Getter
   * @todo: rewrite to use Es6 getter
   *
   * @param  {String}   propName    Name of property to get
   * @return {mixed}                Value at property
   */
  this.get = function (propName) {
    if (allowedProps.indexOf(propName) === -1) {
      throw new Error('Disallowed property name:' + propName);
    }
    return this[propName];
  };

  /**
     * setter
     * @todo: rewrite to use Es6 setter
     *
     * @param  {String} propName    Name of property to set
     * @param  {mixed}  propName    Val to set
     * @return {mixed}              Value at property
     */
  this.set = function (propName, propVal) {
    if (allowedProps.indexOf(propName) === -1) {
      throw new Error('Disallowed property name:' + propName);
    }

    if (propVal === undefined) {
      this[propName] = null;
    }

    this[propName] = propVal;
  };

  /**
   * Run this passed func for each note
   *
   * @param  {Function} fn  Func to run
   * @return {Undefined}
   */
  this.forEachNote = function (fn) {
    _.each(this.get('notes'), fn);
  };

  /**
   * Get imposed        frase length
   * @return {Number}   Integral frase length
   */
  this.getImposedFraseLength = function () {
    return this.get('imposedFraseLength');
  };

  /**
   * Get the first note
   * @return {Object}   Note object
   */
  this.getFirstNote = function () {
    var notes1 = this.get('notes');
    if (notes1.notes) {
      return notes1.notes[0].note;
    }
    return this.get('notes')[0].note;
  };

  /**
     * Based on previous frase, give this one its
     * start position in the overall song.
     *
     * @param  {Object} priorFollowingTime Time by which to follow the prior
     * @return {Undefined}
     */
  this.hookTo = function (priorFollowingTime) {
    var fnt = this.getFirstNote();

    if (this.get('disableArpeg')) {
      // multiply this frase position by the fraseDuration (chord duration)
      fnt['fraseDelay'] = (this.getIndex() * this.get('fraseDuration'));
    } else {
      // mulitply insead by the forced phrase length
      fnt['fraseDelay'] = (this.getIndex() * this.getImposedFraseLength());
    }

    fnt['fraseDelay'] += priorFollowingTime;

    if (isNaN(fnt['fraseDelay']) || fnt['fraseDelay'] === undefined) {
      throw new Error('Unable to set frase timing');
    }
  };

  /**
   * Get the note count
   * @return {Number}   Integral note count
   */
  this.getNoteCount = function () {
    return this.referToNotes().length;
  };

  /**
   * Get the "disableArpeg" prop
   *
   * @return {Boolean}
   */
  this.getDisableArpeg = function () {
    return this.get('disableArpeg');
  };

  /**
   * Get config of manipulator being appled to to the
   * Frase context; prefer local, resort to Phase-based
   * configuration
   *
   * @param  {String}   manipName Manipulator name to refer to
   * @return {mixed}    Config
   */
  this.getManipParam = function (manipName) {
    var confDat = this.get('config');
    if (confDat) {
      if (confDat[manipName] !== undefined) {
        return confDat[manipName];
      }
    }
    return this._getPhaseManipParam(manipName);
  };

  /**
   * clone notes
   */
  this.frozenNotes = function () {
    if (!Object.isFrozen(this.notes)) {
      Object.freeze(this.notes);
    }
    return this.notes;
  };

  /**
   * Get config of manipulator being appled to to the
   * Frase context.
   *
   * @param  {String}   manipName Manipulator name to refer to
   * @return {mixed}    Config
   */
  this._getPhaseManipParam = function (manipName) {
    var phsConfDat = this.get('phaseConfig');

    if (phsConfDat) {
      if (phsConfDat[manipName] !== undefined) {
        return phsConfDat[manipName];
      }
    }
  };
  /**
     * If arpeg is not disabled, use imposedFraseLength
     * If arpeg is disabled, use fraseDuration; this means the
     * notes are played as a chord
     *
     */
  this.calcFollowingTime = function (phaseDelay) {
    var relativeFollowTime,
      absoFollowingTime;

    if (this.getDisableArpeg() === true) {
      // A frase is a chord; use chord duration
      relativeFollowTime = this.getIndex() * this.getFraseDuration();
    } else {
      // A frase is a series of notes; this is the reason for imposed
      // frase len property
      relativeFollowTime = this.getIndex() * this.getImposedFraseLength();
    }

    if (relativeFollowTime === undefined) {
      if (this.getIndex() === 0) {
        relativeFollowTime = 0;
      }
      throw new Error('Could not obtain relative following time');
    }

    // We always want to offset it to the phrase
    absoFollowingTime = relativeFollowTime + phaseDelay;

    if (!absoFollowingTime && absoFollowingTime !== 0) {
      throw new Error('Could not obtain absolute following time');
    }
    return absoFollowingTime;
  };

  this.initialize(params);
};

module.exports = Frase;
