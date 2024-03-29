/*
 * Copyright 2019 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
process.env.HELIX_FETCH_FORCE_HTTP1 = true;

/* eslint-env mocha */

const assert = require('assert');
const querystring = require('querystring');
const { Request } = require('@adobe/helix-fetch');
const { condit } = require('@adobe/helix-testutils');
const { OneDrive } = require('@adobe/helix-onedrive-support');
const { main: universalMain } = require('../src/index');

require('dotenv').config();

const condition = condit.hasenv('AZURE_WORD2MD_CLIENT_ID', 'AZURE_HELIX_USER', 'AZURE_HELIX_PASSWORD');

async function main(params = {}, env = {}, headers = {}) {
  const resp = await universalMain(
    new Request(`https://data-emmbed.com/fetch?${querystring.encode(params)}`, { headers }),
    {
      env,
    },
  );
  return {
    statusCode: resp.status,
    body: resp.headers.get('content-type') === 'application/json' ? await resp.json() : await resp.text(),
    headers: [...resp.headers.keys()].reduce((result, key) => {
      // eslint-disable-next-line no-param-reassign
      result[key] = resp.headers.get(key);
      return result;
    }, {}),
  };
}

const DATA_COUNTRIES = [{ Country: 'Japan', Code: 'JP', Number: 3 },
  { Country: 'Germany', Code: 'DE', Number: 5 },
  { Country: 'USA', Code: 'US', Number: 7 },
  { Country: 'Switzerland', Code: 'CH', Number: 27 },
  { Country: 'France', Code: 'FR', Number: 99 },
  { Country: 'Australia', Code: 'AUS', Number: 12 }];

