import { REPORT_NEVER, REPORT_ONCE, REPORT_ALL, getReportingLevel } from './levels';

export const createTypesStorage = () => new Map();

/**
 *
 * @param {Map} storage
 */
export const hasTypeInformation = (storage, key) => {
  const info = storage.get(key);

  return info && info.length;
};

/**
 *
 * @param {Map} storage
 * @param {*} key
 * @param {Function} callback
 */
export const getTypeInformation = (storage, key, callback) => {
  const info = storage.get(key);

  if (info) {
    info.forEach((types) => callback(key, types));
  }
};

/**
 *
 * @param {Map} storage
 * @param {*} key
 * @param {*} types
 * @param {Number} level
 */
export const storeTypeInformation = (storage, key, types, level) => {
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

export const storeTypeInformationFor = (storage, target, key, types) =>
  storeTypeInformation(storage, key, types, getReportingLevel(target, key));
