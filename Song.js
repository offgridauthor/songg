/**
  * Model class for raw song data
  *
* */
import Phase from './Phase.js';
import fs from 'fs';
import Midi from 'jsmidgen';

class Song {
  /**
   * Backbone model defaults
   *
   * @type {Object}
   */
  constructor (initProps) {
    this.initialize(initProps);
  }

  get (n) {
    return this[n];
  }

  set (n, val) {
    this[n] = val;
  }
  /**
   * Set up the instance
   *
   * @param  {Object} attribs Constructor attributes
   * @param  {Object} opts    Options (arguments, basically) for this function
   *
   * @return void
   */
  initialize (attribs) {
    this.secondsDivisor = 256;
    this.hist = [];
    this.phases = {};
    this.writeableEvents = null;
    this.outputDir = 'public/outputMidi';
    this.disableArpeg = attribs.disableArpeg;
    this.manipParams = attribs.manipParams;
    if (typeof (this.get('disableArpeg')) !== 'boolean') {
      throw new Error('Must be bool');
    }
  }

  /**
   * Return a phase by name
   *
   * @param  {String} pn  phase name
   *
   * @return object/false Requested phrase
   */
  getPhase (pn) {
    if (pn) {
      if (this.phases) {
        if (this.phases[pn]) {
          return this.phases[pn];
        }
      }
    }
    throw new Error('cant return phase ' + pn);
  }

  /**
   * Get the number of phases in the song.

   * @return {Number} Length of phase array
   */
  getPhaseLen () {
    var cnt = 0;
    _.each(this.phases, function () {
      cnt++;
    });
    return cnt;
  }

  /**
   * Experimental pattern; deprecated
   * (will be replaced with more traditional method calls)
   * Pass a phase name, function, and args for the function
   * to call this function and operate it on a phase of the
   * song.
   *
   * @param  {String}   phsNm  Name of the phase on which to perpetrate this function
   * @param  {Function} fn     Funtion to perpetrate on the phase
   * @param  {Object}   params Will be used as arguments/options for call to fn
   *
   * @return {undefined}
   */
  portal (phsNm, fn, params) {
    var phz = this.getPhase(phsNm);
    return fn.apply(params.ctxt, [phz]);
  }

  /**
   * Calculate the number of phases in the song
   *
   * @return {Number} Lengh value of this.attributes.phases
   */
  countPhases () {
    return this.phases.length;
  }

  /**
   * Add a phase to the song
   *
   * @param  {Object} phase  Phase data
   * @param  {String} nm     key name for phase
   * @param  {Number} idx    index at which to assign phase
   *
   * @return {undefined}
   */
  addPhase (phase, nm, opts) {
    if (typeof phase === 'object') {
      _._.verifySongOpts(opts);

      let idx = Object.keys(this.phases).length,
        newPhs = new Phase(phase, nm, idx, opts);

      this.phases[nm] = newPhs;
    } else {
      throw new Error('Argument should be an object (' + (typeof phase) + ') ');
    }
  }

  /**
   * Get the contents of the song bar by bar--for playing as
   * opposed to saving to a file.
   *
   * @return {Array} bars of the song
   */
  readBars () {
    return this.filterBrowserNotes(this.writeableEvents);
  }

  filterBrowserNotes (nots) {
    const filtered = _.where(nots, {
      'type': 'on'
    }).map((nt) => {
      return [
        nt.note, nt.duration / this.secondsDivisor,
        (nt.absoTime / this.secondsDivisor) + 3
      ];
    });

    return filtered;
  }

  /**
   * Extract phase data and in the process time it correctly
   * with relation to other phases.
   *
   * @return {Object} Song class
   */
  saveMidi () {
    let mod = this.getFileModel('first-measured');
    this._midgenWriteEvents(this.writeableEvents, mod);
    this.saveModel(mod);
    return this;
  }

  get writeableEvents () {
    if (this._writeableEvents === null) {
      this._writeableEvents = this.compile();
    }
    return this._writeableEvents;
  }

