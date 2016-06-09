var util = require('util'),
    Manipulator = require("./Manipulator.js");

var PhaseManipulator = function () {

    Manipulator.apply(this, arguments);

    this.name = "PhaseManipulator";
}

util.inherits(PhaseManipulator, Manipulator);

PhaseManipulator.prototype.forEachBar = function(phs, fn, params, modFn)
{
    if (!_.isFunction(modFn)) {
        throw new Error('Function is required.');
    }
    _.forEach(phs, function(br, idx){
        params.barIndex = idx;
        if (modFn(idx)) {
            fn(br, params);
        }
    });
}

PhaseManipulator.prototype.perBarForEach = function(phs, params, modFn)
{
    if (!params.rulesPerBar) {
        throw new Error('Per-bar rules are required for this manipulation.');
    }

    if (typeof(params.barIndex) !== 'number')
    {
        throw new Error('perBarForeach misapplication.');
    }

    _.foreach(phs, function(br, idx){
        params.rulesPerBar[idx](br);
    });
}

module.exports = PhaseManipulator;
