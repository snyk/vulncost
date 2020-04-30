export function getPackages(fileName, source) {
  const packages = [];

  const lines = [];
  source.split(/\r?\n/).forEach(function(line) {
    lines.push(line);
  });

  const pjson = JSON.parse(source);
  const depLines = findDependecyLines(pjson.dependencies, lines);

  for (var dep in pjson.dependencies) {
    var p = {};
    p.fileName = fileName;
    p.name = dep;
    p.loc = findLoc(dep, depLines.lines, depLines.offset);
    p.line = p.loc.start.line;
    packages.push(p);
  }
  return packages;
}

function findDependecyLines(dependencies, lines) {
  const depStartLine = lines.find(x => x.includes('"dependencies"'));
  const depLineIndex = lines.indexOf(depStartLine) + 1;

  const depLines = lines.slice(
    depLineIndex,
    depLineIndex + Object.keys(dependencies).length
  );
  console.log(depLines);

  return {
    lines: depLines,
    offset: depLineIndex,
  };
}

function findLoc(dep, lines, offset) {
  const line = lines.find(x => x.includes('"' + dep + '"'));
  const index = offset + lines.indexOf(line) + 1;

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
