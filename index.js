var request = require('request');
var zlib = require('zlib');

function template(str, data) {
	return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
		var value = data[key];
		if (value === undefined) {
			throw new Error('No value provided for variable ' + str);
		} else if (typeof value === 'function') {
			value = value(data);
		}
		return value;
	});
}

module.exports = function(options) {
	if (typeof options === 'string') options = {uri: options};
	if (!options.uri) throw new Error('Missing proxy "uri" parameter');
	var uri = options.uri;
	var decompress = options.decompress || 'always';
	var subdomains = options.subdomains || 'abc';
	var retries = options.retries || 0;
	var retryDelayBase = typeof options.retryDelayBase === 'number' ? options.retryDelayBase : 500;
	var retryDelayMax = typeof options.retryDelayMax === 'number' ? options.retryDelayMax : 1000 * 60;
	var retryDelayMultiple = typeof options.retryDelayMultiple === 'number' ? options.retryDelayMultiple : 2;
	var usesSubdomainReplacement = typeof uri === 'string' && uri.indexOf('{s}') > -1;
	var headers = decompress === 'always' ? {'Accept-Encoding': 'gzip, deflate'} : {};
	for (var k in options.headers) {
		if (options.headers.hasOwnProperty(k)) {
			headers[k] = options.headers[k];
		}
	}

	return {
		name: 'proxy',
		serve: function(server, req, callback) {
			// use the client's accept-encoding if we want decompression
			// behavior to be determined by client capabilities
			var finalRequestHeaders = headers;
			if (decompress === 'client') {
				var finalRequestHeaders = {};
				for (var k in headers) {
					if (headers.hasOwnProperty(k)) {
						finalRequestHeaders[k] = headers[k];
					}
				}
				finalRequestHeaders['Accept-Encoding'] = req.headers['accept-encoding'];
			}

			var requestURI;
			if (typeof uri === 'function') {
				requestURI = uri(req);
			} else {
				requestURI = uri;
				if (usesSubdomainReplacement) {
		 			var sudomainIndex = Math.abs(req.x + req.y) % subdomains.length;
					var subdomain = subdomains[sudomainIndex];
					requestURI = requestURI.replace('{s}', subdomain);
				}
				requestURI = template(requestURI, req);
			}

			if (!requestURI) {
				var error = new Error('No proxy url defined for this tile');
				error.statusCode = 404;
				return callback(error);
			}

			var options = {
				headers: finalRequestHeaders,
				uri: requestURI,
				encoding: null // we want a buffer, not a string
			};

			var handleError = function(err, requestNumber) {
				var attemptsRemaining = retries - (requestNumber - 1);
				var delayMs = Math.min(retryDelayMax, retryDelayBase * Math.pow(retryDelayMultiple, requestNumber - 1));
				if (attemptsRemaining > 0) {
					setTimeout(attemptRequest, delayMs, requestNumber + 1);
				} else {
					callback(err);
				}
			};

			var attemptRequest = function(requestNumber) {
				request(options, function onResponse(err, resp, body) {
					if (err) return handleError(err, requestNumber);

					// don't accept anything but a 200 OK
					if (resp.statusCode !== 200) {
						var httpError = new Error('Received non-200 status from upstream (' + resp.statusCode + ')');
						httpError.statusCode = resp.statusCode;
						return handleError(httpError, requestNumber);
					}

					// detect content encoding
					var contentEncoding = (resp.headers['content-encoding'] || '').toLowerCase();
					if (!contentEncoding) {
						if (body && body[0] === 0x1F && body[1] === 0x8B) contentEncoding = 'gzip';
						if (body && body[0] === 0x78 && body[1] === 0x9C) contentEncoding = 'deflate';
					}

					// should we attempt decompression?
					var shouldDecompress = false;
					if (contentEncoding === 'gzip' || contentEncoding === 'deflate') {
						shouldDecompress = decompress === 'always';
						if (decompress === 'client') {
							var clientSupportedEncodings = (req.headers['accept-encoding'] || '').trim().toLowerCase().split(/\s*,\s*/);
							shouldDecompress = clientSupportedEncodings.indexOf(contentEncoding) === -1;
						}
					}

					// decompress body
					if (shouldDecompress) {
						var fn = contentEncoding === 'gzip' ? 'gunzip' : 'inflate';
						return zlib[fn](body, function(err, data) {
							if (err) return callback(err);
							delete resp.headers['content-encoding'];
							delete resp.headers['content-length'];
							callback(null, data, resp.headers);
						});
					}

					callback(null, body, resp.headers);
				});
			};

			attemptRequest(1);
		}
	};
};
