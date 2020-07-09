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
/* eslint-disable camelcase */
const { fetch } = require('@adobe/helix-fetch');
const { utils } = require('@adobe/helix-shared');

async function extract(url, params, log = console) {
  const host = 'https://adobeioruntime.net';
  const path = '/api/v1/web/helix/helix-services/run-query@v2/';
  const query = url.split('/').pop();
  const resource = `${host}${path}${query}`;
  const DEFAULT_CACHE = 'max-age=600';

  const results = await fetch(url.startsWith(host) ? url : resource);
  const statusCode = utils.propagateStatusCode(results.status);
  const logLevel = utils.logLevelForStatusCode(results.status);
  const cacheControl = results.headers.get('cache-control');

  try {
    if (!results.ok) {
      throw new Error(await results.text());
    }
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': cacheControl || DEFAULT_CACHE,
      },
      body: (await results.json()).results,
    };
  } catch (e) {
    log[logLevel](`data request to ${resource} failed ${e.message}`);
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60',
      },
      body: [],
    };
  }
}

module.exports = {
  name: 'run-query',
  required: [],
  pattern: (url) => /(^https:\/\/adobeioruntime\.net\/api\/v1\/web\/helix\/helix-services\/run-query@.*)/.test(url)
    || /^\/?_query\/run-query\/.*$/.test(new URL(url).pathname),
  extract,
};
