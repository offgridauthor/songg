/**
 * Generic pattern-enforcing functions to indicate which notes
 * of a bar should be adjusted / left untouched
 * 
 */
module.exports = {
    /**
     * Affect all notes
     *
     * @return {Boolean}     Whether to affect this note
     */
    ALL: function() {
        return true;
    },

    /**
     * Affect only every other note
     *
     * @param  {Number} idx  Index in list for this note
     * @return {Boolean}     Whether to affect this note
     */
    "EVERY-OTHER": function(idx){
        return idx % 2 == 0;
    }
}
