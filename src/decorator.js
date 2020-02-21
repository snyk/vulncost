import { workspace, window, Range, Position } from 'vscode';

import logger from './logger';

const decorations = {};

export function flushDecorations(fileName, packages) {
  logger.log(`Flushing decorations`);
  decorations[fileName] = {};
  packages.forEach(packageInfo => {
    if (packageInfo.vulns === undefined) {
      const configuration = workspace.getConfiguration('vulnCost');
      if (configuration.showCalculatingDecoration) {
        decorate('Checking...', packageInfo);
      }
    } else {
      calculated(packageInfo);
    }
  });
  refreshDecorations(fileName);
}

export function calculated(packageInfo) {
  const decorationMessage = getDecorationMessage(packageInfo);
  decorate(decorationMessage, packageInfo);
}

function getDecorationMessage(packageInfo) {
  if (!packageInfo.vulns || packageInfo.vulns.totalVulns <= 0) {
    return '';
  }

  let decorationMessage = packageInfo.vulns.totalVulns + ' vulns';
  // const configuration = workspace.getConfiguration('vulnCost');

  return decorationMessage;
}

function getDecorationColor(size) {
  const configuration = workspace.getConfiguration('vulnCost');
  const sizeInKB = size / 1024;
  if (sizeInKB < configuration.smallPackageSize) {
    return configuration.smallPackageColor;
  } else if (sizeInKB < configuration.mediumPackageSize) {
    return configuration.mediumPackageColor;
  } else {
    return configuration.largePackageColor;
  }
}

function decorate(text, packageInfo, color = getDecorationColor(0)) {
  const { fileName, line } = packageInfo;
  logger.log(
    `Setting Decoration: ${text}, ${JSON.stringify(packageInfo.name, null, 2)}`
  );
  decorations[fileName][line] = {
    renderOptions: { after: { contentText: text, color } },
    range: new Range(
      new Position(line - 1, 1024),
      new Position(line - 1, 1024)
    ),
  };
  refreshDecorations(fileName);
}

const decorationType = window.createTextEditorDecorationType({
  after: { margin: '0 0 0 1rem' },
});
let decorationsDebounce;
function refreshDecorations(fileName, delay = 10) {
  clearTimeout(decorationsDebounce);
  decorationsDebounce = setTimeout(
    () =>
      getEditors(fileName).forEach(editor => {
        editor.setDecorations(
          decorationType,
          Object.keys(decorations[fileName]).map(x => decorations[fileName][x])
        );
      }),
    delay
  );
}

function getEditors(fileName) {
  return window.visibleTextEditors.filter(
    editor => editor.document.fileName === fileName
  );
}

export function clearDecorations() {
  window.visibleTextEditors.forEach(textEditor => {
    return textEditor.setDecorations(decorationType, []);
  });
}
