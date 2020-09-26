import { workspace, window, Range, Position, ThemeColor } from 'vscode';
import logger from './logger';
import * as vscode from 'vscode';

const decorations = {};
const iacDiagnostics = {};
let shown = {};

export function flushDecorations(fileName, packages=[], displayCheck = false) {
  // logger.log(`Flushing decorations`);
  decorations[fileName] = {};
  packages.forEach(packageInfo => {
    if (packageInfo.vulns === undefined) {
      const configuration = workspace.getConfiguration('vulnCost');
      if (configuration.showDecoration) {
        decorate('Scanning for vulns...', packageInfo);
      }
    } else {
      calculated(packageInfo, displayCheck);
    }
  });
  refreshDecorations(fileName);
}

export function applyIaCDiagnostics(fileName, diagnostics, document) {
  if (iacDiagnostics[fileName]) {
    diagnostics.set(document.uri, iacDiagnostics[fileName]);
  }
}

export function flushIaCDecorations(fileName, diagnostics, document) {
  decorations[fileName] = {};
  iacDiagnostics[fileName] = [];
  refreshDecorations(fileName);
}

export function calculated(packageInfo, displayCheck = false) {
  const decorationMessage = getDecorationMessage(packageInfo);

  if (displayCheck && decorationMessage.length === 0 && (shown[packageInfo.string+packageInfo.fileName] === undefined || !shown[packageInfo.string+packageInfo.fileName])) {
    shown[packageInfo.string+packageInfo.fileName] = true;
    decorate("✔️", packageInfo);
    setTimeout(() => {decorate(decorationMessage, packageInfo);}, 1000);
  } else {
    decorate(decorationMessage, packageInfo);
  }
}

export function calculatedIaC(issue, diagnostics, document) {
  decorateIaC(issue, document);
  applyIaCDiagnostics(document.fileName, diagnostics, document);
}

export function clearShown() {
  shown = {};
}


function getDecorationMessage(packageInfo) {
  logger.log(
    `getDecorationMessage - has object? ${!!packageInfo}, has prop? ${!!packageInfo.vulns}, for ${
      packageInfo.name
    }`
  );
  if (!packageInfo.vulns || !packageInfo.vulns.count) {
    return '';
  }

  const { count } = packageInfo.vulns;
  let decorationMessage = `${count} vuln${count === 1 ? '' : 's'} (click to fix)`;

  return decorationMessage;
}

function decorate(text, packageInfo) {
  const { fileName, line } = packageInfo;

  const hasVuln = text.includes('vuln');

  let color = new ThemeColor(hasVuln ? 'errorForeground' : 'foreground');

  let fontWeight = hasVuln ? 'bold' : 'normal';

  decorations[fileName][line] = {
    renderOptions: { after: { contentText: text, color, fontWeight } },
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

export function decorateIaC(issue, document) {
  const { fileName, title, lineNumber } = issue;

  let severity = vscode.DiagnosticSeverity.Error;
  if (issue.severity === 'medium') {
    severity = vscode.DiagnosticSeverity.Warning;
  }
  if (issue.severity === 'low') {
    severity = vscode.DiagnosticSeverity.Information;
  }

  const issueRange = new Range(new vscode.Position(lineNumber - 1, 0), new vscode.Position(lineNumber - 1, 1024));
  const relatedInformation = [];
  if (issue.description) {
    relatedInformation.push(
      new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, issueRange), issue.description)
    )
  }
  iacDiagnostics[fileName].push({
    code: '',
    message: title,
    range: issueRange,
    severity,
    source: '🔒 VulnCost',
    relatedInformation,
  });
}
