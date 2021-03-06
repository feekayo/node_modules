# Changelog

[npm history][1]

[1]: https://www.npmjs.com/package/nodejs-promisify?activeTab=versions

### [1.0.2](https://www.github.com/googleapis/nodejs-promisify/compare/v1.0.1...v1.0.2) (2019-06-26)


### Bug Fixes

* **docs:** link to reference docs section on googleapis.dev ([#128](https://www.github.com/googleapis/nodejs-promisify/issues/128)) ([5a8bd90](https://www.github.com/googleapis/nodejs-promisify/commit/5a8bd90))

### [1.0.1](https://www.github.com/googleapis/nodejs-promisify/compare/v1.0.0...v1.0.1) (2019-06-14)


### Bug Fixes

* **docs:** move to new client docs URL ([#124](https://www.github.com/googleapis/nodejs-promisify/issues/124)) ([34d18cd](https://www.github.com/googleapis/nodejs-promisify/commit/34d18cd))

## [1.0.0](https://www.github.com/googleapis/nodejs-promisify/compare/v0.4.0...v1.0.0) (2019-05-02)


### Build System

* upgrade engines field to >=8.10.0 ([#108](https://www.github.com/googleapis/nodejs-promisify/issues/108)) ([78ab89c](https://www.github.com/googleapis/nodejs-promisify/commit/78ab89c))


### BREAKING CHANGES

* upgrade engines field to >=8.10.0 (#108)

## v0.4.0

02-12-2019 19:44 PST

### New features
- feat: add callbackify() and callbackifyAll() methods ([#82](https://github.com/googleapis/nodejs-promisify/pull/82))

### Documentation
- docs: update contributing path in README ([#86](https://github.com/googleapis/nodejs-promisify/pull/86))
- chore: move CONTRIBUTING.md to root ([#85](https://github.com/googleapis/nodejs-promisify/pull/85))
- docs: add lint/fix example to contributing guide ([#83](https://github.com/googleapis/nodejs-promisify/pull/83))

### Internal / Testing Changes
- build: create docs test npm scripts ([#88](https://github.com/googleapis/nodejs-promisify/pull/88))
- build: test using @grpc/grpc-js in CI ([#87](https://github.com/googleapis/nodejs-promisify/pull/87))
- build: ignore googleapis.com in doc link check ([#81](https://github.com/googleapis/nodejs-promisify/pull/81))
- build: check broken links in generated docs ([#79](https://github.com/googleapis/nodejs-promisify/pull/79))
- chore(deps): update dependency @types/sinon to v7 ([#78](https://github.com/googleapis/nodejs-promisify/pull/78))
- chore(build): inject yoshi automation key ([#77](https://github.com/googleapis/nodejs-promisify/pull/77))
- chore: update nyc and eslint configs ([#76](https://github.com/googleapis/nodejs-promisify/pull/76))
- chore: fix publish.sh permission +x ([#74](https://github.com/googleapis/nodejs-promisify/pull/74))
- fix(build): fix Kokoro release script ([#73](https://github.com/googleapis/nodejs-promisify/pull/73))
- build: add Kokoro configs for autorelease ([#72](https://github.com/googleapis/nodejs-promisify/pull/72))
- chore: always nyc report before calling codecov ([#69](https://github.com/googleapis/nodejs-promisify/pull/69))
- chore: nyc ignore build/test by default ([#68](https://github.com/googleapis/nodejs-promisify/pull/68))
- chore(build): update prettier config ([#66](https://github.com/googleapis/nodejs-promisify/pull/66))
- fix: get the build passing ([#65](https://github.com/googleapis/nodejs-promisify/pull/65))
- chore: update license file ([#64](https://github.com/googleapis/nodejs-promisify/pull/64))
- fix(build): fix system key decryption ([#60](https://github.com/googleapis/nodejs-promisify/pull/60))
- chore(deps): update dependency @types/sinon to v5.0.7 ([#58](https://github.com/googleapis/nodejs-promisify/pull/58))
- fix: Pin @types/sinon to last compatible version ([#57](https://github.com/googleapis/nodejs-promisify/pull/57))
- chore: add synth.metadata
- chore(deps): update dependency gts to ^0.9.0 ([#54](https://github.com/googleapis/nodejs-promisify/pull/54))
- chore: update eslintignore config ([#53](https://github.com/googleapis/nodejs-promisify/pull/53))
- chore: use latest npm on Windows ([#52](https://github.com/googleapis/nodejs-promisify/pull/52))
- chore: update CircleCI config ([#51](https://github.com/googleapis/nodejs-promisify/pull/51))
- chore: include build in eslintignore ([#48](https://github.com/googleapis/nodejs-promisify/pull/48))
- chore: update issue templates ([#44](https://github.com/googleapis/nodejs-promisify/pull/44))
- chore: remove old issue template ([#42](https://github.com/googleapis/nodejs-promisify/pull/42))
- build: run tests on node11 ([#41](https://github.com/googleapis/nodejs-promisify/pull/41))
- chores(build): do not collect sponge.xml from windows builds ([#40](https://github.com/googleapis/nodejs-promisify/pull/40))
- chores(build): run codecov on continuous builds ([#39](https://github.com/googleapis/nodejs-promisify/pull/39))
- chore: update new issue template ([#38](https://github.com/googleapis/nodejs-promisify/pull/38))
- chore(deps): update dependency sinon to v7 ([#33](https://github.com/googleapis/nodejs-promisify/pull/33))
- build: fix codecov uploading on Kokoro ([#34](https://github.com/googleapis/nodejs-promisify/pull/34))
- Update kokoro config ([#30](https://github.com/googleapis/nodejs-promisify/pull/30))
- Update CI config ([#28](https://github.com/googleapis/nodejs-promisify/pull/28))
- Don't publish sourcemaps ([#26](https://github.com/googleapis/nodejs-promisify/pull/26))
- Update kokoro config ([#24](https://github.com/googleapis/nodejs-promisify/pull/24))
- test: remove appveyor config ([#23](https://github.com/googleapis/nodejs-promisify/pull/23))
- Update CI config ([#22](https://github.com/googleapis/nodejs-promisify/pull/22))
- Enable prefer-const in the eslint config ([#21](https://github.com/googleapis/nodejs-promisify/pull/21))
- Enable no-var in eslint ([#19](https://github.com/googleapis/nodejs-promisify/pull/19))
- Update CI config ([#18](https://github.com/googleapis/nodejs-promisify/pull/18))

## v0.3.1

### Internal / Testing Changes
- Add synth script and update CI (#14)
- chore(deps): update dependency nyc to v13 (#12)
- chore: ignore package-lock.json (#11)
- chore(deps): lock file maintenance (#10)
- chore: update renovate config (#9)
- remove that whitespace (#8)
- chore(deps): lock file maintenance (#7)
- chore(deps): update dependency typescript to v3 (#6)
- chore: assert.deelEqual => assert.deepStrictEqual (#5)
- chore: move mocha options to mocha.opts (#4)
- chore(deps): update dependency gts to ^0.8.0 (#1)
- chore(deps): lock file maintenance (#3)
- chore(deps): lock file maintenance (#2)
