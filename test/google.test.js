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
/* eslint-disable global-require, class-methods-use-this */
const assert = require('assert');
const proxyquire = require('proxyquire');

class MockOAuth2 {
  constructor({ clientId }) {
    if (clientId === 'fail') {
      throw new Error();
    }
  }

  setCredentials() {
    return undefined;
  }

  on(_, cb) {
    cb({ tokens: {} });
    return undefined;
  }
}

const TEST_SHEETS_1 = {
  data: {
    spreadsheetId: '1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k',
    properties: {
      title: 'Autos',
      locale: 'en_US',
      autoRecalc: 'ON_CHANGE',
      timeZone: 'Europe/Paris',
      defaultFormat: {
        backgroundColor: { red: 1, green: 1, blue: 1 },
        padding: { right: 3, left: 3 },
        verticalAlignment: 'BOTTOM',
        wrapStrategy: 'LEGACY_WRAP',
        textFormat: {
          foregroundColor: {}, fontFamily: 'arial,sans,sans-serif', fontSize: 10, bold: false, italic: false, strikethrough: false, underline: false, foregroundColorStyle: { rgbColor: {} },
        },
        backgroundColorStyle: { rgbColor: { red: 1, green: 1, blue: 1 } },
      },
    },
    sheets: [{
      properties: {
        sheetId: 0, title: 'helix-default', index: 0, sheetType: 'GRID', gridProperties: { rowCount: 92, columnCount: 20, frozenRowCount: 1 },
      },
    }],
    spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k/edit',
  },
};

const TEST_SHEETS_2 = {
  data: {
    spreadsheetId: '2222222222222222222',
    properties: {
      title: 'Autos',
    },
    sheets: [{
      properties: {
        sheetId: 0, title: 'Sheet1', index: 0, sheetType: 'GRID', gridProperties: { rowCount: 92, columnCount: 20, frozenRowCount: 1 },
      },
    }],
  },
};

const TEST_SHEETS_3 = {
  data: {
    spreadsheetId: '3333333333333333333',
    properties: {
      title: 'Autos',
    },
    sheets: [{
      properties: {
        sheetId: 0, title: 'helix-countries', index: 0, sheetType: 'GRID', gridProperties: { rowCount: 92, columnCount: 20, frozenRowCount: 1 },
      },
    }],
  },
};

const TEST_VALUES_1 = {
  data: { range: 'helix-default!A1:T92', majorDimension: 'ROWS', values: [['Hersteller', 'Modell', 'Preis', 'Verbrauch', 'Kofferraum', 'Preis2', 'Verbrauch pro Jahr', 'Gesamtkosten'], ['Hyundai', 'Trajet', 23000, 7.2, 304, 1.1, 5976, 28976, 'Klapptüren', 'Hässlich wie die Nacht'], ['Ford', 'Galaxy Ambiente', 24400, 10.1, 330, 1.3, 8383, 32783, '193 km/h'], ['Fiat', 'Ulysse', 25200, 9.2, 324, 1.3, 7635.999999999999, 32836, 'Schiebetüren'], ['Citroën', 'C8', 25400, 9.1, 324, 1.3, 7553, 32953, 'Schiebetüren'], ['Peugeot', '807 2.0', 25450, 9.1, 324, 1.3, 7553, 33003, 'Schiebetüren'], ['Renault', 'Espace 2.0 Advantage', 25500, 9.4, 291, 1.3, 7802, 33302, 'kleiner Kofferraum'], ['Chrysler', 'Voyager Family', 25900, 10.1, 660, 1.3, 8383, 34283, 'Gegenübersitzen'], ['VW', 'Multivan Startline', 29000, 8, 664, 1.3, 6640, 35640, 'Gegenübersitzen'], ['Lancia', 'Phedra', 30900, 6.9, 324, 1.1, 5727, 36627], ['VW', 'Sharan 2.0', 29300, 9.4, 1200, 1.3, 7802, 37102], ['Mercedes-Benz', 'Viano Lang', 33150, 8.9, 730, 1.1, 7387, 40537], [], ['Hyundai', 'H-1 Travel', 20400, 8.3, '', 1.1, 6889.000000000001, 27289], ['Ford', 'Transit Cityline', 19611, 7, '', 1.1, 5810, 25421], ['Opel', 'Vivaro', 19660, 7.7, '', 1.1, 6391, 26051], ['Renault', 'Trafic', '', '', '', 1.1, 0, 0], ['Nissan', 'Primastar', '', '', '', 1.1, 0, 0], ['Citroën', 'Jumper', '', '', '', 1.1, 0, 0], ['Peugeot', 'Boxer', 19490, 7, '', 1.1, 5810, 25300], ['Fiat', 'Ducato', 19390, 7.3, '', 1.1, 6059, 25449]] },
};
const TEST_VALUES_2 = {
  data: { range: 'Sheet1!A1:B4', majorDimension: 'ROWS', values: [['Country', 'Code', 'Number'], ['Japan', 'JP', '81']] },
};

const TEST_VALUES_3 = {
  data: { range: 'helix-countries!A1:B4', majorDimension: 'ROWS', values: [['Country', 'Code', 'Number'], ['Switzerland', 'CH', '41']] },
};

const TEST_SHEETS = {
  '1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k': TEST_SHEETS_1,
  '2222222222222222222': TEST_SHEETS_2,
  '3333333333333333333': TEST_SHEETS_3,
};
const TEST_VALUES = {
  '1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k': TEST_VALUES_1,
  '2222222222222222222': TEST_VALUES_2,
  '3333333333333333333': TEST_VALUES_3,
};

