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
export const defaultMergeStrategy = (key, target, source) => {
  source.forEach((type) => {
    if (!target.has(type)) {
      target.add(type);
    }
  });

  return target;
};

class MapOfSetsStorage {
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
   *
   * @param {*} key
   * @param {Function} callback
   */
  get(key, callback) {
    const values = this.storage.get(key);

    if (values) {
      values.forEach((type) => callback(type, key, this));
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
    const target = new MapOfSetsStorage();
    this.storage.forEach((values, key) => target.set(key, new Set(values)));

    return target;
  }
}

class TypeInfoStorage extends MapOfSetsStorage {
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

export const createTypesStorage = () => new TypeInfoStorage();

export default TypeInfoStorage;
