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

async function extract(url, params, env, log = console) {
  const {
    sheet,
    table,
  } = params;
  const {
    AZURE_WORD2MD_CLIENT_ID: clientId,
    AZURE_HELIX_USER: username,
    AZURE_HELIX_PASSWORD: password,
  } = env;

  try {
    const drive = new OneDrive({
      clientId,
      username,
      password,
      log,
    });
    let item = await drive.getDriveItemFromShareLink(url);
    /* istanbul ignore else */
    if (!item.lastModifiedDateTime) {
      item = await drive.getDriveItem(item);
    }
    const { lastModifiedDateTime } = item;
    const workbook = drive.getWorkbook(item);

    // if a sheet is specified, use it
    let worksheetName;
    if (sheet) {
      worksheetName = `helix-${sheet}`;
    } else {
      // get the sheet names and check if any of them starts with `helix-`
      const sheetNames = await workbook.getWorksheetNames();
      const hasHelixSheets = !!sheetNames.find((n) => n.startsWith('helix-'));
      if (hasHelixSheets) {
        if (sheetNames.indexOf('helix-default') < 0) {
          // no helix-default -> not found
          log.info('Workbook has helix sheets but no helix-default');
          return {
            statusCode: 404,
            headers: {
              'cache-control': 'no-store, private, must-revalidate',
            },
            body: [],
          };
        }
        worksheetName = 'helix-default';
      } else {
        [worksheetName] = sheetNames;
        log.info(`Workbook has no helix sheets. using first one: ${worksheetName}`);
      }
    }

    const worksheet = workbook.worksheet(encodeURIComponent(worksheetName));
    const body = await (async () => {
      if (!table) {
        log.info(`returning used-range for ${worksheetName}.`);
        return worksheet.usedRange().getRowsAsObjects();
      }
      // if table is a number, get the names
      let tableName = table;
      if (/^\d+$/.test(table)) {
        const tableNum = Number.parseInt(table, 10);
        const tableNames = await worksheet.getTableNames();
        if (tableNum < 0 || tableNum >= tableNames.length) {
          log.info(`table index out of range: 0 >= ${tableNum} < ${tableNames.length}`);
          const error = new Error('index out of range');
          error.statusCode = 404;
          throw error;
        }
        tableName = tableNames[tableNum];
      }
      log.info(`fetching table data for worksheet ${worksheetName} with name ${tableName}`);
      return worksheet.table(encodeURIComponent(tableName)).getRowsAsObjects();
    })();
    log.info(`returning ${body.length} rows.`);
    const headers = {
      'Content-Type': 'application/json',
      'cache-control': 'no-store, private, must-revalidate',
    };
    if (lastModifiedDateTime) {
      headers['Last-Modified'] = new Date(lastModifiedDateTime).toUTCString();
    }
    return {
      statusCode: 200,
      headers,
      body,
    };
  } catch (e) {
    log.error(e.message);
    return {
      statusCode: e.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'cache-control': 'no-store, private, must-revalidate',
      },
      body: [],
    };
  }
}

module.exports = {
  name: 'excel',
  required: ['AZURE_WORD2MD_CLIENT_ID', 'AZURE_HELIX_USER', 'AZURE_HELIX_PASSWORD'],
  accept: (url) => url.protocol === 'onedrive:' || /^https:\/\/.*\.sharepoint\.com\//.test(url),
  extract,
};
