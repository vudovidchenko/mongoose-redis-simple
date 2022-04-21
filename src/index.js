const Hash = require("mix-hash"),
    redis = require("redis"),
    util = require("util");

let client,
    redisOk = false;

module.exports = function (mongoose, option) {
    const exec = mongoose.Query.prototype.exec;

    if (option.client) {
        client = option.client;
        redisOk = true;
    } else {
        client = redis.createClient(option || "redis://127.0.0.1:6379");

        client.on("error", function(err) {
            redisOk = false;
        });

        client.on("connect", function() {
            redisOk = true;
        });
    }

    client.get_async = util.promisify(client.get);

    mongoose.Query.prototype.cache = function (ttl, customKey) {
        if (typeof ttl === 'string') {
            customKey = ttl;
            ttl = 60;
        }

        this._ttl = ttl;
        this._key = customKey;
        return this;
    };

    mongoose.Query.prototype.exec = async function () {
        if (typeof this._ttl === 'undefined' || !redisOk) {
            return exec.apply(this, arguments);
        }

        const key = this._key || Hash.md5(JSON.stringify(Object.assign({}, { name: this.model.collection.name, conditions: this._conditions, fields: this._fields, o: this.options, populates: JSON.stringify(this._mongooseOptions.populate) })));

        const cached = await client.get_async(key);
        if (cached) {

            const docBuilder = (data, conditions) => {
                const document = new this.model(data, conditions);
                document.isNew = false;
                return document;
            };

            // console.log(`[LOG] Serving from cache`);
            const conditions = this._fields;
            if (conditions) delete conditions["_id"];

            const doc = JSON.parse(cached);
            return Array.isArray(doc) ? doc.map(d => docBuilder(d, conditions)) : docBuilder(doc, conditions);
        }

        const result = await exec.apply(this, arguments);

        if (result) {
            if (this._ttl <= 0) {
                client.set(key, JSON.stringify(result));
            } else {
                client.set(key, JSON.stringify(result), "EX", this._ttl);
            }
        }

        return result;
    }

};

module.exports.clearCache = function(customKey) {
    if (redisOk && customKey) {
        client.del(customKey);
    }
};