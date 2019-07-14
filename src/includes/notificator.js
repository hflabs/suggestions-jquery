var notificator = {
    chains: {},

    on: function(name, method) {
        this.get(name).push(method);
        return this;
    },

    get: function(name) {
        var chains = this.chains;
        return chains[name] || (chains[name] = []);
    }
};

export { notificator };
