/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const { promisify } = require('util');
const zlib = require('zlib');
const fetchAPI = require('@adobe/helix-fetch');

const gzip = promisify(zlib.gzip);

const { Response, context, ALPN_HTTP1_1 } = fetchAPI;
const { fetch } = process.env.HELIX_FETCH_FORCE_HTTP1
  ? context({
    alpnProtocols: [ALPN_HTTP1_1],
    userAgent: 'helix-fetch', // static user agent for test recordings
  })
  /* istanbul ignore next */
  : fetchAPI;

async function store(data, hdrs, url) {
  console.log('storing headers:', hdrs);
  const headers = {
    'content-type': 'application/json',
    'content-encoding': 'gzip',
  };
  if (hdrs['x-source-location']) {
    headers['x-amz-meta-x-source-location'] = hdrs['x-source-location'];
  }
  console.log('put url:', url);
  console.log('put headers:', headers);
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: await gzip(Buffer.from(JSON.stringify(data), 'utf-8')),
  });

  const msg = await res.text();
  console.log(res.status);
  console.log(msg);
  console.log(res.headers.plain());
  if (res.ok) {
    return new Response('', {
      status: 200,
    });
  }

  return new Response('', {
    status: res.status,
  });
}

module.exports = store;
