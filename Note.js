
var parser = require('note-parser');

/**
 * Constructs instance of object with class Note
 *
 * Importantly, this.ntAttrs is a reference to a set of notes
 * in a song somewhere.
 *
 * @param  {object} atrs Reference to a set of attributes in
 *                       a song that make up a single note.
 *
 * @return {undefined}
 */
function Note (atrs)
{
    this.ntAttrs = atrs.note;
};

/**
 * Set octave
 *
 * @param  {number}     newOct Octave to which to set the note.
 * @return {undefined}
 */
Note.prototype.setOct = function(newOct)
{

    letter = this.getLetter();
    var newReadableNote = letter + newOct.toString(),
        newFreq = parser.freq(newReadableNote),
        newMid = parser.midi(newReadableNote);

    this.ntAttrs.freq = newFreq;
    this.ntAttrs.oct = newOct;
    this.ntAttrs.midi = newMid;

}

/**
 * Return the note's letter in the scale
 *
 * @return {string} note letter value
 */
Note.prototype.getLetter = function()
{
    return this.ntAttrs.letter;
}

module.exports = Note;
