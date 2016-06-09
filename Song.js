
var bb = require('backbone'),
    parser = require('note-parser');






var Song = bb.Model.extend(
{
    initialize: function(attribs, opts){
        var that = this;
        this.phaseMeta = [];
        this.writeableDuration = opts.writeableDuration;
        this.hist = [];
        // if (this.get('phases')) {
        //     this.set('phases', []);
        // }
    },
    defaults: {
        title: null,
        phases: new Array(), //array of Phase objects
        writeablePhases: new Array(), //array of Phase objects
    },
    getPhase: function(pn){
        console.log('getPhaes');
        if (pn
            && this.get
            && this.attributes
            && this.attributes.phases
            && this.attributes.phases.length
        ) {
            var phs = _._.whereWithIndex(this.get('phases'));
            if (phs) {
                return phs;
            }
        } else {
            console.log('36', this.attributes);
            return false;
        }
    },
    portal: function(phsNm, fn, params){

        return this.getPhase(phsNm);

    },
    countPhases: function(){

        var phss = this.attributes.phases;

        return (phss && (phss.length !== undefined && phss.length !== null)) ? phss.length : undefined;

    },
    addPhase: function(phase, pegLib, nm, idx)
    {
        if (typeof phase === 'object') {

            console.log(this);
            this.attributes.phases.push(phase);
            this.phaseMeta.push({
                'name': nm,
                'defaultPlacement': pegLib
            });
        } else {
            throw new Error('Argument should be an object (' + (typeof phase) + ') ');
        }

    },
    readBars: function()
    {
        var retVar = [],
        that = this,
        forEachPhase = function(phs)
        {
            var forEachBar = function(br)
            {
                retVar.push(that.formatOutputBar(br));
            };
            _.each(phs, forEachBar);
        };

        _.each(this.attributes.phases, forEachPhase);
        return retVar;
    },
    getSheetMusicBars: function()
    {
        var retVar = [],
            that = this;

        var forEachWrPhase = function(wrphs, phsIdx)
        {
            var forEachBar = function(br)
            {
                var nts = that.formatWriteableBar(br, phsIdx)
                retVar = retVar.concat(nts);
            };

            _.each(wrphs, forEachBar);
        }

        _.each(this.attributes.phases, forEachWrPhase);
        return retVar;
    },
    formatWriteableBar: function(bar, phsIdx)
    {
        var that = this,
        retVar = [];

        _.each(bar, function(nt, idx){
            var formattedNote = that.formatWriteableNote(nt.note, idx, phsIdx);
            retVar.push(formattedNote);
        });

        return retVar;

    },
    formatWriteableNote: function(nt, ntIdx, phaseIdx)
    {
        var pc = parser.parse(nt),
            writeableTime = Math.round(nt.time * this.writeableDuration * 2), //durational; so doesnt need base time?
            writeableNote = "" + nt.letter + nt.oct,
            writeData = {
                note: writeableNote,
                duration: writeableTime
            };
        return writeData;
    },
    formatOutputBar: function(bar)
    {
        return {chord: bar};
    },

});

module.exports = Song;
