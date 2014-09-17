(function() {
    /**
     * features for connected instances
     */

    var optionsUsed = {
        bounds: null
    };

    var methods = {

        setupBounds: function () {
            this.bounds = {
                $parent: $(),
                from: null,
                to: null
            };
        },

        unbindFromParent: function  () {
            this.bounds.$parent.off('.' + this.uniqueId);
        },

        setBoundsOptions: function () {
            var that = this,
                $oldParent = that.bounds.$parent,
                $newParent = $(that.options.bounds && that.options.bounds.parent),
                newBounds = $.trim(that.options.bounds && that.options.bounds.for).split('-');

            if (!$oldParent.is($newParent)) {
                that.unbindFromParent();
                $newParent.on(
                    [
                        'suggestions-select.' + that.uniqueId,
                        'suggestions-selectnothing.' + that.uniqueId,
                        'suggestions-invalidateselection.' + that.uniqueId,
                        'suggestions-clear.' + that.uniqueId
                    ].join(' '),
                    $.proxy(that.onParentSelectionChanged, that)
                );
                $newParent.on('suggestions-dispose.' + that.uniqueId, $.proxy(that.onParentDispose, that));
            }
            that.bounds.$parent = $newParent;

            that.bounds.from = newBounds[0];
            that.bounds.to = newBounds[newBounds.length - 1];
        },

        constructBoundsParams: function () {
            var that = this,
                parentKlardId = utils.getDeepValue(that.bounds.$parent.suggestions(), 'selection.data.kladr_id'),
                params = {};

            if (parentKlardId) {
                params['locations'] = [{ 'kladr_id': parentKlardId }];
                params['restrict_value'] = true;
            }

            if (that.bounds.from) {
                params['from_bound'] = { value: that.bounds.from };
            }
            if (that.bounds.to) {
                params['to_bound'] = { value: that.bounds.to };
            }

            return params;
        },

        onParentSelectionChanged: function (e, suggestion) {
            this.clear();
        },

        onParentDispose: function (e) {
            this.unbindFromParent();
        }

    };

    $.extend(defaultOptions, optionsUsed);

    $.extend(Suggestions.prototype, methods);

    initializeHooks.push(methods.setupBounds);

    disposeHooks.push(methods.unbindFromParent);

    setOptionsHooks.push(methods.setBoundsOptions);

    requestParamsHooks.push(methods.constructBoundsParams);

})();