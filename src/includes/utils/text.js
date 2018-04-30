import { WORD_DELIMITERS, WORD_PARTS_DELIMITERS } from '../constants';
import { collection_util } from './collection';

/**
 * Утилиты для работы с текстом.
 */

var WORD_SPLITTER = new RegExp('[' + WORD_DELIMITERS + ']+', 'g');
var WORD_PARTS_SPLITTER = new RegExp('[' + WORD_PARTS_DELIMITERS + ']+', 'g');

var text_util = {
    /**
     * Заменяет амперсанд, угловые скобки и другие подобные символы
     * на HTML-коды
     */
    escapeHtml: function (str) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };

        if (str) {
            collection_util.each(map, function(html, ch){
                str = str.replace(new RegExp(ch, 'g'), html);
            });
        }
        return str;
    },

    /**
     * Эскейпирует символы RegExp-шаблона обратным слешем
     * (для передачи в конструктор регулярных выражений)
     */
    escapeRegExChars: function (value) {
        return value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    },    

    /**
     * Приводит слово к нижнему регистру и заменяет ё → е
     */
    formatToken: function (token) {
        return token && token.toLowerCase().replace(/[ёЁ]/g, 'е');
    },

    /**
     * Возвращает регулярное выражение для разбивки строки на слова
     */
    getWordExtractorRegExp: function () {
        return new RegExp('([^' + WORD_DELIMITERS + ']*)([' + WORD_DELIMITERS + ']*)', 'g');
    },

    /**
     * Вырезает из строки стоп-слова
     */
    normalize: function(str, stopwords) {
        return text_util.split(str, stopwords).join(' ');
    },

    /**
     * Добивает строку указанным символов справа до указанной длины
     * @param sourceString  исходная строка
     * @param targetLength  до какой длины добивать
     * @param padString  каким символом добивать
     * @returns строка указанной длины
     */
    padEnd: function(sourceString, targetLength, padString) {
        if (String.prototype.padEnd) {
            return sourceString.padEnd(targetLength, padString);
        }
        targetLength = targetLength>>0; //floor if number or convert non-number to 0;
        padString = String((typeof padString !== 'undefined' ? padString : ' '));
        if (sourceString.length > targetLength) {
            return String(sourceString);
        }
        else {
            targetLength = targetLength - sourceString.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
            }
            return String(sourceString) + padString.slice(0,targetLength);
        }
    },

    /**
     * Нормализует строку, разбивает на слова,
     * отсеивает стоп-слова из списка.
     * Расклеивает буквы и цифры, написанные слитно.
     */
    split: function(str, stopwords) {
        str = str.toLowerCase();
        str = str.replace('ё', 'е')
            .replace(/(\d+)([а-я]{2,})/g, '$1 $2')
            .replace(/([а-я]+)(\d+)/g, '$1 $2');

        var words = collection_util.compact(str.split(WORD_SPLITTER)),
            lastWord = words.pop(),
            goodWords = collection_util.minus(words, stopwords);

        goodWords.push(lastWord);
        return goodWords;
    },
    
    /**
     * Заменяет слова на составные части.
     * В отличие от withSubTokens, не сохраняет исходные слова.
     */
    splitTokens: function(tokens) {
        var result = [];
        collection_util.each(tokens, function (token, i) {
            var subtokens = token.split(WORD_PARTS_SPLITTER);
            result = result.concat(collection_util.compact(subtokens));
        });
        return result;
    },

    /**
     * Проверяет, включает ли строка 1 строку 2.
     * Если строки равны, возвращает false.
     */
    stringEncloses: function(str1, str2) {
        return str1.length > str2.length 
            && str1.toLowerCase().indexOf(str2.toLowerCase()) !== -1;
    },

    /**
     * Возвращает список слов из строки.
     * При этом первыми по порядку идут «предпочтительные» слова
     * (те, что не входят в список «нежелательных»).
     * Составные слова тоже разбивает на части.
     * @param {string} value - строка
     * @param {Array} unformattableTokens - «нежелательные» слова
     * @return {Array} Массив атомарных слов
     */
    tokenize: function(value, unformattableTokens) {
        var tokens = collection_util.compact(text_util.formatToken(value).split(WORD_SPLITTER));
        // Move unformattableTokens to the end.
        // This will help to apply them only if no other tokens match
        var preferredTokens = collection_util.minus(tokens, unformattableTokens);
        var otherTokens = collection_util.minus(tokens, preferredTokens);
        tokens = text_util.withSubTokens(preferredTokens.concat(otherTokens));
        return tokens;
    },
    
    /**
     * Разбивает составные слова на части 
     * и дописывает их к исходному массиву.
     * @param {Array} tokens - слова
     * @return {Array} Массив атомарных слов
     */
    withSubTokens: function (tokens) {
        var result = [];
        collection_util.each(tokens, function (token, i) {
            var subtokens = token.split(WORD_PARTS_SPLITTER);
            result.push(token);
            if (subtokens.length > 1) {
                result = result.concat(collection_util.compact(subtokens));
            }
        });
        return result;
    }
};

export { text_util };