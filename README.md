# tilestrata-proxy
[![NPM version](http://img.shields.io/npm/v/tilestrata-proxy.svg?style=flat)](https://www.npmjs.org/package/tilestrata-proxy)
[![Build Status](https://travis-ci.org/naturalatlas/tilestrata-proxy.svg)](https://travis-ci.org/naturalatlas/tilestrata-proxy)
[![Coverage Status](http://img.shields.io/codecov/c/github/naturalatlas/tilestrata-proxy/master.svg?style=flat)](https://codecov.io/github/naturalatlas/tilestrata-proxy)

A [TileStrata](https://github.com/naturalatlas/tilestrata) plugin for proxying tile requests. Commonly this is needed when you have a beefy vector tile server, and want rendering to happen on cheaper, more-lightweight boxes for scaling purposes.

### Sample Usage

```js
var tilestrata = require('tilestrata');
var vtileraster = require('tilestrata-vtile-raster');
var proxy = require('tilestrata-proxy');
var strata = tilestrata();

// route that proxies from an upstream server
strata.layer('vtiles').route('t.pbf').use(proxy({uri: 'http://domain.com/{z}/{x}/{y}.mvt'}));

// rasterize the vector tiles
strata.layer('mylayer').route('t.png').use(vtileraster({
    xml: '/home/ybon/Code/maps/thankyou/mapnik.xml',
    tileSize: 256,
    metatile: 1,
    bufferSize: 128,
    tilesource: ['vtiles', 't.pbf']
}));

strata.listen(8080);
```

The plugin will automatically decompress gzipped content by default regardless of the client's `Accept-Encoding` header. This is due to the fact that proxied content is often used as part of a pipeline (it's not served directly to the client). This isn't always the case though. Decompression behavior is configurable:

```js
// always decompress gzipped content
proxy({decompress: 'always'});

// decompress only if the client does not support compression
proxy({decompress: 'client'});

// never decompress gzipped content
proxy({decompress: 'never'});
```

To specify custom request headers, use the `headers` option:

```js
proxy({
	uri: '...',
	headers: {
		'User-Agent': 'TileStrata/' + tilestrata.version
	}
})
```

## Other Options

```js
// spread requests across different subdomains ala leaflet
.use(proxy({uri: 'http://{s}.domain.com/{z}/{x}/{y}.png', subdomains: 'abc'}));
.use(proxy({uri: 'http://{s}.domain.com/{z}/{x}/{y}.png', subdomains: ['a', 'b', 'c']}));

// request arbitrary urls
.use(proxy({uri: tile => {
	// note: if you return a falsy value this will cause a 404 Not Found to be returned
	return 'http://domain.com/' + tile.z + '/' + tile.x + '/' + tile.y + '.png';
}}));
```

## Contributing

Before submitting pull requests, please update the [tests](test) and make sure they all pass.

```sh
$ npm test
```

## License

Copyright &copy; 2015–2017 [Yohan Boniface](https://github.com/yohanboniface) & [Contributors](https://github.com/naturalatlas/tilestrata-proxy/graphs/contributors)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at: http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
