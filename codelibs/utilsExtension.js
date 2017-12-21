module.exports = {
    /**
     * Find and return an object; include its index
     * as a property (index in the array in
     * which it's sought).
     *
     * @param  {Object} list        List/array in which to search
     * @param  {Object} searchTerms Sought key-value pairs
     * @return {Object}             Object if found; otherwise undefined
     */
    whereWithIndex: function(list, searchTerms)
    {
        if (list === undefined || searchTerms === undefined) {
            throw new Error('WhereWithIndex expects 2 parameters.');
        }

        var retVar;
            _.map(list, function(element, idx) {

                var match = _.where([element], searchTerms);

                if (match.length > 0) {
                    retVar = match[0];
                    retVar.index = idx;

                }
            });
            //@todo: Always return the same type.
        return retVar;
    },

    /**
     * Logg any var type fully
     *
     * @param  {mixed} arg1     Item to be logged
     * @return {undefined}      [description]
     */
    logg: function(arg1)
    {
        if (typeof arg1 === 'object') {
            console.log(JSON.stringify(arg1, null, 4));
            return;
        }
        console.log(arg1);

    },
    /**
     * Simple verification of song options
     *
     * @param  {Object}     opts Options to verify
     * @return {undefined}
     * @throws {Error}      If unverifiable
     */
    verifySongOpts: function(opts)
    {
        if (!opts || opts[app.songAttributesKey] === undefined) {
            throw new Error('Global data is required');
        }
    },
    /**
     * Require boolean; otherwise throw Error
     *
     * @param  {mixed}      boolReq Value to verify as bool
     * @return {undefined}
     * @throws {Error}              If unverifiable
     */
    requireBoolean: function(boolReq)
    {
        if (!_.isBoolean(boolReq)) {
            throw new Error(' This ' + typeof(boolReq) + ' must be boolean')
        };
    }
};
