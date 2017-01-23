describe('Initialization', function () {
    'use strict';

    var serviceUrl = '/some/url',
        $body = $(document.body);

    /**
     * Just a wrapper for a bunch of specs to check that instance is completely initialized
     * Wherever called, runs these specs in current environment
     */
    function checkInitialized () {

        it('Should request service status', function () {
            expect(this.server.requests.length).toBe(1);
            expect(this.server.requests[0].url).toContain('/status/fio');
        });

        it('Should create all additional components', function () {
            var instance = this.instance;
            $.each(['$wrapper', '$container', '$constraints'], function (i, component) {
                expect(instance[component].length).toEqual(1);
            });
            expect(instance.addon.$el.length).toEqual(1);
        });

    }

    /**
     * Checks that instance has not been completely initialized
     */
    function checkNotInitialized () {

        it('Should not send anything to server', function () {
            expect(this.server.requests.length).toBe(0);
        });

        it('Should not create any additional elements', function () {
            expect(this.instance.addon).toBeUndefined();
            expect(this.instance.$wrapper).toBeNull();
        });

    }

    beforeEach(function () {
        $.Suggestions.resetTokens();

        this.server = sinon.fakeServer.create();
    });

    afterEach(function () {
        this.server.restore();
    });

    describe('visible element', function () {

        beforeEach(function () {
            this.input = document.createElement('input');
            this.$input = $(this.input).appendTo($body);
            this.instance = this.$input.suggestions({
                serviceUrl: serviceUrl,
                type: 'NAME'
            }).suggestions();

            helpers.returnGoodStatus(this.server);
        });

        afterEach(function () {
            this.instance.dispose();
            this.$input.remove();
        });

        it('Should initialize suggestions options', function () {
            expect(this.instance.options.serviceUrl).toEqual(serviceUrl);
        });

        checkInitialized();

    });

    describe('check defaults', function () {

        beforeEach(function () {
            this.input = document.createElement('input');
            this.$input = $(this.input).appendTo($body);
            this.instance = this.$input.suggestions({
                type: 'NAME'
            }).suggestions();

            helpers.returnGoodStatus(this.server);
        });

        afterEach(function () {
            this.instance.dispose();
            this.$input.remove();
        });

        it('serviceUrl', function () {
            expect(this.instance.options.serviceUrl).toEqual($.Suggestions.defaultOptions.serviceUrl);
        });

        checkInitialized();

    });

    describe('check custom options', function () {

        beforeEach(function () {
            this.input = document.createElement('input');
            this.$input = $(this.input).appendTo($body);
            this.instance = this.$input.suggestions({
                type: 'NAME',
                serviceUrl: 'http://domain.com'
            }).suggestions();

            helpers.returnGoodStatus(this.server);
        });

        afterEach(function () {
            this.instance.dispose();
            this.$input.remove();
        });

        it('serviceUrl', function () {
            expect(this.instance.options.serviceUrl).toEqual('http://domain.com');
        });

        checkInitialized();

    });

    describe('hidden element', function () {

        // create input, but do not add it to DOM
        beforeEach(function () {
            jasmine.clock().install();

            this.input = document.createElement('input');
            this.$input = $(this.input);
            this.instance = this.$input.suggestions({
                serviceUrl: serviceUrl,
                type: 'NAME'
            }).suggestions();

            helpers.returnGoodStatus(this.server);
        });

        afterEach(function () {
            this.instance.dispose();
            jasmine.clock().uninstall();
        });

        it('Should initialize suggestions options', function () {
            expect(this.instance.options.serviceUrl).toEqual(serviceUrl);
        });

        checkNotInitialized();

        describe('after showed', function () {

            beforeEach(function () {
                this.$input.appendTo($body);
            });

            afterEach(function () {
                this.$input.remove();
            });

            checkNotInitialized();

            describe('and interacted by keyboard', function () {

                beforeEach(function () {
                    helpers.keydown(this.input, 32);
                });

                checkInitialized();
            });

            describe('and interacted by mouse', function () {

                beforeEach(function () {
                    this.$input.mouseover();
                });

                checkInitialized();
            });

            describe('and `initializeInterval` expired', function () {

                beforeEach(function () {
                    jasmine.clock().tick($.Suggestions.defaultOptions.initializeInterval + 1);
                });

                checkInitialized();
            });
        });

    });

});
