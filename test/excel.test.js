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
/* eslint-env mocha */
const assert = require('assert');
const { main } = require('../src/index');

describe('Excel Tests', () => {
  it('Works for Excel Feeds', async () => {
    const result = await main({
      __ow_path: '/https://adobe.sharepoint.com/sites/TheBlog/_layouts/15/guestaccess.aspx',
      share: 'ESR1N29Z7HpCh1Zfs_0YS_gB4gVSuKyWRut-kNcHVSvkew',
      email: 'helix%40adobe.com',
      e: 'vmQSij',
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 200);
    assert.notEqual(result.body.length, 0);
    assert.ok(result.body[0].url);
    assert.ok(result.body[0].year);
  }).timeout(15000);

  it('Fails for invalid Excel Feeds', async () => {
    const result = await main({
      __ow_path: '/https://adobe.sharepoint.com/sites/TheBlog/_layouts/15/guestaccess.aspx',
      share: 'invalid',
      email: 'helix%40adobe.com',
      e: 'vmQSij',
      AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
      AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
      AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
    });
    assert.equal(result.statusCode, 500);
    assert.equal(result.body.length, 0);
  }).timeout(15000);
});
