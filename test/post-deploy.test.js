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
/* eslint-disable no-unused-expressions,no-console */

const chai = require('chai');
const chaiHttp = require('chai-http');
const { createTargets } = require('./post-deploy-utils.js');

chai.use(chaiHttp);
const { expect } = chai;

createTargets().forEach((target) => {
  describe(`Post-Deploy Tests (${target.title()})`, () => {
    it('RSS Embed', async () => {
      await chai
        .request(target.host())
        .get(`${target.urlPath()}/https://daringfireball.net/feeds/main`)
        .then((response) => {
          expect(response).to.be.json;
          expect(response).to.have.status(200);
        }).catch((e) => {
          throw e;
        });
    }).timeout(60000);

    it('Excel Embed (without tables)', async () => {
      const url = 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx?d=w6911fff4a52a4b3fb80560d8785adfa3&csf=1&web=1&e=fkkA2a';
      console.log('Trying', url);

      await chai
        .request(target.host())
        .get(`${target.urlPath()}/${url}`)
        .then((response) => {
          // console.log(response);
          expect(response).to.have.status(200);
          expect(response).to.be.json;
          expect(response.body.data).to.be.an('array').that.deep.includes({
            Country: 'Japan',
            Code: 'JP',
            Number: 3,
          });
        }).catch((e) => {
          throw e;
        });
    }).timeout(10000);

    it('Fetches excel sheet with post', async () => {
      const url = 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx';
      console.log('Trying', url);

      await chai
        .request(target.host())
        .post(`${target.urlPath()}/${url}`)
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
          src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx',
        })
        .then((response) => {
          // console.log(response);
          expect(response).to.have.status(200);
          expect(response).to.be.json;
          expect(response.body.data).to.be.an('array').that.deep.includes({
            Country: 'Japan',
            Code: 'JP',
            Number: 3,
          });
        })
        .catch((e) => {
          throw e;
        });
    }).timeout(10000);

    it('Stores excel sheet in s3 with presigned url', async () => {
      const url = 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx';
      console.log('Trying', url);

      await chai
        .request(target.host())
        .post(`${target.urlPath()}/${url}`)
        .set('content-type', 'application/x-www-form-urlencoded')
        .send({
          src: 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/data-embed-no-helix.xlsx',
          presignedStorageUrl: 'https://h3d4b1d4ea6d84b0229bce7cf6806b0bb3470489ab8205a13f75cfe518fa7.s3.amazonaws.com/live/data-embed-unit-tests/data-embed-no-helix.json?AWSAccessKeyId=AKIARXE2QZFCSXL7IA4R&Content-Type=application%2Fjson&Expires=1622631323&Signature=niwM0kcwJ5aC2y6ZrHRiU1W3gow%3D&X-Amz-SignedHeaders=content-type',
        })
        .then((response) => {
          // console.log(response);
          expect(response).to.have.status(200);
          expect(response).to.be.json;
          expect(response.body.data).to.be.an('array').that.deep.includes({
            Country: 'Japan',
            Code: 'JP',
            Number: 3,
          });
        })
        .catch((e) => {
          throw e;
        });
    }).timeout(10000);

    it('Excel Embed (with tables)', async () => {
      const url = 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx?d=w6911fff4a52a4b3fb80560d8785adfa3&csf=1&web=1&e=fkkA2a';
      console.log('Trying', url);

      await chai
        .request(target.host())
        .get(`${target.urlPath()}?src=${encodeURIComponent(url)}&sheet=tables&table=0`)
        .then((response) => {
          // console.log(response);
          expect(response).to.have.status(200);
          expect(response).to.be.json;
          expect(response.body.data).to.be.an('array').that.deep.includes({
            A: 112,
            B: 224,
            C: 135,
          });
        }).catch((e) => {
          throw e;
        });
    }).timeout(10000);

    it('Google Sheets Embed', async () => {
      const url = 'https://docs.google.com/spreadsheets/d/1KP2-ty18PLmHMduBX-ZOlHUpNCk6uB1Q1i__l3scoTM/view';
      console.log('Trying', url);
      await chai
        .request(target.host())
        .get(`${target.urlPath()}/${url}`)
        .then((response) => {
          expect(response).to.be.json;
          expect(response.body.data).to.be.an('array').that.deep.includes({
            Country: 'Japan',
            Code: 'JP',
            Number: 3,
          });
          expect(response).to.have.status(200);
        }).catch((e) => {
          throw e;
        });
    }).timeout(10000);

    it('Helix Run Query Embed', async () => {
      console.log('Trying', `https://adobeioruntime.net/${target.urlPath()}/https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@v2/error500`);

      await chai
        .request(target.host())
        .get(`${target.urlPath()}/https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@v2/error500?fromMins=1000&toMins=0`)
        .then((response) => {
          expect(response).to.be.json;
          expect(response.body.data).to.be.an('array');
          expect(response).to.have.status(200);
        }).catch((e) => {
          throw e;
        });
    }).timeout(10000);

    it('Helix Run Query Embed Works with Site prefixed', async () => {
      console.log('Trying', `https://adobeioruntime.net/${target.urlPath()}/https://example.com/_query/run-query/error500?fromMins=1000&toMins=0`);

      await chai
        .request(target.host())
        .get(`${target.urlPath()}/https://example.com/_query/run-query/error500?fromMins=1000&toMins=0`)
        .then((response) => {
          expect(response).to.be.json;
          expect(response.body.data).to.be.an('array');
          expect(response).to.have.status(200);
        }).catch((e) => {
          throw e;
        });
    }).timeout(10000);
  });
});
