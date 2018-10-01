import {
  REPORT_NEVER,
  REPORT_ONCE,
  REPORT_ALL,
  getReportingLevel,
  validateReportingLevel,
} from './levels';

/**
 *
 * @param {any} key
 * @param {Set} target
 * @param {Set} source
 */
const defaultMergeStrategy = (key, target, source) => {
  if (!source || !target) {
    return source || target;
  }

  source.forEach((type) => {
    if (!target.has(type)) {
      target.add(type);
    }
  });

  return target;
};

class TypeInfoStorage {
  constructor() {
    this.storage = new Map();
  }

  has(key) {
    const info = this.storage.get(key);

    return info && info.size;
  }

  hasType(key, type) {
    const info = this.storage.get(key);

    return info && info.has(type);
  }

  /**
   *
   * @param {*} key
   * @param {Function} callback
   */
  get(key, callback) {
    const info = this.storage.get(key);

    if (info) {
      info.forEach((type) => callback(key, type));
    }
  }

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
        this.storage.delete(key);
        break;
      case REPORT_ONCE:
        {
          const types = this.storage.get(key);

          if (types) {
            if (!types.has(type)) {
              types.add(type);
            }
          } else {
            this.storage.set(key, new Set([type]));
          }
        }
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
      this.storage.delete(key);
      return;
    }

    this.storage.set(key, types);
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

export const createTypesStorage = () => new TypeInfoStorage();

export default TypeInfoStorage;