describe('Excel Integration Test', () => {
  condit('Excel Spreadsheet without AZURE_HELIX_USER throws error', condition, async () => {
    const result = await main({
      src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/data-embed-no-default.xlsx?d=wf80aa1d65efb4e41bd16ba3ca0a4564b&csf=1&web=1&e=9WnXzf',
    }, {
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 500);
  }).timeout(30000);

  condit('Excel Spreadsheet without AZURE_HELIX_PASSWORD throws error', condition, async () => {
    const result = await main({
      src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/data-embed-no-default.xlsx?d=wf80aa1d65efb4e41bd16ba3ca0a4564b&csf=1&web=1&e=9WnXzf',
    }, {
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
    });
    assert.equal(result.statusCode, 500);
  }).timeout(30000);

  condit('Excel Spreadsheet returns default helix sheets', condition, async () => {
    const result = await main({
      src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/data-embed-no-default.xlsx?d=wf80aa1d65efb4e41bd16ba3ca0a4564b&csf=1&web=1&e=9WnXzf',
    }, {
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      ':version': 3,
      ':type': 'sheet',
      data: DATA_COUNTRIES,
      limit: 6,
      offset: 0,
      total: 6,
    });
  }).timeout(30000);

  condit('Excel Spreadsheet without helix-default but sheet params', condition, async () => {
    const result = await main({
      src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/data-embed-no-default.xlsx?d=wf80aa1d65efb4e41bd16ba3ca0a4564b&csf=1&web=1&e=9WnXzf',
      sheet: 'countries',
    }, {
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      ':version': 3,
      ':type': 'sheet',
      data: DATA_COUNTRIES,
      limit: 6,
      offset: 0,
      total: 6,
    });
  }).timeout(30000);

  condit('Excel Spreadsheet without helix returns first sheet', condition, async () => {
    const result = await main({
      src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/data-embed-no-helix.xlsx?d=w88ace0003b6847a48b6bb84b79a5b72b&csf=1&web=1&e=Sg8lKt',
    }, {
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      ':version': 3,
      ':type': 'sheet',
      data: [{ Country: 'Japan', Code: 'JP', Number: 81 }],
      limit: 1,
      offset: 0,
      total: 1,
    });
  }).timeout(30000);

  condit('Excel Spreadsheet without helix-default but sheet params Unicode', condition, async () => {
    const result = await main({
      src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx?d=w6911fff4a52a4b3fb80560d8785adfa3&csf=1&web=1&e=fkkA2a',
      sheet: '日本',
    }, {
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      ':version': 3,
      ':type': 'sheet',
      data: [{ Country: 'Japan', Code: 'JP', Number: 3 }],
      limit: 1,
      offset: 0,
      total: 1,
    });
  }).timeout(30000);

  condit('Excel Spreadsheet returns all helix sheets', condition, async () => {
    const result = await main({
      src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/multisheet.xlsx',
      limit: 1,
    }, {
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      ':names': ['日本', 'tables', 'foo'],
      ':type': 'multi-sheet',
      ':version': 3,
      foo: {
        data: [
          { Code: 'JP', Country: 'Japan', Number: 3 },
        ],
        limit: 1,
        offset: 0,
        total: 6,
      },
      tables: {
        data: [
          {
            '': '', A: 112, B: 224, C: 135,
          },
        ],
        limit: 1,
        offset: 0,
        total: 10,
      },
      日本: {
        data: [
          { Code: 'JP', Country: 'Japan', Number: 3 },
        ],
        limit: 1,
        offset: 0,
        total: 1,
      },
    });
  }).timeout(30000);

  condit('Excel Spreadsheet returns selected sheets', condition, async () => {
    const result = await main({
      src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/multisheet.xlsx',
      sheet: ['foo', '日本'],
      limit: 1,
    }, {
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      ':names': ['日本', 'foo'],
      ':type': 'multi-sheet',
      ':version': 3,
      foo: {
        data: [
          { Code: 'JP', Country: 'Japan', Number: 3 },
        ],
        limit: 1,
        offset: 0,
        total: 6,
      },
      日本: {
        data: [
          { Code: 'JP', Country: 'Japan', Number: 3 },
        ],
        limit: 1,
        offset: 0,
        total: 1,
      },
    });
  }).timeout(30000);

  condit('Retrieves Excel Spreadsheet with helix-default (range)', condition, async () => {
    const result = await main({
      src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx?d=w6911fff4a52a4b3fb80560d8785adfa3&csf=1&web=1&e=fkkA2a',
    }, {
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      ':version': 3,
      ':type': 'sheet',
      data: DATA_COUNTRIES,
      limit: 6,
      offset: 0,
      total: 6,
    });
  }).timeout(15000);

  condit('Retrieves Excel Spreadsheet with access token', condition, async () => {
    const od = new OneDrive({
      clientId: process.env.AZURE_WORD2MD_CLIENT_ID,
      username: process.env.AZURE_HELIX_USER,
      password: process.env.AZURE_HELIX_PASSWORD,
    });

    const { accessToken } = await od.getAccessToken();
    await od.dispose();
    const result = await main({
      src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx?d=w6911fff4a52a4b3fb80560d8785adfa3&csf=1&web=1&e=fkkA2a',
    }, {
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
    }, {
      authorization: `Bearer ${accessToken}`,
    });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      ':version': 3,
      ':type': 'sheet',
      data: DATA_COUNTRIES,
      limit: 6,
      offset: 0,
      total: 6,
    });
  }).timeout(15000);

  condit('Retrieves Excel Spreadsheet with refresh token', condition, async () => {
    const od = new OneDrive({
      clientId: process.env.AZURE_WORD2MD_CLIENT_ID,
      username: process.env.AZURE_HELIX_USER,
      password: process.env.AZURE_HELIX_PASSWORD,
    });

    const { refreshToken } = await od.getAccessToken();
    await od.dispose();
    const result = await main({
      src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx?d=w6911fff4a52a4b3fb80560d8785adfa3&csf=1&web=1&e=fkkA2a',
    }, {
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_WORD2MD_REFRESH_TOKEN: refreshToken,
    });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      ':version': 3,
      ':type': 'sheet',
      data: DATA_COUNTRIES,
      limit: 6,
      offset: 0,
      total: 6,
    });
  }).timeout(15000);

  condit('Retrieves Excel Spreadsheet with tables and table name', condition, async () => {
    const result = await main({
      src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx?d=w6911fff4a52a4b3fb80560d8785adfa3&csf=1&web=1&e=fkkA2a',
      sheet: 'tables',
      table: 'Table1',
    }, {
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      ':version': 3,
      ':type': 'sheet',
      data: [{ A: 112, B: 224, C: 135 }, { A: 2244, B: 234, C: 53 }],
      limit: 2,
      offset: 0,
      total: 2,
    });
  }).timeout(15000);

  condit('Retrieves Excel Spreadsheet with tables and table index', condition, async () => {
    const result = await main({
      src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx?d=w6911fff4a52a4b3fb80560d8785adfa3&csf=1&web=1&e=fkkA2a',
      sheet: 'tables',
      table: 1,
    }, {
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
      limit: 4,
    });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      ':version': 3,
      ':type': 'sheet',
      data: [{ X: 111, Y: 222, Z: 333 }, { X: 444, Y: 555, Z: 666 }],
      limit: 2,
      offset: 0,
      total: 2,
    });
  }).timeout(15000);

  condit('Retrieves Excel Spreadsheet via drive uri', condition, async () => {
    const result = await main({
      src: 'onedrive:/drives/b!DyVXacYnlkm_17hZL307Me9vzRzaKwZCpVMBYbPOKaVT_gD5WmlHRbC-PCpiwGPx/items/012VWERI7U74IWSKVFH5F3QBLA3B4FVX5D',
      limit: 2,
      offset: 3,
    }, {
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, {
      ':version': 3,
      ':type': 'sheet',
      data: [{ Code: 'CH', Country: 'Switzerland', Number: 27 }, { Code: 'FR', Country: 'France', Number: 99 }],
      limit: 2,
      offset: 3,
      total: 6,
    });
  }).timeout(15000);
});
