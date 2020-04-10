import { getPackages } from '../../src/getImports/htmlParser';

const testScenarios = [
  {
    name: 'jQuery',
    url: 'https://code.jquery.com/jquery-3.3.1.min.js',
    package: 'jquery',
    version: '3.3.1',
  },
  {
    name: 'ASP net CDN',
    url: 'https://ajax.aspnetcdn.com/ajax/jquery/jquery-3.2.1.min.js',
    package: 'jquery',
    version: '3.2.1',
  },
  {
    name: 'Stackpath',
    url:
      'https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js',
    package: 'bootstrap',
    version: '4.4.1',
  },
  {
    name: 'MaxCDN',
    url: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js',
    package: 'bootstrap',
    version: '3.3.7',
  },
  {
    name: 'yandex',
    url: 'https://yastatic.net/jquery/3.3.1/jquery.min.js',
    package: 'jquery',
    version: '3.3.1',
  },
  {
    name: 'unpkg.com',
    url: 'https://unpkg.com/jquery@3.3.1/dist/jquery.js',
    package: 'jquery',
    version: '3.3.1',
  },
  {
    name: 'jsDelivr – npm',
    url: 'https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js',
    package: 'jquery',
    version: '3.2.1',
  },
  {
    name: 'jsDelivr - npm shorthand',
    url: 'https://cdn.jsdelivr.net/npm/jquery@3.2',
    package: 'jquery',
    version: '3.2',
  },
  {
    name: 'jsDelivr - github',
    url: 'https://cdn.jsdelivr.net/gh/jquery/jquery@3.2.1/dist/jquery.min.js',
    package: 'jquery',
    version: '3.2.1',
  },
  {
    name: 'CDNjs',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js',
    package: 'jquery',
    version: '3.4.1',
  }
];

testScenarios.map(scenario => {
  test(`Extract ${scenario.name} package and version`, () => {
    const packages = getPackages(
      'foo',
      `<script src="${scenario.url}"></script>`
    );
    expect(packages[0].name).toBe(scenario.package);
    expect(packages[0].version).toBe(scenario.version);
  });
});
