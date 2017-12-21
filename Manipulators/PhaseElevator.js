/**
 * This manipulator raises each bar in the phase according to
 * the values in noteTranslation property.
 */

var util = require('util'),
  PhaseManipulator = require('./PhaseManipulator.js'),
  ForEachModulators = require('../codelibs/ForEachModulators.js'),
  modulator = 'ALL',
  modulatorFn = ForEachModulators[modulator],
  Note = require('../Note.js'),
  noteTranslation =
        { perBarIdx: [5, 5]
        }

function PhaseElevator () {
  PhaseManipulator.apply(this, arguments)
  this.name = 'PhaseElevator'
}

util.inherits(PhaseElevator, PhaseManipulator)

/**
 * Effect the elevation
 *
 * @param  {Array}  phs     Array of bars of notes
 *
 * @return {undefined}
 */
PhaseElevator.prototype.go = function (phs) {

  this.forEachBar(phs, raiseBar, {}, modulatorFn)

  /**
     * Raise the octave of the bar's notes according to
     * noteTranslation specs
     *
     * @param  {Object}     br      bar
     * @param  {Object}     params  options
     *
     * @return {undefined}
     */
  function raiseBar (br, params) {
    var idx = params.barIndex
    _.each(
      br,
      function (ntDat) {
        var nt = new Note(ntDat)
        if (noteTranslation.perBarIdx.length > 0) {
          var modIdz = idx % noteTranslation.perBarIdx.length
          if (noteTranslation.perBarIdx[modIdz]) {
            nt.setOct(noteTranslation.perBarIdx[modIdz])
          }
        }
      }
    )
  }
}

module.exports = PhaseElevator
