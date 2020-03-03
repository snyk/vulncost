import * as vscode from 'vscode';
import { KEY_MENTION } from './diagnostics';

// const providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

/**
 * Provides code actions corresponding to diagnostic problems.
 */
export class SnykVulnInfo {
  provideCodeActions(document, range, context) {
    // for each diagnostic entry that has the matching `code`, create a code action command
    return context.diagnostics
      .filter(diagnostic => diagnostic.code === KEY_MENTION)
      .map(diagnostic => [this.createCommandCodeAction(diagnostic), this.createSnykCodeAction(diagnostic)])
      .flat();
  }

  createCommandCodeAction(diagnostic) {
    const action = new vscode.CodeAction(
      'Learn about this vulnerability',
      vscode.CodeActionKind.QuickFix
    );

    const pkg = diagnostic.message.split(' ')[0];

    action.command = {
      command: 'vscode.open',
      title: 'Learn about this vulnerability',
      arguments: [vscode.Uri.parse('https://snyk.io/test/npm/' + pkg)],
    };
    action.diagnostics = [diagnostic];
    action.isPreferred = true;
    return action;
  }

  createSnykCodeAction(diagnostic) {
    const action = new vscode.CodeAction(
      'Connect your project to Snyk to fix vulnerabilities',
      vscode.CodeActionKind.QuickFix
    );

    action.command = {
      command: 'vscode.open',
      title: 'connect to Snyk',
      arguments: [vscode.Uri.parse('https://app.snyk.io/login?utm_source=vuln_cost&utm_campaign=vuln_cost')],
    };
    action.diagnostics = [diagnostic];
    action.isPreferred = true;
    return action;
  }
}
