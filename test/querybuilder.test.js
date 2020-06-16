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
const qb = require('../src/querybuilder/qb');

describe('Test Query Builder URL Parser', () => {
  it('Works for empty strings', () => {
    assert.deepEqual(loadquerystring(''), {
      _type: 'and',
      predicates: [],
    });
  });

  it('Works with non-matching prefixes', () => {
    assert.deepEqual(loadquerystring('foo=bar', '_hlx'), {
      _type: 'and',
      predicates: [],
    });
  });

  it('Works with matching prefixes', () => {
    assert.deepEqual(loadquerystring('foo=bar&hlx_p.limit=10&hlx_fulltext=Management', 'hlx_'), {
      _type: 'and',
      limit: 10,
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
      _type: 'and',
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
      _type: 'and',
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
      _type: 'and',
      predicates: [
        {
          _type: 'fulltext',
          fulltext: 'Management',
        },
        {
          _type: 'or',
          predicates: [
            {
              _type: 'and',
              predicates: [
                {
                  _type: 'path',
                  path: '/content/geometrixx/en',
                },
                {
                  _type: 'type',
                  type: 'cq:Page',
                },
              ],
            },
            {
              _type: 'and',
              predicates: [
                {
                  _type: 'path',
                  path: '/content/dam/geometrixx',
                },
                {
                  _type: 'type',
                  type: 'dam:Asset',
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('Loads grouped examples (normal)', () => {
    const res = {
      _type: 'and',
      limit: 10,
      predicates: [
        {
          _type: 'fulltext',
          fulltext: 'Management',
        },
        {
          _type: 'and',
          predicates: [
            {
              _type: 'and',
              predicates: [
                {
                  _type: 'path',
                  path: '/content/geometrixx/en',
                },
                {
                  _type: 'type',
                  type: 'cq:Page',
                },
              ],
            },
            {
              _type: 'and',
              predicates: [
                {
                  _type: 'path',
                  path: '/content/dam/geometrixx',
                },
                {
                  _type: 'type',
                  type: 'dam:Asset',
                },
              ],
            },
          ],
        },
      ],
    };

    assert.deepEqual(loadtext(`p.limit=10
fulltext=Management
group.p.and=true
group.1_group.path=/content/geometrixx/en
group.1_group.type=cq:Page
group.2_group.path=/content/dam/geometrixx
group.2_group.type=dam:Asset`), res);
  });

  it('Loads grouped examples (abd)', () => {
    const res = {
      _type: 'and',
      limit: 10,
      predicates: [
        {
          _type: 'fulltext',
          fulltext: 'Management',
        },
        {
          _type: 'and',
          predicates: [
            {
              _type: 'and',
              predicates: [
                {
                  _type: 'path',
                  path: '/content/geometrixx/en',
                },
                {
                  _type: 'type',
                  type: 'cq:Page',
                },
              ],
            },
            {
              _type: 'and',
              predicates: [
                {
                  _type: 'path',
                  path: '/content/dam/geometrixx',
                },
                {
                  _type: 'type',
                  type: 'dam:Asset',
                },
              ],
            },
          ],
        },
      ],
    };

    assert.deepEqual(loadtext(`p.limit=10
fulltext=Management
group.1_group.path=/content/geometrixx/en
group.1_group.type=cq:Page
group.2_group.path=/content/dam/geometrixx
group.2_group.type=dam:Asset`), res);
  });
});

describe('Utility Unit Tests', () => {
  it('Flat packs it', () => {
    const arr = [[1, 2], 3];
    assert.deepEqual(arr.reduce(flat, []), [1, 2, 3]);
  });
});

describe('Test Query Builder Range Property Filters', () => {
  const testarray = [
    { foo: 'bar', bar: 'baz', val: 1 },
    { foo: 'foo', bar: 'bar', val: 3.1415 },
    { foo: 'baz', bar: 'foo', val: 100 },
    { foo: 'baz', bar: 'foo', val: undefined },
  ];

  it('createfilter limits results', () => {
    assert.deepEqual(qb`rangeproperty.property=val
rangeproperty.lowerBound=1
rangeproperty.upperBound=100`(testarray), [
      { foo: 'foo', bar: 'bar', val: 3.1415 },
    ]);

    assert.deepEqual(qb`rangeproperty.property=val
rangeproperty.lowerBound=1
rangeproperty.lowerOperation=x
rangeproperty.upperOperation=x
rangeproperty.upperBound=100`(testarray), [{ foo: 'bar', bar: 'baz', val: 1 },
      { foo: 'foo', bar: 'bar', val: 3.1415 },
      { foo: 'baz', bar: 'foo', val: 100 }]);
  });
});

describe('Test Query Builder Property Filters', () => {
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

  it('createfilter limits results', () => {
    assert.deepEqual(qb`p.limit=1`(testarray), [
      { foo: 'bar', bar: 'baz' },
    ]);

    assert.deepEqual(qb`p.offset=1&p.limit=1`(testarray), [
      { foo: 'foo', bar: 'bar' },
    ]);

    assert.deepEqual(qb`p.offset=1`(testarray), [
      { foo: 'foo', bar: 'bar' },
      { foo: 'baz', bar: 'foo' },
    ]);
  });

  it('createfilter filters properties with equals', () => {
    assert.deepEqual(qb`property=foo
property.value=bar`(testarray), [
      { foo: 'bar', bar: 'baz' },
    ]);
  });

  it('createfilter filters properties with like', () => {
    assert.deepEqual(qb`property=foo
property.operation=like
property.value=a`(testarray), [
      { foo: 'bar', bar: 'baz' },
      { foo: 'baz', bar: 'foo' },
    ]);

    assert.deepEqual(qb`property=unknown
property.operation=like
property.value=a`(testarray), []);

    assert.deepEqual(qb`property=unknown&property.operation=like&property.value=a`(testarray), []);
  });

  it('createfilter filters properties with unequals', () => {
    assert.deepEqual(qb`property=foo
property.operation=unequals
property.value=foo`(testarray), [
      { foo: 'bar', bar: 'baz' },
      { foo: 'baz', bar: 'foo' },
    ]);
  });

  it('createfilter filters properties with unequals and OR joins', () => {
    assert.deepEqual(qb`1_property=foo
1_property.value=bar
2_property=foo
2_property.value=baz
nop=nop`(testarray), [
      { foo: 'bar', bar: 'baz' },
      { foo: 'baz', bar: 'foo' },
    ]);
  });

  it('createfilter filters properties with exists', () => {
    assert.deepEqual(qb`property=foo
property.operation=exists`(testarray), testarray);

    assert.deepEqual(qb`property=qxb
property.operation=exists`(testarray), []);
  });

  it('createfilter filters properties with not', () => {
    assert.deepEqual(qb`property=foo
property.operation=not`(testarray), []);

    assert.deepEqual(qb`property=qxb
property.operation=not`(testarray), testarray);
  });
});

describe('Test Conjunction Transformer', () => {
  it('Keeps exitsing structure', () => {
    const input = {
      _type: 'property',
      property: 'foo',
      value: 'bar',
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
      _type: 'and',
      predicates: [
        {
          _type: 'or',
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
          _type: 'or',
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
