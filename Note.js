
var bb = require('backbone'),
    parser = require('note-parser');

/**
 * Constructs instance of object with class Note
 *
 * Importantly, this.ntAttrs is a reference to a set of notes
 * in a song somewhere.
 *
 * @param  {object} atrs Reference to a set of attributes in
 *                       a song that make up a single note.
 *
 * @return {[type]}      [description]
 */
var Note = function(atrs)
    {
        this.ntAttrs = atrs;
    };

Note.prototype.setOct = function(newOct)
{
    letter = this.getLetter();
    var newReadableNote = letter + newOct,
        newFreq = parser.freq(newReadableNote),
        newMid = parser.midi(newReadableNote);


    this.ntAttrs.freq = newFreq;
    this.ntAttrs.oct = newOct;
    this.ntAttrs.midi = newMid;

    //set oct, then adjust frequency.
}

Note.prototype.getLetter = function()
{
    return this.ntAttrs.letter;
}

module.exports = Note;
