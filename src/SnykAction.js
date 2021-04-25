import * as vscode from 'vscode';
import { isAuthed } from './getImports/snykAPI';
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

function createOpenVulnPageAction(args) {
  return createSimpleAction({ command: 'vulnCost.openVulnPage', ...args });
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
        const count = vulns.count;
        const res = [];

        if (isAuthed()) {
          res.push(
            createShowOutputAction({
              diagnostic,
              actionTitle: `Fix vuln${count === 1 ? '' : 's'}`,
              title: 'Show vulnerability details',
              args: [vulns],
              isPreferred: true,
            })
          );
        } else {
          res.push(
            createAuthAction({
              diagnostic,
              actionTitle: `Fix vuln${count === 1 ? '' : 's'}`,
              title: 'Connect to Snyk',
              isPreferred: true,
            })
          );
        }

        res.push(
          createOpenVulnPageAction({
            diagnostic,
            actionTitle: 'Learn about this package',
            title: 'Learn about this package',
            args: [pkg],
            isPreferred: true,
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

        return res;
      })
      .flat();
  }
}
