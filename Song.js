/**
 * Model file for raw song data
 *
 * Next to do:
 *
 * 1 - document and clarify all json settings
 *      ~ remove redundant ones
*  1.5 - Move out the application of Arpeggiation
*       into the song config for real. Make it possible
*       to apply that arpeg to specific chords.
 * 2 - generalize the ArpegOneTwoOne
 * 3 - may be worthwhile to get the song previewer
 *      working again
 * 4 - update npm modules
 * 5 - in this file, re-obtain the prior version of
 *      the writing functions in which no imposed
 *      bar length was used.
 * 6 - Really i need to disambiguate when the
 *      song is being treated as an entirity--
 *      flattened array--versus when we are
 *      treating the phases individually. IOW,
 *      properly use SongManipulator as distinct
 *      from PhaseManipulator.
 *      It seems to me I'm missing a Phase.js class.
 *  7 - Also, disambiguate the file model from the
 *       preview model. One should be capable of being
 *       derived from the other by simple arithmetic
 *   8 - Rename the concepts of bar and chord as a
 *       single concept, a phrase--different in Songg from
 *       either a bar or a chord.
 */

var Phase = require('./Phase.js'),
    bb = require('backbone'),
    parser = require('note-parser'),
    midiUtils = require('midiutils'),
    fs = require('fs'),
    Midi = require('jsmidgen'),
    imposedBarLength = 256; //this is being moved into song config file

/**
 * The role of backbone is deprecated in this codebase.
 *
 * @type {[type]}
 */
