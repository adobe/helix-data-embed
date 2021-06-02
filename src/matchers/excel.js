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
const { OneDrive } = require('@adobe/helix-onedrive-support');
const Tabular = require('./Tabular.js');
const sheets = require('./sheets.js');

/**
 * Returns the onedrive client - authenticated either via bearer token or env credentials.
 *
 * @param {object} env environment params
 * @param {Logger} log logger
 * @returns {OneDrive} the onedrive client
 */
async function getOneDriveClient(env, log) {
  const {
    AZURE_WORD2MD_CLIENT_ID: clientId,
    AZURE_WORD2MD_CLIENT_SECRET: clientSecret,
    AZURE_WORD2MD_REFRESH_TOKEN: refreshToken,
    AZURE_HELIX_USER: username,
    AZURE_HELIX_PASSWORD: password,
    AUTHORIZATION: auth,
  } = env;

  // check for authenticated request
  if (auth && auth.startsWith('Bearer ')) {
    const od = new OneDrive({
      clientId,
      clientSecret,
      log,
    });
    od.getAccessToken = () => ({
      accessToken: auth.substring(7),
    });
    return od;
  }

  if (!refreshToken) {
    if (!username) {
      throw new Error('AZURE_HELIX_USER or AZURE_WORD2MD_REFRESH_TOKEN parameter missing.');
    }
    if (!password) {
      throw new Error('AZURE_HELIX_PASSWORD or AZURE_WORD2MD_REFRESH_TOKEN parameter missing.');
    }
  }

  return new OneDrive({
    clientId,
    clientSecret,
    refreshToken,
    username,
    password,
    log,
  });
}

class Excel extends Tabular {
  constructor(drive, url) {
    super();
    this.drive = drive;
    this.url = url;
  }

  /**
   * @returns {Promise<DriveItem>}
   * @private
   */
  async _getDriveItem() {
    if (!this.item) {
      this.item = await this.drive.getDriveItemFromShareLink(this.url);
      /* istanbul ignore else */
      if (!this.item.lastModifiedDateTime) {
        this.item = await this.drive.getDriveItem(this.item);
      }
    }
    return this.item;
  }

  /**
   * @returns {Promise<Workbook>}
   * @private
   */
  async _getWorkbook() {
    if (!this.workbook) {
      this.workbook = this.drive.getWorkbook(await this._getDriveItem());
    }
    return this.workbook;
  }

  /**
   * Returns the last modified time
   * @returns {Promise<string>}
   */
  async getLastModified() {
    /* istanbul ignore next */
    if (!this.lastModified) {
      this.lastModified = (await this._getDriveItem()).lastModifiedDateTime;
    }
    return this.lastModified;
  }

  /**
   * Returns the source location of this tabular data.
   * @returns {Promise<string>}
   */
  async getSourceLocation() {
    if (!this.sourceLocation) {
      const driveItem = await this._getDriveItem();
      this.sourceLocation = `/drives/${driveItem.parentReference.driveId}/items/${driveItem.id}`;
    }
    return this.sourceLocation;
  }

  /**
   * Returns the sheet names.
   * @returns {Promise<string[]>}
   */
  async getSheetNames() {
    return (await this._getWorkbook()).getWorksheetNames();
  }

  /**
   * Returns the data for the given sheet and optional table
   * @param {string} sheetName Sheet name
   * @param {string} [table] Table name or number
   * @returns {Promise<Array<Object>>}
   */
  async getData(sheetName, table) {
    const worksheet = (await this._getWorkbook()).worksheet(encodeURIComponent(sheetName));
    if (!table) {
      this.log.info(`returning used-range for ${sheetName}.`);
      return worksheet.usedRange().getRowsAsObjects();
    }

    // if table is a number, get the names
    let tableName = table;
    if (/^\d+$/.test(table)) {
      const tableNum = Number.parseInt(table, 10);
      const tableNames = await worksheet.getTableNames();
      if (tableNum < 0 || tableNum >= tableNames.length) {
        this.log.info(`table index out of range: 0 >= ${tableNum} < ${tableNames.length}`);
        const error = new Error('index out of range');
        error.statusCode = 404;
        throw error;
      }
      tableName = tableNames[tableNum];
    }
    this.log.info(`fetching table data for worksheet ${sheetName} with name ${tableName}`);
    return worksheet.table(encodeURIComponent(tableName)).getRowsAsObjects();
  }
}

async function extract(url, params, env, log = console) {
  let drive;
  try {
    drive = await getOneDriveClient(env, log);
    const tabular = new Excel(drive, url).withLog(log);
    return sheets(tabular, params, log);
  } finally {
    if (drive) {
      await drive.dispose();
    }
  }
}

module.exports = {
  name: 'excel',
  required: ['AZURE_WORD2MD_CLIENT_ID'],
  accept: (url) => url.protocol === 'onedrive:' || /^https:\/\/.*\.sharepoint\.com\//.test(url),
  extract,
};
