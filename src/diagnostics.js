import * as vscode from 'vscode';
import { isAuthed } from './getImports/snykAPI';

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
    if (pkg.vulns && pkg.vulns.count > 0) {
      diagnostics.push(createDiagnostic(doc, pkg));
    }
  }

  diagnosticCollection.set(doc.uri, diagnostics);
}

export function getMessage(pkg) {
  // SUPER IMPORTANT: this string is used by the Action Provider as there's no way
  // to pass around meta data, so the package name (and version) that represents
  // a key to the cache is lifted from this string.
  return `⛔ ${pkg.vulns.packageName} has ${pkg.vulns.count} vulns`;
}

export function getPackageFromMessage(message) {
  return message.replace(/^⛔\s+/g, '').split(' ')[0]
}

function breakdown(pkg) {
  const sort = ['high', 'medium', 'low'];
  const sortBy = (a, b) => {
    return sort.indexOf(a.severity) - sort.indexOf(b.severity);
  };

  const vulns = pkg.vulns.vulnerabilities.sort(sortBy);
  const high = vulns.filter(vuln => vuln.severity === "high").length;
  const medium = vulns.filter(vuln => vuln.severity === "medium").length;
  const low = vulns.filter(vuln => vuln.severity === "low").length;

  const message = `${high} High, ${medium} Medium, ${low} Low`;
  const breakdown = `\n ${vulns.map(vuln => `${vuln.severity.toUpperCase()} ${vuln.packageName}@${vuln.version} ${vuln.title}`).join('\n ')}`;

  return message + breakdown;
}

function createDiagnostic(doc, pkg) {
  // create range that represents, where in the document the word is
  let range = new vscode.Range(
    pkg.loc.start.line - 1,
    pkg.loc.start.column,
    pkg.loc.end.line - 1,
    pkg.loc.end.column
  );

  let message = getMessage(pkg);

  if (!isAuthed()) {
    message += '\nConnect your project to Snyk to find and fix vulnerabilities';
  } else {
    message += ` - ${breakdown(pkg)}`;
  }

  let diagnostic = new vscode.Diagnostic(
    range,
    message,
    vscode.DiagnosticSeverity.Warning
  );

  diagnostic.code = KEY_MENTION;
  return diagnostic;
}
