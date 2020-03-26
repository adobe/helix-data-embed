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
/* eslint-disable class-methods-use-this */
const assert = require('assert');
const proxyquire = require('proxyquire');
const path = require('path');
const fs = require('fs-extra');
const { pattern, extract: extractfunc } = require('../src/matchers/excel');

class DummyOneDrive {
  getDriveItemFromShareLink(url) {
    if (!pattern(url)) {
      throw new Error();
    }
    return {};
  }

  downloadDriveItem() {
    return fs.readFile(path.resolve(__dirname, 'fixtures', 'urls.xlsx'));
  }
}

describe.skip('Excel Tests', () => {
  const { extract } = proxyquire('../src/matchers/excel.js', {
    '@adobe/helix-onedrive-support': {
      OneDrive: DummyOneDrive,
    },
  });

  it('Works for Excel Feeds', async () => {
    const result = await extract(
      'https://adobe.sharepoint.com/sites/TheBlog/_layouts/15/guestaccess.aspx?share=ESR1N29Z7HpCh1Zfs_0YS_gB4gVSuKyWRut-kNcHVSvkew&email=helix%40adobe.com&e=hx0OUl',
      {},
    );
    assert.equal(result.statusCode, 200);
    assert.notEqual(result.body.length, 0);
    assert.equal(result.body[0].url, 'https://theblog.adobe.com/silka-miesnieks-designing-immersive-world/');
    assert.ok(result.body[0].year);
  }).timeout(15000);

  it('Fails for invalid Excel Feeds', async () => {
    const result = await extract(
      'invalid',
      {},
    );

    assert.equal(result.statusCode, 500);
    assert.equal(result.body.length, 0);
  }).timeout(15000);
});

describe('Excel Graph Tests', () => {
  it('Works for Excel Feeds', async () => {
    const result = await extractfunc(
      'https://adobe.sharepoint.com/sites/TheBlog/_layouts/15/guestaccess.aspx?share=ESR1N29Z7HpCh1Zfs_0YS_gB4gVSuKyWRut-kNcHVSvkew&email=helix%40adobe.com&e=hx0OUl',
      {
        AZURE_WORD2MD_CLIENT_ID: process.env.AZURE_WORD2MD_CLIENT_ID,
        AZURE_HELIX_USER: process.env.AZURE_HELIX_USER,
        AZURE_HELIX_PASSWORD: process.env.AZURE_HELIX_PASSWORD,
      },
    );
    assert.equal(result.statusCode, 200);
    assert.notEqual(result.body.length, 0);
    assert.equal(result.body[0].url, 'https://theblog.adobe.com/silka-miesnieks-designing-immersive-world/');
    assert.ok(result.body[0].year);
  }).timeout(15000);
});
