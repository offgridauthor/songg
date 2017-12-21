/**
 * Extendable class for altering phases of Songs
 *
 */
var util = require('util'),
    Manipulator = require("./Manipulator.js");

function PhaseManipulator ()
{
    Manipulator.apply(this, arguments);
    this.name = "PhaseManipulator";
}

util.inherits(PhaseManipulator, Manipulator);

/**
 * Within specified phase, execute specified function on each bar.
 *
 * @param  {object}   phs    Phase data
 * @param  {Function} fn     Function that will actually manipulate the note in some way
 * @param  {object}   params Arguments or options for call to fn
 * @param  {Function} modFn  Modulator: function that determines which notes on each bar to alter
 *
 * @return {undefined}
 */
PhaseManipulator.prototype.forEachBar = function(phs, fn, params, modFn)
{

    if (!_.isFunction(modFn)) {
        throw new Error('Function is required.');
    }

    _.forEach(phs.referToFrases(), function(bar0, idx) {

        params.barIndex = idx;
        if (modFn(idx)) {

            fn(bar0, params);
            bar0 = null;
            delete bar0;
        }
    });
}

module.exports = PhaseManipulator;
