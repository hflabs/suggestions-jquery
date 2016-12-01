(function () {

    $(function() {
        Token.init();

        function switchTo(choice) {
            var sgt = $('#address').suggestions(),
                lbl = $('#label');
            if (switchers[choice] !== undefined) {
                $('#address').val('');
                switchers[choice].call(this, sgt, lbl);
            }
        }

        var switchers = {};

        switchers['none'] = function (sgt, lbl) {
            lbl.text('Без ограничений');
            sgt.setOptions({
                constraints: {}
            });
        };

        switchers['msk'] = function (sgt, lbl) {
            lbl.text('Конкретный регион (Москва)');
            sgt.setOptions({
                constraints: {
                    // ограничиваем поиск Москвой
                    locations: {region: 'Москва'},
                    deletable: true
                },
                // в списке подсказок не показываем область
                restrict_value: true
            });
        };

        switchers['nsk'] = function (sgt, lbl) {
            lbl.text('Конкретный город (Новосбирск)');
            sgt.setOptions({
                constraints: {
                    label: 'Новосибирск',
                    // ограничиваем поиск Новосибирском
                    locations: {
                        region: 'Новосибирская',
                        city: 'Новосибирск'
                    },
                    // даем пользователю возможность снять ограничение
                    deletable: true
                },
                // в списке подсказок не показываем область и город
                restrict_value: true
            });
        };

        switchers['kladr'] = function (sgt, lbl) {
            lbl.text('Ограничение по коду КЛАДР (Тольятти)');
            sgt.setOptions({
                constraints: {
                    label: 'Тольятти',
                    // ограничиваем поиск городом Тольятти по коду КЛАДР
                    locations: {kladr_id: '63000007'}
                },
                // в списке подсказок не показываем область и город
                restrict_value: true
            });
        };

        switchers['regions'] = function (sgt, lbl) {
            lbl.text('Несколько регионов (Москва и Московская область)');
            sgt.setOptions({
                constraints: [
                    // Москва
                    {
                        locations: {region: 'Москва'},
                        deletable: true
                    },
                    // Московская область
                    {
                        label: 'МО',
                        locations: {kladr_id: '50'},
                        deletable: true
                    }
                ]
            });
        };

        switchers['fd'] = function (sgt, lbl) {
            lbl.text('Федеральный округ (ЮФО)');
            sgt.setOptions({
                constraints: {
                    label: 'ЮФО',
                    // несколько ограничений по ИЛИ
                    locations: [
                        {'region': 'адыгея'},
                        {'region': 'астраханская'},
                        {'region': 'волгоградская'},
                        {'region': 'калмыкия'},
                        {'region': 'краснодарский'},
                        {'region': 'ростовская'}
                    ]
                }
            });
        };

        $('#address').suggestions({
            serviceUrl: 'https://suggestions.dadata.ru/suggestions/api/4_1/rs',
            token: Token.get(),
            type: 'ADDRESS',
            constraints: {},
            /* Вызывается, когда пользователь выбирает одну из подсказок */
            onSelect: function (suggestion) {
                console.log(suggestion);
            }
        });

        $('#switcher a').click(function (e) {
            e.preventDefault();
            switchTo($(this).data('switch'));
        });

    });

})();