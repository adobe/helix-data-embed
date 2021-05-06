/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
const { cleanupHeaderValue } = require('@adobe/helix-shared-utils');

async function extract(tabular, params, log) {
  const {
    sheet,
    table,
  } = params;
  try {
    const sheets = (Array.isArray(sheet) ? sheet : [sheet]).filter((s) => !!s);
    const sheetNames = await tabular.selectSheetNames(sheets);

    // if no sheets, return 404
    if (sheetNames.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'cache-control': 'no-store, private, must-revalidate',
        },
        body: [],
      };
    }

    const body = await Promise.all(sheetNames.map(async (name) => {
      const data = await tabular.getData(name, table);
      log.info(`fetched sheet data ${name}: ${data.length} rows.`);
      return {
        name: name.startsWith('helix-') ? name.substring(6) : name,
        data,
      };
    }));

    const headers = {
      'Content-Type': 'application/json',
      'cache-control': 'no-store, private, must-revalidate',
    };
    const lastModified = await tabular.getLastModified();
    if (lastModified) {
      headers['Last-Modified'] = new Date(lastModified).toUTCString();
    }
    return {
      statusCode: 200,
      headers,
      body,
    };
  } catch (e) {
    log.error(e.message);
    return {
      statusCode: e.statusCode || 500,
      headers: {
        'Content-Type': 'application/json',
        'cache-control': 'no-store, private, must-revalidate',
        'x-error': cleanupHeaderValue(e.message),
      },
      body: [],
    };
  }
}

module.exports = extract;
