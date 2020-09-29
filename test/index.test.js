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

    assert.ok(Array.isArray(body));
    assert.deepEqual(EXPECTED_HEADERS, headers);
    assert.equal(statusCode, 200);
  }).timeout(6000);

  it('tests index with relative run_query url', async () => {
    const EXPECTED_HEADERS = {
      'Cache-Control': 'max-age=60',
      'Content-Type': 'application/json',
    };
    const { body, headers, statusCode } = await main({
      __ow_path: '/https://example.com/_query/run-query/error500',
      __ow_query: 'fromMins=1000&toMins=0',
    });

    assert.ok(Array.isArray(body));
    assert.deepEqual(EXPECTED_HEADERS, headers);
    assert.equal(statusCode, 200);
  }).timeout(6000);

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
