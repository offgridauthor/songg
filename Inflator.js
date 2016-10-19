var util = require('util'),
    parser = require('note-parser'),
    t = require('tonal'),
    Song = require('./Song.js'),
    tc = require('tonal-chord');

    function getTonalNotes(chordLibDat)
    {
        // import chord from 'tonal-chord';
        var chordName = chordLibDat.chord,
            oct = chordLibDat.octave;

            var
            rawChord = tc.build(chordName, oct);

            // console.log('tc: ' , tc, 'chord name: ', chordName);
            // console.log('raw chord:', rawChord);

             //use tonal.js to fetch a midi-composed chord
        return rawChord;
    }
/**
 * Given the basic theoretical data of a song, this class
 * makes the entire default set of bars.
 */



var Inflator = function () {
    this.name = "Inflator";
}
/**
 * Inflate song according to blueprint data in the "phases" object
 * of the song's json.
 *
 * @param  {object} dat POJO taken as the entirety of the song's json file
 *
 * @return {object} Inflated song
 */
Inflator.inflate = function(dat)
{
    //Load data into vars for convenience.
    var song = null,
        song = new Song(null, {writeableDuration: dat.writeableDuration}),
        chords = dat.chords,
        /**
            Chords lib; array of objects each with this structure:
            {
                name: "mainChord"   //your chosen name for the chord
                chord: "maj",       // according to tonal.js conventions
                octave: "C4"        //according to tonal.js convention
            }
        */
        /*
            The blueprint that makes use of the chords library
            Array of objects in which each item is roughly equivalent to
            a chunk of song such as a chorus, verse, or bridge.
            Each chunk is one iteration of that; so you would probably have
            chorus1, verse1, chorus2, verse2, and so forth
         */
        songTime = 0,
        phsCnt = 0;


    return makeDefaultBars();

    function makeDefaultBars()
    {
        /*
            Each phase names a song phase such as chorus1, verse1, bridge,
            chorus2, verse2, bridge2.
            For each such key, contained in it is an object with blueprint
            data. The blueprint makes use of this particular song's chord
            library, defined separately in the json file (see above for the
            structure of both the phase objects and the chord lib items).
         */
        /**
         * Procedure that conducts a basic construction according to the blueprint data.
         * Manipulators are introduced elsewhere.
         *
         * @param  {string} phase Phase element. Structure of that POJO:
         * {

                 "measureCount": 3, user-set number of measures in phase
                 "composition": ["primary", "cBar", "secondary"],
                                The inflator runs through a manipulator up to [measureCount]
                                times for each of these names--which it seeks in the chord
                                library.

                 "arpegLib": {  For this phase only, time data for making the initial
                                (pre-manipulation) midi-ish note

                     "cBar": {
                         "offset": 0,
                         "arr": [0.2, 0.2, 0.2, 0.2, 0.2]
                     },
                     "primary": {
                         "offset": 1,
                         "arr": [0.2, 0.2, 0.2, 0.2]
                     },
                     "secondary": {
                         "offset": 2,
                         "arr": [0.2, 0.2, 0.2, 0.2]
                     }
                 }

         * }
         * @param  {integer} idx    Index of element; ie order
         * @param  {object} allKeys Reference to master list, i.e. the outer thing we are looping through
         *
         * @return {undefined}
         */
        function forEachPhase (phase, phaseIdxInSong, allKeys)
        {

            var phaseReceptacle = [], //reset temporary var for each laid out phase
                phaseTime = 0, //reset the ticker for this phase

                //cache a few properties for convenience
                measureChords = phase.composition,
                pegLib = phase.arpegLib,
                // phase.measureLength,
                beatLength = phase.beatLength,
                measureCntr = 0;


                var validateChordNames = function(cordz)
                {
                    var invalidCordz = [];

                    cordz.forEach(function(cordzItm, cordzIdx){
                        var crdDat = _.where(chords, {name: cordzItm});
                        if (crdDat.length <= 0) {
                            //console.log('invalid chord:', cordzItm);
                            invalidCordz.push(cordzItm);
                        }
                    });

                    if (invalidCordz.length > 0) {
                        throw new Error('Invalid chords found; not in the library: ', invalidCordz);

                    }
                }

                validateChordNames(measureChords);

                var phaseReceptacle =[],
                    elapsedMsrTime = 0;
                while (measureCntr < phase.measureCount)
                {
                    console.log('begin measure loop');
                    barCntr = 0; // single bar per chord
                    var measure = new String(measureCntr + 1),
                        measureReceptacle = [];

                    while (barCntr < measureChords.length) { //an unresolved issue: composition (chord names) len may differ from measure length
                        var chordName = measureChords[barCntr];
                        // console.log('adding a bar to the measure ()' , chordName);
                        // console.log('bar cntr:' , barCntr);
                        addBarToMeasure(barCntr, chordName, measureReceptacle, beatLength, chords, songTime, measure, parser);
                        barCntr ++;
                    }

                    withOffsets = addMeasureOffsets(measureReceptacle, elapsedMsrTime);

                    withOffsets.forEach(
                        function(obj)
                        {
                            phaseReceptacle.push(obj.notes);
                        }
                    );

                    measureCntr++;

                    //This variables illustrate inflator structure.
                    var beatsPerBar = measureChords.length,
                        barsThisMeasure = barCntr,
                        beatsThisMeasure = beatsPerBar * barsThisMeasure,
                        msrLength = beatsThisMeasure * beatLength;

                    elapsedMsrTime += msrLength;

                    console.log('elapsed at end of (' + (measureCntr -1) +') :' + elapsedMsrTime);
                }
                phsCnt++;


                /*

                How it should look , phase when
                added to song

                [ [ { note: [Object] },
                    { note: [Object] },
                    { note: [Object] },
                    { note: [Object] } ],
                  [ { note: [Object] },
                    { note: [Object] },
                    { note: [Object] },
                    { note: [Object] } ],
                  [ { note: [Object] },
                    { note: [Object] },
                    { note: [Object] },
                    { note: [Object] } ] ]
                 */
                song.addPhase(phaseReceptacle, pegLib, phaseIdxInSong, phsCnt);
        }
        _.forEach(dat.phases, forEachPhase);

        return song;

    }

    function stampNote(nt, meta)
    {
        nt.note.meta = meta;
    }

    function add(a, b) {
        return a + b;
    }
}
/**
 * Given an array of note names and arpegLib from song's json, makes midi
 * data in a format consumable by the player, MIDI.js.
 *
 * @param  {array} nts List of note names
 * @param  {object} params POJO; structure example:
 *                          {
 *                              pl: { //object from arpeg lib
                                     "offset": 0,
                                     "arr": [0.2, 0.2, 0.2, 0.2, 0.2]
 *                                      }
 *
 *                          }
 * @return {[type]}        [description]
 */
