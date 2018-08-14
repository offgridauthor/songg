// import tonalNote from 'tonal-note';
const tonalNote = require('tonal-note');


/**
 * Constructs instance of object with class Note
 *
 * @todo:
 * Importantly, this.ntAttrs is a reference to a set of notes
 * in a song somewhere.
 *
 * @param  {object} atrs Reference to a set of attributes in
 *                       a song that make up a single note.
 *
 * @return {undefined}
 */
class Note {
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

  /**
   * Set the letter of this note.
     Always results in additionally setting the oct (which
     was passed with the letter) so always triggers the
     refresh of all other attributes.
   */
  set letter (letterWithOct) {
    let tokenized = this.getTokens(letterWithOct);

    this.ntAttrs.letter = tokenized[0] + tokenized[1];

    if (tokenized[2] === "") {
      if (this.oct) { // if already an octave is there...
        // do compilation of other assets.
        this.compile();
      }
      // otherwise, we don't compile ; there is no default oct.
    } else { //set the new octave.
      // will set off triggering the compilation as well.
      this.ntAttrs.oct = tokenized[2];
      this.compile();
    }
  }

  get letter () {
    return this.ntAttrs.letter;
  }

  set ntAttrs (obj) {
    requireType(obj, 'Object');
    this._ntAttrs = obj;
  }

  get ntAttrs () {
    return this._ntAttrs;
  }

  set duration (dur) {
    requireType(dur, "Number");
    this.ntAttrs.duration = dur;
  }

  get duration () {
    return this.ntAttrs.duration;
  }


  /**
   * Set the oct of this note.
     Always triggers the refresh of all other attributes.
   */
  set oct (oct) {
    if (!this.letter) {
      throw new Error('It is disallowed to set octave before any letter is set.');
    }
    requireType(oct, 'Integer');
    let letter = this.ntAttrs.letter,
      newAttrs;

    this.getValidTokens(letter + oct);
    this.ntAttrs.oct = oct;
  }

  get oct () {
    return this.ntAttrs.oct;
  }

  getNoteAttribs () {
    return JSON.parse(JSON.stringify(this.ntAttrs));
  }

  set relativeTime (num)
  {
    requireType(num, 'Number');
    this.ntAttrs.relativeTime = num;
  }

  get relativeTime ()
  {
    return this.ntAttrs.relativeTime;
  }
}

Note.prototype.getValidTokens = function (lwo) {
  let tokenized = this.getTokens(lwo);
  if (tokenized[0] === '' || tokenized[2] === '') {
    throwErr();
  }
  return tokenized;
  function throwErr () {
    throw new Error('Invalid note Name proposed or created from oct: "' + lwo + '"');
  }
};

Note.prototype.getTokens = function (letterPossibleOctave) {
  return tonalNote.tokenize(letterPossibleOctave);
};

function requireType (arg, type) {
  let method = 'is' + type,
    doThrow = false,
    nummed;

  if (!_[method] && type !== 'Integer') {
    throw new Error('Type method ' + method + ' does not enjoy a presence on the lodash sticky side.');
  }

  if (type === 'Integer') {
    nummed = parseInt(arg);
    if ('' + nummed !== arg + '') {
      doThrow = true;
    }

    if (Number.isInteger(nummed) === false) {
      doThrow = true;
    }
  } else if (!_[method](arg)) {
    console.error(arg);
    doThrow = true;
  }

  if (doThrow) {
    throw new Error('var "' + arg + '" is not ' + type + ', which is the required type. ');
  }
}

module.exports = Note;
