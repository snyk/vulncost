const sort = ['high', 'medium', 'low'];
const sortBy = (a, b) => {
  return sort.indexOf(a.severity) - sort.indexOf(b.severity);
};
const ucFirst = _ => `${_[0].toUpperCase()}${_.slice(1)}`;

/**
 *
 * @param {string} tested Tested module in format package@version
 * @param {data} data Vulnerability data via test/api
 */
export default function report(tested, data) {
  const dedupe = [];

  if (!data.vulnerabilities) {
    return '';
  }

  const res = data.vulnerabilities.map(
    ({ severity, upgradePath, title, from, id }) => {
      return {
        id,
        severity,
        upgradePath,
        remediation: upgradePath[0],
        title,
        from: from.pop(),
        direct: upgradePath.length === 1,
      };
    }
  ).filter(({ id }) => {
    if (!dedupe.includes(id)) {
      dedupe.push(id);
      return true;
    }
  });

  const direct = res
    .filter(_ => _.direct)
    .sort()
    .sort(sortBy);
  const indirect = res.filter(_ => _.direct === false).sort(sortBy);

  const remediation = res
    .map(_ => _.remediation)
    .sort()
    .pop();

  const lines = ['', `=== ${tested} ===`, ''];

  if (direct.length) {
    lines.push(
      'Direct:',
      direct.map(_ => `${ucFirst(_.severity)} ${_.title}\n- https://snyk.io/vuln/${_.id}`).join('\n'),
      ''
    );
  }

  if (indirect.length) {
    lines.push(
      'Indirect:',
      indirect
        .map(_ => `${ucFirst(_.severity)} ${_.title} in ${_.from}\n- https://snyk.io/vuln/${_.id}`)
        .join('\n'),
      ''
    );
  }

  if (remediation) {
    lines.push('Possible remediation:', remediation);
  } else {
    lines.push('No remediation available.');
  }

  return lines.join('\n');
}

// report('webpack@4.39.0', require('../../test/fixtures/webpack.json')) // ?