function timelessBar(noteNames, parser1)
{
    var whichNote = 0,
        midiNts = [],
        writeableNts = [],
        timeless = [];


    noteNames.forEach(function(itm, phaseIdxInSong, allNotes){
        /**
         * Given name of a single note, create those as tonal-formatted
         * note objects. These are collected in timless.
         *
         */
        //console.log('p1 - in tbar', parser1);
        var timelessNote1 = timelessNote(itm /* note name */, parser1);
        timeless.push(timelessNote1);
    });

    return timeless;

    function simultaneousNotes()
    {

    }
}

function timelessNote(ntNm, prs){

    var pc = prs.parse(ntNm);

    pc.phaseStart = null;
    pc.strumTime = null;

    pc.delay = null;
    return pc;

}

/**
 *
 * @param {array} bar Array of notes with null time and delay
 * @param {[type]} phaseTime [description]
 *
 * addOffsets(bar, phaseTime, measure, strumIdx, beatLength);
 */
function addBarOffsets(bar, timeToAdd)
{
    var measureLength = 1,
        barCopied = copyBar(bar),
        offsetToMeasure = addBarTime(barCopied, timeToAdd),
        retVar = { 'notes': offsetToMeasure };

    return retVar;

    function addBarTime(bar123, bTm)
    {
        var newBar = [];
        bar123.forEach(
            function(offsettable)
            {
                offsettable.time = bTm
                newBar.push({'note': offsettable});
            }
        );
        return newBar;
    }

    function copyBar(bar1){
        var retBar = [];
        bar1.forEach(
            function(offsetItm1)
            {
                var tn2 = JSON.parse(JSON.stringify(offsetItm1));
                retBar.push(tn2);
            }
        );
        return retBar;
    }
}


