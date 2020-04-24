import { v4 as uuidv4 } from 'uuid';
import logger from './logger';
import axios from 'axios';
import * as vscode from 'vscode';

const STATS_API_ROOT = 'https://us-central1-snyk-vulncost.cloudfunctions.net/app/';
const meta = 'vulncost-analytics';
const FIRST_STARTUP = 'FIRST_STARTUP';
const STARTUP = 'STARTUP';
const TEST = 'TEST';

const extensionInfo = vscode.extensions.getExtension('snyk-security.vscode-vuln-cost').packageJSON

const instance = axios.create({
  baseURL: STATS_API_ROOT,
  timeout: 5000
});

class Statistics {

  init(context) {
    this.context = context;
    this.userid = context.globalState.get('userid');
    logger.log('userid found: ' + this.userid);

    if (!this.userid) {
      this.userid = uuidv4();
      logger.log('created userid: ' + this.userid);
      context.globalState.update('userid', this.userid)
    }
  }

  ping() {
    logger.log('try to ping');
    instance.get('ping')
      .then(response => { logger.log('pinged statistics server: ' + response.data); })
      .catch(error => { logger.log(error); });
  }

  sendTest(comment) {
    //max send once every 2 minutes
    const now = new Date().getTime();
    if (!this.lastTestSend || now - this.lastTestSend >= 120000) {
      this.send(TEST, comment);
      this.lastTestSend = now;
    }
  }

  sendStartup(comment) {
    this.firstStartup = this.context.globalState.get('firstStartup');
    if (!this.firstStartup) {
      this.send(FIRST_STARTUP, comment);
      this.context.globalState.update('firstStartup', new Date().getTime());
    } else {
      this.send(STARTUP, comment);
    }
  }

  send(action, comment) {
    logger.log(`sending stats action:[${action}], comment:[${comment}]`);
    const message = {
      "meta": meta,
      "time": new Date().getTime(),
      "item": {
        "user": this.userid,
        "app": extensionInfo.name + ' ' + extensionInfo.version,
        "action": action,
        "comment": comment
      }
    };

    instance.post('api/log', message)
      .then(response => {
        logger.log(`response: ${response.status} on message ${message.action} - ${message.comment}`);
      })
      .catch(error => {
        logger.log(`error: ${error} on message ${message.action} - ${message.comment}`);
      });
  }
}

export default new Statistics();

