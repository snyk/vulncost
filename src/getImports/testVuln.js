import axios from 'axios';
import logger from '../logger';
import statistics from '../statistics';
import utm from '../utm';
import { getToken, isAuthed } from './snykAPI';

function testNoAuth(key) {
  return axios
    .get(`https://snyk.io/test/npm/${key}?${utm}&type=json`)
    .then(({ data }) => {
      if (typeof data === 'string') {
        // bug on snyk's side, returning a string for 404
        logger.log(`bad return on ${key}`);
        throw new Error('bad return from snyk api (unauthed)');
      }

      return {
        ok: data.totalVulns === 0,
        packageName: data.resultTitle,
        count: data.totalVulns,
      };
    });
}

function testWithAuth({ name, version }) {
  const encodedName = encodeURIComponent(name);
  const url = `https://snyk.io/api/v1/test/npm/${encodedName}/${version}?${utm}`;

  return axios
    .get(url, {
      headers: {
        'x-is-ci': false,
        authorization: `token ${getToken()}`,
      },
    })
    .then(res => {
      const vulnerabilities = res.data.issues.vulnerabilities || [];
      const uniqBasedOnId = new Set();
      vulnerabilities.forEach(v => uniqBasedOnId.add(v.id));
      const fixable = vulnerabilities.some(({ isUpgradable }) => isUpgradable);

      return {
        vulnerabilities,
        packageName: `${name}@${version}`,
        count: uniqBasedOnId.size,
        fixable,
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
