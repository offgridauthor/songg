var util = require('util'),
    parser = require('note-parser'),
    t = require('tonal'),
    Song = require('./Song.js'),
    tc = require('tonal-chord');

    var defaultDelay = 64,
        absoTimeIdx = 'absoTime',
        relativeTimeIdx = 'relativeTime',
        song;

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
    return makeDefaultBars();

    function makeDefaultBars()
    {

        song = new Song(null);

        var chords = dat.chords,
            phsCnt = 0,
            phsTime = 0;

        _.forEach(dat.phases, function(a,b,c){
            var lengthOfAddedPhase = forEachPhase(a,b, phsTime, chords, phsCnt);
            phsCnt++;
            phsTime += lengthOfAddedPhase;
        });

        return song;
    }
    /**
     * Procedure that conducts a basic construction according to the blueprint data.
     * Manipulators are introduced elsewhere.
     *
     */
    function forEachPhase (phase, phaseIdxInSong, phaseTimeInSong, chords, phsCnt)
    {
        var phaseReceptacle = [], //reset temporary var for each laid out phase

            // cache a few properties for convenience
            measureChords = phase.composition,
            pegLib = phase.arpegLib,
            // phase.measureLength,
            beatLength = phase.beatLength,
            measureCntr = 0,
            calculatedPhaseTime = beatLength * measureChords.length * phase.measureCount,
            relTime = phase.midiBeatLength,
            dur = phase.chordDuration;

            validateChordNames(measureChords, chords);

            var phaseReceptacle =[],
                elapsedMsrTime = 0;

            while (measureCntr < phase.measureCount)
            {
                // console.log('begin measure loop; measure countr', measureCntr + "\n" + '<--------new measure -------------------->');
                barCntr = 0; // single bar per chord

                var measure = new String(measureCntr + 1),
                    measureReceptacle = [];

                while (barCntr < measureChords.length) { //an unresolved issue: composition (chord names) len may differ from measure length
                    var chordName = measureChords[barCntr];
                    // console.log('adding a bar to the measure ()' , chordName);
                    // console.log('bar cntr:' , barCntr);
                    console.log('another bar; idx:' , barCntr);
                    //@todo: This haphazard function call is a major suck.
                    // Reduce num of args by breaking up work.
                    // Place as many calculations as possible into it, removing
                    // them from above. Perhaps just pass it the phase data
                    // or something.
                    addBarToMeasure(barCntr, chordName, measureReceptacle, beatLength, chords, measure, parser, relTime, dur);
                    barCntr ++;
                }
                var elapsedTime = (elapsedMsrTime + phaseTimeInSong);
                console.log('elapsed measure time:' + elapsedMsrTime);
                console.log('phs time:', phaseTimeInSong);
                console.log('elapsed time:', elapsedTime);
                console.log();
                measureReceptacle = addMeasureOffsets(measureReceptacle, elapsedTime);
                withOffsets = measureReceptacle;
                withOffsets.forEach(
                    function(obj)
                    {
                        phaseReceptacle.push(obj.notes);
                    }
                );

                measureCntr++;

                //These variables illustrate inflator structure.
                var barsThisMeasure = measureChords.length,
                    beatsThisMeasure = barsThisMeasure,
                    msrLength = beatsThisMeasure * beatLength;

                    elapsedMsrTime += msrLength;
                //console.log('elapsed at end of (' + (measureCntr -1) +') :' + elapsedMsrTime);
            }

            //showPhaseNotes(phaseReceptacle);
            song.addPhase(phaseReceptacle, pegLib, phaseIdxInSong, phsCnt);
            validateCountedTime(elapsedMsrTime, calculatedPhaseTime);
            return elapsedMsrTime;
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

        var timelessNote1 = timelessNote(itm /* note name */, parser1);
        timeless.push(timelessNote1);
    });

    return timeless;

}

function timelessNote(ntNm, prs){

    var pc = prs.parse(ntNm);

    pc.phaseStart = null;
    pc.strumTime = null;

    pc.delay = null;
    return pc;

}

/**
 * Set each note in a bar to timeToAdd
 * @param {array} bar Array of notes with null time and delay
 * @param {Number} timeToAdd Time to which to set each note of bar
 *
 *
 */
function addBarOffsets(bar, absoTime, midiRelTime, midiDur)
{
    var measureLength = 1,
        barCopied = copyBar(bar),
        offsetToMeasure = addBarTime(barCopied, absoTime),
        barCopiedAgain = copyBar(offsetToMeasure),
        withRelativeTimes = addRelBarTimes(barCopiedAgain, midiRelTime, midiDur),
        retVar = { 'notes': withRelativeTimes };
        //showBarNotes(retVar.notes);

    return retVar;

}


    function addBarTime(bar123, bTm)
    {
        var newBar = [];
        bar123.forEach(
            function(offsettable)
            {
                offsettable[absoTimeIdx] = bTm;
                newBar.push({'note': offsettable});
            }
        );
        return newBar;
    }

    function addRelBarTimes(bar123, relTime, dur)
    {
        var newBar = [];
        bar123.forEach(
            function(obj)
            {   var offsettable = obj.note;
                offsettable[relativeTimeIdx] = relTime;
                offsettable['duration'] = dur;
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
     * Add specified time to each note in the specified measure
     *
     * @param {Object} msr_ The Measure
     * @param {Number} mTm  Time to add to each note in the measure
     *
     * @return {undefined} _
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
                        offsettable.note[absoTimeIdx] += mTm;
                        // console.log('note time after:', offsettable.note.time );
                        newBar.notes.push(offsettable);
                    }
                );
                newMsr_.push(newBar)
            }
        );
        return newMsr_;
    }

    /**
     * Copy the specified measure; deep copy
     *
     * @param  {Object} m1 Measure to copy
     * @return {undefined} _
     */
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

function addBarToMeasure(stridx, measureChordName, receptacle, beatLength1, chordLib, measure, p1, relTime, dur)
{

    var strumTime = beatLength1 * stridx,
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

    // var timedToPhase = addOffsets(bar,  measure, stridx, beatLength1);
    // next func call should just add a beat length for each elapsed bar
    // that has come before this one.

    console.log('bar index:', stridx, 'beat length:', beatLength1);
    console.log('setting bar to time ', stridx * beatLength1);

    var timedToBar = addBarOffsets(bar, stridx * beatLength1, relTime, dur);

    receptacle.push({'notes': timedToBar.notes} );

}

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

    /**
     *
     *
     * @param  {[type]} phsData [description]
     * @return {[type]}         [description]
     */
    function showBarNotes(barData)
    {
        var n = 0;
        console.log("A bar, note by note:");
        barData.forEach(
            function(obj){

                var nNt = obj.note;
                console.log('note object ');
                console.log(nNt);

            }
        );
    }

    function validateCountedTime(cntd, calcd)
    {
        if (cntd !== calcd) {
            throw new Error('Counted phase time does not match projected phase time');
        }
    }

    function validateChordNames (cordz, songChords)
    {
        var invalidCordz = [];

        cordz.forEach(function(cordzItm, cordzIdx){
            var crdDat = _.where(songChords, {name: cordzItm});
            if (crdDat.length <= 0) {
                //console.log('invalid chord:', cordzItm);
                invalidCordz.push(cordzItm);
            }
        });

        if (invalidCordz.length > 0) {
            throw new Error('Invalid chords found; not in the library: ', invalidCordz);

        }
    }



module.exports = Inflator;
