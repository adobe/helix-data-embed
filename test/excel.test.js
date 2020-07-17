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
const { OneDriveMock } = require('@adobe/helix-onedrive-support');
const proxyquire = require('proxyquire');
const path = require('path');
const fs = require('fs-extra');
const exampleBook = require('./fixtures/book-with-tables.js');
const exampleBook2 = require('./fixtures/book-without-tables.js');

const TEST_SHARE_LINK = 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx';
const TEST_SHARE_LINK_NO_TABLES = 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data-no-tables.xlsx';

class DummyOneDrive extends OneDriveMock {
  constructor() {
    super();
    this.registerWorkbook('my-drive', 'my-item', exampleBook);
    this.registerWorkbook('my-drive', 'my-item-no-tables', exampleBook2);
    this.registerShareLink(TEST_SHARE_LINK, 'my-drive', 'my-item');
    this.registerShareLink(TEST_SHARE_LINK_NO_TABLES, 'my-drive', 'my-item-no-tables');
  }
}

describe('Excel Tests', () => {
  const { extract } = proxyquire('../src/matchers/excel.js', {
    '@adobe/helix-onedrive-support': {
      OneDrive: DummyOneDrive,
    },
  });

  it('Works for Excel Workbooks with no tables', async () => {
    const expected = await fs.readJson(path.resolve(__dirname, 'fixtures', 'example-data-sheet1.json'));
    const result = await extract(
      new URL('https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data-no-tables.xlsx'),
      {},
    );
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, expected);
  });

  it('Works for Excel Workbooks with onedrive uri', async () => {
    const expected = await fs.readJson(path.resolve(__dirname, 'fixtures', 'example-data-sheet1.json'));
    const result = await extract(
      new URL('onedrive:/drives/my-drive/items/my-item'),
      {},
    );
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, expected);
  });

  it('Works for Excel Workbooks with tables', async () => {
    const expected = await fs.readJson(path.resolve(__dirname, 'fixtures', 'example-data-sheet1.json'));
    const result = await extract(
      new URL('https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx'),
      {},
    );
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, expected);
  });

  it('Fails with 404 for non existing Excel workbook', async () => {
    const result = await extract(
      new URL('https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/not-exist.xlsx'),
      {},
    );

    assert.equal(result.statusCode, 404);
    assert.equal(result.body.length, 0);
  });

  it('Fails for non existing Excel workbook with onedrive uri', async () => {
    const result = await extract(
      new URL('onedrive:/drives/1234/items/5678'),
      {},
    );

    assert.equal(result.statusCode, 404);
    assert.equal(result.body.length, 0);
  });

  it('Fails for invalid onedrive items uri', async () => {
    const result = await extract(
      new URL('onedrive:/drives/1234/root'),
      {},
    );

    assert.equal(result.statusCode, 500);
    assert.equal(result.body.length, 0);
  });

  it('Fails for invalid onedrive uri', async () => {
    const result = await extract(
      new URL('onedrive:/1234'),
      {},
    );

    assert.equal(result.statusCode, 500);
    assert.equal(result.body.length, 0);
  });
});
