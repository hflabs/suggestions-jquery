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

        this.server.respond(helpers.responseFor(['Japaneese lives in Japan and love non-japaneese']));

        var $item = this.instance.$container.children('.suggestions-suggestion');

        expect($item.length).toEqual(1);
        expect($item.html()).toEqual('<strong>Japa<\/strong>neese lives in <strong>Japa<\/strong>n and love non-japaneese');
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
                psrts: ['NAME', 'PATRONYMIC', 'SURNAME']
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

});