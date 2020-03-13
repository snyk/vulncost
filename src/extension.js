import {
  clearPackageCache,
  getImports,
  JAVASCRIPT,
  TYPESCRIPT,
} from './getImports';
import * as vscode from 'vscode';
import { calculated, flushDecorations, clearDecorations } from './decorator';
import logger from './logger';
import { SnykVulnInfo } from './SnykAction';
import { isAuthed, setToken } from './getImports/snykAPI';
import { refreshDiagnostics } from './diagnostics';
import { v4 as uuidv4 } from 'uuid';
import authenticate from './authenticate';

const { window, workspace, commands } = vscode;

let isActive = true;
let packageWatcher = {};

export function activate(context) {
  try {
    logger.init(context);

    if (isAuthed()) {
      logger.log('🔒 Using Snyk credentials');
    } else {
      logger.log('🔓 Using anonymous API');
    }

    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
        JAVASCRIPT,
        new SnykVulnInfo(),
        {
          providedCodeActionKinds: SnykVulnInfo.providedCodeActionKinds,
        }
      )
    );

    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
        TYPESCRIPT,
        new SnykVulnInfo(),
        {
          providedCodeActionKinds: SnykVulnInfo.providedCodeActionKinds,
        }
      )
    );

    const diagnostics = vscode.languages.createDiagnosticCollection(
      'snyk-vulns'
    );

    context.subscriptions.push(diagnostics);

    workspace.onDidChangeTextDocument(
      ev => isActive && processActiveFile(ev.document, diagnostics)
    );
    window.onDidChangeActiveTextEditor(
      ev => ev && isActive && processActiveFile(ev.document, diagnostics)
    );
    if (window.activeTextEditor && isActive) {
      processActiveFile(window.activeTextEditor.document, diagnostics);
    }

    context.subscriptions.push(
      commands.registerCommand('vulnCost.check', () => {
        processActiveFile(window.activeTextEditor.document, diagnostics);
      })
    );

    context.subscriptions.push(
      commands.registerCommand('vulnCost.toggle', () => {
        isActive = !isActive;
        if (isActive && window.activeTextEditor) {
          processActiveFile(window.activeTextEditor.document, diagnostics);
        } else {
          deactivate();
          clearDecorations();
        }
      })
    );

    context.subscriptions.push(
      commands.registerCommand('vulnCost.signIn', () => {
        if (isAuthed()) {
          window.showInformationMessage(
            'You are already connected to your Snyk account'
          );
          return;
        }

        const token = uuidv4();
        const url =
          'https://app.snyk.io/login?utm_medium=ide&utm_source=vscode&utm_campaign=vuln_cost&token=' +
          token;

        vscode.env.openExternal(vscode.Uri.parse(url)).then(() => {
          authenticate(token)
            .then(res => {
              setToken(res.data.api);
              window.showInformationMessage(
                'Your Snyk account is now connected.'
              );
            })
            .catch(e => {
              logger.log(e.message);
              window.showErrorMessage(e.message);
            });
        });
      })
    );
  } catch (e) {
    console.log(e.message);
    logger.log('wrapping error: ' + e);
  }
}

export function deactivate() {}

function createPackageWatcher(fileName) {
  if (packageWatcher[fileName]) {
    console.log('watching already', fileName);
    return;
  }

  // FIXME investigate why this doesn't work in a multi-root workspace (might be a vscode bug)
  const watcher = vscode.workspace.createFileSystemWatcher(fileName);
  watcher.onDidChange(() => {
    clearPackageCache();
    if (isActive && window.activeTextEditor) {
      commands.executeCommand('vulnCost.check');
    }
  });

  packageWatcher[fileName] = watcher;
}

let emitters = {};
async function processActiveFile(document, diagnostics) {
  if (document && language(document)) {
    const { fileName } = document;
    if (emitters[fileName]) {
      emitters[fileName].removeAllListeners();
    }
    // const { timeout } = workspace.getConfiguration('vulnCost');
    emitters[fileName] = getImports(
      fileName,
      document.getText(),
      language(document)
    );

    emitters[fileName].on('package', createPackageWatcher);
    emitters[fileName].on('error', e => logger.log(`vulnCost error: ${e}`));
    emitters[fileName].on('start', packages => {
      flushDecorations(fileName, packages);
    });
    emitters[fileName].on('calculated', calculated);

    emitters[fileName].on('done', packages => {
      flushDecorations(fileName, packages);
      refreshDiagnostics(document, diagnostics, packages);
    });
  }
}

function language({ fileName, languageId }) {
  const configuration = workspace.getConfiguration('vulnCost');
  const typescriptRegex = new RegExp(
    configuration.typescriptExtensions.join('|')
  );
  const javascriptRegex = new RegExp(
    configuration.javascriptExtensions.join('|')
  );
  if (
    languageId === 'typescript' ||
    languageId === 'typescriptreact' ||
    typescriptRegex.test(fileName)
  ) {
    return TYPESCRIPT;
  } else if (
    languageId === 'javascript' ||
    languageId === 'javascriptreact' ||
    javascriptRegex.test(fileName)
  ) {
    return JAVASCRIPT;
  } else {
    return undefined;
  }
}
