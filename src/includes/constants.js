var KEYS = {
    ENTER: 13,
    ESC: 27,
    TAB: 9,
    SPACE: 32,
    UP: 38,
    DOWN: 40
};

var CLASSES = {
    hint: "suggestions-hint",
    mobile: "suggestions-mobile",
    nowrap: "suggestions-nowrap",
    promo: "suggestions-promo",
    promo_desktop: "suggestions-promo-desktop",
    selected: "suggestions-selected",
    suggestion: "suggestions-suggestion",
    subtext: "suggestions-subtext",
    subtext_inline: "suggestions-subtext suggestions-subtext_inline",
    subtext_delimiter: "suggestions-subtext-delimiter",
    subtext_label: "suggestions-subtext suggestions-subtext_label",
    removeConstraint: "suggestions-remove",
    value: "suggestions-value"
};

var EVENT_NS = ".suggestions";
var DATA_ATTR_KEY = "suggestions";
var WORD_DELIMITERS = "\\s\"'~\\*\\.,:\\|\\[\\]\\(\\)\\{\\}<>№";
var WORD_PARTS_DELIMITERS = "\\-\\+\\\\\\?!@#$%^&";

export {
    KEYS,
    CLASSES,
    EVENT_NS,
    DATA_ATTR_KEY,
    WORD_DELIMITERS,
    WORD_PARTS_DELIMITERS
};
