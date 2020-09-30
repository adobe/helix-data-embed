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
const proxyquire = require('proxyquire');
const { main } = require('../src/index');

const TEST_DATA = [];
for (let i = 0; i < 10000; i += 1) {
  const col = [];
  TEST_DATA.push(col);
  for (let j = 0; j < 10; j += 1) {
    col.push(`cell(${i},${j})`);
  }
}

describe('Integration Tests', () => {
  it('Rejects missing URLs', async () => {
    const result = await main({
      __ow_logger: console,
    });
    assert.equal(result.statusCode, 400);
  });

  it('tests index with absolute run_query url', async () => {
    const EXPECTED_HEADERS = {
      'Cache-Control': 'max-age=600',
      'Content-Type': 'application/json',
    };
    const { body, headers, statusCode } = await main({
      __ow_path: '/https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500',
    });

    assert.ok(Array.isArray(body.data));
    assert.deepEqual(headers, EXPECTED_HEADERS);
    assert.equal(statusCode, 200);
  })
    .timeout(6000);

  it('tests index with relative run_query url', async () => {
    const EXPECTED_HEADERS = {
      'Cache-Control': 'max-age=600',
      'Content-Type': 'application/json',
    };
    const { body, headers, statusCode } = await main({
      __ow_path: '/https://example.com/_query/run-query/error500',
      __ow_query: 'fromMins=1000&toMins=0',
    });

    assert.ok(Array.isArray(body.data));
    assert.deepEqual(headers, EXPECTED_HEADERS);
    assert.equal(statusCode, 200);
  }).timeout(60000);

  it('Rejects missing parameters', async () => {
    const result = await main();
    assert.equal(result.statusCode, 400);
  });

  it('Rejects unknown URLs', async () => {
    const result = await main({
      __ow_path: '/https://example.com',
    });
    assert.equal(result.statusCode, 404);
  });
});

describe('Index result Tests', () => {
  it('handles limit correctly', async () => {
    const { main: customMain } = proxyquire('../src/index.js', {
      './embed.js': () => ({
        body: TEST_DATA,
      }),
    });
    const result = await customMain({
      src: 'https://foo.com',
      'hlx_p.limit': 10,
    });
    assert.deepEqual(result, {
      body: {
        data: TEST_DATA.slice(0, 10),
        limit: 10,
        offset: 0,
        total: 10000,
      },
    });
  });

  it('handles offset correctly', async () => {
    const { main: customMain } = proxyquire('../src/index.js', {
      './embed.js': () => ({
        body: TEST_DATA,
      }),
    });
    const result = await customMain({
      src: 'https://foo.com',
      'hlx_p.offset': 9000,
    });
    assert.deepEqual(result, {
      body: {
        data: TEST_DATA.slice(9000),
        limit: 1000,
        offset: 9000,
        total: 10000,
      },
    });
  });

  it('handles limit and offset correctly', async () => {
    const { main: customMain } = proxyquire('../src/index.js', {
      './embed.js': () => ({
        body: TEST_DATA,
      }),
    });
    const result = await customMain({
      src: 'https://foo.com',
      'hlx_p.limit': 50,
      'hlx_p.offset': 100,
    });
    assert.deepEqual(result, {
      body: {
        data: TEST_DATA.slice(100, 150),
        limit: 50,
        offset: 100,
        total: 10000,
      },
    });
  });

  it('truncates result if too large for action response', async () => {
    const { main: customMain } = proxyquire('../src/index.js', {
      './embed.js': () => ({
        body: TEST_DATA,
      }),
    });
    const result = await customMain({
      src: 'https://foo.com',
    });
    assert.deepEqual(result, {
      body: {
        data: TEST_DATA.slice(0, 4970),
        limit: 4970,
        offset: 0,
        total: 10000,
      },
    });
  });
});
