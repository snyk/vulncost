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

  show() {
    this.channel.show();
  }

  clear() {
    this.channel.clear();
  }

  flushWith(text) {
    this.clear();
    this.print(text);
    this.show();
  }

  print(text) {
    this.channel.appendLine(text);
  }

  log(text) {
    if (debug) {
      console.log(text);
      this.debugChannel.appendLine(text);
    }
  }
}

export default new Logger();
