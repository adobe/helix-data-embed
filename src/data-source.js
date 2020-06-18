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
const querystring = require('querystring');

/**
 * Analyses the params and extracts the data source, which is specified by a `src` param.
 * For backward compatibility, the source can also be added as path, either escaped or unescaped.
 *
 * @param {string} params the openwhisk action params
 * @return {URL} the extracted data source or null
 */
function dataSource(params) {
  const { __ow_path: path = '', src = '' } = params;
  let url = null;
  if (!path) {
    if (!src.startsWith('https://')) {
      return null;
    }
    url = new URL(params.src);

  // expect the _ow_path to start with /https:// or /https%3a%2f%2f
  } else if (path.startsWith('/https%3A%2F%2F')) {
    url = new URL(decodeURIComponent(path.substring(1)));
  } else if (!path.startsWith('/https://')) {
    return null;
  } else {
    url = new URL(path.substring(1));
  }

  if (!params.__ow_query) {
    // reconstruct __ow_query
    const q = {};
    Object.keys(params)
      .filter((key) => !/^[A-Z]+_[A-Z]+/.test(key))
      .filter((key) => key !== 'api')
      .filter((key) => key !== 'src')
      .filter((key) => !/^__ow_/.test(key))
      .forEach((key) => {
        q[key] = params[key];
        // don't append querybuilder keys to source or if a src param was given
        if (!key.startsWith('hlx_') && !params.src) {
          url.searchParams.append(key, params[key]);
        }
      });
    // eslint-disable-next-line no-param-reassign
    params.__ow_query = querystring.stringify(q);
  } else {
    // else add it to the url
    Object.entries(querystring.parse(params.__ow_query))
      .filter(([key]) => (!key.startsWith('hlx_')))
      .forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
  }
  return url;
}

module.exports = dataSource;
