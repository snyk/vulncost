import { dirname, join } from 'path';
import finder from 'find-package-json';
import test from './testVuln';
import logger from '../logger';

import { DebounceError, debouncePromise } from './debouncePromise';
import report from '../report';
import axios from 'axios';

let cache = {};
let vulnCache = {};
const projectCache = {};

export async function getPackageKey(pkg) {
  if (pkg.version && pkg.name) {
    return { name: pkg.name, version: pkg.version };
  }

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
  // then it means it's not locally installed, so let's get the version from the
  // npm registry
  if (!packageInfo.name || !packageInfo.name.toLowerCase().startsWith(name)) {
    try {
      const res = await axios.get(`https://registry.npmjs.org/${name}`);
      const version = res.data['dist-tags']['latest'];

      return { name, version };
    } catch (err) {
      return {
        name,
        version: 'latest',
      };
    }
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
    if (pkg.string) {
      cache[pkg.string] = cache[pkg.string] || (await getPackageKey(pkg));
    } else {
      cache[pkg.string] = await getPackageKey(pkg);
    }
  } catch (e) {
    logger.log(e.message);
    return pkg;
  }

  const key = keyed(cache[pkg.string]);
  logger.log('query ' + key);

  if (vulnCache[key] === undefined || vulnCache[key] instanceof Promise) {
    try {
      vulnCache[key] = vulnCache[key] || lookupVulns(key, cache[pkg.string]);
      vulnCache[key] = await vulnCache[key];
      logger.log('vuln test complete for ' + key);
      const reportSummary = report(key, vulnCache[key]);
      vulnCache[key].reportSummary = reportSummary;
      if (!vulnCache[key].ok) logger.print(reportSummary);
    } catch (e) {
      logger.log(`try on vuln test failed: ${e.message}`);
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
  return debouncePromise(
    key,
    (resolve, reject) => {
      test(pkg)
        .then(resolve)
        .catch(reject);
    },
    2000
  );
}
