import { dirname, join } from 'path';
import finder from 'find-package-json';
import test from './testVuln';

import { DebounceError, debouncePromise } from './debouncePromise';

let cache = {};
let vulnCache = {};
const projectCache = {};

export function getPackageKey(pkg) {
  let dir = projectCache[pkg.fileName];

  if (!dir) {
    const f = finder(pkg.fileName);
    dir = dirname(f.next().filename);
    projectCache[pkg.fileName] = dir;
  }

  const name = pkg.name;

  const f = finder(join(dir, 'node_modules', name));
  let packageInfo = f.next().value;

  // if the package doesn't start with the package name we were looking for
  // then it means it's not locally installed, so let's assume they're going
  // to install and set version to "latest"
  if (!packageInfo.name || !packageInfo.name.toLowerCase().startsWith(name)) {
    packageInfo = {
      name,
      version: 'latest',
    };
  }

  return { name: packageInfo.name, version: packageInfo.version };
}

function keyed(packageInfo) {
  return `${packageInfo.name}@${packageInfo.version}`;
}

export function clearPackageCache() {
  cache = {};
  vulnCache = {};
}

export function getPackageFromCache(key) {
  return vulnCache[key];
}

export async function getPackageInfo(pkg) {
  try {
    cache[pkg.string] = cache[pkg.string] || getPackageKey(pkg);
  } catch (e) {
    return pkg;
  }

  const key = keyed(cache[pkg.string]);

  if (vulnCache[key] === undefined || vulnCache[key] instanceof Promise) {
    try {
      vulnCache[key] = vulnCache[key] || lookupVulns(key, cache[pkg.string]);
      vulnCache[key] = await vulnCache[key];
    } catch (e) {
      if (e === DebounceError) {
        delete vulnCache[key];
        throw e;
      } else {
        vulnCache[key] = {};
        return { ...pkg, vulns: vulnCache[key], error: e };
      }
    }
  }
  return { ...pkg, vulns: vulnCache[key] };
}

export default function lookupVulns(key, pkg) {
  return debouncePromise(key, (resolve, reject) => {
    test(pkg)
      .then(resolve)
      .catch(reject);
  });
}
