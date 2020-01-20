"use strict";

/**
 * @typedef {Object} NtpTimeResult
 * @property {Date} now Correct real time
 * @property {Number} offset Offset local to real time in milliseconds
 * @property {Number} precision Precision in milliseconds
 */

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends =
  Object.assign ||
  function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };

var _createClass = (function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

var _ntpPacketParser = require("ntp-packet-parser");

var _ntpPacketParser2 = _interopRequireDefault(_ntpPacketParser);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var dgram = require("dgram");

var singleton = void 0;
var lastPoll = void 0;
var lastResult = void 0;

var NtpTimeSync = (function() {
  /**
   * @param {Object} options
   */
  function NtpTimeSync() {
    var _this = this;

    var options =
      arguments.length > 0 && arguments[0] !== undefined
        ? arguments[0]
        : undefined;

    _classCallCheck(this, NtpTimeSync);

    var defaultOptions = {
      // list of NTP time servers, optionally including a port (defaults to options.ntpDefaults.port = 123)
      servers: [
        "0.pool.ntp.org",
        "1.pool.ntp.org",
        "2.pool.ntp.org",
        "3.pool.ntp.org"
      ],

      // required amount of valid samples
      sampleCount: 8,

      // amount of time in milliseconds to wait for an NTP response
      replyTimeout: 3000,

      // defaults as of RFC5905
      ntpDefaults: {
        port: 123,
        version: 4,
        tolerance: 15e-6,
        minPoll: 4,
        maxPoll: 17,
        maxDispersion: 16,
        minDispersion: 0.005,
        maxDistance: 1,
        maxStratum: 16,
        precision: -18,
        referenceDate: new Date("Jan 01 1900 GMT")
      }
    };

    this.options = _extends({}, defaultOptions, options);

    // convert servers to internal representation
    this.options.servers = this.options.servers.map(function(server) {
      return {
        host: server.split(":", 2)[0],
        port: Number(server.split(":", 2)[1]) || _this.options.ntpDefaults.port
      };
    });

    this.samples = [];
  }

  /**
   * Returns a singleton
   * @param {Object} options
   * @return {NtpTimeSync}
   */

  _createClass(
    NtpTimeSync,
    [
      {
        key: "collectSamples",
        value: async function collectSamples(numSamples) {
          var _this2 = this;

          var ntpResults = [];
          var retry = 0;

          var _loop = async function _loop() {
            var timePromises = [];

            _this2.options.servers.forEach(function(server) {
              timePromises.push(
                _this2
                  .getNetworkTime(server.host, server.port)
                  .then(function(data) {
                    _this2.acceptResponse(data);

                    return data;
                  })
              );
            });

            // wait for NTP responses to arrive
            ntpResults = ntpResults
              .concat(
                await Promise.all(
                  timePromises.map(function(p) {
                    return p.catch(function(e) {
                      return e;
                    });
                  })
                )
              )
              .filter(function(result) {
                return !(result instanceof Error);
              });

            if (ntpResults.length === 0) {
              retry++;
            }
          };

          do {
            await _loop();
          } while (ntpResults.length < numSamples && retry < 3);

          if (ntpResults.length === 0) {
            throw new Error(
              "Connection error: Unable to get any NTP response after " +
                retry +
                " retries"
            );
          }

          // filter erroneous responses, use valid ones as samples
          var samples = [];
          ntpResults.forEach(function(data) {
            var offsetSign =
              data.transmitTimestamp.getTime() >
              data.destinationTimestamp.getTime()
                ? 1
                : -1;

            var offset =
              (Math.abs(
                data.receiveTimestamp.getTime() - data.originTimestamp.getTime()
              ) +
                Math.abs(
                  data.transmitTimestamp.getTime() -
                    data.destinationTimestamp.getTime()
                )) /
              2 *
              offsetSign;

            var delay = Math.max(
              data.destinationTimestamp.getTime() -
                data.originTimestamp.getTime() -
                (data.receiveTimestamp.getTime() -
                  data.transmitTimestamp.getTime()),
              Math.pow(2, _this2.options.ntpDefaults.precision)
            );

            var dispersion =
              Math.pow(2, data.precision) +
              Math.pow(2, _this2.options.ntpDefaults.precision) +
              _this2.options.ntpDefaults.tolerance *
                (data.destinationTimestamp.getTime() -
                  data.originTimestamp.getTime());

            samples.push({
              data: data,
              offset: offset,
              delay: delay,
              dispersion: dispersion
            });
          });

          // sort samples by ascending delay
          samples.sort(function(a, b) {
            return a.delay - b.delay;
          });

          // restrict to best n samples
          return samples.slice(0, numSamples);
        }

        /**
     * @param {Boolean} force Force NTP update
     * @return {NtpTimeResult}
     */
      },
      {
        key: "getTime",
        value: async function getTime() {
          var force =
            arguments.length > 0 && arguments[0] !== undefined
              ? arguments[0]
              : false;

          if (
            !force &&
            lastPoll &&
            Date.now() - lastPoll <
              Math.pow(2, this.options.ntpDefaults.minPoll) * 1000
          ) {
            var _date = new Date();
            _date.setUTCMilliseconds(
              _date.getUTCMilliseconds() + lastResult.offset
            );

            return {
              now: _date,
              offset: lastResult.offset,
              precision: lastResult.precision
            };
          }

          // update time samples
          this.samples = await this.collectSamples(this.options.sampleCount);

          // calculate offset
          var offset =
            this.samples.reduce(function(acc, item) {
              return acc + item.offset;
            }, 0) / this.samples.length;

          var precision = NtpTimeSync.stdDev(
            this.samples.map(function(sample) {
              return sample.offset;
            })
          );

          lastResult = {
            offset: offset,
            precision: precision
          };
          lastPoll = Date.now();

          var date = new Date();
          date.setUTCMilliseconds(date.getUTCMilliseconds() + offset);

          return {
            now: date,
            offset: offset,
            precision: precision
          };
        }

        /**
     * Will return the correct timestamp when function was called
     * @param {Boolean} force
     * @return {Date}
     */
      },
      {
        key: "now",
        value: async function now() {
          var force =
            arguments.length > 0 && arguments[0] !== undefined
              ? arguments[0]
              : false;

          var now = new Date();
          var result = await this.getTime(force);

          now.setUTCMilliseconds(now.getUTCMilliseconds() + result.offset);
          return now;
        }

        /**
     * @param {String} string
     * @param {Integer} length
     * @param {String} char
     * @param {String} side
     * @private
     */
      },
      {
        key: "createPacket",

        /**
     * @param {Integer} leapIndicator, defaults to 3 (unsynchronized)
     * @param {Integer} ntpVersion, defaults to `options.ntpDefaults.version`
     * @param {Integer} mode, defaults to 3 (client)
     * @return {Buffer}
     * @private
     */
        value: function createPacket() {
          var leapIndicator =
            arguments.length > 0 && arguments[0] !== undefined
              ? arguments[0]
              : 3;
          var ntpVersion =
            arguments.length > 1 && arguments[1] !== undefined
              ? arguments[1]
              : null;
          var mode =
            arguments.length > 2 && arguments[2] !== undefined
              ? arguments[2]
              : 3;

          ntpVersion = ntpVersion || this.options.ntpDefaults.version;

          // generate NTP packet
          var ntpData = new Array(48).fill(0);

          ntpData[0] =
            // Leap indicator (= 3, unsynchronized)
            NtpTimeSync.pad((leapIndicator >>> 0).toString(2), 2) +
            // NTP version (= 4)
            NtpTimeSync.pad((ntpVersion >>> 0).toString(2), 3) +
            // client mode (= 3)
            NtpTimeSync.pad((mode >>> 0).toString(2), 3);

          ntpData[0] = parseInt(ntpData[0], 2);

          // origin timestamp
          var baseTime =
            new Date().getTime() -
            this.options.ntpDefaults.referenceDate.getTime();
          var seconds = baseTime / 1000;
          var ntpTimestamp = (seconds * Math.pow(2, 32)).toString(2);
          ntpTimestamp = NtpTimeSync.pad(ntpTimestamp, 64);

          // origin timestamp
          ntpData[24] = parseInt(ntpTimestamp.substr(0, 8), 2);
          ntpData[25] = parseInt(ntpTimestamp.substr(8, 8), 2);
          ntpData[26] = parseInt(ntpTimestamp.substr(16, 8), 2);
          ntpData[27] = parseInt(ntpTimestamp.substr(24, 8), 2);
          ntpData[28] = parseInt(ntpTimestamp.substr(32, 8), 2);
          ntpData[29] = parseInt(ntpTimestamp.substr(40, 8), 2);
          ntpData[30] = parseInt(ntpTimestamp.substr(48, 8), 2);
          ntpData[31] = parseInt(ntpTimestamp.substr(56, 8), 2);

          // transmit timestamp
          ntpData[40] = parseInt(ntpTimestamp.substr(0, 8), 2);
          ntpData[41] = parseInt(ntpTimestamp.substr(8, 8), 2);
          ntpData[42] = parseInt(ntpTimestamp.substr(16, 8), 2);
          ntpData[43] = parseInt(ntpTimestamp.substr(24, 8), 2);
          ntpData[44] = parseInt(ntpTimestamp.substr(32, 8), 2);
          ntpData[45] = parseInt(ntpTimestamp.substr(40, 8), 2);
          ntpData[46] = parseInt(ntpTimestamp.substr(48, 8), 2);
          ntpData[47] = parseInt(ntpTimestamp.substr(56, 8), 2);

          return Buffer.from(ntpData);
        }

        /**
     *
     * @param client
     * @private
     */
      },
      {
        key: "getNetworkTime",

        /**
     * @param {String} server
     * @param {Integer} port
     * @return {Promise|NTPPacket}
     */
        value: function getNetworkTime(server) {
          var _this3 = this;

          var port =
            arguments.length > 1 && arguments[1] !== undefined
              ? arguments[1]
              : 123;

          return new Promise(function(resolve, reject) {
            var client = dgram.createSocket("udp4");
            var hasFinished = false;

            var errorCallback = function errorCallback(err) {
              if (timeoutHandler) {
                clearTimeout(timeoutHandler);
                timeoutHandler = null;
              }

              if (hasFinished) {
                return;
              }

              NtpTimeSync.cleanup(client);

              hasFinished = true;
              reject(err);
            };

            client.on("error", function(err) {
              return errorCallback;
            });

            // setup timeout
            var timeoutHandler = setTimeout(function() {
              errorCallback(new Error("Timeout waiting for NTP response."));
            }, _this3.options.replyTimeout);

            client.send(_this3.createPacket(), port, server, function(err) {
              if (hasFinished) {
                return;
              }

              if (err) {
                errorCallback(err);
                return;
              }

              client.once("message", function(msg) {
                if (hasFinished) {
                  return;
                }

                clearTimeout(timeoutHandler);
                timeoutHandler = null;
                client.close();

                var result = _ntpPacketParser2.default.parse(msg);
                result.destinationTimestamp = new Date();

                hasFinished = true;
                resolve(result);
              });
            });
          });
        }

        /**
     * Test if response is acceptable for synchronization
     * @param {NTPPacket} data
     */
      },
      {
        key: "acceptResponse",
        value: function acceptResponse(data) {
          /*
       * Format error
       */
          if (data.version > this.options.ntpDefaults.version) {
            throw new Error(
              "Format error: Expected version " +
                this.options.ntpDefaults.version +
                ", got " +
                data.version
            );
          }

          /*
       * A stratum error occurs if (1) the server has never been
       * synchronized, (2) the server stratum is invalid.
       */
          if (
            data.leapIndicator === 3 ||
            data.stratum >= this.options.ntpDefaults.maxStratum
          ) {
            throw new Error("Stratum error: Remote clock is unsynchronized");
          }

          /*
       * Verify valid root distance.
       */
          var rootDelay =
            (data.rootDelay.getTime() -
              this.options.ntpDefaults.referenceDate.getTime()) /
            1000;
          var rootDispersion =
            (data.rootDispersion.getTime() -
              this.options.ntpDefaults.referenceDate.getTime()) /
            1000;
          if (
            rootDelay / 2 + rootDispersion >=
            this.options.ntpDefaults.maxDispersion
          ) {
            throw new Error("Distance error: Root distance too large");
          }

          /*
       * Verify origin timestamp
       */
          if (data.originTimestamp.getTime() > new Date().getTime()) {
            throw new Error(
              "Format error: Origin timestamp is from the future"
            );
          }
        }

        /**
     * Average for a list of numbers
     * @param {Array} values
     * @return {number}
     * @private
     */
      }
    ],
    [
      {
        key: "getInstance",
        value: function getInstance() {
          var options =
            arguments.length > 0 && arguments[0] !== undefined
              ? arguments[0]
              : undefined;

          if (!singleton) {
            singleton = new NtpTimeSync(options);
          }

          return singleton;
        }
      },
      {
        key: "pad",
        value: function pad(string, length) {
          var char =
            arguments.length > 2 && arguments[2] !== undefined
              ? arguments[2]
              : "0";
          var side =
            arguments.length > 3 && arguments[3] !== undefined
              ? arguments[3]
              : "left";

          if (side === "left") {
            return (
              char.repeat(length).substring(0, length - string.length) + string
            );
          }

          return (
            string + char.repeat(length).substring(0, length - string.length)
          );
        }
      },
      {
        key: "cleanup",
        value: function cleanup(client) {
          try {
            client.close();
          } catch (e) {
            // ignore, as we just want to cleanup
          }
        }
      },
      {
        key: "avg",
        value: function avg(values) {
          var sum = values.reduce(function(sum, value) {
            return sum + value;
          }, 0);

          return sum / values.length;
        }

        /**
     * Standard deviation for a list of numbers
     * @param {Array} values
     * @return {number}
     * @private
     */
      },
      {
        key: "stdDev",
        value: function stdDev(values) {
          var avg = this.avg(values);

          var squareDiffs = values.map(function(value) {
            var diff = value - avg;
            return diff * diff;
          });

          return Math.sqrt(this.avg(squareDiffs));
        }
      }
    ]
  );

  return NtpTimeSync;
})();

exports.default = NtpTimeSync;
