const http = require("http");
const https = require("https");
const fs = require("fs");
const Stream = require("stream").Transform;
const sharp = require("sharp");

const imagemin = require("imagemin");
const imageminJpegtran = require("imagemin-jpegtran");
const imageminPngquant = require("imagemin-pngquant");

class AvatarLocalCache {
	constructor() {
		this.width = 120;
		this._formats = ["jpeg", "png", "webp"];
	}

	get formats() {
		return this._formats;
	}

	set formats(formats) {
		this._formats = formats;
	}

	fetchUrl(url, outputFileSlug) {
		let width = this.width;
		return new Promise((fetchResolve, fetchReject) => {
			if(!url || !outputFileSlug) {
				fetchReject(new Error("Bad `fetchUrl` usage in `avatar-local-cache`. Expects `fetchUrl(url, outputFileSlug)`"));
			}

			(url.startsWith("http:") ? http : https).request(url, (res) => {
				const { statusCode } = res;

				if (statusCode !== 200) {
					res.resume();
					fetchReject(new Error(`AvatarLocalCache request failed. Status Code: ${statusCode}`));
				}

				let data = new Stream();
				res.on("data", (chunk) => {
					data.push(chunk);
				});

				res.on("end", function() {
					let promises = [];
					let img = sharp(data.read()).resize({ width: width });

					if(this.formats.indexOf("jpeg") > -1) {
						let jpgPromise = new Promise((resolve, reject) => {
							// http://sharp.pixelplumbing.com/en/stable/api-output/#jpeg
							img.jpeg({ quality: 100 })
								.toFile(`${outputFileSlug}.jpg`, (err, info) => {
									if(err) {
										fetchReject(err);
									} else {
										imagemin([`${outputFileSlug}.jpg`], {
											plugins: [
												imageminJpegtran()
											]
										}).then(files => {
											for(let file of files) {
												fs.writeFile(`${outputFileSlug}.jpg`, file.data, err => {
													if(err) {
														fetchReject(err);
													} else {
														resolve(`${outputFileSlug}.jpg`);
													}
												});
											}
										});
									}
								});
						});

						promises.push(jpgPromise);
					}

					if(this.formats.indexOf("png") > -1) {
						let pngPromise = new Promise((resolve, reject) => {
							// http://sharp.pixelplumbing.com/en/stable/api-output/#png
							img.png()
								.toFile(`${outputFileSlug}.png`, (err, info) => {
									if(err) {
										fetchReject(err);
									} else {
										// console.log( `Wrote ${outputFileSlug}.png` );

										imagemin([`${outputFileSlug}.png`], {
											plugins: [
												imageminPngquant()
											]
										}).then(files => {
											for(let file of files) {
												fs.writeFile(`${outputFileSlug}.png`, file.data, err => {
													if(err) {
														fetchReject(err);
													} else {
														resolve(`${outputFileSlug}.png`);
													}
												});
											}
										});
									}
								});
						});

						promises.push(pngPromise);
					}

					if(this.formats.indexOf("webp") > -1) {
						let webpPromise = new Promise((resolve, reject) => {
							// http://sharp.pixelplumbing.com/en/stable/api-output/#webp
							img.webp({ lossless: true })
								.toFile(`${outputFileSlug}.webp`, (err, info) => {
									if(err) {
										fetchReject(err);
									} else {
										resolve(`${outputFileSlug}.webp`);
									}
								});
						});

						promises.push(webpPromise);
					}

					Promise.all(promises).then(function(files) {
						fetchResolve(files);
					});
				}.bind(this));
			}).end();
		});
	}
}

module.exports = AvatarLocalCache;