import report, { summary } from "../src/report"

describe('summary', () => {
  it('should return a well formatted string', () => {
    expect(summary({vulns: {
      vulnerabilities: [
        {
          severity: 'high',
        },
        {
          severity: 'medium',
        },
        {
          severity: 'low',
        }
      ]
    }})).toBe('1 high, 1 medium, 1 low');
  })

  it.each([['critical'], ['high'], ['medium'], ['low']])(
    'supports %s severity',
    severity => {
      expect(
        summary({
          vulns: {
            vulnerabilities: [
              {
                severity,
              },
            ],
          },
        })
      ).toBe(`1 ${severity}`);
    }
  );
})

describe('report', () => {
  it('should return a well formatted report', () => {

    expect(
      report('goof@1.0.1', {
        vulnerabilities: [
          {
            id: 'UNIQ-VULN-ID',
            title: 'my-first-pkg',
            severity: 'low',
            upgradePath: [],
            from: ['loaded-via-pkg'],
          },
        ],
      })
    ).toMatchSnapshot();
  })

  it.each([['critical'], ['high'], ['medium'], ['low']])(
    'supports %s severity',
    severity => {
      expect(
        summary({
          vulns: {
            vulnerabilities: [
              {
                severity,
              },
            ],
          },
        })
      ).toContain(`${severity}`);
    }
  );
})
