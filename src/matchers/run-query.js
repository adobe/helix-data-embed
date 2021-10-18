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
const { propagateStatusCode, logLevelForStatusCode } = require('@adobe/helix-shared-utils');
const fetchAPI = require('@adobe/helix-fetch');

const { fetch } = process.env.HELIX_FETCH_FORCE_HTTP1
  ? /* istanbul ignore next */ fetchAPI.h1()
  : /* istanbul ignore next */ fetchAPI;

async function extract(url, params, env, log = console) {
  const host = 'https://adobeioruntime.net';
  const path = '/api/v1/web/helix/helix-services/run-query@v2/';
  const query = url.toString().split('/').pop();
  const resource = `${host}${path}${query}`;
  const DEFAULT_CACHE = 'max-age=600';

  const results = await fetch(url.hostname === 'adobeioruntime.net' ? url.toString() : resource);
  const statusCode = propagateStatusCode(results.status);
  const logLevel = logLevelForStatusCode(results.status);
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
      body: [{
        name: 'run-query',
        data: (await results.json()).results,
      }],
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
  accept: (url) => /(^https:\/\/adobeioruntime\.net\/api\/v1\/web\/helix\/helix-services\/run-query@.*)/.test(url)
    || /^\/?_query\/run-query\/.*$/.test(url.pathname),
  extract,
};
