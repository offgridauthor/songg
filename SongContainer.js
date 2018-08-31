/**
  * Model class for raw song data
  *
  **/
import fs from 'fs';
import Midi from 'jsmidgen';
import Song from './Song';

const div1 = .75,
  secondsDivisor = 256;

class SongContainer {

  /***
   *
   **/
  constructor (initProps) {
    this.initialize(initProps);
  }

  /**
   * Get value of specified prop.
   *
   * @param {mixed} n Property to get
   */
  get (n) {
    return this[n];
  }

  /**
   * Set value at specified property key.
   *
   */
  set (n, val) {
    this[n] = val;
  }

  /**
   * Set up the instance
   *
   * @param  {Array} attribs Constructor attributes
   * @param  {Object} opts    Options (arguments, basically) for this function
   *
   * @return void
   */
  initialize (attribs) {
    this.tracks = [];
    this.writeableEvents = [];
    this.outputDir = 'public/outputMidi';
    _.each(
      attribs,
      (songDat) => {
        let song = new Song(songDat);
        this.tracks.push(song);
      }
    );
  }
}

module.exports = Song;
