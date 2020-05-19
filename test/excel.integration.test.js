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
/* eslint-env mocha */

const assert = require('assert');
const { condit } = require('@adobe/helix-testutils');
const { main } = require('../src/index');

require('dotenv').config();

describe('Excel Integration Test', () => {
  condit('Retrieves Excel Spreadsheet without tables', condit.hasenv('AZURE_WORD2MD_CLIENT_ID', 'AZURE_HELIX_USER', 'AZURE_HELIX_PASSWORD'), async () => {
    const result = await main({
      __ow_logger: console,
      __ow_path: '/https://adobe-my.sharepoint.com/personal/trieloff_adobe_com/_layouts/15/guestaccess.aspx',
      share: 'Edoi88tLKLpDsKzSfL-pcJYB2lIo7UKooYWnjm3w2WRrsA',
      email: 'helix@adobe.com',
      e: 'tD623x',
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.length, 3);
  }).timeout(10000);

  condit('Retrieves Excel Spreadsheet with tables', condit.hasenv('AZURE_WORD2MD_CLIENT_ID', 'AZURE_HELIX_USER', 'AZURE_HELIX_PASSWORD'), async () => {
    const result = await main({
      __ow_logger: console,
      __ow_path: '/https://adobe-my.sharepoint.com/personal/trieloff_adobe_com/_layouts/15/guestaccess.aspx',
      share: 'Edz_l4D0BghJjLkIfyZCB7sBLaBhySyT5An7fPHVS6CFuA',
      email: 'helix@adobe.com',
      e: 'e5ziwf',
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.length, 20);
  }).timeout(10000);
});
