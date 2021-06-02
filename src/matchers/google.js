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
const Tabular = require('./Tabular.js');
const sheets = require('./sheets.js');

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

class Google extends Tabular {
  constructor(sheetsClient, url) {
    super();
    this.sheets = sheetsClient;
    this.spreadsheetId = getId(url);
  }

  /**
   * @returns {Promise<GoogleSheet>}
   * @private
   */
  async _getSheetData() {
    if (!this.data) {
      const { data } = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      this.data = data;
    }
    return this.data;
  }

  async getSourceLocation() {
    return this.spreadsheetId;
  }

  /**
   * Returns the sheet names.
   * @returns {Promise<string[]>}
   */
  async getSheetNames() {
    return (await this._getSheetData()).sheets.map((s) => s.properties.title);
  }

  /**
   * Returns the data for the given sheet and optional table
   * @param {string} sheetName Sheet name
   * @param {string} [table] Table name or number
   * @returns {Promise<Array<Object>>}
   */
  // eslint-disable-next-line no-unused-vars
  async getData(sheetName, table) {
    const data = await this._getSheetData();
    const sheet = data.sheets.find((s) => s.properties.title === sheetName);
    const range = `${sheet.properties.title}!${new A1({
      colStart: 1,
      rowStart: 1,
      nRows: sheet.properties.gridProperties.rowCount,
      nCols: sheet.properties.gridProperties.columnCount,
    })}`;

    const result = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });
    const { values } = result.data;
    const colNames = values[0];
    const rowValues = values.map((row) => colNames.reduce((obj, name, index) => {
      // eslint-disable-next-line no-param-reassign
      obj[name] = row[index];
      return obj;
    }, {}));

    // discard the first row
    rowValues.shift();
    return rowValues;
  }
}

async function extract(url, params, env, log = console) {
  const {
    GOOGLE_DOCS2MD_CLIENT_ID: clientId,
    GOOGLE_DOCS2MD_CLIENT_SECRET: clientSecret,
    GOOGLE_DOCS2MD_REFRESH_TOKEN: refresh_token,
  } = env;

  const auth = createOAuthClient({ clientId, clientSecret }, { refresh_token });
  const sheetsClient = google.sheets({ version: 'v4', auth });
  const tabular = new Google(sheetsClient, url).withLog(log);
  return sheets(tabular, params, log);
}

module.exports = {
  name: 'google',
  required: ['GOOGLE_DOCS2MD_CLIENT_ID', 'GOOGLE_DOCS2MD_CLIENT_SECRET', 'GOOGLE_DOCS2MD_REFRESH_TOKEN'],
  accept: (url) => /^https:\/\/docs\.google\.com\/spreadsheets\/d\/.*/.test(url),
  extract,
};
