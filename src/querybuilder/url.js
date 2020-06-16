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
/* eslint-disable no-underscore-dangle, no-param-reassign */
const { parse } = require('querystring');
const { transformconjunctions } = require('./util');

const unique = (arr, key) => {
  if (arr.indexOf(key) < 0) {
    arr.push(key);
  }
  return arr;
};

const flat = (flattened, e) => {
  if (Array.isArray(e)) {
    return [...flattened, ...e];
  }
  return [...flattened, e];
};

function nest(obj) {
  const entries = Object.entries(obj)
    .map(([k, v]) => {
      const longkey = k.split(/[._]/).map((key) => (Number.parseInt(key, 10) ? Number.parseInt(key, 10) : key));
      // ignore everything that comes before a counter or a group
      const shortkey = longkey.reduce((p, val) => {
        if (Number.isInteger(val)) {
          return [];
        }
        if (val === 'group') {
          return [];
        }
        if (val === 'p') {
          return [];
        }
        p.push(val);
        return p;
      }, []);

      const retval = { };

      if (shortkey.length % 2 === 0) {
        // this looks like …property.value=
        const [type, name] = shortkey.slice(-2);

        retval[name] = v;
        retval._type = type;
        longkey.pop();
      } else {
        // it is only …property=
        const [type] = shortkey.slice(-1);

        retval[type] = v;
        retval._type = type;
      }

      retval._key = longkey.join('.');
      retval._group = longkey.indexOf('group') < 0 ? undefined : retval._key.replace(/(.*)group\..*$/, '$1group');

      return retval;
    });

  const keys = entries
    // extract keys
    .map(({ _key }) => _key)
    // that are unique
    .reduce(unique, []);

  // list all implicit groups
  const groups = entries
    .map(({ _key }) => _key)
    .filter((key) => /group/.test(key))
    .map((key) => key.split('.'))
    .map((keyz) => keyz.slice(0, keyz.lastIndexOf('group') + 1))
    .map((keyz) => keyz.map((_, index) => keyz.slice(0, index + 1)).filter((keyzz) => keyzz.slice(-1)[0] === 'group'))
    // polyfill for Array.prototype.flat
    .reduce(flat, [])
    .map((keyz) => keyz.join('.'))
    .reduce(unique, [])
    .map((name) => ({
      name,
      parent: name === 'group' ? undefined : name.replace(/(.*)group\..*$/, '$1group'),
      group: {
        _type: 'group',
        conjunction: 'default',
        predicates: [],
      },
      depth: name.split('.').filter((e) => e === 'group').length,
    }));

  // console.table(entries);

  const structs = keys
    // remove params (p)
    .filter((e) => e.split('.').indexOf('p') < 0)
    .map((key) => entries
    // get all entries for the current key
      .filter(({ _key }) => key === _key)
    // and merge them
      .reduce((joint, entry) => {
        const o = Object.assign(joint, entry);
        delete o._key;
        return o;
      }, {}));

  const params = entries.filter((e) => e._key.split('.').indexOf('p') >= 0);

  // console.log('params');
  // console.table(params);

  // console.table(structs);

  const root = {
    _type: 'root',
    conjunction: 'default',
    predicates: [],
  };

  structs.forEach((struct) => {
    const parent = groups.find((e) => e.name === struct._group);
    if (struct._group && parent) {
      parent.group.predicates.push(struct);
    } else {
      root.predicates.push(struct);
    }
    // eslint-disable-next-line no-param-reassign
    delete struct._group;
  });

  params.forEach((param) => {
    const parent = groups.find((e) => e.name === param._group);

    const target = param._group && parent ? parent.group : root;
    Object.entries(param)
      .filter(([k]) => !k.startsWith('_'))
      .forEach(([k, v]) => {
        if (k === 'or' && v) {
          target.conjunction = 'or';
        } else if (k === 'and' && v) {
          target.conjunction = 'and';
        } else {
          target[k] = v;
        }
      });

    // console.log(target);
  });

  // transform implicit conjunctions into explicit nested conjunctions
  const explicitgroups = groups.map((group) => ({
    ...group,
    group: transformconjunctions(group.group),
  }));

  explicitgroups.forEach((group) => {
    const parent = explicitgroups.find((e) => e.name === group.parent);
    if (group.parent && parent) {
      parent.group.predicates.push(group.group);
    } else {
      root.predicates.push(group.group);
    }
  });

  // console.table(groups);

  // console.log(JSON.stringify(root, undefined, 2));

  return transformconjunctions(root);
}

function cast(obj) {
  return Object.entries(obj).reduce((o, [k, v]) => {
    if (v === 'true' || v === 'false') {
      o[k] = (v === 'true');
    } else if (!Number.isNaN(Number.parseFloat(v))) {
      o[k] = Number.parseFloat(v);
    } else {
      o[k] = v;
    }
    return o;
  }, {});
}

function loadquerystring(str, prefix = '') {
  const obj = cast(parse(str));

  return nest(Object.entries(obj).reduce((o, [k, v]) => {
    if (k.startsWith(prefix)) {
      // eslint-disable-next-line no-param-reassign
      o[k.replace(prefix, '')] = v;
    }
    return o;
  }, {}));
}

function loadtext(txt) {
  return nest(cast(parse(txt, '\n')));
}

module.exports = { loadquerystring, loadtext, flat };
