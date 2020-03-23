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

async function main(params) {
  /* istanbul ignore next */
  const { __ow_logger: log = console } = params;
  if (!params.__ow_path) {
    return {
      statusCode: 400,
      body: 'Expecting a path',
    };
  }

  if (!params.__ow_query) {
    // reconstruct __ow_query
    const query = Object.keys(params)
      .filter((key) => !/^[A-Z]+_[A-Z]+/.test(key))
      .filter((key) => key !== 'api')
      .filter((key) => !/^__ow_/.test(key))
      .reduce((pv, cv) => {
        if (pv) {
          return `${pv}&${cv}=${params[cv]}`;
        }
        return `${cv}=${params[cv]}`;
      }, '');
    // eslint-disable-next-line no-param-reassign
    params.__ow_query = query;
  }
  const url = `${params.__ow_path.substring(1)}?${params.__ow_query || ''}`;

  const result = await embed(url, params, log);
  return result;
}

module.exports.main = wrap(main)
  .with(epsagon)
  .with(status)
  .with(logger.trace)
  .with(logger);
