/**
 * Model file for raw song data
 */

var bb = require('backbone'),
    parser = require('note-parser'),
    midiUtils = require('midiutils');

var Song = bb.Model.extend(
{
    /**
     * Backbone model defaults
     *
     * @type {Object}
     */
    defaults: {
        title: null,
        phases: new Array(), //array of Phase objects; parts of the song such as verse, chorus, and bridge.
        writeablePhases: new Array(), //deprecated; vestige of the first version of the code
    },
    /**
     * Set up the instance
     *
     * @param  {object} attribs Backbone model attributes
     * @param  {object} opts    Options (arguments, basically) for this function
     *
     * @return void
     */
    initialize: function(attribs, opts){
        var that = this;
        this.phaseMeta = [];
        this.writeableDuration = opts.writeableDuration;
        // console.log('song duration: ' + this.writeableDuration);
        this.hist = [];

    },

    utils: {
        dataFromUtilName: function(ntNm)
        {
            if (ntNm.indexOf('-') !== -1) {
                var dat1 = ntNm.split('-');
                return {
                    'note': dat1[0],
                    'oct': dat1[1]
                };
            } else {
                var oct = ntNm.charAt(ntNm.length - 1),
                    nameWithoutOct = ntNm.substring(0, 2);
                return {
                    'note': nameWithoutOct,
                    'oct': oct
                };
            }
        },
        writeableFormattedNote: function(ntNm, oct)
        {
            var useableNoteName = null,
                sharpsToFlats = {
                    'A#': 'Bb',
                    'B#': 'Cb',
                    'D#': 'Eb',
                    'G#': 'Ab',
                    'F#': 'Gb',
                    'C#': 'D'
                };

            if (ntNm.indexOf('#') !== -1) {
                // console.log('erstwhile');
                useableNoteName = sharpsToFlats[ntNm];
            } else {
                // console.log('hereby');

                useableNoteName = ntNm;
            }

            return useableNoteName + oct;
        }
    },
    /**
     * Return a phase by name
     *
     * @param  {string} pn  phase name
     *
     * @return object/false Requested phrase
     */
    getPhase: function(pn){

        if (pn
            && this.get
            && this.attributes
            && this.attributes.phases
            && this.attributes.phases.length
        ) {
            var phs = _._.whereWithIndex(this.get('phases'));
            if (phs) {
                return phs;
            }
        } else {
            return false;
        }
    },
    /**
     * Pass a phase name, function, and args for the function
     * to call this function and operate it on a phase of the
     * song.
     *
     * @param  {string}   phsNm  Name of the phase on which to perpetrate this function
     * @param  {Function} fn     Funtion to perpetrate on the phase
     * @param  {object}   params Will be used as arguments/options for call to fn
     *
     * @return {undefined}
     */
    portal: function(phsNm, fn, params){
        var phz = this.getPhase(phsNm);
        // console.log('in portal; phase len: ' + phz.length);
        return fn.apply(params.ctxt, [phz]);
        //return fn(this.getPhase(phsNm));

    },
    /**
     * Calculate the number of phases in the song
     *
     * @return {Number} Lengh value of this.attributes.phases
     */
    countPhases: function(){

        var phss = this.attributes.phases;

        return (phss
                && (phss.length !== undefined
                && phss.length !== null))
                    ? phss.length
                    : undefined;

    },
    /**
     * Add a phase to the song
     *
     * @param  {object} phase  Phase data
     * @param  {object} pegLib Arpeggio-making map
     * @param  {string} nm     key name for phase
     * @param  {number} idx    index at which to assign phase
     *
     * @return {undefined}
     */
    addPhase: function(phase, pegLib, nm, idx)
    {
        if (typeof phase === 'object') {

            //console.log(this);
            this.attributes.phases.push(phase);
            this.phaseMeta.push({
                'name': nm,
                'defaultPlacement': pegLib
            });
        } else {
            throw new Error('Argument should be an object (' + (typeof phase) + ') ');
        }

    },
    /**
     * Get the contents of the song bar by bar--for playing as
     * opposed to saving to a file.
     *
     * @return {array} bars of the song
     */
    readBars: function()
    {
        var retVar = [],
        that = this,
        forEachPhase = function(phs)
        {
            var forEachBar = function(br)
            {
                retVar.push(that.formatOutputBar(br));
            };
            _.each(phs, forEachBar);
        };

        _.each(this.attributes.phases, forEachPhase);

        
        return retVar;
    },
    /**
     * "Sheet music" means a spare notation that can be
     * converted to binary and sent down to the user as a
     * MIDI file (as opposed to playing in browser).
     *
     * @return {array} Array of notes
     */
    getSheetMusicBars: function()
    {
        var retVar = [],
            that = this;

        var forEachWrPhase = function(wrphs, phsIdx)
        {
            var forEachBar = function(br)
            {
                //get an array of 3 - 7 notes as "nts" var
                var nts = that.formatWriteableBar(br, phsIdx)
                //add those into the total song, "bar"ness is lost
                //this retvar is just an array of notes.
                retVar = retVar.concat(nts);
            };

            _.each(wrphs, forEachBar);
        }

        _.each(this.attributes.phases, forEachWrPhase);
        return retVar;
    },
    /**
     * Return notes of the bar in a reduced form readily convertable
     * to binary (as opposed to playing in browser).
     *
     * @param  {array}  bar    array of notes
     * @param  {number} phsIdx index from which the bar originated
     *
     * @return {array} Array of music notes in spare notation
     */
    formatWriteableBar: function(bar, phsIdx)
    {
        var that = this,
        retVar = [];

        // console.log('input bar, by note : ');
        // _.each(bar, function(nt1){
        //     console.log('note:' , nt1.note);
        // });
        _.each(bar, function(nt, idx){
            var formattedNote = that.formatWriteableNote(nt.note, idx, phsIdx);
            retVar.push(formattedNote);
        });
        // console.log('output bar, by note : ');
        // _.each(retVar, function(nt1){
        //     console.log('note:' , nt1);
        // });
        return retVar;

    },
    /**
     * Format a note to be placed into a writeable bar.
     *
     * @param  {string} nt       tonal.js style note info
     * @param  {number} ntIdx    index of note relative to the bar
     * @param  {number} phaseIdx index of the phase from which this note originated
     *
     * @return {object}          writeable note data
     */
    formatWriteableNote: function(nt, ntIdx, phaseIdx)
    {
        // console.log('line 209 | ' + nt.pc + ' | ' + nt.freq);
        // console.log(midiUtils.frequencyToNoteNumber(nt.freq));
        var noteNum = midiUtils.frequencyToNoteNumber(nt.freq),
            writeableNoteName = midiUtils.noteNumberToName(noteNum),
            noteData =
                this.utils.dataFromUtilName(writeableNoteName),
            correctWriteableNote =
                this.utils.writeableFormattedNote(noteData['note'], noteData['oct']);

            // console.log(writeableNoteName);
            // console.log(noteData);
            // console.log('final , usable note:');
            // console.log(
            //     correctWriteableNote
            // );
        // console.log('this.writeableDuration:');
        // console.log(this.writeableDuration);
        var pc = parser.parse(nt),
            writeableTime = Math.round(30 /*nt.time*/ /* * this.writeableDuration * 2 */), //durational; so doesnt need base time?
            //writeableNote = "" + nt.letter + nt.oct,
            //writeableNote = noteNum,
            writeableNote = correctWriteableNote,
            writeData = {
                note: writeableNote,
                duration: writeableTime
            };
            // console.log('writeable data:');
            // console.log(writeData);
        return writeData;
    },
    /**
     * Utility-type function for formatting a bar for consumption
     * by the client
     *
     * @param  {array} bar  Array of notes
     *
     * @return {object}     object wrapped how the client expects it
     */
    formatOutputBar: function(bar)
    {
        return {chord: bar};
    },

});

module.exports = Song;
