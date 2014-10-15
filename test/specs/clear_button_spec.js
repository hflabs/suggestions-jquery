describe('Clear button', function () {
    'use strict';

    var serviceUrl = '/some/url';

    beforeEach(function () {
        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo('body');
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'NAME'
        }).suggestions();
        this.$button = this.instance.$wrapper.children('.suggestions-clear');

        this.server = sinon.fakeServer.create();
    });

    afterEach(function () {
        this.instance.dispose();
        this.$input.remove();

        this.server.restore();
    });

    it('should be displayed for mobile view', function () {
        this.instance.setOptions({
            // enable mobile view features
            mobileWidth: 20000
        });
        this.instance.fixPosition();

        expect(this.$button).toBeVisible();
    });

    it('should be always displayed if `showClear` set as true', function () {
        this.instance.setOptions({
            // disable mobile view features
            mobileWidth: null,
            showClear: true
        });
        this.instance.fixPosition();

        expect(this.$button).toBeVisible();
    });

    it('should not be displayed for non-mobile view', function () {
        this.instance.setOptions({
            // disable mobile view features
            mobileWidth: null
        });
        this.instance.fixPosition();

        expect(this.$button).toBeHidden();
    });

    it('should not be displayed if `showClear` set as false', function () {
        this.instance.setOptions({
            // enable mobile view features
            mobileWidth: 20000,
            showClear: false
        });
        this.instance.fixPosition();

        expect(this.$button).toBeHidden();
    });

    it('should clear input\'s value', function () {
        var suggestion = {
            value: 'Новосибирская обл',
            data: {}
        };

        this.input.value = 'Нов';
        this.instance.onValueChange();
        this.server.respond(helpers.responseFor([ suggestion ]));
        this.instance.select(0);

        expect(this.instance.selection).toEqual(helpers.appendUnrestrictedValue(suggestion));

        this.$button.click();

        expect(this.instance.selection).toBeNull();
    });

});
