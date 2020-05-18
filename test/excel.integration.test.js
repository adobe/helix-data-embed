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

const { main } = require('../src/index');
const assert = require('assert');

describe('Excel Integration Test', () => {
  it('Retrieves Excel Spreadsheet', async () => {
    const result = await main({
      __ow_logger: console,
      __ow_path: '/https://adobe-my.sharepoint.com/personal/trieloff_adobe_com/_layouts/15/guestaccess.aspx',
      __ow_query: 'share=Edoi88tLKLpDsKzSfL-pcJYB2lIo7UKooYWnjm3w2WRrsA&email=helix%40adobe.com&e=tD623x',
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 200);
  }).timeout(10000);
});
