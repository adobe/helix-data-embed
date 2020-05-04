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
/* eslint-disable no-underscore-dangle */
const { parse } = require('querystring');

function nest(obj) {
  const entries = Object.entries(obj)
    .map(([k, v]) => {
      const _longkey = k.split(/[._]/).map((key) => (Number.parseInt(key, 10) ? Number.parseInt(key, 10) : key));
      // ignore everything that comes before a counter
      const _shortkey = _longkey.reduce((p, val) => {
        if (Number.isInteger(val)) {
          return [];
        }
        p.push(val);
        return p;
      }, []);

      const retval = { };


      if (_shortkey.length % 2 === 0) {
        // this looks like …property.value=
        const [type, name] = _shortkey.slice(-2);

        retval[name] = v;
        retval._type = type;
        _longkey.pop();
      } else {
        // it is only …property=
        const [type] = _shortkey.slice(-1);

        retval[type] = v;
        retval._type = type;
      }

      retval._key = _longkey.join('.');

      return retval;
    });

  const keys = entries
    // extract keys
    .map(({ _key }) => _key)
    // that are unique
    .reduce((arr, key) => {
      if (arr.indexOf(key) < 0) {
        arr.push(key);
      }
      return arr;
    }, []);

  const structs = keys.map((key) => entries
  // get all entries for the current key
    .filter(({ _key }) => key === _key)
  // and merge them
    .reduce((joint, entry) => {
      const o = Object.assign(joint, entry);
      delete o._key;
      return o;
    }, {}));


  return structs;
}

function loadquerystring(str, prefix = '') {
  const obj = parse(str);

  return nest(Object.entries(obj).reduce((o, [k, v]) => {
    if (k.startsWith(prefix)) {
      // eslint-disable-next-line no-param-reassign
      o[k.replace(prefix, '')] = v;
    }
    return o;
  }, {}));
}

function loadtext(txt) {
  return nest(parse(txt, '\n'));
}

module.exports = { loadquerystring, loadtext };
