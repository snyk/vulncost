import { isAuthed, getToken } from './snykAPI';
import axios from 'axios';
import logger from '../logger';
import utm from '../utm';
import statistics from '../statistics';

const API_ROOT = 'https://snyk.io/api/v1/vuln/npm/';

function testNoAuth(key) {
  return axios
    .get(`https://snyk.io/test/npm/${key}?${utm}&type=json`)
    .then(({ data }) => {
      if (typeof data === 'string') {
        // bug on snyk's side, returning a string for 404
        logger.log('bad return on ' + key);
        throw new Error('bad return from snyk api (unauthed)');
      }

      return {
        ok: data.totalVulns === 0,
        packageName: data.resultTitle,
        count: data.totalVulns,
      };
    });
}

function testWithAuth(pkg) {
  const encodedName = encodeURIComponent(pkg.name + '@' + pkg.version);
  // options.vulnEndpoint is only used by `snyk protect` (i.e. local filesystem tests)
  const url = API_ROOT + encodedName + '?' + utm;
  return axios
    .get(url, {
      headers: {
        'x-is-ci': false,
        authorization: 'token ' + getToken(),
      },
    })
    .then(res => {
      const packageName = decodeURIComponent(
        res.request.res.responseUrl.replace(API_ROOT, '')
      ).replace(/\?.*$/, '');

      const vulns = res.data.vulnerabilities || [];

      const uniqBasedOnId = new Set();
      vulns.forEach(v => uniqBasedOnId.add(v.id));

      return {
        ...res.data,
        packageName,
        count: uniqBasedOnId.size,
        fixable: vulns.reduce((acc, curr) => {
          if (acc) return acc;
          if (curr.isUpgradable) return true;
          return false;
        }, false),
      };
    })
    .catch(e => {
      logger.log(`${url} failed with ${e.message}`);
      throw e;
    });
}

export default function test(pkg) {
  logger.log(`testing ${pkg.name}@${pkg.version}`);
  statistics.sendTest(`${pkg.name}@${pkg.version} - authed: ${isAuthed()}`);
  if (isAuthed()) {
    return testWithAuth(pkg);
  } else {
    return testNoAuth(`${pkg.name}/${pkg.version}`);
  }
}
