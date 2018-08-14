/**
 * For a single bar, temporally spread the notes according to the indicated
 * pattern.
 * @todo: This really needs to be rewritten as a FraseManip that runs in the right way,
 * instead of being a PhaseManip
 */

var util = require('util'),
  PhaseManipulator = require('./PhaseManipulator.js'),
  ForEachModulators = require('../codelibs/ForEachModulators.js'),
  modulator = 'ALL',
  modulatorFn = ForEachModulators[modulator],
  Note = require('../Note.js'),
  arpeggiation = [
    0, 5, 5, 5
  ],
  that = this,
  defaultArp = arpeggiation,
  fraseArp,
  phsArp;

function Arpeggiator () {
  PhaseManipulator.apply(this, arguments);
  this.name = 'Arpeggiator';
}

util.inherits(Arpeggiator, PhaseManipulator);

/**
 * Apply arpeggiation.
 * The arpeggiator is chosen via the following chain of
 * precedence:
 *
 *  i. Frase-defined arpeggiation library
 *  ii. Phase-defined arpeggiation definitino
 *  iii. Default arpeggiation hard coded in this file
 *
 * @param  {Array}  phs     Array of bars of notes
 *
 * @return {undefined}
 */
Arpeggiator.prototype.go = function (phs) {
  if (!phs.getImposedFraseLength()) {
    throw new Error('Custom arpeggation requires an imposed frase length in phase.');
  }

  that = this;
  defaultArp = arpeggiation;
  phsArp = phs.getManipParam(this.name);

  this.arpeg = function (br, params) {
    fraseArp = br.getManipParam(that.name);
    var doDisable = br.get('disableArpeg') || false,
      pegMap;

    _.each(br.notes, function (ntDat, idx) {
      var nt = new Note(ntDat);

      if (doDisable) {
        nt.ntAttrs.relativeTime = 0;
      }

      pegMap = that.getPegMapFromPrecedence(fraseArp, phsArp, defaultArp);

      if (pegMap[idx] !== undefined) {
        nt.ntAttrs.relativeTime = pegMap[idx];
      } else {
        nt.ntAttrs.relativeTime = 0;
      }
    });
    // sort notes for clearer product later at
    // the getWriteableEvents stage.
    that.orderNotes(br.notes);
  };

  this.orderNotes = function (notes) {
    // let nts = JSON.parse(JSON.stringify(notes));
    notes.sort(function (a, b) {
      return a.note.relativeTime > b.note.relativeTime;
    }).map(function (entry) {
      return entry.score;
    }).reverse();
  };

  this.getPegMapFromPrecedence = function (fr, phz, hard) {
    return fr || (phz || hard);
  };

  this.forEachBar(phs, this.arpeg, {}, modulatorFn);
};

module.exports = Arpeggiator;
