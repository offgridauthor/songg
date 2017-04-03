

var bb = require('backbone'),
    parser = require('note-parser'),
    Midi = require('jsmidgen'),
    imposedBarLength = 256; //this is being moved into song config file

var Phase = function(data, nm, order, opts)
{
    var allowedProps = [
        'imposedFraseLength',
        'bars'
    ];

    this.bars = null;
    this.imposedFraseLength = null;

    this.initialize = function(data, nm, order, optParams) {
        this.set('bars', data);
        this.setOptionals(optParams);

    }

    this.setOptionals = function(opts)
    {
        this.set('imposedFraseLength', opts.imposedFraseLength);

    }

    this.set = function(propName, propVal)
    {
        if (allowedProps.indexOf(propName) === -1) {
            throw new Error('Disallowed property name');
        }
        if (propVal === undefined) {
            this[propName] = null;
        }
        this[propName] = propVal;
    }

    this.forEachBar = function(fn)
    {
        _.each(this.bars, fn);
    }

    this.referToBars = function()
    {
        return this.bars;
    }

    this.getImposedFraseLength = function()
    {
        return this.imposedFraseLength;
    }

    this.initialize(data, nm, order, opts);

}



module.exports = Phase;
