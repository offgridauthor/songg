module.exports = {
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

        return retVar;
    },

    logg: function(arg1)
    {
        if (typeof arg1 === 'object') {
            console.log(JSON.stringify(arg1, null, 4));
            return;
        }
        console.log(arg1);

    }
};
