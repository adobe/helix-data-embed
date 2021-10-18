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
process.env.HELIX_FETCH_FORCE_HTTP1 = true;

/* eslint-env mocha */
const assert = require('assert');
// eslint-disable-next-line camelcase
const runQuery = require('../src/matchers/run-query.js');

describe('run query tests', () => {
  it('run query data embeds work', async () => {
    const EXPECTED_HEADERS = {
      'Cache-Control': 'max-age=600',
      'Content-Type': 'application/json',
    };
    const { body, headers, statusCode } = await runQuery.extract('https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500');
    assert.ok(Array.isArray(body));
    assert.deepEqual(EXPECTED_HEADERS, headers);
    assert.equal(statusCode, 200);
  }).timeout(6000);

  it('run query data embeds fail gracefully', async () => {
    const EXPECTED_HEADERS = {
      'Cache-Control': 'max-age=60',
      'Content-Type': 'application/json',
    };
    const { body, headers, statusCode } = await runQuery.extract('/run_query/fail');
    assert.ok(Array.isArray(body));
    assert.deepEqual(EXPECTED_HEADERS, headers);
    assert.equal(statusCode, 404);
  }).timeout(6000);
});
