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
    assert.equal(dataSource({
      url: 'https://www.example.com/foo',
    }, {}), null);
  });

  it('rejects paths not starting with https://', () => {
    assert.equal(dataSource({
      url: 'https://www.example.com/foo',
    }, {
      pathInfo: {
        suffix: '/http://example.com',
      },
    }), null);
  });

  it('rejects escaped paths not starting with https://', () => {
    assert.equal(dataSource({
      url: 'https://www.example.com/foo',
    }, {
      pathInfo: {
        suffix: `/${querystring.escape('http://example.com')}`,
      },
    }), null);
  });

  it('rejects src parameters not starting with scheme', () => {
    assert.equal(dataSource({
      url: 'https://www.example.com/foo?src=/example.com',
    }, {}), null);
  });

  it('src parameters allows for different scheme', () => {
    assert.equal(dataSource({
      url: `https://www.example.com/foo?${querystring.stringify({
        src: 'onedrive://drives/123123/items/234234',
      })}`,
    }, {}),
    'onedrive://drives/123123/items/234234');
  });

  it('returns data source for `src` parameter', () => {
    assert.equal(dataSource({
      url: `https://www.example.com/foo?${querystring.stringify({
        src: 'https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2',
        hlx_limit: '1',
        foo: 'bar',
      })}`,
    }, {}),
    'https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2');
  });

  it('returns data source for `src` parameter with different scheme', () => {
    assert.equal(dataSource({
      url: `https://www.example.com/foo?${querystring.stringify({
        src: 'onedrive://drives/1234/items/5677?a=1&b=2',
        hlx_limit: '1',
        foo: 'bar',
      })}`,
    }, {}),
    'onedrive://drives/1234/items/5677?a=1&b=2');
  });

  it('returns data source for backward compat path parameter with no query', () => {
    assert.equal(dataSource({
      url: 'https://www.example.com/foo',
    }, {
      pathInfo: {
        suffix: '/https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2',
      },
    }),
    'https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2');
  });

  it('returns data source for backward compat path parameter and params', () => {
    assert.equal(dataSource({
      url: `https://www.example.com/foo?${querystring.stringify({
        a: 1,
        b: 2,
        hlx_limit: 1,
      })}`,
    }, {
      pathInfo: {
        suffix: '/https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500',
      },
    }),
    'https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2');
  });

  it('returns data source for escaped path', () => {
    assert.equal(dataSource({
      url: 'https://www.example.com/foo',
    }, {
      pathInfo: {
        suffix: `/${querystring.escape('https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2')}`,
      },
    }),
    'https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500?a=1&b=2');
  });

  it('returns data source for escaped and mangled path', () => {
    assert.equal(dataSource({
      url: 'https://www.example.com/foo',
    }, {
      pathInfo: {
        suffix: '/https:%2F%2Fwww.youtube.com%2Fwatch%3Fv=TTCVn4EByfI',
      },
    }),
    'https://www.youtube.com/watch?v=TTCVn4EByfI');
  });

  it('returns data source for unescaped and mangled path', () => {
    assert.equal(dataSource({
      url: 'https://www.example.com/foo',
    }, {
      pathInfo: {
        suffix: '/https:/www.youtube.com/watch?v=TTCVn4EByfI',
      },
    }),
    'https://www.youtube.com/watch?v=TTCVn4EByfI');
  });
});
