import { WORD_DELIMITERS } from '../constants';
import { lang_util } from '../utils/lang';
import { collection_util } from '../utils/collection';
import { text_util } from '../utils/text';
import { object_util } from '../utils/object';
import { matchers } from '../matchers';

function valueStartsWith (suggestion, field) {
    var fieldValue = suggestion.data && suggestion.data[field];

    return fieldValue &&
        new RegExp('^' + text_util.escapeRegExChars(fieldValue) + '([' + WORD_DELIMITERS + ']|$)','i')
            .test(suggestion.value);
}

var NAME_TYPE = {
    urlSuffix: 'fio',
    noSuggestionsHint: false,
    matchers: [
        matchers.matchByNormalizedQuery(),
        matchers.matchByWords()
    ],
    // names for labels, describing which fields are displayed
    fieldNames: {
        surname: 'фамилия',
        name: 'имя',
        patronymic: 'отчество'
    },
    isDataComplete: function (suggestion) {
        var that = this,
            params = that.options.params,
            data = suggestion.data,
            fields;

        if (lang_util.isFunction(params)) {
            params = params.call(that.element, suggestion.value);
        }
        if (params && params.parts) {
            fields = params.parts.map(function (part) {
                return part.toLowerCase();
            });
        } else {
            // when NAME is first, patronymic is mot mandatory
            fields = ['surname', 'name'];
            // when SURNAME is first, it is
            if (valueStartsWith(suggestion, 'surname')) {
                fields.push('patronymic');
            }
        }
        return object_util.fieldsAreNotEmpty(data, fields);
    },
    composeValue: function (data) {
        return collection_util.compact([data.surname, data.name, data.patronymic]).join(' ');
    }
};

export { NAME_TYPE };