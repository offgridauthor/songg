/**
 * Model file for raw song data
 */

var bb = require('backbone'),
    parser = require('note-parser'),
    midiUtils = require('midiutils'),
    fs = require('fs'),
    Midi = require('jsmidgen');


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
        outputDir: 'public/outputMidi'
    },
    /**
     * Set up the instance
     *
     * @param  {object} attribs Backbone model attributes
     * @param  {object} opts    Options (arguments, basically) for this function
     *
     * @return void
     */
    initialize: function(attribs){
        var that = this;
        this.phaseMeta = [];
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
        getMidgenNote: function(ntNm)
        {
            if (ntNm.indexOf('-') !== -1) {

                    var dat1 = ntNm.split('-');
                    return dat1[0] + dat1[1];

            };

            return ntNm;
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
                useableNoteName = sharpsToFlats[ntNm];
            } else {
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
        return fn.apply(params.ctxt, [phz]);
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
     * Save to a midi file
     *
     * @return {Backbone Model instance}
     */
    saveMidi: function()
    {
        // retVar and associated code lines (currently remarked out)
        // were a way of using the midi file lib called midijs to
        // write files; replaced it with the slightly more versatile
        // js midgen. no return var is needed at this level because
        // js midgen writes to file. Later the file address is passed
        // to the front end to be used as an href for download.

        var that = this,
            mod = that.getFileModel('first-measured');

        var forEachWrPhase = function(wrphs, phsIdx)
        {
            var forEachBar = function(br)
            {

                that.addChordToFile('jsmidgen', mod, br);
            };
            _.each(wrphs, forEachBar);
        }

        _.each(this.attributes.phases, forEachWrPhase);
        this.saveModel(mod); //on save, model gets an href- type property
                            //that will allow download of the saved file.
        // return retVar;
        return this;
    },

    /**
     * Currently unused; soon to be erased.
     *
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

        return retVar;

    },
    /**
     * Currently unused; soon to be erased.
     *
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

        var noteNum = midiUtils.frequencyToNoteNumber(nt.freq),
            writeableNoteName = midiUtils.noteNumberToName(noteNum),
            noteData =
                this.utils.dataFromUtilName(writeableNoteName),
            correctWriteableNote =
                this.utils.writeableFormattedNote(noteData['note'], noteData['oct']);

        var pc = parser.parse(nt),
            writeableTime = 118, //durational; so doesnt need base time?
            writeableNote = correctWriteableNote,
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
        return { chord: bar };
    },

    /**
     * Get file model for storing notes
     *
     * @return {[type]} [description]
     */
    getFileModel: function(name)
    {

        var outDir = this.get('outputDir'),
            model = {
            file: new Midi.File(),
            track: new Midi.Track(),
            name: './' + outDir + '/' + name,
            ext: 'midi'
        };

        model.file.addTrack(model.track);

        return model;
    },

    /**
     *
     *
     * @param {object} model Model from midgen
     */
    addChordToFile: function(library)
    {
        var adapterDirectory = {
            'jsmidgen': 'midgenSaveChord'
        };

        var adapterFunc = adapterDirectory[library],
            unshiftedArgs = Array.prototype.shift.apply(arguments);

        this[adapterFunc].apply(this, arguments);

    },

    /**
     * To make a chord with midgen, the first note of the chord (arbitrary)
     * should carry time info and others have theirs omitted in the bottommost
     * function call to the library.
     *
     * Another less informative but important way of saying that: with the
     * midgen way of building the chord in the file, it matters the group of
     * notes you hand it. The relative timing on most notes is actually
     * ignored.
     *
     * @see https://github.com/dingram/jsmidgen
     */
    midgenSaveChord(model, chord) {

        var that = this,
            isFirstNoteOn = 1;
        console.log('bar', chord);
        _.each(chord, function(noteItm) {

            var nDat = noteItm.note,
                renderableNote =
                    nDat.letter + nDat.acc + new String(nDat.oct).toLowerCase(),
                delay = nDat['relativeTime'];

            if (isFirstNoteOn) {
                // console.log("model.track.addNoteOn(" + 0 + ", " + renderableNote + ", " + delay + ");");
                that.firstBarNoteOn(model, 0, renderableNote, delay);
            } else {
                // console.log("model.track.addNoteOff(" + 0 + ", " + renderableNote + ");");
                that.subsequentBarNoteOn(model, 0, renderableNote);
            }
            isFirstNoteOn = 0;

        });

        //chord off events
        var isFirstNoteOff = 1;
        _.each(chord, function(noteItm) {

            var nDat = noteItm.note,
                renderableNote = nDat.letter + nDat.acc + new String(nDat.oct),
                duration = nDat.duration;

            if (isFirstNoteOff) {
                that.firstBarNoteOff(model, 0, renderableNote, duration);
                // useful log statement, from time to time
                // console.log("model.track.addNoteOff(" + 0 + ", " + renderableNote + ", " + duration + ");");
            } else {

                that.subsequentBarNoteOff(model, 0, renderableNote);
                // useful log statement, from time to time
                // console.log("model.track.addNoteOff(" + 0 + ", " + renderableNote + ");");
            }
            isFirstNoteOff = 0;
        });
    },
    //my working theory: @param delay is num ticks
    //by which to follow the last specified note's start.
    firstBarNoteOn: function(model, channel, pitch, delay){
        pitch = pitch.toLowerCase();

        model.track.addNoteOn(channel, pitch, delay);
    },

    subsequentBarNoteOn: function(model, channel, pitch) {
        pitch = pitch.toLowerCase();
        model.track.addNoteOn(channel, pitch);

    },
    firstBarNoteOff: function(model, channel, pitch, duration){
        pitch = pitch.toLowerCase();
        model.track.addNoteOff(channel, pitch, duration);


    },
    subsequentBarNoteOff: function(model, channel, pitch){
        pitch = pitch.toLowerCase();
        model.track.addNoteOff(channel, pitch);

    },
    saveModel: function(model)
    {
        this.makeOutputDir();

        if (!model.name) {
            model.name = 'temp';
        }
        if (!model.ext) {
            model.ext = 'midi';
        }

        var fileName = model.name + '.' + model.ext,
            fileExists = true,
            iterator = 0,
            safety = 0,
            suffix = '';

        while (fileExists) {
            if (iterator > 0) {
                suffix = '-' + iterator;
                fileName =
                    model.name
                        + suffix
                        + '.'
                        + model.ext;
            }


            if (!this.pathExists(fileName)) {
                fileExists = false;
                model.name = model.name + suffix;
            }

            iterator ++;

        }
        var outFile = model.name + '.' + model.ext;
        //console.log('output file: ' + outFile);
        fs.writeFileSync(outFile, model.file.toBytes(), 'binary');
        this.set('outputLink', (outFile.split('./public')[1]));
    },
    pathExists: function(path)
    {
        return fs.existsSync(path);
    },
    makeOutputDir: function()
    {
        var oDir = this.get('outputDir');

        if (!oDir) {
            throw new Error('Could not obtain the outputDir property');
        }

        if (!this.pathExists(oDir)) {
            //console.log('Path ' + oDir + ' does not see to exist; making it . . . ');
            fs.mkdirSync(oDir);
            if (!this.pathExists(oDir)) {
                throw new Error ('Could not make output directory; ' + oDir);
            }
        }

        return true;
    }
});



module.exports = Song;
