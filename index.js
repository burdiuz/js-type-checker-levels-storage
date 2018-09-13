'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var hasOwn_1 = createCommonjsModule(function (module, exports) {

Object.defineProperty(exports, '__esModule', { value: true });

const hasOwn = (
  (has) =>
  (target, property) =>
  Boolean(target && has.call(target, property))
)(Object.prototype.hasOwnProperty);

exports.hasOwn = hasOwn;
exports.default = hasOwn;
});

var hasOwn = unwrapExports(hasOwn_1);
var hasOwn_2 = hasOwn_1.hasOwn;

const REPORT_NEVER = 'never';
const REPORT_ONCE = 'once';
const REPORT_ALL = 'all';

const REPORT_KEY = Symbol('type-checkers:report-level');
const PROPERTY_REPORT_KEY = Symbol('type-checkers:property-report-level');

let globalReportingLevel = REPORT_ALL;

const validateReportingLevel = level => {
  switch (level) {
    case REPORT_NEVER:
    case REPORT_ONCE:
      return level;
    default:
      return REPORT_ALL;
  }
};

const setGlobalReportingLevel = level => {
  globalReportingLevel = validateReportingLevel(level);
};

const getGlobalReportingLevel = () => globalReportingLevel;

const setTargetGeneralReportingLevel = (target, level) => {
  if (level) {
    target[REPORT_KEY] = validateReportingLevel(level);
  } else {
    delete target[REPORT_KEY];
  }
};

const setTargetPropertyReportingLevel = (target, perPropertyLevels) => {
  if (!perPropertyLevels) {
    delete target[PROPERTY_REPORT_KEY];
    return;
  }

  target[PROPERTY_REPORT_KEY] = Object.keys(perPropertyLevels).reduce((levels, prop) => {
    levels[prop] = validateReportingLevel(perPropertyLevels[prop]);
    return levels;
  }, {});
};

const setReportingLevel = (target, generalLevel, perPropertyLevels) => {
  setTargetGeneralReportingLevel(target, generalLevel);
  setTargetPropertyReportingLevel(target, perPropertyLevels);
};

const getTargetReportingLevel = (target, key) => {
  if (hasOwn(target[PROPERTY_REPORT_KEY], key)) {
    return target[PROPERTY_REPORT_KEY][key];
  }

  return target[REPORT_KEY];
};

const getReportingLevel = (target, key) => {
  let level = getTargetReportingLevel(target, key);

  if (!level) {
    level = getTargetReportingLevel(target.constructor, key);
  }

  return level || getGlobalReportingLevel();
};

const createTypesStorage = () => new Map();

/**
 *
 * @param {Map} storage
 */
const hasTypeInformation = (storage, key) => {
  const info = storage.get(key);

  return info && info.length;
};

/**
 *
 * @param {Map} storage
 * @param {*} key
 * @param {Function} callback
 */
const getTypeInformation = (storage, key, callback) => {
  const info = storage.get(key);

  if (info) {
    info.forEach(types => callback(key, types));
  }
};

/**
 *
 * @param {Map} storage
 * @param {*} key
 * @param {*} types
 * @param {Number} level
 */
const storeTypeInformation = (storage, key, types, level) => {
  if (!types) return;

  switch (level) {
    case REPORT_NEVER:
      // storage.delete(key); // do we need this?
      break;
    case REPORT_ONCE:
      storage.delete(key);
      storage.set(key, [types]);
      break;
    case REPORT_ALL:
    default:
      {
        const info = storage.get(key);
        if (info) {
          info.push(types);
        } else {
          storage.set(key, [types]);
        }
      }
      break;
  }
};

const storeTypeInformationFor = (storage, target, key, types) => storeTypeInformation(storage, key, types, getReportingLevel(target, key));

exports.REPORT_ALL = REPORT_ALL;
exports.REPORT_NEVER = REPORT_NEVER;
exports.REPORT_ONCE = REPORT_ONCE;
exports.createTypesStorage = createTypesStorage;
exports.getTypeInformation = getTypeInformation;
exports.hasTypeInformation = hasTypeInformation;
exports.storeTypeInformation = storeTypeInformation;
exports.storeTypeInformationFor = storeTypeInformationFor;
exports.getGlobalReportingLevel = getGlobalReportingLevel;
exports.setGlobalReportingLevel = setGlobalReportingLevel;
exports.getReportingLevel = getReportingLevel;
exports.setReportingLevel = setReportingLevel;
//# sourceMappingURL=index.js.map
