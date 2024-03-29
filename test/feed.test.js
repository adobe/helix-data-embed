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
const { Request } = require('@adobe/helix-fetch');
const { main } = require('../src/index');

describe('Feed Tests', () => {
  it('Works for RSS Feeds', async () => {
    const response = await main(
      new Request('https://www.example.com/data-embed-action'),
      {
        env: {},
        pathInfo: {
          suffix: '/https://daringfireball.net/feeds/articles',
        },
      },
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.ok(body.data.length > 1);
  }).timeout(10000);

  it('Works for RSS Feeds with Limits', async () => {
    const response = await main(
      new Request('https://www.example.com/data-embed-action?limit=1'),
      {
        env: {},
        pathInfo: {
          suffix: '/https://daringfireball.net/feeds/main',
        },
      },
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.data.length, 1);
  }).timeout(10000);

  it('Rejects invalid RSS Feeds', async () => {
    const response = await main(
      new Request('https://www.example.com/data-embed-action?feed=atom&foo=bar'),
      {
        env: {},
        pathInfo: {
          suffix: '/https://example.com',
        },
      },
    );
    assert.equal(response.status, 500);
  }).timeout(5000);
});
