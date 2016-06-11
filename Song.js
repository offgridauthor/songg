/**
 * Model file for raw song data
 */

var bb = require('backbone'),
    parser = require('note-parser');

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
     * @param  {object} attribs Backbone model attributes
     * @param  {object} opts    Options (arguments, basically) for this function
     *
     * @return void
     */
    initialize: function(attribs, opts){
        var that = this;
        this.phaseMeta = [];
        this.writeableDuration = opts.writeableDuration;
        this.hist = [];

    },
    /**
     * Return a phase by name
     *
     * @param  {string} pn phase name
     *
     * @return object/false   Requested phrase
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
     * @param  {[type]}   phsNm  [description]
     * @param  {Function} fn     [description]
     * @param  {[type]}   params [description]
     * @return {[type]}          [description]
     */
    portal: function(phsNm, fn, params){

        return fn(this.getPhase(phsNm));

    },
    /**
     * Calculate the number of phases in the song
     *
     * @return {Number} Lengh value of this.attributes.phases
     */
    countPhases: function(){

        var phss = this.attributes.phases;

        return (phss && (phss.length !== undefined && phss.length !== null)) ? phss.length : undefined;

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

            console.log(this);
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
                var nts = that.formatWriteableBar(br, phsIdx)
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

        _.each(bar, function(nt, idx){
            var formattedNote = that.formatWriteableNote(nt.note, idx, phsIdx);
            retVar.push(formattedNote);
        });

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
        var pc = parser.parse(nt),
            writeableTime = Math.round(nt.time * this.writeableDuration * 2), //durational; so doesnt need base time?
            writeableNote = "" + nt.letter + nt.oct,
            writeData = {
                note: writeableNote,
                duration: writeableTime
            };
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
