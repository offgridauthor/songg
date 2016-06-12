/**
 * This manipulator raises each bar in the phase according to
 * the values in noteTranslation property.
 */

var util = require('util'),
    PhaseManipulator = require("./PhaseManipulator.js"),
    ForEachModulators = require('../codelibs/ForEachModulators.js'),
    modulator = 'ALL',
    modulatorFn = ForEachModulators[modulator],
    Note = require('../Note.js'),
    noteTranslation =
        {   perBarIdx: [
                5,
                5,
                6,
                6,
                6,
                4,
                2,
                3,
                5,
                6
            ]
        };

function PhaseElevator ()
{
    PhaseManipulator.apply(this, arguments);
    this.name = "PhaseElevator";
}

util.inherits(PhaseElevator, PhaseManipulator);

/**
 * Effect the elevation
 *
 * @param  {Array}  phs     Array of bars of notes
 *
 * @return {undefined}
 */
PhaseElevator.prototype.go = function(phs)
{

    this.forEachBar(phs, raiseBar, {}, modulatorFn);

    function raiseBar(br, params)
    {
        var idx = params.barIndex;
        _.each(
            br,
            function(ntDat)
            {
                var nt = new Note(ntDat);
                console.log('before (' + idx+ ') :', nt);
                nt.setOct(noteTranslation.perBarIdx[idx]);
                console.log('after:', nt);
                nt = {};
                delete nt;
            }
        );
    }
}

module.exports = PhaseElevator;
