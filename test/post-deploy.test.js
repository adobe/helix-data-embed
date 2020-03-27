/*
 * Copyright 2019 Adobe. All rights reserved.
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
/* eslint-disable no-unused-expressions */

const chai = require('chai');
const chaiHttp = require('chai-http');
const packjson = require('../package.json');

chai.use(chaiHttp);
const { expect } = chai;

function getbaseurl() {
  const namespace = 'helix';
  const package = 'helix-services-private';
  const name = packjson.name.replace('@adobe/helix-', '');
  let version = `${packjson.version}`;
  if (process.env.CI && process.env.CIRCLE_BUILD_NUM && process.env.CIRCLE_BRANCH !== 'master') {
    version = `ci${process.env.CIRCLE_BUILD_NUM}`;
  }
  return `api/v1/web/${namespace}/${package}/${name}@${version}`;
}

describe('Post-Deploy Tests', () => {
  it('RSS Embed', async () => {
    await chai
      .request('https://adobeioruntime.net/')
      .get(`${getbaseurl()}/https://blogs.adobe.com/psirt/?feed=atom`)
      .then((response) => {
        expect(response).to.be.json;
        expect(response.body).to.be.an('array').that.has.length(10);
        expect(response).to.have.status(200);
      }).catch((e) => {
        throw e;
      });
  }).timeout(10000);

  it('Excel Embed', async () => {
    console.log('Trying', `https://adobeioruntime.net/${getbaseurl()}/https://adobe.sharepoint.com/sites/TheBlog/_layouts/15/guestaccess.aspx?share=ESR1N29Z7HpCh1Zfs_0YS_gB4gVSuKyWRut-kNcHVSvkew&email=helix%40adobe.com&e=hx0OUl`);

    await chai
      .request('https://adobeioruntime.net/')
      .get(`${getbaseurl()}/https://adobe.sharepoint.com/sites/TheBlog/_layouts/15/guestaccess.aspx?share=ESR1N29Z7HpCh1Zfs_0YS_gB4gVSuKyWRut-kNcHVSvkew&email=helix%40adobe.com&e=hx0OUl`)
      .then((response) => {
        expect(response).to.be.json;
        expect(response.body).to.be.an('array').that.deep.includes({
          'import date': '2020-03-25T16:20:13.696Z',
          url: 'https://theblog.adobe.com/brands-acting-responsibly-amid-covid-19/',
          year: 2020,
        });
        expect(response).to.have.status(200);
      }).catch((e) => {
        throw e;
      });
  }).timeout(10000);
});
