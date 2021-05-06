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

class Tabular {
  withLog(log) {
    this.log = log;
    return this;
  }

  /**
   * Returns the last modified time
   * @returns {Promise<string>}
   */
  // eslint-disable-next-line class-methods-use-this
  async getLastModified() {
    return '';
  }

  /**
   * Returns the sheet names.
   * @returns {Promise<string[]>}
   */
  // eslint-disable-next-line class-methods-use-this
  async getSheetNames() {
    return [];
  }

  /**
   * Returns the data for the given sheet and optional table
   * @param {string} sheetName Sheet name
   * @param {string} [table] Table name or number
   * @returns {Promise<Array<Object>>}
   */
  // eslint-disable-next-line no-unused-vars,class-methods-use-this
  async getData(sheetName, table) {
    return [];
  }

  /**
   * Selects the sheet names that are selected or defaulted.
   * @param {string[]} requestedSheets requested sheet names.
   * @returns {Promise<string[]>} the names of the sheets that need to be returned.
   */
  async selectSheetNames(requestedSheets) {
    // get all sheets
    const allSheetNames = await this.getSheetNames();
    let sheetNames = [];

    // if sheets are specified, filter the names
    if (requestedSheets.length) {
      const prefixed = requestedSheets.map((name) => `helix-${name}`);
      sheetNames = allSheetNames.filter((name) => prefixed.indexOf(name) >= 0);
    } else {
      const helixSheets = allSheetNames.filter((n) => n.startsWith('helix-'));
      if (helixSheets.length === 0) {
        // if no helix sheets, use the first one
        sheetNames = allSheetNames.length ? [allSheetNames[0]] : [];
      } else if (helixSheets.indexOf('helix-default') >= 0) {
        // if there is a helix-default, use it
        sheetNames = ['helix-default'];
      } else {
        // else only use the helix sheets
        sheetNames = helixSheets;
      }
    }
    this.log.info(`Using [${sheetNames}] from ${allSheetNames} with [${requestedSheets}] selection.`);
    return sheetNames;
  }
}

module.exports = Tabular;
