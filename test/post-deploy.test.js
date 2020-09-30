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
const packjson = require('../package.json');

chai.use(chaiHttp);
const { expect } = chai;

function getbaseurl() {
  const namespace = 'helix';
  const package = 'helix-services';
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
      .get(`${getbaseurl()}/https://daringfireball.net/feeds/main`)
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
      .request('https://adobeioruntime.net/')
      .get(`${getbaseurl()}/${url}`)
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

  it('Excel Embed (with tables)', async () => {
    const url = 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx?d=w6911fff4a52a4b3fb80560d8785adfa3&csf=1&web=1&e=fkkA2a';
    console.log('Trying', url);

    await chai
      .request('https://adobeioruntime.net/')
      .get(`${getbaseurl()}?src=${encodeURIComponent(url)}&sheet=tables&table=0`)
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
      .request('https://adobeioruntime.net/')
      .get(`${getbaseurl()}/${url}`)
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

  it('Google Sheets Embed with Query Builder', async () => {
    const url = 'https://docs.google.com/spreadsheets/d/1KP2-ty18PLmHMduBX-ZOlHUpNCk6uB1Q1i__l3scoTM/edit?hlx_property=Code&hlx_property.value=DE';
    console.log('Trying', url);

    await chai
      .request('https://adobeioruntime.net/')
      .get(`${getbaseurl()}/${url}`)
      .then((response) => {
        // console.log(response.body);
        expect(response).to.be.json;
        expect(response.body.data).to.be.an('array').that.eql([{ Code: 'DE', Country: 'Germany', Number: 5 }]);
        expect(response.body.data).to.have.lengthOf(1);
        expect(response).to.have.status(200);
      }).catch((e) => {
        throw e;
      });
  }).timeout(10000);

  it('Google Sheets Embed with Query Builder (alternative syntax)', async () => {
    const src = 'https://docs.google.com/spreadsheets/d/1KP2-ty18PLmHMduBX-ZOlHUpNCk6uB1Q1i__l3scoTM/edit';
    const url = `${getbaseurl()}?src=${encodeURIComponent(src)}&hlx_property=Code&hlx_property.value=DE`;
    console.log('Trying', url);

    await chai
      .request('https://adobeioruntime.net/')
      .get(url)
      .then((response) => {
        // console.log(response.body);
        expect(response).to.be.json;
        expect(response.body.data).to.be.an('array').that.eql([{ Code: 'DE', Country: 'Germany', Number: 5 }]);
        expect(response.body.data).to.have.lengthOf(1);
        expect(response).to.have.status(200);
      }).catch((e) => {
        throw e;
      });
  }).timeout(10000);

  it('Helix Run Query Embed', async () => {
    console.log('Trying', `https://adobeioruntime.net/${getbaseurl()}/https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@v2/error500`);

    await chai
      .request('https://adobeioruntime.net/')
      .get(`${getbaseurl()}/https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@v2/error500?fromMins=1000&toMins=0`)
      .then((response) => {
        expect(response).to.be.json;
        expect(response.body.data).to.be.an('array');
        expect(response).to.have.status(200);
      }).catch((e) => {
        throw e;
      });
  }).timeout(10000);

  it('Helix Run Query Embed Works with Site prefixed', async () => {
    console.log('Trying', `https://adobeioruntime.net/${getbaseurl()}/https://example.com/_query/run-query/error500?fromMins=1000&toMins=0`);

    await chai
      .request('https://adobeioruntime.net/')
      .get(`${getbaseurl()}/https://example.com/_query/run-query/error500?fromMins=1000&toMins=0`)
      .then((response) => {
        expect(response).to.be.json;
        expect(response.body.data).to.be.an('array');
        expect(response).to.have.status(200);
      }).catch((e) => {
        throw e;
      });
  }).timeout(10000);
});

describe('Running Post-Deployment Integration Tests on Preprod', () => {
  it('RSS Embed', async () => {
    await chai
      .request('https://preprod.adobeioruntime.net/')
      .get(`${getbaseurl()}/https://daringfireball.net/feeds/main`)
      .then((response) => {
        expect(response).to.be.json;
        expect(response.body.data).to.be.an('array');
        expect(response).to.have.status(200);
      }).catch((e) => {
        throw e;
      });
  }).timeout(60000);

  it('Excel Embed (without tables)', async () => {
    const url = 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx?d=w6911fff4a52a4b3fb80560d8785adfa3&csf=1&web=1&e=fkkA2a';
    console.log('Trying', url);

    await chai
      .request('https://preprod.adobeioruntime.net/')
      .get(`${getbaseurl()}/${url}`)
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
  }).timeout(60000);

  it('Excel Embed (with tables)', async () => {
    const url = 'https://adobe.sharepoint.com/:x:/r/sites/cg-helix/Shared%20Documents/data-embed-unit-tests/example-data.xlsx?d=w6911fff4a52a4b3fb80560d8785adfa3&csf=1&web=1&e=fkkA2a';
    console.log('Trying', url);

    await chai
      .request('https://preprod.adobeioruntime.net/')
      .get(`${getbaseurl()}?src=${encodeURIComponent(url)}&sheet=tables&table=0`)
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
      .request('https://preprod.adobeioruntime.net/')
      .get(`${getbaseurl()}/${url}`)
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

  it('Google Sheets Embed with Query Builder', async () => {
    const url = 'https://docs.google.com/spreadsheets/d/1KP2-ty18PLmHMduBX-ZOlHUpNCk6uB1Q1i__l3scoTM/edit?hlx_property=Code&hlx_property.value=DE';
    console.log('Trying', url);

    await chai
      .request('https://preprod.adobeioruntime.net/')
      .get(`${getbaseurl()}/${url}`)
      .then((response) => {
        // console.log(response.body);
        expect(response).to.be.json;
        expect(response.body.data).to.be.an('array').that.eql([{ Code: 'DE', Country: 'Germany', Number: 5 }]);
        expect(response).to.have.status(200);
      }).catch((e) => {
        throw e;
      });
  }).timeout(10000);

  it('Google Sheets Embed with Query Builder (alternative syntax)', async () => {
    const src = 'https://docs.google.com/spreadsheets/d/1KP2-ty18PLmHMduBX-ZOlHUpNCk6uB1Q1i__l3scoTM/edit';
    const url = `${getbaseurl()}?src=${encodeURIComponent(src)}&hlx_property=Code&hlx_property.value=DE`;
    console.log('Trying', url);

    await chai
      .request('https://preprod.adobeioruntime.net/')
      .get(url)
      .then((response) => {
        // console.log(response.body);
        expect(response).to.be.json;
        expect(response.body.data).to.be.an('array').that.eql([{ Code: 'DE', Country: 'Germany', Number: 5 }]);
        expect(response).to.have.status(200);
      }).catch((e) => {
        throw e;
      });
  }).timeout(10000);

  it('Helix Run Query Embed', async () => {
    console.log('Trying', `https://adobeioruntime.net/${getbaseurl()}/https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@v2/error500`);

    await chai
      .request('https://preprod.adobeioruntime.net/')
      .get(`${getbaseurl()}/https://adobeioruntime.net/api/v1/web/helix/helix-services/run-query@v2/error500?fromMins=1000&toMins=0`)
      .then((response) => {
        expect(response).to.be.json;
        expect(response.body.data).to.be.an('array');
        expect(response).to.have.status(200);
      }).catch((e) => {
        throw e;
      });
  }).timeout(10000);

  it('Helix Run Query Embed Works with Site prefixed', async () => {
    console.log('Trying', `https://adobeioruntime.net/${getbaseurl()}/https://example.com/_query/run-query/error500?fromMins=1000&toMins=0`);

    await chai
      .request('https://preprod.adobeioruntime.net/')
      .get(`${getbaseurl()}/https://example.com/_query/run-query/error500?fromMins=1000&toMins=0`)
      .then((response) => {
        expect(response).to.be.json;
        expect(response.body.data).to.be.an('array');
        expect(response).to.have.status(200);
      }).catch((e) => {
        throw e;
      });
  }).timeout(10000);
}).timeout(10000);
