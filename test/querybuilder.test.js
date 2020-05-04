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
const { loadquerystring, loadtext } = require('../src/querybuilder/url');

describe('Test Query Builder URL Parser', () => {
  it('Works for empty strings', () => {
    assert.deepEqual(loadquerystring(''), {});
  });

  it('Works non-matching prefixes', () => {
    assert.deepEqual(loadquerystring('foo=bar', '_hlx'), {});
  });
});

describe('Test Query Builder Text Parser', () => {
  it('Works for empty strings', () => {
    assert.deepEqual(loadtext(''), {});
  });

  it('Loads simple examples', () => {
    assert.deepEqual(loadtext(`type=cq:Page
1_property=jcr:content/cq:template
1_property.value=/apps/geometrixx/templates/homepage
2_property=jcr:content/jcr:title
2_property.value=English`), [
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
    ]);
  });
});
