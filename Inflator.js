var util = require('util'),
    parser = require('note-parser'),
    t = require('tonal'),
    Song = require('./Song.js');


/**
 * Given the basic theoretical data of a song, this class
 * makes the entire default set of bars.
 */


var Inflator = function () {
    this.name = "Inflator";
}

Inflator.inflate = function(dat)
{

    var song = null,
        song = new Song(null, {writeableDuration: dat.writeableDuration}),
        chords = dat.chords,
        phases = dat.phases,
        songTime = 0,
        songParams = {
            phs: phases
        },
        phsCnt = 0;

    return makeDefaultBars(songParams);

    function makeDefaultBars(params)
    {
        var phases1 = params.phs;

        function forEachPhase (element, idx, allKeys)
        {

            var phaseNotes = [],
                phaseTime = 0,
                phaseName = element,
                phase = phases1[element],
                comp = phase.composition,
                pegLib = phase.arpegLib,
                barCntr = 0,
                barTimes = [];

                //var sum = [1, 2, 3].reduce(add, 0);
                //for each bar from the factory
                while (barCntr < phase.barCount)
                {
                    // for this phase, all data to build it is in arpegLib,
                    // and composition, and it will make reference to
                    // "chords", the theoretical info store.
                    var barTime = 0;
                    barTimes.push(barTime);
                    comp.forEach(  //going through each bar name
                        function(barName){

                            var thisPegLib = pegLib[barName],
                                offset = thisPegLib.offset,
                                arr = thisPegLib.arr,
                                theorySearchResults = _.where(chords, {name: barName})[0],
                                rc = getRawNotes(
                                    {
                                        crdTheory: theorySearchResults,
                                    }
                                );

                            var bar = makeMidiAddTime(
                                rc,
                                {   phsTm: phaseTime,
                                    barTimesCache: barTimes,
                                    ofs: offset,
                                    pl: thisPegLib
                                }
                            );
                            var noteMetaData = makeNoteMetaData(barName);

                            _.each(bar.notes, function(nt){
                                stampNote(nt, noteMetaData);
                            });

                            phaseNotes.push(bar.notes);

                            //the primary reason that node js is fantastic is that in a sense it IS stateful.
                            //
                            phaseTime += barTimes[barTimes.length - 1];
                             //presumes that chords dont overlap. too simple an algo.
                            //should just take the highest combination of a pertinent offset plus indiv
                            //vidual note's time signature. in fact, this is the first thing to do.
                        }
                    );
                    barCntr++;
                }

                phsCnt++;
                song.addPhase(phaseNotes, pegLib, idx, phsCnt);
        }

        Object.keys(phases).forEach(forEachPhase);

        return song;

    }

    function makeNoteMetaData (bn)
    {
        return {'chord' : bn};
    }

    function stampNote(nt, meta)
    {
        nt.note.meta = meta;
    }

    function getRawNotes(params)
    {
        var chordName = params.crdTheory.chord,
            oct = params.crdTheory.octave,
            rawChord = t.chord(chordName, oct);
        return rawChord;
    }


    function makeMidiAddTime(nts, params)
    {

        var timesCache = params.barTimesCache,
            baseTime = params.ofs,
            whichNote = 0,
            arpegCntr = params.pl.arr,
            midiNts = [],
            writeableNts = [],
            pTime = params.phsTm;

        nts.forEach (function(nt){
            //console.log('trying to parse note:', nt);
            var pc = parser.parse(nt);

            songTime += arpegCntr[whichNote];

            pc.time = songTime;
            pc.delay = songTime;
            midiNts.push({'note': pc});
            whichNote ++;

        });
        return {
            'notes': midiNts
        }
    }

    function add(a, b) {
        return a + b;
    }
}

module.exports = Inflator;
