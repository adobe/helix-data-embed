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

describe('Feed Tests', () => {
  it('Works for RSS Feeds', async () => {
    const result = await main({
      __ow_path: '/https://blogs.adobe.com/psirt/',
      __ow_query: 'feed=atom',
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.length, 10);
  }).timeout(10000);

  it('Works for RSS Feeds with Limits', async () => {
    const result = await main({
      __ow_path: '/https://blogs.adobe.com/psirt/',
      __ow_query: 'feed=atom&hlx_p.limit=1',
    });
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.length, 1);
  }).timeout(10000);

  it('Rejects invalid RSS Feeds', async () => {
    const result = await main({
      __ow_path: '/https://example.com',
      feed: 'atom',
      foo: 'bar',
    });
    assert.equal(result.statusCode, 500);
  }).timeout(5000);
});
