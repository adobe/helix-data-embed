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
const data = [
  ['Country', 'Code', 'Number'],
  ['Japan', 'JP', 3],
  ['Germany', 'DE', 5],
  ['USA', 'US', 7],
  ['Switzerland', 'CH', 27],
  ['France', 'FR', 99],
];

const tables = [];

const namedItems = [];

module.exports = {
  name: 'book-with-multi-helix',
  tables,
  sheets: [{
    name: 'helix-countries',
    tables,
    namedItems,
    usedRange: {
      address: 'Sheet1!A1:B4',
      addressLocal: 'A1:B4',
      values: data,
    },
  }, {
    name: 'helix-default',
    tables,
    namedItems,
    usedRange: {
      address: 'Sheet1!A1:B4',
      addressLocal: 'A1:B4',
      values: data,
    },
  }],
  namedItems,
};
