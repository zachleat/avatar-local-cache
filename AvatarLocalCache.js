const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
const sharp = require("sharp");

const imagemin = require("imagemin");
const imageminJpegtran = require("imagemin-jpegtran");
const imageminPngquant = require("imagemin-pngquant");

class AvatarLocalCache {
	constructor() {
		this.width = 120;
		this._formats = ["jpeg", "png", "webp"];
		this._onlyKeepSmallestFormats = true;
	}

	get formats() {
		return this._formats;
	}

	set formats(formats) {
		this._formats = formats;
	}

	get onlyKeepSmallestFormats() {
		return this._onlyKeepSmallestFormats;
	}

	set onlyKeepSmallestFormats(value) {
		this._onlyKeepSmallestFormats = value;
	}

	async getReturnObject(stem, extension) {
		let fullPath = `${stem}.${extension}`;
		let stats = await new Promise((resolve, reject) => {
			fs.stat(fullPath, function(err, stats) {
				if(err) {
					reject(err);
				}
				resolve(stats);
			});
		});
		let metadata = await sharp(fullPath).metadata();

		return Object.assign(metadata, {
			name: path.parse(fullPath).name,
			path: fullPath,
			size: stats.size,
			toString: function() {
				return `${fullPath} (${(stats.size/1000).toFixed(2)}KB)`;
			}
		});
	}

	fetchUrl(url, outputFileSlug) {
		let width = this.width;
		return new Promise((fetchResolve, fetchReject) => {
			if(!url || !outputFileSlug) {
				fetchReject(new Error("Bad `fetchUrl` usage in `avatar-local-cache`. Expects `fetchUrl(url, outputFileSlug)`"));
			}

			fetch(url).catch(function(error) {
				fetchReject(`Url: ${url}\nError: ${error}`);
			}).then(function(res) {
				if(!res.ok) {
					fetchReject(new Error(`Bad status code for ${url} (${res.status}): ${res.statusText}`));
					return;
				}

				res.buffer().then(body => {
					let promises = [];
					let img = sharp(body).resize({ width: width, withoutEnlargement: true });
					img.metadata().catch(function(error) {
						fetchReject(`Url: ${url}\nError: ${error}`);
					}).then(function(metadata) {
						if(this.formats.indexOf("jpeg") > -1) {
							let jpgPromise = new Promise((resolve, reject) => {
								// http://sharp.pixelplumbing.com/en/stable/api-output/#jpeg
								let jpeg;
								if(metadata.format !== "jpeg") {
									jpeg = img.jpeg();
								} else {
									jpeg = img;
								}

								jpeg.toFile(`${outputFileSlug}.jpg`, (err, info) => {
									if(err) {
										fetchReject(`Url: ${url}\nError: ${err}`);
									} else {
										imagemin([`${outputFileSlug}.jpg`], {
											plugins: [
												imageminJpegtran()
											]
										}).then(files => {
											for(let file of files) {
												fs.writeFile(`${outputFileSlug}.jpg`, file.data, err => {
													if(err) {
														fetchReject(`Url: ${url}\nError: ${err}`);
													} else {
														this.getReturnObject(outputFileSlug, "jpg").then(function(returnData) {
															resolve(returnData);
														});
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
								let png;
								if(metadata.format !== "png") {
									png = img.png();
								} else {
									png = img;
								}

								png.toFile(`${outputFileSlug}.png`, (err, info) => {
									if(err) {
										fetchReject(`Url: ${url}\nError: ${err}`);
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
														fetchReject(`Url: ${url}\nError: ${err}`);
													} else {
														this.getReturnObject(outputFileSlug, "png").then(function(returnData) {
															resolve(returnData);
														});
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
								let webp;
								if(metadata.format !== "webp") {
									webp = img.webp();
								} else {
									webp = img;
								}

								webp.toFile(`${outputFileSlug}.webp`, (err, info) => {
									if(err) {
										fetchReject(`Url: ${url}\nError: ${err}`);
									} else {
										this.getReturnObject(outputFileSlug, "webp").then(function(returnData) {
											resolve(returnData);
										});
									}
								});
							});

							promises.push(webpPromise);
						}

						Promise.all(promises).then(function(files) {
							let sorted = files.sort(function(a, b) {
								return a.size - b.size;
							});

							if(this.onlyKeepSmallestFormats) {
								// remove webp if it’s not the smallest
								if(!sorted[0].path.endsWith(".webp")) {
									sorted = sorted.filter(function(entry) {
										if(entry.path.endsWith(".webp")) {
											fs.unlink(entry.path, (err) => {
												if (err) throw err;
											});
											return false;
										} else {
											return true;
										}
									});
								}

								// remove the biggest of png/jpg
								if( sorted.filter(function(entry) {
									return entry.path.endsWith(".jpg") || entry.path.endsWith(".png");
								}).length >= 2 ) {
									let cut = sorted.pop();
									fs.unlink(cut.path, (err) => {
										if (err) throw err;
									});
								}
							}

							fetchResolve(sorted);

						}.bind(this));

					}.bind(this)); // .metadata
				}); // buffer
			}.bind(this));
		});
	}
}

module.exports = AvatarLocalCache;