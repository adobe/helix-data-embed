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
const AWSStorage = require('@adobe/helix-universal/src/aws-storage.js');
require('dotenv').config();

async function run() {
  const url = await AWSStorage.presignURL(
    'h3d4b1d4ea6d84b0229bce7cf6806b0bb3470489ab8205a13f75cfe518fa7',
    'live/data-embed-unit-tests/data-embed-no-helix.json', {
      ContentType: 'application/json',
      // Metadata: {
      //   'x-source-location': '',
      // },
    },
    'PUT',
    600,
  );
  console.log(url);
}

run().catch(console.error);
