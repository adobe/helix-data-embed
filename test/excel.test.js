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
const exampleBook3 = require('./fixtures/book-without-default.js');
const exampleBook4 = require('./fixtures/book-without-helix.js');

const TEST_SHARE_LINK = 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx';
const TEST_SHARE_LINK_NO_TABLES = 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data-no-tables.xlsx';
const TEST_SHARE_LINK_NO_DEFAULT = 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data-no-default.xlsx';
const TEST_SHARE_LINK_NO_HELIX = 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data-no-helix.xlsx';

class DummyOneDrive extends OneDriveMock {
  constructor() {
    super();
    this.registerWorkbook('my-drive', 'my-item', exampleBook);
    this.registerWorkbook('my-drive', 'my-item-no-tables', exampleBook2);
    this.registerWorkbook('my-drive', 'my-item-no-default', exampleBook3);
    this.registerWorkbook('my-drive', 'my-item-no-helix', exampleBook4);
    this.registerShareLink(TEST_SHARE_LINK, 'my-drive', 'my-item');
    this.registerShareLink(TEST_SHARE_LINK_NO_TABLES, 'my-drive', 'my-item-no-tables');
    this.registerShareLink(TEST_SHARE_LINK_NO_DEFAULT, 'my-drive', 'my-item-no-default');
    this.registerShareLink(TEST_SHARE_LINK_NO_HELIX, 'my-drive', 'my-item-no-helix');
    this.registerDriveItem('my-drive', 'my-item', { lastModifiedDateTime: new Date().toISOString() });
    this.registerDriveItem('my-drive', 'my-item-no-tables', { lastModifiedDateTime: new Date().toISOString() });
    this.registerDriveItem('my-drive', 'my-item-no-default', { lastModifiedDateTime: new Date().toISOString() });
    this.registerDriveItem('my-drive', 'my-item-no-helix', {});
  }

  registerDriveItem(driveId, itemId, data) {
    super.registerDriveItem(driveId, itemId, {
      id: itemId,
      parentReference: {
        driveId,
      },
      ...data,
    });
  }
}

describe('Excel Tests', () => {
  const { extract, accept } = proxyquire('../src/matchers/excel.js', {
    '@adobe/helix-onedrive-support': {
      OneDrive: DummyOneDrive,
    },
  });

  it('Test patterns', () => {
    assert.ok(accept(new URL('https://example.sharepoint.com/')));
    assert.ok(accept(new URL('onedrive:/drives/my-drive/items/my-item')));
  });

  it('Returns 404 for Excel Workbooks with no default sheet', async () => {
    const result = await extract(
      new URL('https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data-no-default.xlsx'),
      {},
    );
    assert.equal(result.statusCode, 404);
  });

  it('Returns 404 for Excel Workbooks with wrong sheet name', async () => {
    const result = await extract(
      new URL('https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data-no-default.xlsx'),
      {
        sheet: 'foo',
      },
    );
    assert.equal(result.statusCode, 404);
  });

  it('Works for Excel Workbooks with no default but sheet name', async () => {
    const expected = await fs.readJson(path.resolve(__dirname, 'fixtures', 'example-data-sheet1.json'));
    const result = await extract(
      new URL('https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data-no-default.xlsx'),
      {
        sheet: 'countries',
      },
    );
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, expected);
  });

  it('Works for Excel Workbooks with no helix sheet', async () => {
    const expected = await fs.readJson(path.resolve(__dirname, 'fixtures', 'example-data-sheet1.json'));
    const result = await extract(
      new URL('https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data-no-helix.xlsx'),
      {},
    );
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, expected);
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

  it('Works for Excel Workbooks with tables (index)', async () => {
    const expected = await fs.readJson(path.resolve(__dirname, 'fixtures', 'example-data-sheet1.json'));
    const result = await extract(
      new URL('https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx'),
      {
        table: '0',
      },
    );
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, expected);
  });

  it('Works for Excel Workbooks with tables (name)', async () => {
    const expected = await fs.readJson(path.resolve(__dirname, 'fixtures', 'example-data-sheet1.json'));
    const result = await extract(
      new URL('https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx'),
      {
        table: 'Table1',
      },
    );
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, expected);
  });

  it('Returns 404 for wrong table name', async () => {
    const result = await extract(
      new URL('https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx'),
      {
        table: 'foo',
      },
    );
    assert.equal(result.statusCode, 404);
  });

  it('Returns 404 for wrong table index', async () => {
    const result = await extract(
      new URL('https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx'),
      {
        table: '99',
      },
    );
    assert.equal(result.statusCode, 404);
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
