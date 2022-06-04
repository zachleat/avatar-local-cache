# Avatar Local Cache

This project has been retired and is replaced by:

* [IndieWeb Avatar](https://www.zachleat.com/web/indieweb-avatar/)
* [Eleventy Image](https://www.11ty.dev/docs/plugins/image/)
* [Twitter Avatar URL](https://github.com/zachleat/twitter-avatar-url)

---

Saves a image URL for an avatar to the local file system (and optimizes the image). Read the [blog post that inspired this utility: A Featherweight Facepile](https://www.zachleat.com/web/featherweight-facepile/).

* Workaround for large avatar images on hosted services.
* Image URLs won’t break in the future.
* Only keeps the smallest images (`webp` if smallest and one of `jpg` or `png`)

## Install

```
npm install avatar-local-cache
```

## Usage

The default behavior will only keep `webp` if it has the smallest file size and then will pick one of `jpg` or `png` based on which one is the smallest of the two. To disable this, see the `Keep all formats` example below.

```js
const AvatarLocalCache = require("avatar-local-cache");

let cache = new AvatarLocalCache();
cache.fetchUrl("https://opencollective-production.[…].jpeg", "nhoizey").then(function(files) {
    console.log( `Wrote ${files.map(entry => entry.path).join(", ")}.` );
});
```

The above writes three files but only keeps one: `nhoizey.webp` (20KB), `nhoizey.jpg` (22KB), and `nhoizey.png` (9KB).

1. It only keeps the `webp` file if it is the smallest (it is not).
2. It then picks the smaller of the `jpg` and the `png` (in this case, the `png` wins by 13KB).

This allows you to iterate over the object returned from the promise to create an `img` (if only one source remains) or a `picture` element (if the `webp` survived alongside a `jpg` or `png`).

### Image Maximum Width

Images will be resized down to this width. Images smaller than this width will not be resized.

```js
let cache = new AvatarLocalCache();
cache.width = 400;
```

### Change formats

```js
let cache = new AvatarLocalCache();
cache.formats = ["jpeg"];

// or
cache.formats = ["png"];

// or (order doesn’t matter)
cache.formats = ["webp", "jpeg"];
```

### Keep all formats

To disable this file size comparison and file pruning, just set `onlyKeepSmallestFormats` to false.

```js
let cache = new AvatarLocalCache();
cache.onlyKeepSmallestFormats = false;
```

### Skip Metadata

_Added in 2.0.6_

Faster. Won’t return size or `sharp` metadata.

```js
let cache = new AvatarLocalCache();
cache.skipMetadata = true;
```

