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
const querystring = require('querystring');
const proxyquire = require('proxyquire');
const nock = require('nock');
const { Request } = require('@adobe/helix-universal');
const { DataEmbedValidator } = require('@adobe/helix-shared-config');
const { main } = require('../src/index');

const log = {
  debug: console.log,
  info: console.log,
  warn: console.log,
  error: console.error,
  trace: console.log,
};

const TEST_DATA = [];
for (let i = 0; i < 10000; i += 1) {
  const row = {};
  TEST_DATA.push(row);
  for (let j = 0; j < 10; j += 1) {
    row[`col${j}`] = `cell(${i},${j})`;
  }
}

function validate(data) {
  const validator = new DataEmbedValidator();
  validator.assertValid(data);
}

describe('Integration Tests', async () => {
  it('Rejects missing URLs', async () => {
    const response = await main(new Request('https://www.example.com/data-embed-action'), { log });
    assert.equal(response.status, 400);
  });

  it('tests index with absolute run_query url', async () => {
    const EXPECTED_HEADERS = {
      'cache-control': 'max-age=600',
      'content-type': 'application/json',
    };
    const response = await main(
      new Request('https://www.example.com/data-embed-action'),
      {
        env: {},
        log,
        pathInfo: {
          suffix: '/https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@2.4.11/error500',
        },
      },
    );

    const { headers, status } = response;
    assert.equal(status, 200);
    const body = await response.json();
    await validate(body);
    assert.deepEqual(headers.plain(), EXPECTED_HEADERS);
  })
    .timeout(60000);

  it('tests index with relative run_query url', async () => {
    const EXPECTED_HEADERS = {
      'cache-control': 'max-age=600',
      'content-type': 'application/json',
    };
    const response = await main(
      new Request('https://www.example.com/data-embed-action?fromMins=1000&toMins=0'),
      {
        log,
        env: {},
        pathInfo: {
          suffix: '/https://example.com/_query/run-query/error500',
        },
      },
    );

    const { headers, status } = response;
    const body = await response.json();
    await validate(body);
    assert.deepEqual(headers.plain(), EXPECTED_HEADERS);
    assert.equal(status, 200);
  }).timeout(60000);

  it('Rejects unknown URLs', async () => {
    const response = await main(
      new Request('https://www.example.com/data-embed-action?'),
      {
        log,
        env: {},
        pathInfo: {
          suffix: '/https://example.com',
        },
      },
    );
    assert.equal(response.status, 404);
  });
});

