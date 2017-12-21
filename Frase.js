var Frase = function (params) {
  var allowedProps = [
    'notes',
    'imposedFraseLength',
    'fraseDuration',
    'index',
    'disableArpeg',
    'config',
    'phaseConfig'
  ]

  this.notes = null
  this.fraseDuration = null
  this.imposedFraseLength = null
  this.disableArpeg = null

  this.initialize = function (parameters) {
    this.set('notes', parameters.notes)
    this.set('index', parameters.index)
    this.set('imposedFraseLength', parameters.phaseOptions.imposedLength)
    this.set('fraseDuration', parameters.phaseOptions.duration)
    // importantly, for now you can't set the disableArpeg straight
    // from the bar; only has granularity at song level
    this.set('disableArpeg', parameters.phaseOptions.disableArpeg)
    this.set('config', parameters.config)
    this.set('phaseConfig', parameters.phaseOptions.manipParams)
  }

  // common with phase
  this.getIndex = function () {
    return this.get('index')
  }

  this.referToNotes = function () {
    return this.get('notes')
  }

  this.get = function (propName) {
    if (allowedProps.indexOf(propName) === -1) {
      throw new Error('Disallowed property name:' + propName)
    }
    return this[propName]
  }

  this.set = function (propName, propVal) {
    if (allowedProps.indexOf(propName) === -1) {
      throw new Error('Disallowed property name:' + propName)
    }

    if (propVal === undefined) {
      this[propName] = null
    }

    this[propName] = propVal
  }

  this.forEachNote = function (fn) {
    _.each(this.get('notes'), fn)
  }

  this.getImposedFraseLength = function () {
    return this.get('imposedFraseLength')
  }

  this.getFirstNote = function () {
    var notes1 = this.get('notes')
    if (notes1.notes) {
      return notes1.notes[0].note
    }
    return this.get('notes')[0].note
  }

  /**
     * Based on previous phrase, give this one its
     * start position in the overall song.
     *
     * @param  {[type]} previousPhase [description]
     * @return {[type]}               [description]
     */
  this.hookTo = function (priorFollowingTime) {
    var fnt = this.getFirstNote()

    if (this.get('disableArpeg')) {
      // multiply this frase position by the fraseDuration (chord duration)
      fnt['fraseDelay'] = (this.getIndex() * this.get('fraseDuration'))
    } else {
      // mulitply insead by the forced phrase length
      fnt['fraseDelay'] = (this.getIndex() * this.getImposedFraseLength())
    }

    fnt['fraseDelay'] += priorFollowingTime

    if (fnt['fraseDelay'] === NaN || fnt['fraseDelay'] == undefined) {
      throw new Error('Unable to set frase timing')
    }
  }

  this.getNoteCount = function () {
    return this.referToNotes().length
  }

  this.getDisableArpeg = function () {
    return this.get('disableArpeg')
  }

  this.getManipParam = function (manipName) {
    var confDat = this.get('config')
    if (confDat) {
      if (confDat[manipName] !== undefined) {
        return confDat[manipName]
      }
    }
    return this._getPhaseManipParam(manipName)
  }

  this._getPhaseManipParam = function (manipName) {
    var phsConfDat = this.get('phaseConfig')

    if (phsConfDat) {
      if (phsConfDat[manipName] !== undefined) {
        return phsConfDat[manipName]
      }
    }
  }
  /**
     * If arpeg is not disabled, use imposedFraseLength
     * If arpeg is disabled, use fraseDuration; this means the
     * notes are played as a chord
     *
     */
  this.calcFollowingTime = function (phaseDelay) {
    var relativeFollowTime,
      absoFollowingTime,
      fnt = this.getFirstNote(),
      noteCnt = this.getNoteCount()

    if (this.getDisableArpeg() === true) {
      // A frase is a chord; use chord duration
      relativeFollowTime = this.getIndex() * this.getFraseDuration()
    } else {
      // A frase is a series of notes; this is the reason for imposed
      // frase len property
      relativeFollowTime = this.getIndex() * this.getImposedFraseLength()
    }

    if (relativeFollowTime === undefined) {
      if (this.getIndex() === 0) {
        var relativeFollowTime = 0
      }
      throw new Error('Could not obtain relative following time')
    }

    // We always want to offset it to the phrase
    absoFollowingTime = relativeFollowTime + phaseDelay

    if (!absoFollowingTime && absoFollowingTime !== 0) {
      throw new Error('Could not obtain absolute following time')
    }
    return absoFollowingTime
  }

  this.initialize(params)
}

module.exports = Frase
