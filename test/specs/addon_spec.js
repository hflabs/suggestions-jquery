describe('Right-sided control', function () {
    'use strict';

    var serviceUrl = '/some/url',
        attr = 'data-addon-type',
        $body = $(document.body);

    beforeEach(function () {
        this.server = sinon.fakeServer.create();
        jasmine.clock().install();

        this.input = document.createElement('input');
        this.$input = $(this.input).appendTo($body);
        this.instance = this.$input.suggestions({
            serviceUrl: serviceUrl,
            type: 'NAME'
        }).suggestions();
        this.$button = this.instance.$wrapper.children('.suggestions-addon');
    });

    afterEach(function () {
        this.instance.dispose();
        this.$input.remove();

        jasmine.clock().uninstall();
        this.server.restore();
    });

    describe('and empty `addon` option', function () {

        describe('for mobile view', function () {

            beforeEach(function () {
                this.instance.options.mobileWidth = 20000;
                this.instance.isMobile = true;
            });

            it('should not show anything if no text entered', function () {
                expect(this.$button).toBeHidden();
            });

            it('should show clear button if text entered', function () {
                this.input.value = 'но';
                this.instance.onValueChange();

                jasmine.clock().tick(51);

                expect(this.$button).toBeVisible();
                expect(this.$button.attr(attr)).toEqual('clear');
            });

            it('should clear text on button click', function () {
                this.input.value = 'но';
                this.instance.onValueChange();

                jasmine.clock().tick(51);
                helpers.click(this.$button);

                expect(this.input.value).toEqual('');
            });

            it('should not clear text on button click if field is disabled', function () {
                this.input.value = 'но';
                this.instance.onValueChange();
                this.input.setAttribute('disabled', true);

                jasmine.clock().tick(51);
                helpers.click(this.$button);

                expect(this.input.value).toEqual('но');
            });

        });

        describe('for desktop view', function () {

            beforeEach(function () {
                this.instance.options.mobileWidth = NaN;
                this.instance.isMobile = false;
            });

            it('should not show anything if no text entered', function () {
                expect(this.$button).toBeHidden();
            });

            it('should show spinner if text entered', function () {
                this.input.value = 'но';
                this.instance.onValueChange();
                this.instance.fixPosition();

                jasmine.clock().tick(51);

                expect(this.$button).toBeVisible();
                expect(this.$button.attr(attr)).toEqual('spinner');
            });

        });

    });

    describe('and `addon` option set as \'none\'', function () {

        beforeEach(function () {
            this.instance.setOptions({
                addon: 'none'
            })
        });

        it('should not show clear button if text entered', function () {
            this.instance.options.mobileWidth = 20000;
            this.instance.isMobile = true;

            this.input.value = 'но';
            this.instance.onValueChange();

            jasmine.clock().tick(51);

            expect(this.$button).toBeHidden();
        });

        it('should not show spinner if text entered', function () {
            this.instance.options.mobileWidth = NaN;
            this.instance.isMobile = false;

            this.input.value = 'но';
            this.instance.onValueChange();

            jasmine.clock().tick(51);

            expect(this.$button).toBeHidden();
        });

    });

    describe('and `addon` option set as \'clear\'', function () {

        beforeEach(function () {
            this.instance.setOptions({
                addon: 'clear',
                onInvalidateSelection: function () {}
            })
        });

        it('should show clear button in mobile view', function () {
            this.instance.options.mobileWidth = 20000;
            this.instance.isMobile = true;

            this.input.value = 'но';
            this.instance.onValueChange();

            jasmine.clock().tick(51);

            expect(this.$button).toBeVisible();
            expect(this.$button.attr(attr)).toEqual('clear');
        });

        it('should show clear button in desktop view', function () {
            this.instance.options.mobileWidth = NaN;
            this.instance.isMobile = false;

            this.input.value = 'но';
            this.instance.onValueChange();

            jasmine.clock().tick(51);

            expect(this.$button).toBeVisible();
            expect(this.$button.attr(attr)).toEqual('clear');
        });

        it('should trigger onInvalidateSelection method on clear', function () {
            this.input.value = 'но';
            this.instance.onValueChange();

            jasmine.clock().tick(51);

            spyOn(this.instance.options, 'onInvalidateSelection');
            this.$button.click();
            expect(this.instance.options.onInvalidateSelection).toHaveBeenCalled();
        });

    });

    describe('and `addon` option set as \'spinner\'', function () {

        beforeEach(function () {
            this.instance.setOptions({
                addon: 'spinner'
            })
        });

        it('should show spinner in mobile view', function () {
            this.instance.options.mobileWidth = 20000;
            this.instance.isMobile = true;

            this.input.value = 'но';
            this.instance.onValueChange();

            jasmine.clock().tick(51);

            expect(this.$button).toBeVisible();
            expect(this.$button.attr(attr)).toEqual('spinner');
        });

        it('should show spinner in desktop view', function () {
            this.instance.options.mobileWidth = NaN;
            this.instance.isMobile = false;

            this.input.value = 'но';
            this.instance.onValueChange();

            jasmine.clock().tick(51);

            expect(this.$button).toBeVisible();
            expect(this.$button.attr(attr)).toEqual('spinner');
        });

    });

});