describe('Index result Tests', () => {
  it('handles limit correctly', async () => {
    const { main: customMain } = proxyquire('../src/index.js', {
      './embed.js': () => ({
        body: [{
          name: 'helix-default',
          data: TEST_DATA,
        }],
      }),
    });
    const response = await customMain(
      new Request(`https://www.example.com/data-embed-action?${querystring.stringify({
        src: 'https://foo.com',
        limit: 10,
      })}`),
      { log },
    );
    const data = await response.json();
    await validate(data);
    assert.deepEqual(data, {
      ':version': 3,
      ':type': 'sheet',
      data: TEST_DATA.slice(0, 10),
      limit: 10,
      offset: 0,
      total: 10000,
    });
  });

  it('handles offset correctly', async () => {
    const { main: customMain } = proxyquire('../src/index.js', {
      './embed.js': () => ({
        body: [{
          name: 'helix-default',
          data: TEST_DATA,
        }],
      }),
    });
    const response = await customMain(
      new Request(`https://www.example.com/data-embed-action?${querystring.stringify({
        src: 'https://foo.com',
        offset: 9000,
      })}`),
      { log },
    );
    const data = await response.json();
    await validate(data);
    assert.deepEqual(data, {
      ':version': 3,
      ':type': 'sheet',
      data: TEST_DATA.slice(9000),
      limit: 1000,
      offset: 9000,
      total: 10000,
    });
  });

  it('handles limit and offset correctly', async () => {
    const { main: customMain } = proxyquire('../src/index.js', {
      './embed.js': () => ({
        body: [{
          name: 'helix-default',
          data: TEST_DATA,
        }],
      }),
    });
    const response = await customMain(
      new Request(`https://www.example.com/data-embed-action?${querystring.stringify({
        src: 'https://foo.com',
        limit: 50,
        offset: 100,
      })}`),
      { log },
    );
    const data = await response.json();
    await validate(data);
    assert.deepEqual(data, {
      ':version': 3,
      ':type': 'sheet',
      data: TEST_DATA.slice(100, 150),
      limit: 50,
      offset: 100,
      total: 10000,
    });
  });

  it('handles limit and offset with qb properties correctly', async () => {
    const { main: customMain } = proxyquire('../src/index.js', {
      './embed.js': () => ({
        body: [{
          name: 'helix-default',
          data: TEST_DATA,
        }],
      }),
    });
    const response = await customMain(
      new Request(`https://www.example.com/data-embed-action?${querystring.stringify({
        src: 'https://foo.com',
        'hlx_p.limit': 50,
        'hlx_p.offset': 100,
      })}`),
      { log },
    );
    const data = await response.json();
    await validate(data);
    assert.deepEqual(data, {
      ':version': 3,
      ':type': 'sheet',
      data: TEST_DATA.slice(100, 150),
      limit: 50,
      offset: 100,
      total: 10000,
    });
  });

  it('handles limit and offset correctly for multiple sheets', async () => {
    const { main: customMain } = proxyquire('../src/index.js', {
      './embed.js': () => ({
        body: [{
          name: 'one',
          data: TEST_DATA,
        }, {
          name: 'two',
          data: TEST_DATA,
        }],
      }),
    });
    const response = await customMain(
      new Request(`https://www.example.com/data-embed-action?${querystring.stringify({
        src: 'https://foo.com',
        limit: 50,
        offset: 100,
      })}`),
      { log },
    );
    const data = await response.json();
    await validate(data);
    assert.deepEqual(data, {
      ':type': 'multi-sheet',
      ':version': 3,
      ':names': [
        'one',
        'two',
      ],
      one: {
        data: TEST_DATA.slice(100, 150),
        limit: 50,
        offset: 100,
        total: 10000,
      },
      two: {
        data: TEST_DATA.slice(100, 150),
        limit: 50,
        offset: 100,
        total: 10000,
      },
    });
  });

  it('truncates result if too large for action response in openwhisk', async () => {
    const { main: customMain } = proxyquire('../src/index.js', {
      './embed.js': () => ({
        body: [{
          name: 'helix-default',
          data: TEST_DATA,
        }],
      }),
    });
    const response = await customMain(
      new Request(`https://www.example.com/data-embed-action?${querystring.stringify({
        src: 'https://foo.com',
      })}`),
      {
        log,
        runtime: {
          name: 'apache-openwhisk',
        },
      },
    );
    const data = await response.json();
    await validate(data);
    assert.deepEqual(data, {
      ':version': 3,
      ':type': 'sheet',
      data: TEST_DATA.slice(0, 3395),
      limit: 3395,
      offset: 0,
      total: 10000,
    });
  });

  it('does not truncate result if too large with presigned storage url', async () => {
    const scope = nock('https://www.example.com')
      .put('/store/this?signed=1234')
      .reply(200);

    const { main: customMain } = proxyquire('../src/index.js', {
      './embed.js': () => ({
        body: [{
          name: 'helix-default',
          data: TEST_DATA,
        }],
        headers: {
          'x-source-location': '/drive/1234',
        },
      }),
    });
    const response = await customMain(
      new Request(`https://www.example.com/data-embed-action?${querystring.stringify({
        src: 'https://foo.com',
        presignedStorageUrl: 'https://www.example.com/store/this?signed=1234',
      })}`),
      {
        log,
        runtime: {
          name: 'apache-openwhisk',
        },
      },
    );
    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.headers.get('location'), 'https://www.example.com/store/this');
    await scope.done();
  });

  it('propagates error with presigned url', async () => {
    const scope = nock('https://www.example.com')
      .put('/store/this?signed=1234')
      .reply(403);

    const { main: customMain } = proxyquire('../src/index.js', {
      './embed.js': () => ({
        body: [{
          name: 'helix-default',
          data: TEST_DATA,
        }],
        headers: {
          'x-source-location': '/drive/1234',
        },
      }),
    });
    const response = await customMain(
      new Request(`https://www.example.com/data-embed-action?${querystring.stringify({
        src: 'https://foo.com',
        presignedStorageUrl: 'https://www.example.com/store/this?signed=1234',
      })}`),
      {
        log,
        runtime: {
          name: 'apache-openwhisk',
        },
      },
    );
    assert.strictEqual(response.status, 403);
    await scope.done();
  });

  it('does not truncate result if too large for action response in lambda', async () => {
    const { main: customMain } = proxyquire('../src/index.js', {
      './embed.js': () => ({
        body: [{
          name: 'helix-default',
          data: TEST_DATA,
        }],
      }),
    });
    const response = await customMain(
      new Request(`https://www.example.com/data-embed-action?${querystring.stringify({
        src: 'https://foo.com',
      })}`),
      {
        log,
        runtime: {
          name: 'aws-lambda',
        },
      },
    );
    const data = await response.json();
    await validate(data);
    assert.deepEqual(data, {
      ':version': 3,
      ':type': 'sheet',
      data: TEST_DATA,
      limit: 10000,
      offset: 0,
      total: 10000,
    });
  });
});
