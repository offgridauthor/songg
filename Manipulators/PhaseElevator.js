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
        {   perBarIdx: [3,4]
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
    return;
    this.forEachBar(phs, raiseBar, {}, modulatorFn);

    function raiseBar(br, params)
    {
        //console.log('br---');
        //console.log(br);
        var idx = params.barIndex;
        _.each(
            br,
            function(ntDat)
            {
                //console.log('ntDat:', ntDat);
                var nt = new Note(ntDat);
                //console.log('before (' + idx+ ') :', nt);
                if (noteTranslation.perBarIdx.length > 0) {
                    var modIdz = idx % noteTranslation.perBarIdx.length;

                    console.log('modIdz', modIdz);

                    if (noteTranslation.perBarIdx[modIdz]) {
                        nt.setOct(noteTranslation.perBarIdx[modIdz]);
                    }
                }

                //console.log('after:', nt);
                nt = {};
                delete nt;
            }
        );
    }
}

module.exports = PhaseElevator;
