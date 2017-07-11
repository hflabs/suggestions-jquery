import $ from 'jquery';

var DEFAULT_OPTIONS = {
    autoSelectFirst: false,
    // основной url, может быть переопределен
    serviceUrl: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs',
    // url, который заменяет serviceUrl + method + type
    // то есть, если он задан, то для всех запросов будет использоваться именно он
    // если не поддерживается cors то к url будут добавлены параметры ?token=...&version=...
    // и заменен протокол на протокол текущей страницы
    url: null,
    onSearchStart: $.noop,
    onSearchComplete: $.noop,
    onSearchError: $.noop,
    onSuggestionsFetch: null,
    onSelect: null,
    onSelectNothing: null,
    onInvalidateSelection: null,
    minChars: 1,
    deferRequestBy: 100,
    params: {},
    paramName: 'query',
    timeout: 3000,
    formatResult: null,
    formatSelected: null,
    noCache: false,
    containerClass: 'suggestions-suggestions',
    tabDisabled: false,
    triggerSelectOnSpace: false,
    triggerSelectOnEnter: true,
    triggerSelectOnBlur: true,
    preventBadQueries: false,
    hint: 'Выберите вариант или продолжите ввод',
    noSuggestionsHint: {
        NAME:       'Неизвестное ФИО',
        ADDRESS:    'Неизвестный адрес',
        EMAIL:      'Неизвестная эл. почта',
        PARTY:      'Неизвестная организация',
        BANK:       'Неизвестный банк'
    },
    type: null,
    requestMode: 'suggest',
    count: 5,
    $helpers: null,
    headers: null,
    scrollOnFocus: true,
    mobileWidth: 980,
    initializeInterval: 100,
    forceInitialize: false
};

export { DEFAULT_OPTIONS };
