# ntp-time-sync
Fetches the current time from NTP servers and returns offset information

## Installation
```bash
# using Yarn
$ yarn add ntp-time-sync

# using NPM
$ npm install ntp-time-sync
```

## Usage
Consider using the library as a singleton, so that not every call to `getTime` fires new NTP packages.
The library itself will manage minimum/maximum poll times.

Several requests to multiple NTP time servers are fired and the responses will be aggregated.

```js
const timeSync = NtpTimeSync.getInstance();

// request 1
timeSync.getTime().then(function (result) {
  console.log("current system time", new Date());
  console.log("real time", result.now);
  console.log("offset in milliseconds", result.offset);
})

// request 2, will use cached offset from previous request
timeSync.getTime().then(function (result) {
  console.log("current system time", new Date());
  console.log("real time", result.now);
  console.log("offset in milliseconds", result.offset);
})

// ES2017 style
const result = await timeSync.getTime();
console.log("real time", result.now);
```

`<ntpTimeSyncInstance>.getTime()` returns a `Promise` object which will eventually be resolved with a object containing the following information:

| Property | Description |
| :--- | :--- |
| `now` | Current NTP time ("real time") |
| `offset` | Calculated offset between local system time and NTP time |
 
`<ntpTimeSyncInstance>.now()` returns a `Date` object containing the correct time for the moment when the function was called.
In contrast to `getTime()`, which will return the correct time for the moment the Promise gets resolved. 

## Options
You can pass custom options to the constructor of `NtpTimeSync` or `NtpTimeSync.getInstance(options)`.
These will be merged with the following defaults:

```js
const defaultOptions = {
  // list of NTP time servers, optionally including a port (defaults to 123)
  servers: [
    "0.pool.ntp.org",
    "1.pool.ntp.org",
    "2.pool.ntp.org",
    "3.pool.ntp.org"
  ],

  // required amount of valid samples in order to calculate the time
  sampleCount: 8,

  // amount of time in milliseconds to wait for a single NTP response
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
```