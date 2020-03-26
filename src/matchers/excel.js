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
    const worksheetsuri = `/drives/${item.parentReference.driveId}/items/${item.id}/workbook/worksheets/`;
    const worksheets = await (await drive.getClient(false)).get(worksheetsuri);
    const worksheetname = worksheets.value[0].name;

    const tablesuri = `/drives/${item.parentReference.driveId}/items/${item.id}/workbook/worksheets/${worksheetname}/tables/`;
    const tables = await (await drive.getClient(false)).get(tablesuri);
    const tablename = tables.value[0].name;

    const rowsuri = `/drives/${item.parentReference.driveId}/items/${item.id}/workbook/worksheets/${worksheetname}/tables/${tablename}/rows/`;
    const rows = await (await drive.getClient(false)).get(rowsuri);

    const columnsuri = `/drives/${item.parentReference.driveId}/items/${item.id}/workbook/worksheets/${worksheetname}/tables/${tablename}/columns/`;
    const columns = await (await drive.getClient(false)).get(columnsuri);

    const columnnames = columns.value.map(({ name }) => name);

    const rowvalues = rows.value.map((myrow) => columnnames.reduce((row, name, index) => {
      // eslint-disable-next-line no-param-reassign
      row[name] = myrow.values[0][index];
      return row;
    }, {}));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=600',
      },
      body: rowvalues,
    };
  } catch (e) {
    log.error(e.message);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=600',
      },
      body: [],
    };
  }
}


module.exports = {
  required: ['share', 'AZURE_WORD2MD_CLIENT_ID', 'AZURE_HELIX_USER', 'AZURE_HELIX_PASSWORD'],
  pattern: (url) => /^https:\/\/.*\.sharepoint\.com\/sites\/.*\/_layouts\/15\/guestaccess\.aspx/.test(url),
  extract,
};
