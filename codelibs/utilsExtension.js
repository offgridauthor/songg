module.exports = {
    whereWithIndex: function(list, searchTerms)
    {
        var retVar;
            _.map(list, function(element, idx){

                var match = _.where([element], searchTerms);

                if (match.length > 0) {
                    retVar = match[0];
                    retVar.index = idx;

                }
            });
        return retVar;
    }
};
