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

const matchers = [
  feed,
];

function hasParams(list, params) {
  const empty = list.filter((parameter) => params[parameter] === undefined);
  return empty.length === list.length;
}

function embed(url, params, log) {
  const matching = matchers
    .filter((candidate) => hasParams(candidate.required, params))
    .find((candidate) => candidate.pattern(url));

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

  return matching.extract(url, params);
}

module.exports = embed;