/**
 *
 *
 * @param {array} msr Measure of bars; each bar = array with "notes" as
 *                    primary property.
 * @param {[type]} phaseTime [description]
 *
 * addOffsets(bar, phaseTime, measure, strumIdx, beatLength);
 */
function addMeasureOffsets(msr, timeToAdd)
{
    var copied = copyMeasure(msr),
        offsetToMeasure = addMeasureTime(copied, timeToAdd);

    return offsetToMeasure;

    /**
     *
     *
     * @param {[type]} msr_ [description]
     * @param {[type]} mTm  [description]
     */
    function addMeasureTime(msr_, mTm)
    {
        var newMsr_ = [];
        msr_.forEach(
            function(barItm)
            {
                var newBar = {
                    notes: []
                };

                barItm.notes.forEach(
                    function(offsettable)
                    {
                        // console.log('note time before before:', offsettable.note.time );
                        offsettable.note.time += mTm;
                        // console.log('note time after:', offsettable.note.time );
                        newBar.notes.push(offsettable);
                    }
                );
                newMsr_.push(newBar)
            }
        );
        return newMsr_;
    }

    function copyMeasure(m1){
        var retM = [];
        m1.forEach(
            function(offsetItm1)
            {
                var tn2 = JSON.parse(JSON.stringify(offsetItm1));
                retM.push(tn2);
            }
        );
        return retM;
    }
}



function addBarToMeasure(stridx, measureChordName, receptacle, beatLength1, chordLib, songTime, measure, p1)
{

    // console.log('making measure ', stridx, 'chord name:', measureChordName);
    var //error, here: chord name is being gotten by stridx; wrong
        strumTime = beatLength1 * stridx,
        chordLibDat = _.where(chordLib, {name: measureChordName})[0],
        chordNoteList = getTonalNotes(
                chordLibDat
        );

    var bar = timelessBar(
            chordNoteList, //e.g. [ 'C4', 'Eb4', 'G4' ]
            p1
        );

    var noteMetaData = makeNoteMetaData(measureChordName);
    _.each(bar.notes, function(nt){
        stampNote(nt, noteMetaData);
    });

    // var timedToPhase = addOffsets(bar, songTime, measure, stridx, beatLength1);
    // next func call should just add a beat length for each elapsed bar
    // that has come before this one.
    console.log('setting bar to time ', stridx * beatLength1);
    var timedToBar = addBarOffsets(bar, stridx * beatLength1);

    receptacle.push({'notes': timedToBar.notes} );

}

/*

"C11",
"D11b9",
"E13"


"melodies": [
    {
        "indexBy": "barCount",
        "type": "arpeggio",
        "timing": "even",
        "composition": [
            "G+add#9",
            "C11"
        ]
    }
],
"arpegLib": {
    "2": {
        "type": "even"
    },
    "4": {
        "arr": [
            0.25,
            0.25,
            0.25,
            0.2
        ]
    }
}

 */

function makeNoteMetaData (bn)
{
    return {'chord' : bn};
}

function showPhaseNotes(phsData)
{
    var n = 0;
    phsData.forEach(
        function(arr){
            var nNt = 0;
            console.log('array ' + n + ' of note objects');
            arr.forEach(function(noteObj){
                console.log('note object ' + nNt );
                console.log(noteObj.note);
                nNt ++ ;
            });
            n++;
        }
    );
}


module.exports = Inflator;
