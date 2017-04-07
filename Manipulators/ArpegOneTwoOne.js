/**
 * This code is to be generalized. I am changing it so that all code
 * is a universal arpeggiator with the "arpeggiation" variable, below,
 * as one of the few items that will be different among classes, or
 * perhaps just an argument in the constructor or in the function call.
 *
 */

var util = require('util'),
    PhaseManipulator = require("./PhaseManipulator.js"),
    ForEachModulators = require('../codelibs/ForEachModulators.js'),
    modulator = 'ALL',
    modulatorFn = ForEachModulators[modulator],
    Note = require('../Note.js'),
    arpeggiation = [
        0, 64, 20, 120 /* values are transferred directly, will be relative */
    ];

function ArpegOneTwoOne ()
{
    PhaseManipulator.apply(this, arguments);
    this.name = "ArpegOneTwoOne";
}

util.inherits(ArpegOneTwoOne, PhaseManipulator);

/**
 * Effect the elevation
 *
 * @param  {Array}  phs     Array of bars of notes
 *
 * @return {undefined}
 */
ArpegOneTwoOne.prototype.go = function(phs)
{
    if (!phs.getImposedFraseLength()) {
        throw new Error('Custom arpeggation requires an imposed frase length in phase.');
    }

    this.forEachBar(phs, arpeg, {}, modulatorFn);

    function arpeg(br, params)
    {   console.log('arp 43');
        _._.logg(br);
        var idx = params.barIndex,
            applicableDelay = null;

        _.each(
            br,
            function(ntDat, idx)
            {
                if (arpeggiation[idx]) {
                    applicableDelay = arpeggiation[idx];
                }

                var nt = new Note(ntDat);
                console.log('arp 56');
                if (applicableDelay) {
                    console.log('arp 58');
                    nt.ntAttrs.relativeTime = applicableDelay;
                    nt.ntAttrs.imposedBarLength = phs.imposedFraseLength;
                } else {
                    console.log('arp 62');
                    nt.ntAttrs.relativeTime = 0;
                }

                console.log('arpeg end'); _._.logg(nt.ntAttrs);

            }
        );
    }
}

module.exports = ArpegOneTwoOne;
