import * as vscode from 'vscode';
import { isAuthed } from './getImports/snykAPI';
import utm from './utm';
import { getPackageFromCache } from './getImports/packageInfo';
import { KEY_MENTION, getPackageFromMessage } from './diagnostics';

function createSimpleAction({
  isPreferred = true,
  diagnostic,
  actionTitle,
  command,
  args = [],
}) {
  const action = new vscode.CodeAction(
    actionTitle,
    vscode.CodeActionKind.QuickFix
  );

  action.command = {
    command,
    title: actionTitle,
    arguments: args,
  };
  action.diagnostics = [diagnostic];
  action.isPreferred = isPreferred;
  return action;
}

function createAuthAction(args) {
  return createSimpleAction({ command: 'vulnCost.signIn', ...args });
}

function createShowOutputAction(args) {
  return createSimpleAction({ command: 'vulnCost.showOutput', ...args });
}

function createOpenBrowserAction({
  actionTitle,
  title,
  url,
  isPreferred = false,
  diagnostic,
}) {
  const action = new vscode.CodeAction(
    actionTitle,
    vscode.CodeActionKind.QuickFix
  );

  action.command = {
    command: 'vscode.open',
    title,
    arguments: [vscode.Uri.parse(url)],
  };
  action.diagnostics = [diagnostic];
  action.isPreferred = isPreferred;
  return action;
}

/**
 * Provides code actions corresponding to diagnostic problems.
 */
export class SnykVulnInfo {
  provideCodeActions(document, range, context) {
    // for each diagnostic entry that has the matching `code`, create a code action command
    return context.diagnostics
      .filter(diagnostic => diagnostic.code === KEY_MENTION)
      .map(diagnostic => {
        const pkg = getPackageFromMessage(diagnostic.message);
        const vulns = getPackageFromCache(pkg);

        const res = [];

        if (isAuthed()) {
          res.push(
            createShowOutputAction({
              diagnostic,
              actionTitle: 'Show vulnerability details',
              title: 'Show vulnerability details',
              args: [vulns],
              isPreferred: true,
            })
          );
        }

        res.push(
          createOpenBrowserAction({
            diagnostic,
            url: `https://snyk.io/test/npm/${pkg}?${utm}`,
            actionTitle: 'Learn about this vulnerability',
            title: 'Learn about this vulnerability',
          })
        );

        // if (vulns.fixable && isAuthed) {
        //   res.push(
        //     createPackageUpgradeAction({
        //       ...vulns,
        //       diagnostic,
        //       isPreferred: true,
        //     })
        //   );
        // }

        if (!isAuthed()) {
          res.push(
            createAuthAction({
              diagnostic,
              actionTitle: 'Connect Snyk to fix vulnerabilities',
              title: 'Connect to Snyk',
              isPreferred: true,
            })
          );
        }

        return res;
      })
      .flat();
  }
}
