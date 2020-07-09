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
const feed = require('./matchers/feed');
const excel = require('./matchers/excel');
const google = require('./matchers/google');
// eslint-disable-next-line camelcase
const runQuery = require('./matchers/run-query');

const matchers = [
  feed, excel, google, runQuery,
];

function hasParams(list, params) {
  const empty = list.filter((parameter) => params[parameter] !== undefined);
  return empty.length === list.length;
}

function embed(url, params, log) {
  const candidates = matchers
    .filter((candidate) => hasParams(candidate.required, params));

  const matching = candidates.find((candidate) => candidate.pattern(url));

  if (!url || !matching) {
    log.warn(`No matcher found for URL ${url}`);
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=3600',
      },
      body: [],
    };
  }
  log.info(`found handler for ${url}: ${matching.name}`);

  return matching.extract(url, params, log);
}

module.exports = embed;
