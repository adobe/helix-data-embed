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
const { wrap } = require('@adobe/openwhisk-action-utils');
const { logger } = require('@adobe/openwhisk-action-logger');
const { wrap: status } = require('@adobe/helix-status');
const { epsagon } = require('@adobe/helix-epsagon');
const embed = require('./embed');
const { loadquerystring } = require('./querybuilder/url');
const { createfilter } = require('./querybuilder/filter');
const dataSource = require('./data-source.js');

const MAX_DATA_SIZE = 750000;

async function main(params) {
  /* istanbul ignore next */
  const { __ow_logger: log = console } = params;
  const url = dataSource((params));
  if (!url) {
    return {
      statusCode: 400,
      body: 'Expecting a datasource',
    };
  }
  log.info(`data-embed for datasource ${url}`);
  const qbquery = loadquerystring(params.__ow_query, 'hlx_');
  log.debug('QB query', qbquery);
  const filter = createfilter(qbquery);
  log.debug('QB filter', filter);
  const result = await embed(url, params, log);

  const { body } = result;
  delete result.body;
  log.debug('result', result);
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
  return {
    ...result,
    body: {
      total: body.length,
      offset: filter.offset || 0,
      limit: filtered.length,
      data: filtered,
    },
  };
}

module.exports.main = wrap(main)
  .with(epsagon)
  .with(status)
  .with(logger.trace)
  .with(logger);
