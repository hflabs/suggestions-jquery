import { WORD_DELIMITERS } from '../constants';
import { object_util } from '../utils/object';
import { jqapi } from '../jqapi';
import { matchers } from '../matchers';
import { ADDRESS_STOPWORDS, ADDRESS_COMPONENTS } from './address';

var BANK_TYPE = {
    urlSuffix: 'bank',
    noSuggestionsHint: 'Неизвестный банк',
    matchers: [matchers.matchByFields(
        // These fields of suggestion's `data` used by by-words matcher
        {
            'value': null,
            'data.bic': null,
            'data.swift': null
        }
    )],
    dataComponents: ADDRESS_COMPONENTS,
    geoEnabled: true,
    formatResult: function (value, currentValue, suggestion, options) {
        var that = this,
            formattedBIC = that.highlightMatches(object_util.getDeepValue(suggestion.data, 'bic'), currentValue, suggestion),
            address = object_util.getDeepValue(suggestion.data, 'address.value') || '';

        value = that.highlightMatches(value, currentValue, suggestion, options);
        value = that.wrapFormattedValue(value, suggestion);

        if (address) {
            address = address.replace(/^\d{6}( РОССИЯ)?, /i, '');
            if (that.isMobile) {
                // keep only two first words
                address = address.replace(new RegExp('^([^' + WORD_DELIMITERS + ']+[' + WORD_DELIMITERS + ']+[^' + WORD_DELIMITERS + ']+).*'), '$1');
            } else {
                address = that.highlightMatches(address, currentValue, suggestion, {
                    unformattableTokens: ADDRESS_STOPWORDS
                });
            }
        }

        if (formattedBIC || address) {
            value +=
                '<div class="' + that.classes.subtext + '">' +
                '<span class="' + that.classes.subtext_inline + '">' + formattedBIC + '</span>' +
                address +
                '</div>';
        }
        return value;
    },
    formatSelected: function (suggestion) {
        return object_util.getDeepValue(suggestion, 'data.name.payment') || null;
    }
};

export { BANK_TYPE };