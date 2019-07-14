import { matchers } from "../matchers";

var EMAIL_TYPE = {
    urlSuffix: "email",
    noSuggestionsHint: false,
    matchers: [matchers.matchByNormalizedQuery()],
    isQueryRequestable: function(query) {
        return this.options.suggest_local || query.indexOf("@") >= 0;
    }
};

export { EMAIL_TYPE };
