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
        expect(response.body).to.be.an('array');
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
        // console.log(response.body);
        expect(response).to.be.json;
        expect(response.body).to.be.an('array').that.deep.includes({
          'import date': '2020-04-23T12:55:40.852Z',
          url: 'https://theblog.adobe.com/best-practices-in-content-management-it-edition/',
          year: 43875,
        });
        expect(response).to.have.status(200);
      }).catch((e) => {
        throw e;
      });
  }).timeout(10000);

  it('Google Sheets Embed', async () => {
    console.log('Trying', `https://adobeioruntime.net/${getbaseurl()}/https://docs.google.com/spreadsheets/d/1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k/edit?ouid=107837958797411838063&usp=sheets_home&ths=true`);

    await chai
      .request('https://adobeioruntime.net/')
      .get(`${getbaseurl()}/https://docs.google.com/spreadsheets/d/1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k/edit?ouid=107837958797411838063&usp=sheets_home&ths=true`)
      .then((response) => {
        expect(response).to.be.json;
        expect(response.body).to.be.an('array').that.deep.includes({
          Hersteller: 'Hyundai', Modell: 'Trajet', Preis: 23000, Verbrauch: 7.2, Kofferraum: 304, Preis2: 1.1, 'Verbrauch pro Jahr': 5976, Gesamtkosten: 28976,
        });
        expect(response).to.have.status(200);
      }).catch((e) => {
        throw e;
      });
  }).timeout(10000);

  it('Google Sheets Embed with Query Builder', async () => {
    console.log('Trying', `https://adobeioruntime.net/${getbaseurl()}/https://docs.google.com/spreadsheets/d/1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k/edit?ouid=107837958797411838063&usp=sheets_home&ths=true`);

    await chai
      .request('https://adobeioruntime.net/')
      .get(`${getbaseurl()}/https://docs.google.com/spreadsheets/d/1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k/edit?ouid=107837958797411838063&usp=sheets_home&ths=true&hlx_property=Hersteller&hlx_property.value=Ford`)
      .then((response) => {
        expect(response).to.be.json;
        expect(response.body).to.be.an('array').that.deep.includes({
          Gesamtkosten: 32783,
          Hersteller: 'Ford',
          Kofferraum: 330,
          Modell: 'Galaxy Ambiente',
          Preis: 24400,
          Preis2: 1.3,
          Verbrauch: 10.1,
          'Verbrauch pro Jahr': 8383,
        });
        expect(response.body).to.have.lengthOf(2);
        expect(response).to.have.status(200);
      }).catch((e) => {
        throw e;
      });
  }).timeout(10000);
});
