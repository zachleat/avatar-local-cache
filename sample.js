const AvatarLocalCache = require("./AvatarLocalCache");

let cache = new AvatarLocalCache();
cache.fetchUrl("https://www.gravatar.com/avatar/10ca8fcb1f434f8929dca2a8867fb71d?default=404", "philhawksworth").then(function(files) {
	console.log( `Wrote ${files.join(", ")}.` );
});