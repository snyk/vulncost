import * as vscode from 'vscode';
export const KEY_MENTION = 'snyk_vulns';

/**
 * Analyzes the text document for problems.
 * This demo diagnostic problem provider finds all mentions of 'emoji'.
 * @param doc text document to analyze
 * @param diagnosticCollection diagnostic collection
 */
export function refreshDiagnostics(doc, diagnosticCollection, packages) {
  let diagnostics = [];

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    if (pkg.vulns && pkg.vulns.totalVulns > 0) {
      diagnostics.push(createDiagnostic(doc, pkg));
    }
  }

  diagnosticCollection.set(doc.uri, diagnostics);
}

function createDiagnostic(doc, pkg) {
  // create range that represents, where in the document the word is
  let range = new vscode.Range(
    pkg.loc.start.line - 1,
    pkg.loc.start.column,
    pkg.loc.end.line - 1,
    pkg.loc.end.column
  );

  let diagnostic = new vscode.Diagnostic(
    range,
    pkg.vulns.pageDesc,
    vscode.DiagnosticSeverity.Warning
  );
  diagnostic.code = KEY_MENTION;
  return diagnostic;
}