describe('Google Sheets Tests (mocked)', () => {
  const { extract } = proxyquire('../src/matchers/google.js', {
    googleapis: {
      google: {
        auth: {
          OAuth2: MockOAuth2,
        },
        sheets: () => ({
          spreadsheets: {
            get: ({ spreadsheetId }) => (TEST_SHEETS[spreadsheetId]),
            values: {
              get: ({ spreadsheetId }) => (TEST_VALUES[spreadsheetId]),
            },
          },
        }),
      },
    },
  });

  it('Works for mocked Google Sheets', async () => {
    const result = await extract(
      new URL('https://docs.google.com/spreadsheets/d/1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k/edit?ouid=107837958797411838063&usp=sheets_home&ths=true'),
      {
        GOOGLE_DOCS2MD_CLIENT_ID: 'fake',
        GOOGLE_DOCS2MD_CLIENT_SECRET: 'fake',
        GOOGLE_DOCS2MD_REFRESH_TOKEN: 'fake',
      },
    );
    assert.equal(result.statusCode, 200);
    assert.notEqual(result.body.length, 0);
    assert.equal(result.body[0].Modell, 'Trajet');
    assert.ok(result.body[0].Preis);
  }).timeout(15000);

  it('Returns 404 for unknown sheet', async () => {
    const result = await extract(
      new URL('https://docs.google.com/spreadsheets/d/1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k/edit?ouid=107837958797411838063&usp=sheets_home&ths=true'),
      {
        GOOGLE_DOCS2MD_CLIENT_ID: 'fake',
        GOOGLE_DOCS2MD_CLIENT_SECRET: 'fake',
        GOOGLE_DOCS2MD_REFRESH_TOKEN: 'fake',
        sheet: 'foo',
      },
    );
    assert.equal(result.statusCode, 404);
  }).timeout(15000);

  it('Returns 404 for sheets with no helix-default', async () => {
    const result = await extract(
      new URL('https://docs.google.com/spreadsheets/d/3333333333333333333/edit?ouid=107837958797411838063&usp=sheets_home&ths=true'),
      {
        GOOGLE_DOCS2MD_CLIENT_ID: 'fake',
        GOOGLE_DOCS2MD_CLIENT_SECRET: 'fake',
        GOOGLE_DOCS2MD_REFRESH_TOKEN: 'fake',
      },
    );
    assert.equal(result.statusCode, 404);
  }).timeout(15000);

  it('Returns first sheet if no helix-sheets', async () => {
    const result = await extract(
      new URL('https://docs.google.com/spreadsheets/d/2222222222222222222/edit?ouid=107837958797411838063&usp=sheets_home&ths=true'),
      {
        GOOGLE_DOCS2MD_CLIENT_ID: 'fake',
        GOOGLE_DOCS2MD_CLIENT_SECRET: 'fake',
        GOOGLE_DOCS2MD_REFRESH_TOKEN: 'fake',
      },
    );
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, [{ Code: 'JP', Country: 'Japan', Number: '81' }]);
  }).timeout(15000);

  it('Returns correct sheet', async () => {
    const result = await extract(
      new URL('https://docs.google.com/spreadsheets/d/3333333333333333333/edit?ouid=107837958797411838063&usp=sheets_home&ths=true'),
      {
        GOOGLE_DOCS2MD_CLIENT_ID: 'fake',
        GOOGLE_DOCS2MD_CLIENT_SECRET: 'fake',
        GOOGLE_DOCS2MD_REFRESH_TOKEN: 'fake',
        sheet: 'countries',
      },
    );
    assert.equal(result.statusCode, 200);
    assert.deepEqual(result.body, [{ Code: 'CH', Country: 'Switzerland', Number: '41' }]);
  }).timeout(15000);

  it('Fails (in a good way) for mocked Google Sheets', async () => {
    const result = await extract(
      new URL('https://docs.google.com/spreadsheets/d/1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k/edit?ouid=107837958797411838063&usp=sheets_home&ths=true'),
      {
        GOOGLE_DOCS2MD_CLIENT_ID: 'fail',
        GOOGLE_DOCS2MD_CLIENT_SECRET: 'fake',
        GOOGLE_DOCS2MD_REFRESH_TOKEN: 'fake',
      },
    );
    assert.equal(result.statusCode, 500);
    assert.equal(result.body.length, 0);
  }).timeout(15000);
});

describe('Google Sheets Tests (online)', () => {
  const { extract, accept } = require('../src/matchers/google');

  it('Test patterns', () => {
    assert.ok(accept(new URL('https://docs.google.com/spreadsheets/d/1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k/edit?ouid=107837958797411838063&usp=sheets_home&ths=true')));
    assert.ok(!accept(new URL('https://docs.google.com/airballoons/d/1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k/edit?ouid=107837958797411838063&usp=sheets_home&ths=true')));
  });

  it.skip('Works for real Google Sheets', async () => {
    const result = await extract(
      new URL('https://docs.google.com/spreadsheets/d/1IX0g5P74QnHPR3GW1AMCdTk_-m954A-FKZRT2uOZY7k/edit?ouid=107837958797411838063&usp=sheets_home&ths=true'),
      {
        GOOGLE_DOCS2MD_CLIENT_ID: process.env.GOOGLE_DOCS2MD_CLIENT_ID,
        GOOGLE_DOCS2MD_CLIENT_SECRET: process.env.GOOGLE_DOCS2MD_CLIENT_SECRET,
        GOOGLE_DOCS2MD_REFRESH_TOKEN: process.env.GOOGLE_DOCS2MD_REFRESH_TOKEN,
      },
      console,
    );
    assert.equal(result.statusCode, 200);
    assert.notEqual(result.body.length, 0);
    assert.equal(result.body[0].Modell, 'Trajet');
    assert.ok(result.body[0].Preis);
  }).timeout(15000);
});
