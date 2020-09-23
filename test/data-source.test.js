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
const querystring = require('querystring');
const dataSource = require('../src/data-source.js');

describe('Data Source Tests', () => {
  it('returns null for no path or src', () => {
    assert.equal(dataSource({}), null);
  });

  it('rejects paths not starting with https://', () => {
    assert.equal(dataSource({}), null);
  });

  it('rejects escaped paths not starting with https://', () => {
    assert.equal(dataSource({
      __ow_path: `/${querystring.escape('http://example.com')}`,
    }),
    null);
  });

  it('rejects src parameters not starting with scheme', () => {
    assert.equal(dataSource({
      src: '/example.com',
    }),
    null);
  });

  it('src parameters allows for different scheme', () => {
    assert.equal(dataSource({
      src: 'onedrive://drives/123123/items/234234',
    }),
    'onedrive://drives/123123/items/234234');
  });

  it('returns data source for `src` parameter', () => {
    const params = {
      src: 'https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2',
      hlx_limit: '1',
      foo: 'bar',
    };
    assert.equal(dataSource(params), 'https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2');
    assert.equal(params.__ow_query, 'hlx_limit=1&foo=bar');
  });

  it('returns data source for `src` parameter with different scheme', () => {
    const params = {
      src: 'onedrive://drives/1234/items/5677?a=1&b=2',
      hlx_limit: '1',
      foo: 'bar',
    };
    assert.equal(dataSource(params), 'onedrive://drives/1234/items/5677?a=1&b=2');
    assert.equal(params.__ow_query, 'hlx_limit=1&foo=bar');
  });

  it('returns data source for backward compat path parameter with no query', () => {
    const params = {
      __ow_path: '/https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2',
    };
    assert.equal(dataSource(params), 'https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2');
    assert.equal(params.__ow_query, '');
  });

  it('returns data source for backward compat path parameter and params', () => {
    const params = {
      __ow_path: '/https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500',
      a: 1,
      b: 2,
      hlx_limit: 1,
    };
    assert.equal(dataSource(params), 'https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2');
    assert.equal(params.__ow_query, 'a=1&b=2&hlx_limit=1');
  });

  it('returns data source for backward compat path parameter with query', () => {
    const params = {
      __ow_path: '/https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500',
      __ow_query: 'a=1&b=2',
    };
    assert.equal(dataSource(params), 'https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2');
    assert.equal(params.__ow_query, 'a=1&b=2');
  });

  it('returns data source for backward compat path parameter with query in params', () => {
    const params = {
      __ow_path: '/https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500',
      a: 1,
      b: 2,
    };
    assert.equal(dataSource(params), 'https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2');
    assert.equal(params.__ow_query, 'a=1&b=2');
  });

  it('returns data source for escaped path', () => {
    const params = {
      __ow_path: `/${querystring.escape('https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2')}`,
    };
    assert.equal(dataSource(params), 'https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2');
    assert.equal(params.__ow_query, '');
  });

  it('returns data source for escaped and mangled path', () => {
    // logs say: "message":"invalid source /https:%2F%2Fwww.youtube.com%2Fwatch%3Fv=TTCVn4EByfI"
    assert.equal(dataSource({
      __ow_path: '/https:%2F%2Fwww.youtube.com%2Fwatch%3Fv=TTCVn4EByfI',
    }),
    'https://www.youtube.com/watch?v=TTCVn4EByfI');
  });

  it('returns data source for unescaped and mangled path', () => {
    assert.equal(dataSource({
      __ow_path: '/https:/www.youtube.com/watch?v=TTCVn4EByfI',
    }),
    'https://www.youtube.com/watch?v=TTCVn4EByfI');
  });
});
