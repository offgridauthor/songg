/**
  * Model class for raw song data
  *
* */

var Phase = require('./Phase.js'),
  bb = require('backbone'),
  fs = require('fs'),
  Midi = require('jsmidgen'),

  Song = bb.Model.extend(
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
      initialize: function (attribs) {
        this.hist = [];
        this.phases = {};
        if (typeof (this.get('disableArpeg')) !== 'boolean') {
          throw new Error('Must be bool');
        }
      },

      utils: {
        /**
         * Return data parsed from a note name
         *
         * @return {Object}
         */
        dataFromUtilName: function (ntNm) {
          if (ntNm.indexOf('-') !== -1) {
            var dat1 = ntNm.split('-'),
              oct,
              nameWithoutOct;

            return {
              'note': dat1[0],
              'oct': dat1[1]
            };
          } else {
            oct = ntNm.charAt(ntNm.length - 1);
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
      getPhase: function (pn) {
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
       * Get the number of phases in the song.

       * @return {number} Length of phase array
       */
      getPhaseLen: function () {
        var cnt = 0;
        _.each(this.phases, function () {
          cnt++;
        });
        return cnt;
      },

      /**
       * Experimental pattern; deprecated
       * (will be replaced with more traditional method calls)
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
      portal: function (phsNm, fn, params) {
        var phz = this.getPhase(phsNm);
        return fn.apply(params.ctxt, [phz]);
      },

      /**
       * Calculate the number of phases in the song
       *
       * @return {Number} Lengh value of this.attributes.phases
       */
      countPhases: function () {
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
      addPhase: function (phase, nm, opts) {
        if (typeof phase === 'object') {
          _._.verifySongOpts(opts);

          let idx = Object.keys(this.phases).length,
            newPhs = new Phase(phase, nm, idx, opts);

          this.phases[nm] = newPhs;
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
      readBars: function () {
        var retVar = [],
          forEachPhase = function (phs) {
            retVar = retVar.concat(phs.referToFrases());
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
      saveMidi: function () {
        let mod = this.getFileModel('first-measured'),
          writeableEvents = this.prepareSave();
        this.prepareSave();
        this._midgenWriteEvents(writeableEvents, mod);
        this.saveModel(mod);
        return this;
      },

      /**
       *
       */
      prepareSave: function () {
        var writeableEvents;

        this.absolutizePhases();
        writeableEvents = this.getWriteableEvents();
        return writeableEvents;
      },
      /**
       * Chain one phase to the next; finalize timing.
       *
       * @return {object} Phase instance
       */
      absolutizePhases: function () {
        let prevPhase = null;
        this.forEachPhase(function (phs) {
          phs.hookTo(prevPhase);
          phs.timeFrases(prevPhase === null);
          prevPhase = phs;
        });
        prevPhase = null;
      },

      /**
       * Execute specified function per phase in song
       *
       * @param  {Function} fn Function to execute

       * @return {undefined}
       *
       */
      forEachPhase: function (fn) {
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
      formatOutputBar: function (bar) {
        bar = { chord: bar };
      },

      /**
       * Get file model for storing notes
       *
       * @param  {string} name Name of the file
       *
       * @return {object}      Model instance
       */
      getFileModel: function (name) {
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
       * Get events that can be easily, accurately recorded to file
       *
       * @return {array}  writeable (yet still relatively timed)
                          events for absolutizing
       */
      getWriteableEvents: function () {
        var that = this,
          totDelay = 0,
          eventsToWrite = [];

        _.each(this.phases, function (phase) {
          var referee = phase.referToFrases();

          _.each(referee, function (fraseArr, fraseIdx) {
            // for an entire bar:
            _.each(fraseArr.notes, function (noteItm, noteIdx) {
              var nDat = noteItm.note,
                delay,
                renderableNote,
                duration,
                startTick,
                onEvt,
                offEvt;

              if (noteIdx === 0) {
                if (nDat['phaseDelay'] !== undefined) {
                  totDelay = nDat['phaseDelay'];
                } else if (nDat['fraseDelay'] !== undefined) {
                  totDelay = nDat['fraseDelay'];
                } else {
                  throw new Error('First notes phaseDel or fraseDel must be set.');
                }
              }

              delay = nDat['relativeTime'] || 0;
              renderableNote = that.renderableNote(nDat);
              // relativeTime is needed for note on

              // treated now as a delay since previous start
              // duration for note off (second loop)
              duration = nDat.duration;
              startTick = totDelay + (delay || 0);
              onEvt = {
                type: 'on',
                channel: 0,
                note: renderableNote,
                absoTime: startTick
              };

              eventsToWrite.push(onEvt);

              offEvt = {
                type: 'off',
                channel: 0,
                note: renderableNote,
                absoTime: startTick + duration
              };

              eventsToWrite.push(offEvt);
              // totDelay += delay;

              // end loop iteration that handles a single note.
            });
          });
        });
        return eventsToWrite;
      },
      /**
       *
       *
       * @param  {array} eventsToWrite [description]
       * @param  {[type]} model         [description]
       * @return {[type]}               [description]
       */
      _midgenWriteEvents: function (eventsToWrite, model) {
        var that = this;

        eventsToWrite = _.sortBy(
          eventsToWrite, 'absoTime'
        );

        // set midgTime
        _.each(eventsToWrite, function (evt, idx) {
          var isFirst = (idx === 0),
            priorTime;

          if (isFirst) {
            evt.midgTime = evt.absoTime;
          } else {
            priorTime = eventsToWrite[idx - 1].absoTime;
            evt.midgTime = evt.absoTime - priorTime;
          }
        });
        _.each(
          eventsToWrite, function (evt, idx) {
            if (['on', 'off'].indexOf(evt.type) === -1) {
              throw new Error('Event type "' + evt.type + '" not supported');
            }

            var fnName = evt.type === 'on' ? 'midgNoteOn' : 'midgNoteOff';
            that[fnName](model, 0, evt.note, Math.abs(evt.midgTime));
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
      midgenSaveWithoutArpeg: function (model, chord) {
        var that = this,
          isFirstPhase = 1,
          isFirst;

        _.each(chord.notes, function (noteItm) {
          var nDat = noteItm.note,
            renderableNote = that.renderableNote(nDat),

            // relativeTime is needed for note on
            delay = nDat['relativeTime'];

          if (isFirstPhase) {
            that.midgNoteOn(model, 0, renderableNote, delay);
          } else {
            that.midgNoteOn(model, 0, renderableNote, delay);
          }
          isFirstPhase = 0;
        });

        isFirst = 1;
        _.each(chord, function (noteCont) {
          var noteItm = noteCont.note,
            renderableNote = that.renderableNote(noteItm),

            // "duration" key needed for note off
            duration = noteItm.duration;
          if (isFirst) {
            // duration is added as what is technically the delay
            // since the prev. event in the channel.
            that.midgNoteOff(model, 0, renderableNote, duration);
          } else {
            that.midgNoteOff(model, 0, renderableNote);
          }
          isFirst = 0;
        });
      },

      /**
       * Get a note that can be rendered
       *
       * @param  {Object} nDat Note data
       * @return {Object}      Note data renderable
       */
      renderableNote: function (nDat) {
        return nDat.letter + nDat.acc + (nDat.oct).toString();
      },

      midgNoteOn: function (model, channel, pitch, delay) {
        pitch = pitch.toLowerCase();
        if (delay === undefined) {
          return model.track.addNoteOn(channel, pitch);
        }
        return model.track.addNoteOn(channel, pitch, delay);
      },

      midgNoteOff: function (model, channel, pitch, duration) {
        pitch = pitch.toLowerCase();
        if (duration !== undefined) {
          return model.track.addNoteOff(channel, pitch, duration);
        }
        return model.track.addNoteOff(channel, pitch);
      },
      freezePhases: function () {
        this.forEachPhase(Object.freeze);
      },

      /**
       *
       */
      runHooks: function () {

        this.songHooks();
        this.phaseHooks();
        // Run bar hooks
      },

      /**
       *
       */
      phaseHooks: function () {
        const spitName = (phzArg) => {
            phzArg.hooks();
          },
          that = this;

        _.each(
          this.phases,
          (phase) => {
            const phaseName = phase.get('name');
            phase.hooks();
            // new up the class
            // class instance will be ctxt
            //that.portal(phaseName, spitName, { ctxt: {} });
          }
        );
      },

      songHooks: function () {
        const that = this;
        _.each(this.get('manipParams'), (manipDataList, manipName) => {
          that.runManipOnPhases(manipName, manipDataList);
        });
      },

      /**
       *
       */
      runManipOnPhases: function (manipName, manipDataList) {
        const that = this;

        // Right now, we have a property such as "Arpeggiator" from the song's
        // highest-level "manipParams" property; "Arpeggiator" (etc) is an Array
        // with multiple datas for instance. (We are not running per-phase yet)
        _.each(
          manipDataList,
          (manipDatum) => {
            // Within this loop we now have recourse to the phases against which
            // to run this manipulator entry.
            let phaseList = typeof (manipDatum.phases) === 'string'
                ? [manipDatum.phases]
                : manipDatum.phases,
              phaseInstances = _.map(phaseList, (p) => that.phases[p]);

            // Run this one Arpeggiator.data config element against its listed
            // phases.
            _.each(phaseInstances, (phsInst) => {
              phsInst.runManip([manipDatum], manipName);
            });
          }
        );
      },

      saveModel: function (model) {
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
          suffix = '';

        while (fileExists) {
          if (iterator > 0) {
            suffix = '-' + iterator;
            fileName =
              model.name +
                  suffix +
                  '.' +
                  model.ext;
          }

          if (!this.pathExists(fileName)) {
            fileExists = false;
            model.name = model.name + suffix;
          }

          iterator++;
        }

        var outFile = model.name + '.' + model.ext;

        fs.writeFileSync(outFile, model.file.toBytes(), 'binary');
        this.set('outputLink', (outFile.split('./public')[1]));
      },

      pathExists: function (path) {
        return fs.existsSync(path);
      },
      makeOutputDir: function () {
        var oDir = this.get('outputDir');

        if (!oDir) {
          throw new Error('Could not obtain the outputDir property');
        }

        if (!this.pathExists(oDir)) {
          fs.mkdirSync(oDir);
          if (!this.pathExists(oDir)) {
            throw new Error('Could not make output directory; ' + oDir);
          }
        }
        return true;
      }
    }
  );

module.exports = Song;
