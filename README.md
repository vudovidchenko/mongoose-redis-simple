Mongoose Cache: Integrated Redis caching for Mongoose queries.

Best Performance Mongoose caching module that works exactly how you would expect it to, with the latest version of Mongoose.

# Installation

Install via NPM

```js
npm install mongoose-redis-simple --save
```


# Example

```js

var mongoose = require('mongoose');
var MongooseCache = require('mongoose-redis-simple');

```
Init mongoose-redis cache

a. You can pass the Redis address as string   
```js

MongooseCache(mongoose, "redis://127.0.0.1:6379");

```
b. You can pass the Redis address as object   
```js

MongooseCache(mongoose, { host: 'localhost', port: 6379 });

```
c. You can pass the Redis client instance
```js
var redisClient = redis.createClient("redis://127.0.0.1:6379");

MongooseCache(mongoose, { client: redisClient });

```

Use cases
```js

var docs = await Post.find({ stt: 1 }).sort({ crt: -1 })
.limit(30)
.cache(120) // cache 120 seconds
.select({ tl: 1, lth:1, views:1, img: 1, slug: 1})

```
You can also pass a custom key into the .cache() method, which you can then use later to clear the cached content.

```js

app.get('/detail/:id', async (req, res)=> {
    var _id = req.params.id;  
    var info = await Post.findOne({ slug: _id, stt: 1 })
            .cache(120, _id); // custom cache key by id
                
});

```

```js

Post.findById("5dbfac4d7d3ff31acb86d870").cache(60).then(result => {
        console.log(result);
    });

```

```js

Post.findOne({ _id: '5dbfac4d7d3ff31acb86d870' }).cache(60).then(result => {
        console.log(result);
    });

```