  set writeableEvents (arg) {
    _._.requireType(arg, ['Object', 'Null']);
    this._writeableEvents = arg;
  }
  /**
   * Prepare writeable events from the manipulated song data.
   */
  compile () {
    var writeableEvents;

    this.absolutizePhases();
    writeableEvents = this._getWriteableEvents();
    return writeableEvents;
  }
  /**
   * Chain one phase to the next; finalize timing.
   *
   * @return {Object} Phase instance
   */
  absolutizePhases () {
    let prevPhase = null;
    this.forEachPhase(function (phs) {
      phs.hookTo(prevPhase);
      phs.timeFrases(prevPhase === null);
      prevPhase = phs;
    });
    prevPhase = null;
  }

  /**
   * Execute specified function per phase in song
   *
   * @param  {Function} fn Function to execute

   * @return {undefined}
   *
   */
  forEachPhase (fn) {
    _.each(this.phases, fn);
  }

  /**
   * Utility-type function for formatting a bar for consumption
   * by the client
   *
   * @param  {Array} bar  Array of notes
   *
   * @return {Object}     object wrapped how the client expects it
   */
  formatOutputBar (bar) {
    bar = { chord: bar };
  }

  /**
   * Get file model for storing notes
   *
   * @param  {String} name Name of the file
   *
   * @return {Object}      Model instance
   */
  getFileModel (name) {
    var outDir = this.get('outputDir'),
      model = {
        file: new Midi.File(),
        track: new Midi.Track(),
        name: './' + outDir + '/' + name,
        ext: 'midi'
      };
    model.file.addTrack(model.track);

    return model;
  }
  /**
   * Get events that can be easily, accurately recorded to file
   *
   * @return {Array}  writeable (yet still relatively timed)
                      events for absolutizing
   */
  _getWriteableEvents () {
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
            absoTime: startTick,
            duration: duration
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
  }
  /**
   * Format notes for midgen writing
   *
   * @param  {Array}     eventsToWrite Events to write
   * @param  {Object}    model         Model to which to write events
   * @return {undefined}
   */
  _midgenWriteEvents (eventsToWrite, model) {
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
  }

  /**
   * Get a note that can be rendered
   *
   * @param  {Object} nDat Note data
   * @return {Object}      Note data renderable
   */
  renderableNote (nDat) {
    return nDat.letter + nDat.acc + (nDat.oct).toString();
  }

  midgNoteOn (model, channel, pitch, delay) {
    pitch = pitch.toLowerCase();
    if (delay === undefined) {
      return model.track.addNoteOn(channel, pitch);
    }
    return model.track.addNoteOn(channel, pitch, delay);
  }

  midgNoteOff (model, channel, pitch, duration) {
    pitch = pitch.toLowerCase();
    if (duration !== undefined) {
      return model.track.addNoteOff(channel, pitch, duration);
    }
    return model.track.addNoteOff(channel, pitch);
  }

  freezePhases () {
    this.forEachPhase(Object.freeze);
  }

  /**
   *
   */
  runHooks () {
    this.songHooks();
    this.phaseHooks();
    // Run bar hooks
  }

  /**
   *
   */
  phaseHooks () {
    _.each(
      this.phases,
      (phase) => {
        phase.hooks();
      }
    );
  }

  songHooks () {
    const that = this;
    _.each(this.get('manipParams'), (manipDataList, manipName) => {
      that.runManipOnPhases(manipName, manipDataList);
    });
  }

  /**
   *
   */
  runManipOnPhases (manipName, manipDataList) {
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
  }

  saveModel (model) {
    this.makeOutputDir();

    if (!model.name) {
      model.name = 'temp';
    }
    if (!model.ext) {
      model.ext = 'midi';
    }

    let fileName = model.name + '.' + model.ext,
      fileExists = true,
      iterator = 0,
      suffix = '',
      outFile;

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

    outFile = model.name + '.' + model.ext;

    fs.writeFileSync(outFile, model.file.toBytes(), 'binary');
    this.set('outputLink', (outFile.split('./public')[1]));
  }

  pathExists (path) {
    return fs.existsSync(path);
  }
  makeOutputDir () {
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

module.exports = Song;
