describe('Highlight suggestions', function () {
    'use strict';

    var serviceUrl = '/some/url';

    beforeEach(function(){
        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo('body');
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'NAME'
        }).suggestions();

        this.server = sinon.fakeServer.create();
    });

    afterEach(function () {
        this.instance.dispose();
        this.$input.remove();
        this.server.restore();
    });

    it('Should highlight search phrase, in beginning of words', function () {
        this.input.value = 'japa';
        this.instance.onValueChange();

        this.server.respond(helpers.responseFor(['Japaneese lives in Japan and love nonjapaneese']));

        var $item = this.instance.$container.children('.suggestions-suggestion');

        expect($item.length).toEqual(1);
        expect($item.html()).toEqual('<strong>Japa<\/strong>neese lives in <strong>Japa<\/strong>n and love nonjapaneese');
    });

    it('Should highlight search phrase in quotes', function () {
        this.instance.setOptions({
            type: 'PARTY'
        });
        this.input.value = 'фирма';
        this.instance.onValueChange();

        this.server.respond(helpers.responseFor(['ООО "Фирма"']));

        var $item = this.instance.$container.children('.suggestions-suggestion');

        expect($item.length).toEqual(1);
        expect($item.html()).toEqual('ООО "<strong>Фирма</strong>"');
    });

    it('Should highlight names regardless of parts order', function () {
        this.instance.setOptions({
            params: {
                parts: ['NAME', 'PATRONYMIC', 'SURNAME']
            }
        });
        this.input.value = 'Петр Иванович Пе';
        this.instance.onValueChange();

        this.server.respond(helpers.responseFor([
            'Петров Петр Иванович'
        ]));

        var $item = this.instance.$container.children('.suggestions-suggestion');

        expect($item.length).toEqual(1);
        expect($item.html()).toEqual('<strong>Пе<\/strong>тров <strong>Петр<\/strong> <strong>Иванович</strong>');
    });

    it('Should highlight address in parties, ignoring address components types', function () {
        this.instance.setOptions({
            type: 'PARTY'
        });
        this.input.value = 'КРА';
        this.instance.onValueChange();

        this.server.respond(helpers.responseFor([
            {
                value: 'ООО "Красава"',
                data: {
                    address: {
                        value: '350056 РОССИЯ, КРАСНОДАРСКИЙ КРАЙ, Г КРАСНОДАР, П ИНДУСТРИАЛЬНЫЙ, УЛ СВЕТЛАЯ, Д 3',
                        data: null
                    }
                }
            }
        ]));

        var $item = this.instance.$container.children('.suggestions-suggestion'),
            html = $item.html();

        expect($item.length).toEqual(1);
        expect(html).toContain('<strong>КРА</strong>СНОДАРСКИЙ');
        expect(html).toContain('<strong>КРА</strong>СНОДАР,');

        expect(html).toContain(' КРАЙ,');
        expect(html).not.toContain('<strong>КРА</strong>Й');
    });

    it('Should escape html entries', function () {
        this.instance.setOptions({
            type: 'PARTY'
        });
        this.input.value = 'ЗАО &LT';
        this.instance.onValueChange();

        this.server.respond(helpers.responseFor([
            {
                value: 'ЗАО &LT <b>bold</b>',
                data: {}
            }
        ]));

        var $item = this.instance.$container.children('.suggestions-suggestion');

        expect($item.length).toEqual(1);
        expect($item.html()).toContain('<strong>ЗАО</strong> &amp;<strong>LT</strong> &lt;b&gt;bold&lt;/b&gt;');
    });

});