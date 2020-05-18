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

    const client = await drive.getClient();

    const item = await drive.getDriveItemFromShareLink(url);
    const worksheetsuri = `/drives/${item.parentReference.driveId}/items/${item.id}/workbook/worksheets/`;
    const worksheets = await client.get(worksheetsuri);
    const worksheetname = worksheets.value[0].name;

    const tablesuri = `${worksheetsuri}${worksheetname}/tables/`;
    const tables = await client.get(tablesuri);
    const tablename = tables.value[0].name;

    const columnsuri = `${tablesuri}${tablename}/columns/`;
    const columns = await client.get(columnsuri);

    const columnnames = columns.value.map(({ name }) => name);

    const rowvalues = columns.value[0].values
      .map((_, rownum) => columnnames.reduce((row, name, colnum) => {
        const [value] = columns.value[colnum].values[rownum];
        // eslint-disable-next-line no-param-reassign
        row[name] = value;
        return row;
      }, {}));

    // discard the first row
    rowvalues.shift();

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
  required: ['AZURE_WORD2MD_CLIENT_ID', 'AZURE_HELIX_USER', 'AZURE_HELIX_PASSWORD'],
  pattern: (url) => /^https:\/\/.*\.sharepoint\.com\//.test(url),
  extract,
};
