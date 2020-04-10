// import htmlparser2 from 'htmlparser2';
const htmlparser2 = require('htmlparser2');

const JQUERY = 'https://code.jquery.com/';
const MAXCDN = 'https://maxcdn.bootstrapcdn.com/';
const YANDEX = 'https://yastatic.net/';
const BOOTSTRAP = 'https://stackpath.bootstrapcdn.com/';
const pathBased = [MAXCDN, YANDEX, BOOTSTRAP];

const JSDELIVR = 'https://cdn.jsdelivr.net/';
const UNPKG = 'https://unpkg.com/';
const atBased = [JSDELIVR, UNPKG];

// packageFromUrl('https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js') // ?

function packageFromUrl(url) {
  let i = url.toLowerCase().indexOf('/ajax/libs/');
  url = url.replace(/(.slim)?(\.min)?.js$/, '');

  if (i !== -1) {
    i += '/ajax/libs/'.length;
    let pkg = url.substring(i); // ?
    const [name, version = 'latest'] = pkg.split('/'); // ?
    return `${name}@${version}`;
  }

  const isPathBased = pathBased.find(_ => url.toLowerCase().startsWith(_));

  if (isPathBased) {
    let pkg = url.substring(isPathBased.length); // ?
    const [name, version = 'latest'] = pkg.split('/');
    return `${name}@${version}`; // ?
  }

  if (url.toLowerCase().startsWith(JQUERY)) {
    let pkg = url.substring(JQUERY.length); // ?
    const [name, ...version] = pkg.split('-');
    return `${name}@${version.join('-')}`; // ?
  }

  const isAtBased = atBased.find(_ => url.toLowerCase().startsWith(_));

  if (isAtBased) {
    let pkg = url
      .substring(isAtBased.length)
      .split('/')
      .find(str => str.includes('@'))

    return pkg;
  }
  return null;
}

function indexToLineNumber(index, source) {
  return source.substring(0, index).split('\n').length;
}

export function getPackages(fileName, html) {
  const packages = [];
  const parser = new htmlparser2.Parser(
    {
      onopentag(name, attribs) {
        if (
          name === 'script' &&
          attribs.src &&
          (attribs.type || 'javascript/text').toLowerCase() ===
            'javascript/text'
        ) {
          const res = packageFromUrl(attribs.src);

          if (res) {
            const [name, version] = res.split('@');
            const line = indexToLineNumber(parser.startIndex, html);
            let startCol = html
              .substring(parser.startIndex)
              .indexOf(attribs.src);
            if (startCol === -1) startCol = 0;
            packages.push({
              loc: {
                start: {
                  line,
                  column: startCol,
                },
                end: {
                  line,
                  column: startCol + attribs.src.length,
                },
              },
              fileName,
              line,
              name,
              version,
            });
          }
        }
      },
    },
    { decodeEntities: true }
  );
  parser.write(html);
  parser.end();
  return packages;
}
