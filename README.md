# Type Checker Levels Storage
Part of [Primitive Type Checker](https://github.com/burdiuz/js-primitive-type-checker), basically its a [Map of Sets](https://github.com/burdiuz/js-map-of-sets) made to store type information. It stores list of all types applied to property and can return the list or check if type is in list.


## Installation

Via NPM
```bash
npm install @actualwave/type-checker-levels-storage --save
```
Or Yarn
```bash
yarn add @actualwave/type-checker-levels-storage
```


## How to use

Use factory function to create an instance of storage:
```javascript
import { createTypesStorage } from '@actualwave/type-checker-levels-storage';

const storage = createTypesStorage();

storage.add('myNumProp', REPORT_ONCE, 'number');
storage.add('myObjProp', REPORT_ONCE, Object);
```
> For Primitive Type Checker its instantiated automatically for each wrapped object, so no need to create instances manually.

To merge storages, `copyTo()` function is used, developer may use optional third argument to pass custom merge strategy. Its used for merging Sets of properties that have type information in each storage. Default merge strategy simply combines sets.
```javascript
const myMergeStrategy = (key, target, source) => {
	// copy source data to target Set
	return target;
}

sourceStorage.copyTo(targetStorage, null, myMergeStrategy);
```

Additionally, developer may specify how to store types on global level, for entire object or for specific property. To do so, use Report Levels:
```javascript
import {
	setGlobalReportingLevel,
	setReportingLevel,
	REPORT_NEVER,
	REPORT_ONCE,
	REPORT_ALL
} from '@actualwave/type-checker-levels-storage';

setGlobalReportingLevel(REPORT_NONE);

const obj = { mysteriousProp: '1' };

setReportingLevel(obj, REPORT_ONCE, {
	mysteriousProp: REPORT_ALL,
});
```
When storing type information for `obj`, all type information will be stored for every property except `mysteriousProp`, for it stored will be last type only.

Report levels:
 * **REPORT_NEVER** -- do not store type information
 * **REPORT_ONCE** -- store every type
 * **REPORT_ALL** -- store one type, next stored type will clear information about previous

> Written with [StackEdit](https://stackedit.io/).
