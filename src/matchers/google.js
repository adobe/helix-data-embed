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
/* eslint-disable camelcase */
const { google } = require('googleapis');
const A1 = require('@flighter/a1-notation');

/**
 * Remember the access token for future action invocations.
 */
let tokenCache = {};

function getId(url) {
  return url.pathname.match(/\/d\/(.*)\//)[1];
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

async function extract(url, params, log = console) {
  const {
    GOOGLE_DOCS2MD_CLIENT_ID: clientId,
    GOOGLE_DOCS2MD_CLIENT_SECRET: clientSecret,
    GOOGLE_DOCS2MD_REFRESH_TOKEN: refresh_token,
  } = params;

  try {
    const spreadsheetId = getId(url);

    const auth = createOAuthClient({ clientId, clientSecret }, { refresh_token });

    const sheets = google.sheets({ version: 'v4', auth });

    const { data } = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    const sheet1 = data.sheets[0].properties;

    const range = `${sheet1.title}!${new A1({
      colStart: 1,
      rowStart: 1,
      nRows: sheet1.gridProperties.rowCount,
      nCols: sheet1.gridProperties.columnCount,
    })}`;

    const values = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const dataarray = values.data.values;

    const columnnames = dataarray[0];

    const rowvalues = dataarray.map((row) => columnnames.reduce((obj, name, index) => {
    // eslint-disable-next-line no-param-reassign
      obj[name] = row[index];
      return obj;
    }, {}));

    // discard the first row
    rowvalues.shift();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'cache-control': 'no-store, private, must-revalidate',
      },
      body: rowvalues,
    };
  } catch (e) {
    log.error(e.message);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'cache-control': 'no-store, private, must-revalidate',
      },
      body: [],
    };
  }
}

module.exports = {
  name: 'google',
  required: ['GOOGLE_DOCS2MD_CLIENT_ID', 'GOOGLE_DOCS2MD_CLIENT_SECRET', 'GOOGLE_DOCS2MD_REFRESH_TOKEN'],
  accept: (url) => /^https:\/\/docs\.google\.com\/spreadsheets\/d\/.*/.test(url),
  extract,
};
