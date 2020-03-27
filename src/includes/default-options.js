import $ from "jquery";

var DEFAULT_OPTIONS = {
    $helpers: null,
    autoSelectFirst: false,
    containerClass: "suggestions-suggestions",
    count: 5,
    deferRequestBy: 100,
    enrichmentEnabled: true,
    formatResult: null,
    formatSelected: null,
    headers: null,
    hint: "Выберите вариант или продолжите ввод",
    initializeInterval: 100,
    language: null,
    minChars: 1,
    mobileWidth: 600,
    noCache: false,
    noSuggestionsHint: null,
    onInvalidateSelection: null,
    onSearchComplete: $.noop,
    onSearchError: $.noop,
    onSearchStart: $.noop,
    onSelect: null,
    onSelectNothing: null,
    onSuggestionsFetch: null,
    paramName: "query",
    params: {},
    preventBadQueries: false,
    requestMode: "suggest",
    scrollOnFocus: false,
    // основной url, может быть переопределен
    serviceUrl: "https://suggestions.dadata.ru/suggestions/api/4_1/rs",
    tabDisabled: false,
    timeout: 3000,
    triggerSelectOnBlur: true,
    triggerSelectOnEnter: true,
    triggerSelectOnSpace: false,
    type: null,
    // url, который заменяет serviceUrl + method + type
    // то есть, если он задан, то для всех запросов будет использоваться именно он
    // если не поддерживается cors то к url будут добавлены параметры ?token=...&version=...
    // и заменен протокол на протокол текущей страницы
    url: null
};

export { DEFAULT_OPTIONS };
