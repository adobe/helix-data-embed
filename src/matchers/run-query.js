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

async function extract(url, params, log = console) {
  const host = 'https://adobeioruntime.net';
  const path = '/api/v1/web/helix/helix-services/run-query@latest/';
  const query = url.split('/').pop();
  const resource = `${host}${path}${query}`;

  const results = await fetch(resource);

  if (results.ok) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=600',
      },
      body: (await results.json()).results,
    };
  } else {
    const errText = await results.text();
    log.error(`data request to ${resource} failed ${errText}`);
    return {
      statusCode: results.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=600',
      },
      body: [],
    };
  }
}

module.exports = {
  required: [],
  pattern: (url) => /.*run_query.*/.test(url),
  extract,
};
