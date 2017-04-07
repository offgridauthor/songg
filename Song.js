/**
  * Model file for raw song data
  *
  * Next to do:
  *
  * 1 - document and clarify all json settings
  *      ~ remove redundant ones
  * 1.5 - Move out the application of Arpeggiation
  *     into the song config for real. Make it possible
  *     to apply that arpeg to specific chords.
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
  * 7 - It seems to me I'm missing a Phase.js class.
  *      Also, disambiguate the file model from the
  *       preview model. One should be capable of being
  *       derived from the other by simple arithmetic
  * 8 - Rename the concepts of bar and chord as a
  *       single concept, a phrase--different in Songg from
  *       either a bar or a chord.
* */

var Phase = require('./Phase.js'),
    bb = require('backbone'),
    parser = require('note-parser'),
    midiUtils = require('midiutils'),
    fs = require('fs'),
    Midi = require('jsmidgen'),
    imposedBarLength = 256;

/**
 * The role of backbone is deprecated in this codebase.
 *
 * @type {[type]}
 *
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
     * Extract phase data and in the process time it correctly
     * with relation to other phases.
     *
     * @return {Backbone Model instance}
     */
    saveMidi: function()
    {
        var that = this,
            mod = that.getFileModel('first-measured'),
            accum = [],
            phases = this.getAbsolutizedPhases(),
            writeableEvents = this.getWriteableEvents();

        _._.logg(writeableEvents);
        this._midgenWriteEvents(writeableEvents, mod);
        this.saveModel(mod);

        return this;
    },

    /**
     * [chainPhases description]
     * @return {[type]} [description]
     */
    pushPhases: function() {
        var that = this,
            mod = that.getFileModel('first-measured'),
            accum = [];
    },

    /**
     * Chain one phase to the next; finalize timing.
     *
     * @return {[type]} [description]
     *
     */
    getAbsolutizedPhases: function() {
        var prevPhase = null;
        this.forEachPhase(function(phs) {
            if (prevPhase) {

                // console.log('hella fella');
                // _._.logg(phs);
                phs.hookTo(prevPhase);
                // console.log('after:');
                // _._.logg(phs);
            }
            prevPhase = phs;
        });
        return this.phases;
    },

    /**
     * forEachPhase
     *
     * @param  {Function} fn [description]
     * @return {[type]}      [description]
     *
     */
    forEachPhase: function(fn)
    {
        _.each(this.phases, fn);
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
    addPhaseToFile: function(library, mod, bar, accum, barIdx, imposedBarTm)
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
    getWriteableEvents: function() {
        // console.log('getWri');
        var that = this,
            isFirstStart = 1,
            totDelay = 0,
            totDur = 0,
            lastEv = null,
            eventsToWrite = [];

        console.log('phs len: ' + this.phases.length);

        _.each(this.phases, function(phase) {
            // console.log('name:' + phase.getName());
            var referee = phase.referToFrases(),
                isFirstFrase = true;
            _.each(referee, function(fraseArr, fraseIdx) {

                // console.log('319; fraseIdx: ', fraseIdx);
                // _._.logg(fraseArr);
                _.each(fraseArr, function(noteItm, noteIdx) {
                    // console.log('322');
                    // _._.logg(noteItm);
                    var nDat = noteItm.note;
                    if (noteIdx === 0) {
                        // console.log('328');
                        if (isFirstFrase) {
                            if (!isFirstStart) {
                                // console.log('not first start:' + phase.getName());
                                if (nDat['phaseDelay'] === undefined) {
                                    // console.log(JSON.stringify(nDat, null, 4));
                                    throw new Error('First note of phase requires a hook time');
                                }
                                totDelay = nDat['phaseDelay'];
                            }
                        }
                    }
                    console.log('td: ' , totDelay);
                    var renderableNote = that.renderableNote(nDat),
                        //relativeTime is needed for note on

                        delay = nDat['relativeTime'],
                        //treated now as a delay since previous start
                        //duration for note off (second loop)

                        duration = nDat.duration,
                        startTick = totDelay + delay||0,
                        onEvt = {
                            type: 'on',
                            channel: 0,
                            note: renderableNote,
                            absoTime: startTick
                        };


                    eventsToWrite.push(onEvt);

                    var offEvt = {
                        type: 'off',
                        channel: 0,
                        note: renderableNote,
                        absoTime: startTick + duration
                    };

                    eventsToWrite.push(offEvt);
                    totDelay += delay;
                    isFirstFrase = false;
                });
            });
            isFirstStart = 0;
        });
        return eventsToWrite;
    },

    /**
     *
     *
     * @param  {[type]} eventsToWrite [description]
     * @param  {[type]} model         [description]
     * @return {[type]}               [description]
     */
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
