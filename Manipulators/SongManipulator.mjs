/**
 * Manipulates each phase of a song or each as
 * specified by a (yet to be written) modulator
 * function.
 * @todo: Convert to a es6 module.
 */
import util from 'util';
import Manipulator from './Manipulator.mjs';

/**
 * Primary class
 * @return {Undefined}
 */
var SongManipulator = function () {
  this.name = 'SongManipulator';
  Manipulator.apply(this, arguments);
};

util.inherits(SongManipulator, Manipulator);

export default SongManipulator;
