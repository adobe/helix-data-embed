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
const { Response } = require('@adobe/helix-universal');
const { wrap } = require('@adobe/helix-shared');
const { logger } = require('@adobe/helix-universal-logger');
const { wrap: helixStatus } = require('@adobe/helix-status');
const embed = require('./embed');
const { loadquerystring } = require('./querybuilder/url');
const { createfilter } = require('./querybuilder/filter');
const dataSource = require('./data-source.js');

const MAX_DATA_SIZE = 750000;

async function main(req, context) {
  /* istanbul ignore next */
  const { log = console } = context;
  const url = dataSource(req, context);
  if (!url) {
    return new Response('Expecting a datasource', {
      status: 400,
    });
  }
  try {
    const { searchParams } = new URL(req.url);

    log.info(`data-embed for datasource ${url}`);
    const qbquery = loadquerystring(searchParams, 'hlx_');
    log.debug('QB query', qbquery);
    const filter = createfilter(qbquery);
    log.debug('QB filter', filter);
    const params = Array.from(searchParams.entries()).reduce((p, [key, value]) => {
      // eslint-disable-next-line no-param-reassign
      p[key] = value;
      return p;
    }, {});
    const result = await embed(url, params, context.env, log);

    const {
      body,
      statusCode: status,
      headers,
    } = result;
    log.debug(`result body size: ${JSON.stringify(body).length}`);
    const filtered = filter(body);
    let size = JSON.stringify(filtered).length;
    log.info(`filtered result ${filtered.length} rows. size: ${size}`);
    if (size > MAX_DATA_SIZE) {
      // todo: could be optimized to be more accurate using some binary search approach
      const avgRowSize = size / filtered.length;
      const retain = Math.floor(MAX_DATA_SIZE / avgRowSize);
      filtered.splice(retain, filtered.length - retain);
      size = JSON.stringify(filtered).length;
      log.info(`result truncated to ${filtered.length} rows. size: ${size}`);
    }
    const bodyText = JSON.stringify({
      total: body.length,
      offset: filter.offset || 0,
      limit: filtered.length,
      data: filtered,
    });
    return new Response(bodyText, {
      status,
      headers,
    });
  } catch (e) {
    log.error('error fetching data', e);
    return new Response('error fetching data', {
      status: 500,
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store, private, must-revalidate',
      },
    });
  }
}

module.exports.main = wrap(main)
  .with(helixStatus)
  .with(logger.trace)
  .with(logger);
