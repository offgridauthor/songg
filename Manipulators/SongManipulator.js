/**
 * Manipulates each phase of a song or each as
 * specified by a (yet to be written) modulator
 * function.
 *
 */
var util = require('util'),
    Manipulator = require("./Manipulator.js");

var SongManipulator = function () {
    this.name = "SongManipulator";
    Manipulator.apply(this, arguments);
}

util.inherits(SongManipulator, Manipulator);

module.exports = SongManipulator;
