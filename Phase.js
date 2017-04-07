

var bb = require('backbone'),
    parser = require('note-parser'),
    Midi = require('jsmidgen'),
    imposedBarLength = 256; //this is being moved into song config file

var Phase = function(data, nm, order, opts)
{
    var allowedProps = [
        'imposedFraseLength',
        'frases',
        'name'
    ];

    this.frases = null;
    this.imposedFraseLength = null;

    this.initialize = function(data, nm, order, optParams) {
        this.set('frases', data);
        this.set('name', nm);
        this.setOptionals(optParams);
    }

    this.referToFrases = function() {
        return this.frases;
    }

    this.setOptionals = function(opts)
    {
        this.set('imposedFraseLength', opts.imposedFraseLength);
    };

    this.get = function(propName)
    {
        if (allowedProps.indexOf(propName) === -1) {
            throw new Error('Disallowed property name');
        }
        return this[propName];
    };

    this.set = function(propName, propVal)
    {
        if (allowedProps.indexOf(propName) === -1) {
            throw new Error('Disallowed property name');
        }

        if (propVal === undefined) {
            this[propName] = null;
        }
        this[propName] = propVal;
    };

    this.forEachBar = function(fn)
    {
        _.each(this.bars, fn);
    };

    this.referToBars = function()
    {
        return this.bars;
    };

    this.getImposedFraseLength = function()
    {
        return this.imposedFraseLength;
    };

    this.getFirstFrase = function()
    {
        return this.frases[0][0];
    };

    /**
     *
     *
     * @param  {[type]} previousPhase [description]
     * @return {[type]}               [description]
     */
    this.hookTo = function(previousPhase)
    {
        var delay = previousPhase.getFollowingTime(),
            firstBar = this.getFirstFrase();

        firstBar.note.phaseDelay = delay;
    }

    this.getFollowingTime = function()
    {
        return this.get('imposedFraseLength') * this.frases.length - 1;
    }

    this.getName = function()
    {
        return this.get('name');
    }
    this.initialize(data, nm, order, opts);

}

module.exports = Phase;
