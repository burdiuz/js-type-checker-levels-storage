import hasOwn from '@actualwave/has-own';

export const REPORT_NEVER = 'never';
export const REPORT_ONCE = 'once';
export const REPORT_ALL = 'all';

const REPORT_KEY = Symbol('type-checkers:report-level');
const PROPERTY_REPORT_KEY = Symbol('type-checkers:property-report-level');

let globalReportingLevel = REPORT_ALL;

const validateReportingLevel = (level) => {
  switch (level) {
    case REPORT_NEVER:
    case REPORT_ONCE:
      return level;
    default:
      return REPORT_ALL;
  }
};

export const setGlobalReportingLevel = (level) => {
  globalReportingLevel = validateReportingLevel(level);
};

export const getGlobalReportingLevel = () => globalReportingLevel;

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

  target[PROPERTY_REPORT_KEY] = Object.keys(perPropertyLevels).reduce(
    (levels, prop) => {
      levels[prop] = validateReportingLevel(perPropertyLevels[prop]);
      return levels;
    },
    {}
  );
};

export const setReportingLevel = (target, generalLevel, perPropertyLevels) => {
  setTargetGeneralReportingLevel(target, generalLevel);
  setTargetPropertyReportingLevel(target, perPropertyLevels);
};

const getTargetReportingLevel = (target, key) => {
  if (hasOwn(target[PROPERTY_REPORT_KEY], key)) {
    return target[PROPERTY_REPORT_KEY][key];
  }

  return target[REPORT_KEY];
};

export const getReportingLevel = (target, key) => {
  let level = getTargetReportingLevel(target, key);

  if (!level) {
    level = getTargetReportingLevel(target.constructor, key);
  }

  return level || getGlobalReportingLevel();
};
