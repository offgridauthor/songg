import parser from 'note-parser';
import Song from './Song.mjs';
import Frase from './Frase.mjs';
import fs from 'fs';
import Midi from 'jsmidgen';
import tonal from 'tonal';

const secondsDivisor = 256,
  midiExtensions = { 1: 'midi', 2: 'mid' };

/**
 * Create a jsMidgen Midi entity from passed-in data.
 */
class SongFile {

  /**
   * Set up song file for midi save.
   *
   * @param {string}  fn        filename base
   * @param {string}  outputDir output dir for midi file
   */
  constructor (fn, outputDir) {
    this.set('baseFileName', fn);
    this.set('outputDir', outputDir);
    this.set('eventTracks', []);
    this.set('ext', 1);
  }

  pushEventTrack (track) {
    this.get('eventTracks').push(track);
  }

  save (tracks) {
    this.model = this.getFileModel();
    // let strumenti = [0x13, 0x51];
    _.each(this.eventTracks, (writeableEvents, idx) => {
      let track = this.getEmptyTrack();
      track.setTempo(60);
      // track.setInstrument(idx, strumenti[idx]);
      this._midgenWriteEvents(writeableEvents, track);
      this.model.addTrack(track);
    });
    this.saveModel(this.model);
  }

  /**
   * Return only the notes or events that are needed for the
   * browser to play.
   */
  filterBrowserNotes (wriTracks) {
    let filtered = [];

    wriTracks.forEach((trk) => {
      filtered = filtered.concat(this.filterForBrowser(trk));
    });

    return filtered;
  }

  filterForBrowser (writeableTrack) {
    const filtered = _.where(writeableTrack, {
      'type': 'on'
    }).map((nt) => {
      return [
        nt.note, nt.duration / secondsDivisor,
        (nt.absoTime / secondsDivisor) + 3
      ];
    });

    return filtered;
  }

  /**
   * Get file model for storing notes
   *
   * @param  {String} name Name of the file
   *
   * @return {Object}      Model instance
   */
  getFileModel () {
    return new Midi.File();
  }

  /**
   * Get file model for storing notes
   *
   * @param  {String} name Name of the file
   *
   * @return {Object}      Model instance
   */
  getEmptyTrack (name) {
    return new Midi.Track();
  }

  /**
   * Format notes for midgen writing
   *
   * @param  {Array}     eventsToWrite Events to write
   * @param  {Object}    model         Model to which to write events
   * @return {undefined}
   */
  _midgenWriteEvents (eventsToWriteUnsorted, midiTrack) {
    var eventsToWrite = _.sortBy(
      eventsToWriteUnsorted, 'absoTime'
    );

    _.each(eventsToWrite, (evt, idx) => {
      let priorTime = idx > 0 ? eventsToWrite[idx - 1].absoTime : null;
      this.relativizeNote (evt, idx, priorTime);
      this.addNote(midiTrack, evt);
    });
  }

  /**
   * Define final timing for each note by reference to the prior note.
   * Midgen requries that format.
   *
   * @param  {Object}     evt           Event data for note on / off
   * @param  {Number}     idx           Note index
   * @param  {Number}     priorNoteTime Prior note's time
   * @return {undefined}                method works by reference
   */
  relativizeNote (evt, idx, priorNoteTime) {
    var isFirst = (idx === 0);
    if (isFirst) {
      evt.midgTime = evt.absoTime;
    } else {
      _._.requireType(priorNoteTime, 'Number');
      // At this point, it is safe to do some rounding (and necc'y --
      // otherwise floating-point arithmetic imprecision accumulates and throws off
      // timing in the final product.
      evt.midgTime = Math.round(evt.absoTime) - Math.round(priorNoteTime);
    }
  }

  /**
   * David Roe likes to go by "Davo" at work.
   *
   * @param {Object} midiTrack Track from midgen.js
   * @param {Object} evt       Note on / off data
   */
  addNote (midiTrack, evt) {
    let pitch = evt.note,
      delay = evt.midgTime,
      channel = 0;

    if (evt.type === 'on') {
      midiTrack.addNoteOn(channel, pitch, delay);
    } else if (evt.type === 'off') {
      midiTrack.addNoteOff(channel, pitch, delay);
    } else {
      throw new Error('Note types: "on" or "off"');
    }
  }

  /**
   * Save the model to a file we are creating.
   * @todo: This method sets a new property, "fullFileName", as a
   * side effect, which needs to be factored out into its own
   * method.
   */
  saveModel (model) {
    this.makeOutputDir();

    let ext = midiExtensions[this.ext],
      fullFileName = this.get('baseFileName') + '.' + ext,
      fileExists = true,
      iterator = 0,
      suffix = '',
      link;

    while (fileExists || iterator < 1) {
      if (iterator > 0) {
        suffix = '-' + iterator;

        fullFileName =
          this.outputDir +
          '/' +
          this.get('baseFileName') +
              suffix +
              '.' +
              ext;
      }

      if (!this.pathExists(fullFileName)) {
        fileExists = false;
        this.set('fullFileName', fullFileName)
      }
      iterator++;
    }

    fs.writeFileSync(this.get('fullFileName'), model.toBytes(), 'binary');
    link = this.get('fullFileName').split('./public')[1];
    this.set('outputLink', link);
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

  /**
   * Get the contents of the song bar by bar--for playing as
   * opposed to saving to a file.
   *
   * @return {Array} Array of arrays, where each inner array has notes of a track.
   */
  getFilteredBars () {
    let brz = this.filterBrowserNotes(this.eventTracks);
    return brz;
  }

  set (prop, val) {
    this[prop] = val;
  }

  get (prop) {
    return this[prop];
  }
}

export default SongFile;
