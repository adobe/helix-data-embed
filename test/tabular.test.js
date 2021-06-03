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
const Tabular = require('../src/matchers/Tabular.js');

describe('Tabular Tests', () => {
  it('getData returns empty array', async () => {
    const tabular = new Tabular().withLog(console);
    assert.deepEqual(await tabular.getData('foo', 'bar'), []);
  });

  it('getSourceLocation returns empty string', async () => {
    const tabular = new Tabular().withLog(console);
    assert.deepEqual(await tabular.getSourceLocation(), '');
  });

  it('selectSheetNames empty array for no sheets', async () => {
    const tabular = new Tabular().withLog(console);
    assert.deepEqual(await tabular.selectSheetNames([]), []);
  });

  it('selectSheetNames returns first sheet if non requested', async () => {
    const tabular = new Tabular().withLog(console);
    tabular.getSheetNames = () => ['Sheet1', 'Sheet2'];
    assert.deepEqual(await tabular.selectSheetNames([]), ['Sheet1']);
  });

  it('selectSheetNames returns all helix sheets if non requested', async () => {
    const tabular = new Tabular().withLog(console);
    tabular.getSheetNames = () => ['Sheet1', 'Sheet2', 'helix-one', 'helix-two'];
    assert.deepEqual(await tabular.selectSheetNames([]), ['helix-one', 'helix-two']);
  });

  it('selectSheetNames returns helix-default if non requested', async () => {
    const tabular = new Tabular().withLog(console);
    tabular.getSheetNames = () => ['Sheet1', 'Sheet2', 'helix-one', 'helix-default'];
    assert.deepEqual(await tabular.selectSheetNames([]), ['helix-default']);
  });

  it('selectSheetNames returns not sheets if non match the selected sheets', async () => {
    const tabular = new Tabular().withLog(console);
    tabular.getSheetNames = () => ['Sheet1', 'Sheet2', 'helix-one', 'helix-default'];
    assert.deepEqual(await tabular.selectSheetNames(['foo']), []);
  });

  it('selectSheetNames returns the selected sheet', async () => {
    const tabular = new Tabular().withLog(console);
    tabular.getSheetNames = () => ['Sheet1', 'Sheet2', 'helix-one', 'helix-default'];
    assert.deepEqual(await tabular.selectSheetNames(['one']), ['helix-one']);
  });

  it('selectSheetNames returns the selected sheets', async () => {
    const tabular = new Tabular().withLog(console);
    tabular.getSheetNames = () => ['Sheet1', 'Sheet2', 'helix-one', 'helix-default'];
    assert.deepEqual(await tabular.selectSheetNames(['one', 'default']), ['helix-one', 'helix-default']);
  });
});
