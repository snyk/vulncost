import {
  getPackages,
  TYPESCRIPT as TYPESCRIPT_LANG,
  JAVASCRIPT as JAVASCRIPT_LANG,
} from './parser';
import {
  getPackageInfo,
  clearPackageCache as _clearPackageCache,
} from './packageInfo';
import { EventEmitter } from 'events';
import finder from 'find-package-json';
import validate from 'validate-npm-package-name';

export const TYPESCRIPT = TYPESCRIPT_LANG;
export const JAVASCRIPT = JAVASCRIPT_LANG;
export const clearPackageCache = _clearPackageCache; // this is weird…

export function getImports(fileName, text, language) {
  const emitter = new EventEmitter();
  setTimeout(async () => {
    try {
      emitter.emit('package', finder(fileName).next().filename);
    } catch (e) {
      // noop
    }
    try {
      const imports = getPackages(fileName, text, language).filter(info => {
        if (info.name.startsWith('.')) {
          return false;
        }

        if (info.name.trim() == '') {
          return false;
        }

        if (info.name.includes('/') && !info.name.startsWith('@')) {
          // mutating…
          info.name = info.name.split('/').shift();
        }

        const valid = validate(info.name);

        if (valid.errors) {
          // invalid package name, so isn't real, so we'll bail
          return false;
        }

        return true;
      });
      emitter.emit('start', imports);
      const promises = imports
        .map(packageInfo => getPackageInfo(packageInfo))
        .map(promise =>
          promise.then(packageInfo => {
            emitter.emit('calculated', packageInfo);
            return packageInfo;
          })
        );
      const packages = await Promise.all(promises);
      emitter.emit('done', packages);
    } catch (e) {
      emitter.emit('error', e);
    }
  }, 0);
  return emitter;
}
