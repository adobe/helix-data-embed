/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const URL = require('url');
const { google } = require('googleapis');

/**
 * Remember the access token for future action invocations.
 */
let tokenCache = {};

function getId(url) {
  return URL.parse(url).pathname.match(/\/d\/(.*)\//)[1];
}

function createOAuthClient(options, creds) {
  const oAuth2Client = new google.auth.OAuth2(options);
  oAuth2Client.setCredentials({
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    ...tokenCache,
    ...creds,
  });
  oAuth2Client.on('tokens', (tokens) => {
    tokenCache = tokens;
  });

  return oAuth2Client;
}

async function extract(url, params) {
  const {
    GOOGLE_DOCS2MD_CLIENT_ID: clientId,
    GOOGLE_DOCS2MD_CLIENT_SECRET: clientSecret,
    GOOGLE_DOCS2MD_REFRESH_TOKEN: refreshToken,
  } = params;

  const spreadsheetId = getId(url);

  const auth = createOAuthClient({ clientId, clientSecret }, { refreshToken });

  const sheets = google.sheets({ version: 'v4', auth });

  const values = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!',
  });

  /* above fails with:

  Error: No access, refresh token or API key is set.
      at OAuth2Client.getRequestMetadataAsync
      (node_modules/google-auth-library/build/src/auth/oauth2client.js:251:19)

  */
  console.log(values);

  // console.log(sheets);
}

module.exports = {
  required: ['GOOGLE_DOCS2MD_CLIENT_ID', 'GOOGLE_DOCS2MD_CLIENT_SECRET', 'GOOGLE_DOCS2MD_REFRESH_TOKEN'],
  pattern: (url) => /^https:\/\/.*\.sharepoint\.com\//.test(url),
  extract,
};