var Song = bb.Model.extend(
{
    /**
     * Backbone model defaults
     *
     * @type {Object}
     */
    defaults: {
        title: null,
        outputDir: 'public/outputMidi',
        disableArpeg: false
    },
    /**
     * Set up the instance
     *
     * @param  {object} attribs Backbone model attributes
     * @param  {object} opts    Options (arguments, basically) for this function
     *
     * @return void
     */
    initialize: function(attribs) {

        var that = this;
        this.hist = [];
        this.phases = {};
        if (typeof(this.get('disableArpeg')) !== 'boolean') {
            throw new Error('Must be bool');
        }


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
        }
    },

    /**
     * Return a phase by name
     *
     * @param  {string} pn  phase name
     *
     * @return object/false Requested phrase
     */
    getPhase: function(pn) {

        if (pn) {
            if (this.phases) {
                if (this.phases[pn]) {
                    return this.phases[pn];
                }
            }
        }
        throw new Error('cant return phase ' + pn);

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
    portal: function(phsNm, fn, params) {
        var phz = this.getPhase(phsNm);
        return fn.apply(params.ctxt, [phz]);
    },
    /**
     * Calculate the number of phases in the song
     *
     * @return {Number} Lengh value of this.attributes.phases
     */
    countPhases: function(){
        return this.phases.length;

    },
    /**
     * Add a phase to the song
     *
     * @param  {object} phase  Phase data
     * @param  {string} nm     key name for phase
     * @param  {number} idx    index at which to assign phase
     *
     * @return {undefined}
     */
    addPhase: function(phase, nm, idx, opts)
    {
        if (typeof phase === 'object') {
            this.phases[nm] = new Phase(phase, nm, idx, opts);
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
            retVar = retVar.concat(phs.referToBars());

        };

        _.each(this.phases, forEachPhase);
        _.each(retVar, this.formatOutputBar);

        return retVar;
    },
    /**
     * Save to a midi file
     *
     * @return {Backbone Model instance}
     */
    saveMidi: function()
    {
        var
            that = this,
            mod = that.getFileModel('first-measured'),
            accum = [];

        var forEachWrPhase = function(wrphs, phsIdx)
        {
            console.log('\nphase ' + phsIdx);
            wrphs.forEachBar(
                function(br, barIdx)
                {
                    console.log('\nbar ' + barIdx);
                    that.addChordToFile('jsmidgen', mod, br, accum, barIdx, imposedBarLength);
                }
            );
        };

        _.each(this.phases, forEachWrPhase);
        this._midgenWriteEvents(accum, mod);
        this.saveModel(mod);

        return this;
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
        bar = { chord: bar };
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
     * @param {object} model Model from midgen
     */
    addChordToFile: function(library, mod, bar, accum, barIdx, imposedBarTm)
    {

        var enableOrDisble = (this.get('disableArpeg') ? 'diableArpeg' : 'enableArpeg'),
            adapterDirectory = {
                'diableArpeg': {
                    'jsmidgen': 'midgenSaveWithoutArpeg'
                },
                'enableArpeg': {
                    'jsmidgen': 'midgenSaveSong'
                }

            },
            adapterFunc = adapterDirectory[enableOrDisble][library];


        Array.prototype.shift.apply(arguments);
        this[adapterFunc].apply(this, arguments);
    },

    /**
     *
     */
    midgenSaveSong: function(mod, chord, eventsToWrite, barIdx, imposedBarTm) {

        var that = this,
            isFirstStart = 1,
            totDelay = barIdx * imposedBarTm,
            totDur = 0,
            perPitchStats = {},
            lastEv = null;

        if (isNaN(totDelay)) {
            throw new Error("Error with args of midgenSaveSong.");
        }

        _.each(chord, function(noteItm, idx) {

            var nDat = noteItm.note,
                renderableNote = that.renderableNote(nDat),
                //relativeTime is needed for note on
                delay = nDat['relativeTime'], //treated now as a delay since previous start
                //duration for note off (second loop)
                duration = nDat.duration,
                startTick = totDelay + delay;

            if (!(delay) && delay !== 0) {

                throw new Error("Error with delay.");
            }

            perPitchStats[renderableNote] = {
                'startTick': startTick,
                'desiredOffTick': startTick + duration
            };

            if (isNaN(startTick)) {
                throw new Error("Error with startTick.");
            }

            var onEvt = {
                type: 'on',
                channel: 0,
                note: renderableNote,
                absoTime: startTick
            };
            console.log(JSON.stringify(onEvt, null, 4));

            eventsToWrite.push(onEvt);

            if (isNaN(startTick + duration)) {
                throw new Error("Error with startTick or duration.");
            }
            var offEvt = {
                type: 'off',
                channel: 0,
                note: renderableNote,
                absoTime: startTick + duration
            };

            console.log(JSON.stringify(offEvt, null, 4));
            eventsToWrite.push(offEvt);

            totDelay += delay;
            isFirstStart = 0;
        });
    },

    _midgenWriteEvents: function(eventsToWrite, model)
    {
        var that = this;

        eventsToWrite = _.sortBy(
            eventsToWrite, 'absoTime'
        );
        // set midgTime
        _.each (eventsToWrite, function(evt, idx) {

            var isFirst = !!(idx === 0);

            if (isFirst) {
                evt.midgTime = evt.absoTime;

            } else {
                var priorTime = eventsToWrite[idx - 1].absoTime;
                evt.midgTime = evt.absoTime - priorTime;

            }

        });

        // actually write the events
        //
        _.each(
            eventsToWrite, function(evt, idx) {
                if (['on', 'off'].indexOf(evt.type) === -1) {
                    throw new Error('Event type "' + evt.type + '" not supported' );
                }

                var fnName = evt.type === 'on' ? 'midgNoteOn' : 'midgNoteOff';
                that[fnName](model, 0, evt.note, evt.midgTime);

            }
        );
    },

    /**
     *
     */
    midgenSaveChordPrev: function(model, chord, initTime) {

        var that = this,
            isFirstStart = 1,
            totDelay = initTime,
            totDur = 0,
            perPitchStats = {},
            eventsToWrite = [],
            lastEv = null;



        _.each(chord, function(noteItm, idx) {

            var nDat = noteItm.note,
                renderableNote = that.renderableNote(nDat),

                //relativeTime is needed for note on
                delay = nDat['relativeTime'], //treated now as a delay since previous start
                //duration for note off (second loop)
                duration = nDat.duration,

                startTick = totDelay + delay;

            perPitchStats[renderableNote] = {
                'startTick': startTick,
                'desiredOffTick': startTick + duration
            };

            eventsToWrite.push({
                type: 'on',
                channel: 0,
                note: renderableNote,
                absoTime: startTick
            });

            eventsToWrite.push({
                type: 'off',
                channel: 0,
                note: renderableNote,
                absoTime: startTick + duration
            });

            totDelay += delay;
            isFirstStart = 0;
        });

        eventsToWrite = _.sortBy(
            eventsToWrite, 'absoTime'
        );

        _.each (eventsToWrite, function(evt, idx) {

            var isFirst = !!(idx === 0),
                isLast = !!(eventsToWrite[idx + 1]);

            if (isFirst) {
                evt.midgTime = evt.absoTime;

            } else {
                var priorTime = eventsToWrite[idx - 1].absoTime;
                evt.midgTime = evt.absoTime - priorTime;
            }

        });

        _.each(
            eventsToWrite, function(evt, idx) {
                if (['on', 'off'].indexOf(evt.type) === -1) {
                    throw new Error('Event type "' + evt.type + '" not supported' );
                }

                var fnName = evt.type === 'on' ? 'midgNoteOn' : 'midgNoteOff';
                that[fnName](model, 0, evt.note, evt.midgTime);
            }
        );

        return eventsToWrite[eventsToWrite.length -1].absoTime;
    },

    /**
     * Write notes to the midi track to be saved as a midi file.
     *
     * To make a chord with midgen, the first note of the chord (arbitrary)
     * should carry time info and others have theirs omitted in the bottommost
     * function call to the library.
     *
     * Another way of saying that: add a note's beginning point by using
     * the *noteOn functions. That note also opens up a chord; it begins
     * the chord. Subsequent notes will sound simultaneously until they
     * all end from your closing the chord. That happens when you close
     * the first note.
     *
     * Now, there is an addChord; but I need to update jsmidgen to get that.
     *
     * @see https://github.com/dingram/jsmidgen
     */
    midgenSaveWithoutArpeg: function(model, chord) {

        var that = this,
            isFirstStart = 1;


        _.each(chord, function(noteItm) {

            var nDat = noteItm.note,
                renderableNote = that.renderableNote(nDat),

                //relativeTime is needed for note on
                delay = nDat['relativeTime'],
                //duration for note off (second loop)
                duration = nDat.duration;

            if (isFirstStart) {
                that.midgNoteOn(model, 0, renderableNote, delay);

            } else {
                that.midgNoteOn(model, 0, renderableNote, delay);

            }
            isFirstStart = 0;
        });

        var isFirst = 1;
        _.each(chord, function(noteCont) {
                var noteItm = noteCont.note,
                    renderableNote = that.renderableNote(noteItm),
                    //"duration" key needed for note off
                    duration = noteItm.duration;
            if (isFirst) {
                //duration is added as what is technically the delay
                //since the prev. event in the channel.
                that.midgNoteOff(model, 0, renderableNote, duration);

            } else {
                that.midgNoteOff(model, 0, renderableNote);
            }
            isFirst = 0;
        });
    },


    renderableNote: function(nDat)
    {
         return nDat.letter + nDat.acc + new String(nDat.oct)
    },

    midgNoteOn: function(model, channel, pitch, delay) {

        pitch = pitch.toLowerCase();
        if (delay === undefined) {
            return model.track.addNoteOn(channel, pitch);
        }
        return model.track.addNoteOn(channel, pitch, delay);
    },

    midgNoteOff: function(model, channel, pitch, duration) {
        pitch = pitch.toLowerCase();
        if (duration !== undefined) {
            return model.track.addNoteOff(channel, pitch, duration);
        }
        return model.track.addNoteOff(channel, pitch);
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

            fs.mkdirSync(oDir);
            if (!this.pathExists(oDir)) {
                throw new Error ('Could not make output directory; ' + oDir);
            }
        }
        return true;
    }
});

module.exports = Song;
