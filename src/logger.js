import { window } from 'vscode';

const debug = true;

class Logger {
  init(context) {
    this.context = context;
    this.channel = window.createOutputChannel('Snyk vulnCost');
    context.subscriptions.push(this.channel);
    if (debug) {
      this.debugChannel = window.createOutputChannel('vulnCost-debug');
      context.subscriptions.push(this.debugChannel);
    }
  }

  print(text) {
    this.channel.appendLine(text);
  }

  log(text) {
    if (debug) {
      this.debugChannel.appendLine(text);
    }
  }
}

export default new Logger();
