# Avatar Sample Cache

Saves a image URL for an avatar to the local file system (and optimizes the image).

* Workaround for large avatar images on hosted services.
* Image URLs won’t break in the future.

## Usage

```js
const AvatarLocalCache = require("./AvatarLocalCache");

let cache = new AvatarLocalCache();
cache.fetchUrl("https://www.gravatar.com/avatar/10ca8fcb1f434f8929dca2a8867fb71d?default=404", "philhawksworth").then(function(files) {
    console.log( `Wrote ${files.join(", ")}.` );
});
```

Outputs:

```
Wrote philhawksworth.jpg, philhawksworth.png, philhawksworth.webp.
```
