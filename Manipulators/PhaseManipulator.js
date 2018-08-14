/**
 * Extendable class for altering phases of Songs
 *
 */
var util = require('util'),
  Manipulator = require('./Manipulator.js');

/**
 * Primary class
 */
function PhaseManipulator () {
  Manipulator.apply(this, arguments);
  this.name = 'PhaseManipulator';
}

util.inherits(PhaseManipulator, Manipulator);

/**
 * Within specified phase, execute specified function on each bar.
 *
 * @param  {Object}   phs    Phase data
 * @param  {Function} fn     Function that will actually manipulate the note in some way
 * @param  {Object}   params Arguments or options for call to fn
 * @param  {Function} modFn  Modulator: function that determines which notes on each bar to alter
 *
 * @return {undefined}
 */
PhaseManipulator.prototype.forEachBar = function (phs, fn, params, modFn) {
  if (!_.isFunction(modFn)) {
    throw new Error('Function is required.');
  }

  _.forEach(phs.referToFrases(), function (bar0, idx) {
    params.barIndex = idx;
    if (modFn(idx)) {
      fn(bar0, params);
      bar0 = null;
    }
  });
};

PhaseManipulator.prototype.forMatchingFrases = function (crdNm, crdIdx, method) {
  const query = this.parseFraseQuery(crdIdx),
    fr = this.phase[query.q](crdNm, query.k);

  if (!fr) {
    throw new Error('could not find frase ', crdNm, crdIdx);
  }

  method(fr);
};

PhaseManipulator.prototype.parseFraseQuery = (crdIdx) => {
  if (_.isNumber(crdIdx)) {
    return {q: 'findFraseByIndex', k: crdIdx};
  }

  if (!_.isObject(crdIdx)) {
    throw new Error('Improperly formatted locator details');
  }

  if (crdIdx.range) {
    return {q: 'findFrasesInRange', k: crdIdx.range};
  }

  if (crdIdx.index) {
    return {q: 'findFraseByIndex', k: crdIdx.index};
  }
  throw new Error('Improperly formatted locator details (see above)');
};

PhaseManipulator.prototype.setPhase = function (phs) {
  this.phase = phs;
};

module.exports = PhaseManipulator;
