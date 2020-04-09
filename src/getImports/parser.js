import { getPackages as getPackagesFromJS } from './babelParser';
import { getPackages as getPackagesFromHTML } from './htmlParser';
import { getPackages as getPackagesFromPJSON } from './packageJsonParser';

export const TYPESCRIPT = 'typescript';
export const JAVASCRIPT = 'javascript';
export const HTML = 'html';
export const PJSON = 'json';

export function getPackages(fileName, source, language) {
  if ([TYPESCRIPT, JAVASCRIPT].includes(language)) {
    return getPackagesFromJS(fileName, source, language);
  } else if ([HTML].includes(language)) {
    // could be === but maybe we'll expand?
    return getPackagesFromHTML(fileName, source);
  } else if ([PJSON].includes(language)) {
    return getPackagesFromPJSON(fileName, source);
  } else {
    return [];
  }
}
