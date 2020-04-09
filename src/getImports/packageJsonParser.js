export function getPackages(fileName, source) {
  const packages = [];

  const lines = [];
  source.split(/\r?\n/).forEach(function(line) {
    lines.push(line);
  });

  const pjson = JSON.parse(source);

  for (var dep in pjson.dependencies) {
    var p = {};
    p.fileName = fileName;
    p.name = dep;
    p.loc = findLoc(dep, lines);
    p.line = p.loc.start.line;
    packages.push(p);
  }

  return packages;
}

function findLoc(dep, lines) {
  const line = lines.find(x => x.includes('"' + dep + '"'));
  const index = lines.indexOf(line) + 1;

  var loc = {
    start: {},
    end: {},
  };

  loc.start.line = index;
  loc.start.column = line.indexOf('"');
  loc.end.line = index;
  loc.end.column = line.length - 1;
  return loc;
}
