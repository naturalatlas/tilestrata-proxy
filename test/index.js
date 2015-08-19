/* globals describe it */
var proxy = require('../index.js');
var tilestrata = require('tilestrata');
var assert = require('chai').assert;

describe('"tilestrata-proxy"', function() {

	it('should return a remote content', function(done) {
		this.timeout(5000);

		var server = new tilestrata.TileServer();
		var req = tilestrata.TileRequest.parse('/layer/3/2/1/tile.pbf');
		server.layer('layer').route('tile.pbf').use(proxy({
			uri: 'https://raw.githubusercontent.com/naturalatlas/tilestrata-proxy/master/test/fixtures/dummy-{z}-{x}-{y}.txt'
		}));

		server.initialize(function(err) {
			if (err) throw err;
			server.serve(req, false, function(status, buffer, headers) {
				assert.equal(status, 200);
				assert.equal(headers['content-type'], 'text/plain; charset=utf-8', 'Content-Type should be set correctly');
				assert.equal(buffer.toString('utf8'), 'The content');
				done();
			});
		});
	});
	it('should return proper status code', function(done) {
		this.timeout(5000);

		var server = new tilestrata.TileServer();
		var req = tilestrata.TileRequest.parse('/layer/3/2/1/tile.pbf');
		server.layer('layer').route('tile.pbf').use(proxy({
			uri: 'https://raw.githubusercontent.com/naturalatlas/tilestrata-proxy/master/test/fixtures/doesnotexist-{z}-{x}-{y}.txt'
		}));

		server.initialize(function(err) {
			if (err) throw err;
			server.serve(req, false, function(status, buffer, headers) {
				assert.equal(status, 404);
				done();
			});
		});
	});
});
