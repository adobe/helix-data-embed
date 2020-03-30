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
/* eslint-env mocha */
/* eslint-disable class-methods-use-this */
const assert = require('assert');
const { extract } = require('../src/matchers/google');

describe('Google Sheets Tests', () => {
  it('Works for Excel Feeds', async () => {
    const result = await extract(
      'https://docs.google.com/spreadsheets/d/1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k/edit?ouid=107837958797411838063&usp=sheets_home&ths=true',
      {
        GOOGLE_DOCS2MD_CLIENT_ID: process.env.GOOGLE_DOCS2MD_CLIENT_ID,
        GOOGLE_DOCS2MD_CLIENT_SECRET: process.env.GOOGLE_DOCS2MD_CLIENT_SECRET,
        GOOGLE_DOCS2MD_REFRESH_TOKEN: process.env.GOOGLE_DOCS2MD_REFRESH_TOKEN,
      },
    );
    assert.equal(result.statusCode, 200);
    assert.notEqual(result.body.length, 0);
    assert.equal(result.body[0].url, 'https://theblog.adobe.com/silka-miesnieks-designing-immersive-world/');
    assert.ok(result.body[0].year);
  }).timeout(15000);
});
