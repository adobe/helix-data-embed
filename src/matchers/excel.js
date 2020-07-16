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

async function extract(url, params, log = console) {
  const {
    AZURE_WORD2MD_CLIENT_ID: clientId,
    AZURE_HELIX_USER: username,
    AZURE_HELIX_PASSWORD: password,
  } = params;

  try {
    const drive = new OneDrive({
      clientId,
      username,
      password,
      log,
    });

    const item = await drive.getDriveItemFromShareLink(url);
    const workbook = drive.getWorkbook(item);

    const worksheetNames = await workbook.getWorksheetNames();
    const worksheetName = worksheetNames[0];
    const worksheet = workbook.worksheet(worksheetName);
    const tableNames = await worksheet.getTableNames();
    const body = await (async () => {
      if (!tableNames.length) {
        log.info(`worksheet ${worksheetName} has no tables, getting range instead`);
        return worksheet.usedRange().getRowsAsObjects();
      }
      log.info(`fetching table data for worksheet ${worksheetName} with name ${tableNames[0]}`);
      return worksheet.table(tableNames[0]).getRowsAsObjects();
    })();
    log.info(`returning ${body.length} rows.`);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'cache-control': 'no-store, private, must-revalidate',
      },
      body,
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
  name: 'excel',
  required: ['AZURE_WORD2MD_CLIENT_ID', 'AZURE_HELIX_USER', 'AZURE_HELIX_PASSWORD'],
  pattern: (url) => /^https:\/\/.*\.sharepoint\.com\//.test(url),
  extract,
};
