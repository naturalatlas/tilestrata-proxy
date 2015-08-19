var Backend = require('./backend.js');

module.exports = function(options) {
    var source;

    /**
     * Initializes the backend.
     *
     * @param {TileServer} server
     * @param {function} callback(err, fn)
     * @return {void}
     */
    function initialize(server, callback) {
        source = new Backend(server, options);
        source.initialize(callback);
    }

    /**
     * Renders a tile and returns the result as a buffer (PNG),
     * plus the headers that should accompany it.
     *
     * @param {TileServer} server
     * @param {TileRequest} req
     * @param {function} callback(err, buffer, headers)
     * @return {void}
     */
    function serve(server, req, callback) {
        source.getTile(req, callback);
    }

    return {
        init: initialize,
        serve: serve
    };
};
