const AvatarLocalCache = require("./AvatarLocalCache");

let cache = new AvatarLocalCache();
// cache.fetchUrl("https://www.gravatar.com/avatar/10ca8fcb1f434f8929dca2a8867fb71d?default=404", "philhawksworth").then(function(files) {
// 	console.log( `Wrote ${files.join(", ")}.` );
// });

cache.fetchUrl("https://opencollective-production.s3-us-west-1.amazonaws.com/9898d612374d4bbab30e48ad1f580d71_f19640c0-66d6-11e7-bc72-f74ea891500d.jpeg", "nicolas-hoizey").then(function(files) {
	console.log( `Wrote ${files.join(", ")}.` );
});