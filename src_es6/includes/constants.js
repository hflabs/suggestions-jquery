var KEYS = {
        ENTER: 13,
        ESC:   27,
        TAB:   9,
        SPACE: 32,
        UP:    38,
        DOWN:  40
    },
    EVENT_NS = '.suggestions',
    DATA_ATTR_KEY = 'suggestions',
    WORD_DELIMITERS = '\\s"\'~\\*\\.,:\\|\\[\\]\\(\\)\\{\\}<>№',
    WORD_SPLITTER = new RegExp('[' + WORD_DELIMITERS + ']+', 'g'),
    WORD_PARTS_DELIMITERS = '\\-\\+\\/\\\\\\?!@#$%^&',
    WORD_PARTS_SPLITTER = new RegExp('[' + WORD_PARTS_DELIMITERS + ']+', 'g');

export {
    KEYS,
    EVENT_NS,
    DATA_ATTR_KEY,
    WORD_DELIMITERS,
    WORD_SPLITTER,
    WORD_PARTS_DELIMITERS,
    WORD_PARTS_SPLITTER
}
