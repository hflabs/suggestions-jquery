import { matchers } from "../matchers";

function Outward(name) {
    this.urlSuffix = name.toLowerCase();
    this.noSuggestionsHint = "Неизвестное значение";
    this.matchers = [
        matchers.matchByNormalizedQuery(),
        matchers.matchByWords()
    ];
}

export { Outward };
