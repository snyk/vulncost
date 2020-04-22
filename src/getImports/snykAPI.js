const Configstore = require('@snyk/configstore');
const userConfig = new Configstore('snyk');

let token = process.env.SNYK_TOKEN || userConfig.get('api');

export const isAuthed = () => !!token;

export const setToken = t => {
  userConfig.set('api', t);
  token = t;
};

export const getToken = () => token;

export const clearToken = () => {
  userConfig.delete('api');
};

export default token;
