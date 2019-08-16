(function() {
    $(function() {
        Token.init();

        function switchTo(choice) {
            var sgt = $("#address").suggestions(),
                lbl = $("#label");
            if (switchers[choice] !== undefined) {
                $("#address").val("");
                switchers[choice].call(this, sgt, lbl);
            }
        }

        var switchers = {};

        switchers["none"] = function(sgt, lbl) {
            lbl.text("Без ограничений");
            sgt.setOptions({
                constraints: {}
            });
        };

        switchers["foreign"] = function(sgt, lbl) {
            lbl.text("Конкретная страна (Казахстан)");
            sgt.setOptions({
                constraints: {
                    locations: { country_iso_code: "KZ" }
                }
            });
        };

        switchers["msk"] = function(sgt, lbl) {
            lbl.text("Конкретный регион (Москва)");
            sgt.setOptions({
                constraints: {
                    // ограничиваем поиск Москвой
                    locations: { region: "Москва" },
                    deletable: true
                },
                // в списке подсказок не показываем область
                restrict_value: true
            });
        };

        switchers["nsk"] = function(sgt, lbl) {
            lbl.text("Конкретный город (Новосбирск)");
            sgt.setOptions({
                constraints: {
                    label: "Новосибирск",
                    // ограничиваем поиск Новосибирском
                    locations: {
                        region: "Новосибирская",
                        city: "Новосибирск"
                    },
                    // даем пользователю возможность снять ограничение
                    deletable: true
                },
                // в списке подсказок не показываем область и город
                restrict_value: true
            });
        };

        switchers["sochi-adlersky"] = function(sgt, lbl) {
            lbl.text("Внутригородской район (г Сочи, Адлерский р-н)");
            sgt.setOptions({
                constraints: {
                    label: "г Сочи, Адлерский р-н",
                    // ограничиваем поиск Новосибирском
                    locations: {
                        city: "Сочи",
                        city_district: "Адлерский"
                    },
                    // даем пользователю возможность снять ограничение
                    deletable: true
                },
                // в списке подсказок не показываем область и город
                restrict_value: true
            });
        };

        switchers["kladr"] = function(sgt, lbl) {
            lbl.text("Ограничение по коду КЛАДР (Тольятти)");
            sgt.setOptions({
                constraints: {
                    label: "Тольятти",
                    // ограничиваем поиск городом Тольятти по коду КЛАДР
                    locations: { kladr_id: "63000007" }
                },
                // в списке подсказок не показываем область и город
                restrict_value: true
            });
        };

        switchers["fias"] = function(sgt, lbl) {
            lbl.text(
                "Ограничение по коду ФИАС (Краснодарский край, restrict_value = true)"
            );
            sgt.setOptions({
                constraints: {
                    label: "Краснодарский край",
                    // ограничиваем поиск Красндарским Краем по коду ФИАС
                    locations: {
                        region_fias_id: "d00e1013-16bd-4c09-b3d5-3cb09fc54bd8"
                    }
                },
                // в списке подсказок не показываем регион
                restrict_value: true
            });
        };

        switchers["fias-no-restrict"] = function(sgt, lbl) {
            lbl.text(
                "Ограничение по коду ФИАС (Краснодарский край, restrict_value = false)"
            );
            sgt.setOptions({
                constraints: {
                    label: "Краснодарский край",
                    // ограничиваем поиск Красндарским Краем по коду ФИАС
                    locations: {
                        region_fias_id: "d00e1013-16bd-4c09-b3d5-3cb09fc54bd8"
                    }
                },
                // в списке подсказок не показываем регион
                restrict_value: false
            });
        };

        switchers["regions"] = function(sgt, lbl) {
            lbl.text("Несколько регионов (Москва и Московская область)");
            sgt.setOptions({
                constraints: [
                    // Москва
                    {
                        locations: { region: "Москва" },
                        deletable: true
                    },
                    // Московская область
                    {
                        label: "МО",
                        locations: { kladr_id: "50" },
                        deletable: true
                    }
                ]
            });
        };

        switchers["fd"] = function(sgt, lbl) {
            lbl.text("Федеральный округ (ЮФО)");
            sgt.setOptions({
                constraints: {
                    label: "ЮФО",
                    // несколько ограничений по ИЛИ
                    locations: [
                        { region: "адыгея" },
                        { region: "астраханская" },
                        { region: "волгоградская" },
                        { region: "калмыкия" },
                        { region: "краснодарский" },
                        { region: "ростовская" }
                    ]
                }
            });
        };

        $("#address").suggestions({
            token: Token.get(),
            type: "ADDRESS",
            constraints: {},
            /* Вызывается, когда пользователь выбирает одну из подсказок */
            onSelect: function(suggestion) {
                console.log(suggestion);
            }
        });

        $("#switcher a").click(function(e) {
            e.preventDefault();
            switchTo($(this).data("switch"));
        });

        $("#fio").suggestions({
            token: Token.get(),
            type: "NAME",
            constraints: {},
            /* Вызывается, когда пользователь выбирает одну из подсказок */
            onSelect: function(suggestion) {
                console.log(suggestion);
            }
        });

        $("#party").suggestions({
            token: Token.get(),
            type: "PARTY",
            constraints: {},
            /* Вызывается, когда пользователь выбирает одну из подсказок */
            onSelect: function(suggestion) {
                console.log(suggestion);
            }
        });

        $("#email").suggestions({
            token: Token.get(),
            type: "EMAIL",
            constraints: {},
            /* Вызывается, когда пользователь выбирает одну из подсказок */
            onSelect: function(suggestion) {
                console.log(suggestion);
            }
        });

        $("#bank").suggestions({
            token: Token.get(),
            type: "BANK",
            constraints: {},
            /* Вызывается, когда пользователь выбирает одну из подсказок */
            onSelect: function(suggestion) {
                console.log(suggestion);
            }
        });

        $("#region-city").suggestions({
            token: Token.get(),
            type: "ADDRESS",
            constraints: {},
            bounds: "region-city",
            /* Вызывается, когда пользователь выбирает одну из подсказок */
            onSelect: function(suggestion) {
                console.log(suggestion);
            }
        });
    });
})();
