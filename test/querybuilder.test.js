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

const assert = require('assert');
const { loadquerystring, loadtext, flat } = require('../src/querybuilder/url');
const { createfilter } = require('../src/querybuilder/filter');
const { transformconjunctions } = require('../src/querybuilder/util');

describe('Test Query Builder URL Parser', () => {
  it('Works for empty strings', () => {
    assert.deepEqual(loadquerystring(''), {
      _type: 'root',
      conjunction: 'default',
      predicates: [],
    });
  });

  it('Works with non-matching prefixes', () => {
    assert.deepEqual(loadquerystring('foo=bar', '_hlx'), {
      _type: 'root',
      conjunction: 'default',
      predicates: [],
    });
  });

  it('Works with matching prefixes', () => {
    assert.deepEqual(loadquerystring('foo=bar&hlx_p.limit=10&hlx_fulltext=Management', 'hlx_'), {
      _type: 'root',
      conjunction: 'default',
      limit: '10',
      predicates: [{
        _type: 'fulltext',
        fulltext: 'Management',
      }],
    });
  });
});

describe('Test Query Builder Text Parser', () => {
  it('Works for empty strings', () => {
    assert.deepEqual(loadtext(''), {
      _type: 'root',
      conjunction: 'default',
      predicates: [],
    });
  });

  it('Loads simple examples', () => {
    assert.deepEqual(loadtext(`type=cq:Page
1_property=jcr:content/cq:template
1_property.value=/apps/geometrixx/templates/homepage
2_property=jcr:content/jcr:title
2_property.value=English`),
    {
      _type: 'root',
      conjunction: 'default',
      predicates: [
        {
          _type: 'type',
          type: 'cq:Page',
        },
        {
          _type: 'property',
          property: 'jcr:content/cq:template',
          value: '/apps/geometrixx/templates/homepage',
        },
        {
          _type: 'property',
          property: 'jcr:content/jcr:title',
          value: 'English',
        },
      ],
    });
  });

  it('Loads grouped examples or', () => {
    assert.deepEqual(loadtext(`fulltext=Management
group.p.or=true
group.1_group.path=/content/geometrixx/en
group.1_group.type=cq:Page
group.2_group.path=/content/dam/geometrixx
group.2_group.type=dam:Asset`), {
      _type: 'root',
      conjunction: 'default',
      predicates: [
        {
          fulltext: 'Management',
          _type: 'fulltext',
        },
        {
          _type: 'group',
          conjunction: 'or',
          predicates: [
            {
              _type: 'group',
              conjunction: 'default',
              predicates: [
                {
                  path: '/content/geometrixx/en',
                  _type: 'path',
                },
                {
                  type: 'cq:Page',
                  _type: 'type',
                },
              ],
            },
            {
              _type: 'group',
              conjunction: 'default',
              predicates: [
                {
                  path: '/content/dam/geometrixx',
                  _type: 'path',
                },
                {
                  type: 'dam:Asset',
                  _type: 'type',
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('Loads grouped examples (and)', () => {
    assert.deepEqual(loadtext(`p.limit=10
fulltext=Management
group.1_group.path=/content/geometrixx/en
group.1_group.type=cq:Page
group.2_group.path=/content/dam/geometrixx
group.2_group.type=dam:Asset`), {
      _type: 'root',
      conjunction: 'default',
      limit: 10,
      predicates: [
        {
          fulltext: 'Management',
          _type: 'fulltext',
        },
        {
          _type: 'group',
          conjunction: 'default',
          predicates: [
            {
              _type: 'group',
              conjunction: 'default',
              predicates: [
                {
                  path: '/content/geometrixx/en',
                  _type: 'path',
                },
                {
                  type: 'cq:Page',
                  _type: 'type',
                },
              ],
            },
            {
              _type: 'group',
              conjunction: 'default',
              predicates: [
                {
                  path: '/content/dam/geometrixx',
                  _type: 'path',
                },
                {
                  type: 'dam:Asset',
                  _type: 'type',
                },
              ],
            },
          ],
        },
      ],
    });
  });
});

describe('Utility Unit Tests', () => {
  it('Flat packs it', () => {
    const arr = [[1, 2], 3];
    assert.deepEqual(arr.reduce(flat, []), [1, 2, 3]);
  });
});

describe('Test Query Builder Filters', () => {
  const testarray = [
    { foo: 'bar', bar: 'baz' },
    { foo: 'foo', bar: 'bar' },
    { foo: 'baz', bar: 'foo' },
  ];

  it('createfilter returns a function', () => {
    const fn = createfilter({
      _type: 'root',
      conjunction: 'default',
      predicates: [],
    });

    assert.equal(typeof fn, 'function');
  });

  it('createfilter filters', () => {
    const fn = createfilter({
      _type: 'root',
      conjunction: 'default',
      predicates: [],
    });

    const result = fn(testarray);

    assert.ok(Array.isArray(result));
  });

  describe('Test Conjunction Transformer', () => {

    it('Keeps exitsing structure', () => {
      const input = {
        _type: 'property',
        property: 'foo',
        value: 'bar'
      };

      const result = transformconjunctions(input);

      assert.deepEqual(input, result);
    });

    it('Transforms a simple conjunction', () => {
      const result = transformconjunctions({
        _type: 'root',
        conjunction: 'default',
        predicates: [
          {
            _type: 'property',
            property: 'foo',
            value: 'foo1',
          },
          {
            _type: 'property',
            property: 'foo',
            value: 'foo2',
          },
          {
            _type: 'property',
            property: 'bar',
            value: 'bar1',
          },
          {
            _type: 'property',
            property: 'bar',
            value: 'bar2',
          },
        ],
      });

      assert.deepEqual(result, {
        _type: 'root',
        conjunction: 'and',
        predicates: [
          {
            _type: 'group',
            conjunction: 'or',
            predicates: [
              {
                _type: 'property',
                property: 'foo',
                value: 'foo1',
              },
              {
                _type: 'property',
                property: 'foo',
                value: 'foo2',
              },
            ],
          },
          {
            _type: 'group',
            conjunction: 'or',
            predicates: [
              {
                _type: 'property',
                property: 'bar',
                value: 'bar1',
              },
              {
                _type: 'property',
                property: 'bar',
                value: 'bar2',
              },
            ],
          },
        ],
      });
    });
  });
});
