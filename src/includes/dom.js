/**
 * Утилиты для работы с DOM.
 */
var dom = {
    
    /**
     * Выбрать первый элемент с указанным классом.
     */
    selectByClass: function(classname, parent) {
        var selector = '.' + classname;
        if (parent) {
            return parent.querySelector(selector);
        } else {
            return document.querySelector(selector);
        }
    },

    /**
     * Добавить элементу класс.
     */
    addClass: function(element, className) {
        var list = element.className.split(' ');
        if (list.indexOf(className) === -1) {
            list.push(className);
        }
        element.className = list.join(' ');
    },

    /**
     * Добавить элементу стиль.
     */
    setStyle: function(element, name, value) {
        element.style[name] = value;
    },

    /**
     * Подписаться на событие на элементе.
     * @param {Element} element - элемент
     * @param {string} eventName - название события
     * @param {string} namespace - пространство имён события
     * @param {Function} callback - функция-обработчик события
     */
    listenTo: function(element, eventName, namespace, callback) {
        element.addEventListener(eventName, callback, false);
        if (namespace) {
            if (!eventsByNamespace[namespace]) {
                eventsByNamespace[namespace] = [];
            }
            eventsByNamespace[namespace].push({
                eventName: eventName,
                element: element,
                callback: callback,
            });
        }
    },

    /**
     * Отписаться от всех событий с указанным пространством имён.
     */
    stopListeningNamespace: function(namespace) {
        var events = eventsByNamespace[namespace];
        if (events) {
            events.forEach(function(event) {
                event.element.removeEventListener(event.eventName, event.callback, false);
            })
        }
    },
};

export { dom };