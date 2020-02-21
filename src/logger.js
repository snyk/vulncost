import { window } from 'vscode';

const debug = true;

class Logger {
  init(context) {
    this.context = context;
    if (debug) {
      this.channel = window.createOutputChannel('vulnCost');
      context.subscriptions.push(this.channel);
    }
  }

  log(text) {
    if (debug) {
      this.channel.appendLine(text);
    }
  }
}

export default new Logger();
