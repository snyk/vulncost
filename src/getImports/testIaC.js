import { title } from 'process';
import logger from '../logger';
import statistics from '../statistics';
import { isAuthed } from './snykAPI';
import * as vscode from 'vscode';

const util = require('util');
const exec = util.promisify(require('child_process').execFile);

export default async function testIaC(fileName, text, emitter) {
  logger.log(`testing ${fileName}`);
  emitter.emit('start');
  //statistics.sendTest(`${fileName} - authed: ${isAuthed()}`);

  // if (isAuthed()) {
  //   return testWithAuth(pkg);
  // } else {
  //   logger.log('you have to be authed to Snyk to have IaC features')
  // }
  const configuration = vscode.workspace.getConfiguration('vulnCost');
  if (configuration.infrastructureAsCodeConfigurationIssue) {
    await testConfiguration(fileName, emitter);
  }

  if (!configuration.infrastructureAsCodeImageVulnerabilities) {
    return;
  }

  const fileLines = text.split('\n');
  for (let line = 0; line < fileLines.length; line++) {
    if (fileLines[line].includes('image:')) {
      const image = fileLines[line].match(/^[\s]*[-]{0,1}[\s]*image:\s(.*)$/);
      if (image.length === 2) {
        await testImage(image[1], fileName, line+1, emitter);
      }
    }
  }
}

async function testConfiguration(fileName, emitter) {
  let snykRes;
  try {
    snykRes = await exec('snyk', ['iac', 'test', fileName, '--json']);
  } catch(e) {
    snykRes = e;
  }

  try {
    const snykJson = JSON.parse(snykRes.stdout);
    const iacIssues = snykJson.infrastructureAsCodeIssues || [];
    //const calcIssues = iacIssues.map(issue => {return { fileName, description: issue.title, lineNumber: issue.lineNumber, severity: issue.severity }});
    for (const iacIssue of iacIssues) {
      emitter.emit('calculatedIaC', { fileName, title: iacIssue.title, lineNumber: iacIssue.lineNumber, severity: iacIssue.severity, description: iacIssue.iacDescription.issue });
    }
  } catch (e) {
    logger.log('error');
  }
}

async function testImage(image, fileName, lineNumber, emitter)  {
  let snykRes;
  try {
    snykRes = await exec('snyk', ['container', 'test', image, '--json'], {maxBuffer:  100000 * 200});
  } catch(e) {
    snykRes = e;
  }

  const histogram = {
    'low': 0,
    'medium': 0,
    'high': 0
  };

  try {
    const snykJson = JSON.parse(snykRes.stdout);
    if (!snykJson.vulnerabilities) {
      return;
    }

    for (const vuln of snykJson.vulnerabilities) {
      histogram[vuln.severity]++;
    }

    const title = `High: ${histogram['high']}, Medium: ${histogram['medium']}, Low: ${histogram['low']}`;
    emitter.emit('calculatedIaC', { fileName, title, lineNumber });
  } catch (e) {
    logger.log('error');
  }
}
