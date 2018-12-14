const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const RO_SCOPES = ['https://www.googleapis.com/auth/tasks.readonly'];
const RW_SCOPES = ['https://www.googleapis.com/auth/tasks'];
const CREDENTIALS_PATH = `${process.cwd()}/credentials.json`;
const RO_TOKEN_PATH = `${process.cwd()}/rotoken.json`;
const RW_TOKEN_PATH = `${process.cwd()}/rwtoken.json`;

function createOAuth2Client () {
    const credentials = require(CREDENTIALS_PATH);
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    return new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);
}
function createNewToken(oauth2Client, scope, successCallback, failureCallback) {
  const isReadOnly = scope[0] === RO_SCOPES[0];
  const type = isReadOnly ? 'ReadOnly' : 'ReadWrite';
  const tokenPath = isReadOnly ? RO_TOKEN_PATH : RW_TOKEN_PATH;
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope,
  });
  console.log(`\n\nAuthorize for ${type} access token by loading this URL and copying the code it presents> \n\t`, authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    historySize: 0,
  });
  rl.question(`\n\nPaste/Enter Code for ${type} access Token> `, (code) => {
    rl.close();
    oauth2Client.getToken(code, (err, token) => {
      if (err) return failureCallback(`Error Fetching ${type} Token. ${err}`);
      // Store the token to disk for later program executions
      fs.writeFile(tokenPath, JSON.stringify(token), (err) => {
        if (err) failureCallback.error(err);
      });
      successCallback(`${type} Token stored to ${tokenPath}`);
    });
  });
}

if (typeof module != 'undefined' && !module.parent) {
  console.log('Loading Credentials to create OAuth2 Google Client...');
  const oauth2Client = createOAuth2Client();
  const chooseTokenType = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    historySize: 0,
  });
  chooseTokenType.question(`Which kind of token do you want?\n- ReadOnly (enter 'RO')\n- ReadWrite (enter 'RW')\n> `, (type) => {
    chooseTokenType.close();
    if (type.trim().toLowerCase() === 'rw') {
      console.log('Applying OAuth2 client to obtain RW Authorization URL for RW Token generation.');
      createNewToken(oauth2Client, RW_SCOPES, console.log, console.error);
    } else {
      console.log('Applying OAuth2 client to obtain RO Authorization URL for RO Token generation.');
      createNewToken(oauth2Client, RO_SCOPES, console.log, console.error);
    }
  });
} else {
  module.exports = {
    RW_SCOPES, RO_SCOPES,
    createOAuth2Client, createNewToken,
  };
}

