const config = {

DEMO_MODE: false,

TARGET_CHAIN_ID: '0x89',

NETWORK_NAME: 'Polygon Mainnet',

MAX_FILE_SIZE: 100 * 1024 * 1024,

ALLOWED_FILE_TYPES: [

'application/pdf',

'image/jpeg',

'image/jpg',

'image/png',

'image/gif'

],

API_BASE_URL: (() => {

const host = window.location.hostname;

if (host === 'localhost' || host === '127.0.0.1')

return 'http://localhost:3000/api';

if (host.includes('onrender.com'))

return 'https://blockchain-evidence.onrender.com/api';

return window.location.origin + '/api';

})(),

SESSION_TIMEOUT: 30 * 60 * 1000,

APP_NAME: 'EVID-DGC',

DEBUG: true

};

window.config = config;

console.log("Config loaded:", config);