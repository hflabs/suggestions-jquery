[![Build Status](https://travis-ci.org/hflabs/suggestions-jquery.png?branch=master)](https://travis-ci.org/hflabs/suggestions-jquery)

DaData Suggestions
==================

jQuery-плагин для сервиса Подсказок DaData.ru.

Основан на jQuery и плагине DevBridge Autocomplete (https://github.com/devbridge/jQuery-Autocomplete).

##API

* `$(selector).suggestions(options);`
    * Инициализирует плагин для выбранных input-полей.
    * `options`: Объект, определяющий начальные параметры работы плагина.
        * `serviceUrl`: URL или функция, возвращающая URL.
        * `onSelect`: `function (suggestion) {}` Функция, вызываемая когда пользователь выбирает вариант из списка. `this` внутри нее указывает на input HtmlElement.
        * `minChars`: Минимальная длина поисковой строки, необходимая для начала поиска. По умолчанию: `1`.
        * `maxHeight`: Максимальная высота выпадающего списка. По умолчанию: `300`.
        * `deferRequestBy`: Период ожидания (в миллисекундах) перед отправкой ajax запроса. По умолчанию: `0`.
        * `width`: Ширина выпадающего списка, в пикселах. По умолчанию: `auto`, соответствует ширине поля ввода.
        * `params`: Дополнительные параметры, которые требуется включить в ajax-запрос.
        * `ignoreParams`: Флаг, предписывающий не передавать никаких параметров в запросе. Полезен в случаях, когда `serviceUrl` является функцией и конструирует URL самостоятельно. По умолчанию: `false`.
        * `formatResult`: `function (suggestion, currentValue) {}` функция, производящая дополнительное форматирование подсказки. Возвращает html. 
        * `delimiter`: Строка или RegExp, разделяющая поисковую строку на фрагменты. Если задана, в ajax-запрос будет включаться последний из них.
          Полезен в случаях, когда нужно в input-поле получить несколько значений, например, перечисленных через запятую.
        * `zIndex`: 'z-index' для выпадающего списка. По умолчанию: `9999`.
        * `noCache`: Флаг, препятствующий кэшированию ответов сервера. По умолчанию: `false`.
        * `onSearchStart`: `function (query) {}` вызывается перед началом ajax-запроса. `this` привязано к input-элементу. Здесь можно модифицировать объект `query`.
        * `onSearchComplete`: `function (query, suggestions) {}` вызывается по завершении ajax-запроса. `this` привязано к input элементу. В `suggestions` передается массив полученных подсказок.
        * `onSearchError`: `function (query, jqXHR, textStatus, errorThrown) {}` вызывается при неудачном ajax-запросе. `this` привязано к input элементу.
        * `onInvalidateSelection`: `function (suggestion) {}` вызывается при изменении значение input-элемента, после выбора варианта из списка. `this` привязано к input-элементу.
        * `triggerSelectOnSpace`: Флаг, предписывающий вызывать `onSelect` при нажатии пробела, если выбран какой-либо вариант или посковая фраза совпадает с каким-либо вариантом. По умолчанию: `true`.
        * `preventBadQueries`: Флаг, предписывающий предотвращать запросы к серверу, если предыдущие запросы для поисковой фразы, являющейся началом текущей фразы возвращали нулевое количество подсказок. Например, если запрос для фразы `Jam` не вернул ни одной подсказки, то для всех фраз, начинащихся на `Jam` запросы отправлены не будут. По умолчанию `false`. 
        * `beforeRender`: `function (container) {}` вызывается перед показом выпадающего списка.
        * `tabDisabled`: По умолчанию `false`. Если установлен в `true`, то при нажатии `Tab` курсор будет оставаться в поле ввода.
        * `paramName`: По умолчанию `query`. Имя параметра в ajax-запросе, содержащего поисковую строку.
        * `autoSelectFirst`: если установлен в `true`, первыая подсказка будет автоматически выделена при появлении списка. По умолчанию: `false`.
        * `token`: Строка, передаваемая в заголовке запроса для авторизации на сервисе dadata.ru.
        * `usePreloader`: Флаг, указывающий на необходимость отображать прелоадер во время ожидания ответа сервера. По умолчанию: `true`.
        * `hint`: Поясняющий текст, выводимый в выпадающем списке над подсказками. По умолчанию: "Выберите вариант ниже или продолжите ввод".
            Чтобы задать этот текст один раз для всех полей, можно переопределить $.Suggestions.defaultHint = 'Select a suggestion below'
        * `type`: Строка `"NAME"|"ADDRESS"`. Указывает тип искомого содержимого. Это значение используется для более интеллектуальной работы плагина и для обращений к dadata.ru.
        * `useDadata`: Флаг, предписывающий обращаться к dadata.ru. По умолчанию: `true`, но требует наличия опций `token` и `type`. Запросы осуществляются в случае:
            * выбора подсказки из списка (если определен обработчик `onSelect`). В `onSelect` будет передан агрумент `suggestion`, дополненный данными от dadata.ru
            * отсутствия подсказок по введенному запросу. Ответ от dadata.ru будет использован как наиболее вероятная подсказка.
        * `count`: Желаемое количество получаемых подсказок. По умолчанию: 10.
        

Инициализированный плагин имеет следующие методы:

* `setOptions(options)`: обновляет опции.
* `clear`: очищает кэш запросов и текущий список подсказок.
* `clearCache`: очищает кэш запросов.
* `disable`: временно деактивирует функционал плагина.
* `enable`: включает плагин, если он был деактивирован.
* `hide`: скрывает список с подсказками.
* `fixPosition`: принудительно позиционирует вспомогательные элементы
* `dispose`: уничтожает экземпляр плагина.

Есть два способа обращения к этим методам. Первый состоит в передаче названия метода как строкового аргумента, за которым могут следовать иные необходимые аргументы:

    $('#suggestions').suggestions('disable');
    $('#suggestions').suggestions('setOptions', options);

Или можно получить экземпляр плагина, и затем вызывать его методы:

    $('#suggestions').suggestions().disable();
    $('#suggestions').suggestions().setOptions(options);

##Пример использования

Html:

    <input type="text" name="fio" id="suggestions"/>

Получение подсказок через ajax:

    $('#suggestions').suggestions({
        serviceUrl: '/api/fio',
        onSelect: function (suggestion) {
            alert('You selected: ' + suggestion.value + ', ' + suggestion.data);
        }
    });

##Стили

При инициализации плагин создает дополнительные HTML-элементы. Пример приведен ниже.

    <input type="text" name="fio" id="suggestions"/>
    <div class="suggestions-wrapper">
        <i class="suggestions-preloader"></i>
        <div class="suggestions-suggestions">
            <div class="suggestions-suggestion suggestions-selected">...</div>
            <div class="suggestions-suggestion">...</div>
            <div class="suggestions-suggestion">...</div>
        </div>
    </div>

Пример стилей:

    .suggestions-suggestions { border: 1px solid #999; background: #FFF; overflow: auto; }
    .suggestions-suggestion { padding: 2px 5px; white-space: nowrap; overflow: hidden; }
    .suggestions-selected { background: #F0F0F0; }
    .suggestions-suggestions strong { font-weight: normal; color: #3399FF; }
    .suggestions-hint { color: #777; padding: 2px 5px; }

##Формат ответа

Сервер должен передавать следующий объект в формате JSON:

    {
        suggestions: [
            { value: "United Arab Emirates", data: "AE" },
            { value: "United Kingdom",       data: "UK" },
            { value: "United States",        data: "US" }
        ]
    }

Атрибут `data` может быть любого типа. Его значение будет передаваться в функции formatResults и onSelect. Если этот атрибут не используется, то response.suggestions может быть массивом строк:

    {
        suggestions: ["United Arab Emirates", "United Kingdom", "United States"]
    }
