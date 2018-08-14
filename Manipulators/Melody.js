/**
 * For a single bar, temporally spread the notes according to the indicated
 * pattern.
 *
 */

var util = require('util'),
  PhaseManipulator = require('./PhaseManipulator.js');

function Melody () {
  PhaseManipulator.apply(this, arguments);
  this.name = 'Melody';
}

util.inherits(Melody, PhaseManipulator);

/**

 */
Melody.prototype.go = function (phs, song) {
  this.createMelody = function (params) {
  };

  this.overlayMelody = function () {
  };

  this.insertMelody = function () {
  };

  this.getScaleFromPrecedence = function () {
    let phsScale = phs.get('scale'),
      songScale;

    if (phsScale) {
      return phsScale;
    }

    if (song === undefined) {
      return null;
    }

    songScale = song.get('scale');

    if (songScale) {
      return songScale;
    }

    return null;
  };
};

module.exports = Melody;
