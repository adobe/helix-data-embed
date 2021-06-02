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
const wrap = require('@adobe/helix-shared-wrap');
const { logger } = require('@adobe/helix-universal-logger');
const { wrap: helixStatus } = require('@adobe/helix-status');
const embed = require('./embed');
const dataSource = require('./data-source.js');

const TYPE_KEY = ':type';

const VERSION_KEY = ':version';

const NAMES_KEY = ':names';

const MAX_SIZES = {
  'apache-openwhisk': 750000,
  'aws-lambda': 900 * 1000 * 6, // give 10% error margin
  'googlecloud-functions': 1024 * 1024 * 32,
  'azure-functions': 1024 * 1024 * 100,
};

/**
 * Returns the max size for the given environment
 * @param {UniversalContext} context
 * @return {number} the maximum response size
 */
function getMaxSize(context) {
  const name = context.runtime && context.runtime.name;
  return MAX_SIZES[name] || Number.MAX_SAFE_INTEGER;
}

function createfilter(params) {
  const offset = Number.parseInt(params.offset || params['hlx_p.offset'], 10) || 0;
  let limit = Number.parseInt(params.limit || params['hlx_p.limit'], 10) || undefined;
  if (limit && offset) {
    limit += offset;
  }

  // return a function that can filter the data
  const filter = (data) => data.slice(offset, limit);
  filter.offset = offset;
  filter.limit = limit;
  return filter;
}

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
    log.info(`data-embed for datasource ${url}`);

    const sp = new URL(req.url).searchParams;
    const params = Object.fromEntries(sp.entries());
    if (params.sheet) {
      params.sheet = sp.getAll('sheet');
    }
    // little workaround to get authorization header to the embedders
    const env = {
      ...context.env,
      AUTHORIZATION: req.headers.get('authorization'),
    };
    const filter = createfilter(params);
    const result = await embed(url, params, env, log);

    const {
      body,
      statusCode: status,
      headers,
    } = result;

    // if not data set, return
    if (body.length === 0) {
      return new Response('[]', {
        status,
        headers,
      });
    }

    // default to multi sheet
    let ret = {
      [TYPE_KEY]: 'multi-sheet',
      [NAMES_KEY]: [],
    };

    // todo: support per-sheet limits, offsets
    let numRows = 0;
    body.forEach(({ name, data }) => {
      ret[NAMES_KEY].push(name);
      const filtered = filter(data);
      ret[name] = {
        total: data.length,
        offset: filter.offset || 0,
        limit: filtered.length,
        data: filtered,
      };
      numRows += filtered.length;
    });

    let size = JSON.stringify(ret).length;
    log.info(`filtered result ${numRows} rows. size: ${size}.`);
    const maxSize = getMaxSize(context);
    if (size > maxSize) {
      // todo: could be optimized to be more accurate using some binary search approach
      const avgRowSize = size / numRows;
      const retain = Math.floor(maxSize / avgRowSize);
      const retainPerDataSet = Math.ceil(retain / body.length);
      numRows = 0;
      ret[NAMES_KEY].forEach((name) => {
        const set = ret[name];
        set.data.splice(retainPerDataSet, set.data.length - retainPerDataSet);
        set.limit = set.data.length;
        numRows += set.data.length;
      });
      size = JSON.stringify(ret).length;
      log.info(`result truncated to ${numRows} rows. size: ${size}.`);
    }

    // if only 1 data set, unwrap it
    if (ret[NAMES_KEY].length === 1) {
      ret = ret[ret[NAMES_KEY][0]];
      ret[TYPE_KEY] = 'sheet';
    }
    ret[VERSION_KEY] = 3;
    const bodyText = JSON.stringify(ret);
    return new Response(bodyText, {
      status,
      headers,
    });
  } catch (e) {
    log.error('error fetching data', e);
    return new Response('error fetching data', {
      status: 500,
      headers: {
        'content-type': 'text/plain',
        'cache-control': 'no-store, private, must-revalidate',
      },
    });
  }
}

module.exports.main = wrap(main)
  .with(helixStatus)
  .with(logger.trace)
  .with(logger);
