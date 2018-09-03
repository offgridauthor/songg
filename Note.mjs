import tonalNote from 'tonal-note';

/**
 * Wrapper class for a note (array of note attributes)
 */
class Note {
  /**
   * Constructs instance of object with class Note
   *
   * @param  {Object} atrs Reference to a set of attributes in
   *                       a song that make up a single note.
   *
   * @return {undefined}
   */
  constructor (atrs) {
    this.ntAttrs = atrs.note;
  }

  compile () {
    let newAttrs = tonalNote.props(this.letter + this.oct);
    this.ntAttrs = _.extend(this.ntAttrs, newAttrs);
  }

  multiplyDuration (multiplicand) {
    this.duration = this.duration * multiplicand;
  }

  getValidTokens (lwo) {
    let tokenized = this.getTokens(lwo);
    if (tokenized[0] === '' || tokenized[2] === '') {
      throwErr();
    }
    return tokenized;
    function throwErr () {
      throw new Error('Invalid note Name proposed or created from oct: "' + lwo + '"');
    }
  };

  getTokens (letterPossibleOctave) {
    return tonalNote.tokenize(letterPossibleOctave);
  }

  /**
   * Set the letter of this note.
     Always results in additionally setting the oct (which
     was passed with the letter) so always triggers the
     refresh of all other attributes.
   */
  set letter (letterWithOct) {
    // need the actual letter , "#" or "b", and octave.
    let tokenized = this.getTokens(letterWithOct);

    this.ntAttrs.letter = tokenized[0] + tokenized[1];
    if (tokenized[2] === '') {
      if (this.oct) { // if already an octave is there...
        // do compilation of other assets.
        this.compile();
      }
      // otherwise, we don't compile ; there is no default oct.
    } else {
      // set the new octave.
      // will set off triggering the compilation as well.
      this.ntAttrs.oct = tokenized[2];
      this.compile();
    }
  }

  get letter () {
    return this.ntAttrs.letter;
  }

  set ntAttrs (obj) {
    _._.requireType(obj, 'Object');
    this._ntAttrs = obj;
  }

  get ntAttrs () {
    return this._ntAttrs;
  }

  set duration (dur) {
    _._.requireType(dur, 'Number');
    this.ntAttrs.duration = dur;
  }

  get duration () {
    return this.ntAttrs.duration;
  }

  /**
   * These getter and setter have aliases.
     Set the oct of this note.
     Always triggers the refresh of all other attributes.
     See below getter and setter for aliases for getter and setter.
   */
  set oct (oct) {
    if (!this.letter) {
      throw new Error('It is disallowed to set octave before any letter is set.');
    }
    _._.requireType(oct, 'Integer');
    let letter = this.ntAttrs.letter;

    this.getValidTokens(letter + oct);
    this.ntAttrs.oct = oct;
  }

  get oct () {
    return this.ntAttrs.oct;
  }

  get octave () {
    return this.oct;
  }

  set octave (newOct) {
    this.oct = newOct;
  }

  getNoteAttribs () {
    return JSON.parse(JSON.stringify(this.ntAttrs));
  }

  set relativeTime (num) {
    _._.requireType(num, 'Number');
    this.ntAttrs.relativeTime = num;
  }

  get relativeTime () {
    return this.ntAttrs.relativeTime;
  }

  clone () {
    let clonedAttribs = this.getNoteAttribs();
    return new Note({note: clonedAttribs});
  }
}

export default Note;
