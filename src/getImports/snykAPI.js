const Configstore = require('@snyk/configstore');
const userConfig = new Configstore('snyk');

const api = process.env.SNYK_TOKEN || userConfig.get('api');

export const isAuthed = !!api;

export default api;
