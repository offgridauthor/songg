var util = require('util'),
    PhaseManipulator = require("./PhaseManipulator.js"),
    ForEachModulators = require('../codelibs/ForEachModulators.js'),
    modulator = 'EVERY-OTHER',
    modulatorFn = ForEachModulators[modulator],
    Note = require('../Note.js'),
    noteTranslation =
        {   perBarIdx: [
                    4,
                    2,
                    3,
                    5,
                    6,
                    4,
                    2,
                    3,
                    5,
                    6
                ]
        };

var PhaseElevator = function () {
    PhaseManipulator.apply(this, arguments);
    this.name = "PhaseElevator";
}

util.inherits(PhaseElevator, PhaseManipulator);

PhaseElevator.prototype.go = function(phs)
{
    this.forEachBar(phs, raiseBar, {}, modulatorFn);
    function raiseBar(br, params)
    {   var idx = params.barIndex;
        _.each(
            br,
            function(ntDat)
            {
                var nt = new Note(ntDat.note);
                console.log('nt before',nt);
                nt.setOct(noteTranslation.perBarIdx[idx]);
                console.log('nt after',nt);
            }
        );
    }
}

module.exports = PhaseElevator;
