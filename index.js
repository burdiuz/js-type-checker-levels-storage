'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var hasOwn = _interopDefault(require('@actualwave/has-own'));

/**
 * Do not check or report type inconsistency
 */
const REPORT_NEVER = 'never';
/**
 * Report type inconsistency once, i.e. record all types and report new
 */
const REPORT_ONCE = 'once';
/**
 * Report whenever type is inconsistent with initial
 */
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

/**
 *
 * @param {any} key
 * @param {Set} target
 * @param {Set} source
 */
const defaultMergeStrategy = (key, target, source) => {
  source.forEach(type => {
    if (!target.has(type)) {
      target.add(type);
    }
  });

  return target;
};

class MapOfSets {
  constructor() {
    this.storage = new Map();
  }

  has(key) {
    const values = this.storage.get(key);

    return values && values.size;
  }

  hasValue(key, value) {
    const values = this.storage.get(key);

    return values && values.has(value);
  }

  /**
   * @param {*} key
   */
  get(key) {
    return this.storage.get(key);
  }

  /**
   * @param {Function} callback
   */
  forEach(callback) {
    this.storage.forEach((values, key) => values.forEach(value => callback(value, key, this)));
  }

  /**
   * @param {*} key
   * @param {Function} callback
   */
  eachValue(key, callback) {
    const values = this.storage.get(key);

    if (values) {
      values.forEach(value => callback(value, key, this));
    }
  }

  /**
   * Add to type information for specified key.
   * @param {*} key
   * @param {*} value
   * @param {Number} level
   */
  add(key, value) {
    if (!value) return;
    const values = this.storage.get(key);

    if (values) {
      values.add(value);
    } else {
      this.storage.set(key, new Set([value]));
    }
  }

  /**
   * Replace values information for specific key
   * @param {*} key
   * @param {Set} types
   * @param {Number} level
   */
  set(key, values) {
    if (!values || values.size === 0) {
      this.remove(key);
      return;
    }

    this.storage.set(key, new Set(values));
  }

  remove(key) {
    this.storage.delete(key);
  }

  removeValue(key, value) {
    const values = this.storage.get(key);

    if (values) {
      values.delete(value);

      if (!values.size) {
        this.remove(key);
      }
    }
  }

  clone() {
    const target = new MapOfSets();
    this.storage.forEach((values, key) => target.set(key, new Set(values)));

    return target;
  }
}

class TypeInfoStorage extends MapOfSets {
  /**
   * Add to type information for specified key.
   * @param {*} key
   * @param {*} type
   * @param {Number} level
   */
  add(key, type, level) {
    if (!type) return;

    switch (level) {
      case REPORT_NEVER:
        this.remove(key);
        break;
      case REPORT_ONCE:
        super.add(key, type);
        break;
      case REPORT_ALL:
      default:
        {
          const types = this.storage.get(key);

          if (!types || !types.size) {
            this.storage.set(key, new Set([type]));
          }
        }
        break;
    }
  }

  addFor(key, type, target) {
    this.add(key, type, getReportingLevel(target, key));
  }

  /**
   * Replace types information for specific key
   * @param {*} key
   * @param {Set} types
   * @param {Number} level
   */
  set(key, types, level) {
    if (!types || types.size === 0 || level === REPORT_NEVER) {
      this.remove(key);
      return;
    }

    super.set(key, types);
  }

  /**
   *
   * @param {*} key
   * @param {Set} types
   * @param {Object} target
   */
  setFor(key, types, target) {
    return this.set(key, types, getReportingLevel(target, key));
  }

  clone() {
    const target = new TypeInfoStorage();
    this.storage.forEach((types, key) => target.set(key, new Set(types)));

    return target;
  }

  /**
   * Copy types from current storage to storage passed as first argument.
   * @param {Map} storage
   * @param {Object} [target]
   * @param {Function} [mergeStrategy]
   */
  copyTo(storage, target, mergeStrategy = defaultMergeStrategy) {
    this.storage.forEach((types, key) => {
      const level = validateReportingLevel(target && getReportingLevel(target, key));

      switch (level) {
        case REPORT_ALL:
        case REPORT_ONCE:
          if (storage.has(key)) {
            storage.set(key, mergeStrategy(key, storage.get(key), types, level), level);
          } else {
            storage.set(key, new Set(types));
          }
          break;
        case REPORT_NEVER:
        default:
          break;
      }
    });

    return storage;
  }
}

const createTypesStorage = () => new TypeInfoStorage();

exports.REPORT_ALL = REPORT_ALL;
exports.REPORT_NEVER = REPORT_NEVER;
exports.REPORT_ONCE = REPORT_ONCE;
exports.createTypesStorage = createTypesStorage;
exports.defaultMergeStrategy = defaultMergeStrategy;
exports.getGlobalReportingLevel = getGlobalReportingLevel;
exports.setGlobalReportingLevel = setGlobalReportingLevel;
exports.getReportingLevel = getReportingLevel;
exports.setReportingLevel = setReportingLevel;
//# sourceMappingURL=index.js.map
