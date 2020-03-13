import snykAPI, { isAuthed } from './snykAPI';
import axios from 'axios';
import logger from '../logger';

const API_ROOT = 'https://snyk.io/api/v1/vuln/npm/';

function testNoAuth(key) {
  return axios
    .get(`https://snyk.io/test/npm/${key}?type=json`)
    .then(({ data }) => {
      if (typeof data === 'string') {
        // bug on snyk's side, returning a string for 404
        logger.log('bad return on ' + key);
        return null;
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
  const url = API_ROOT + encodedName;
  return axios
    .get(url, {
      headers: {
        'x-is-ci': false,
        authorization: 'token ' + snykAPI,
      },
    })
    .then(res => {
      const packageName = decodeURIComponent(
        res.request.res.responseUrl.replace(API_ROOT, '')
      );

      const vulns = res.data.vulnerabilities || [];
      return {
        ...res.data,
        packageName,
        count: vulns.length,
        fixable: vulns.reduce((acc, curr) => {
          if (acc) return acc;
          if (curr.isUpgradable) return true;
          return false;
        }, false),
      };
    });
}

export default function test(pkg) {
  if (isAuthed()) {
    return testWithAuth(pkg);
  } else {
    return testNoAuth(`${pkg.name}/${pkg.version}`);
  }
}
