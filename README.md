# tilestrata-proxy
[![NPM version](http://img.shields.io/npm/v/tilestrata-proxy.svg?style=flat)](https://www.npmjs.org/package/tilestrata-proxy)
[![Build Status](http://img.shields.io/travis/naturalatlas/tilestrata-proxy/master.svg?style=flat)](https://travis-ci.org/naturalatlas/tilestrata-proxy)

A [TileStrata](https://github.com/naturalatlas/tilestrata) plugin for proxying tile requests. Commonly this is needed when you have a beefy vector tile server, and want rendering to happen on cheaper, more-lightweight boxes for scaling purposes.

### Sample Usage

```js
var tilestrata = require('tilestrata');
var vtileraster = require('tilestrata-vtile-raster');
var proxy = require('tilestrata-proxy');
var strata = tilestrata.createServer();

// route that proxies from an upstream server
strata.layer('vtiles').route('t.pbf').use(proxy({url: 'http://domain.com/{z}/{x}/{y}.mvt'}));

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

## Contributing

Before submitting pull requests, please update the [tests](test) and make sure they all pass.

```sh
$ npm test
```

## License

Copyright &copy; 2015 [Yohan Boniface](https://github.com/yohanboniface) & [Contributors](https://github.com/naturalatlas/tilestrata-proxy/graphs/contributors)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at: http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
