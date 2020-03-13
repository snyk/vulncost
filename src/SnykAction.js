import * as vscode from 'vscode';
import { isAuthed } from './getImports/snykAPI';
// import { getPackageFromCache } from './getImports/packageInfo';
import { KEY_MENTION, getPackageFromMessage } from './diagnostics';

function createAuthAction({ isPreferred = true, diagnostic, actionTitle }) {
  const action = new vscode.CodeAction(
    actionTitle,
    vscode.CodeActionKind.QuickFix
  );

  action.command = {
    command: 'vulnCost.signIn',
  };
  action.diagnostics = [diagnostic];
  action.isPreferred = isPreferred;
  return action;
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

// TODO will restore later
// function createPackageUpgradeAction({
//   vulnerabilities,
//   diagnostic,
//   isPreferred,
// }) {
//   const packages = vulnerabilities
//     .filter(_ => _.isUpgradeable)
//     .map(_ => _.upgradePath[0])
//     .join(' ');

//   const action = new vscode.CodeAction(
//     'Run Snyk remediation',
//     vscode.CodeActionKind.Refactor
//   );

//   action.command = {
//     command: 'vscode.open',
//     title: 'Run Snyk remediation',
//     arguments: [],
//   };
//   action.diagnostics = [diagnostic];
//   action.isPreferred = isPreferred;
//   return action;
// }

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
        // const vulns = getPackageFromCache(pkg);

        const res = [
          createOpenBrowserAction({
            diagnostic,
            url: 'https://snyk.io/test/npm/' + pkg,
            actionTitle: 'Learn about this vulnerability',
            title: 'Learn about this vulnerability',
          }),
        ];

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
