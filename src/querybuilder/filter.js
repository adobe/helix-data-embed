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
/* eslint-disable no-use-before-define, no-underscore-dangle */
const filters = {
  or: (qbtree) => (entry) => qbtree.predicates.reduce((previous, predicate) => {
    const predicatetest = createtest(predicate);
    return previous || predicatetest(entry);
  }, false), // start with rejectance

  // go over the predicates until all satisfy, then return
  and: (qbtree) => (entry) => qbtree.predicates.reduce((previous, predicate) => {
    const predicatetest = createtest(predicate);
    return previous && predicatetest(entry);
  }, true), // start with acceptance

  property: ({ property, value, operation = 'equals' }) => (entry) => {
    switch (operation) {
      case 'exists': return entry[property] !== undefined;
      case 'not': return entry[property] === undefined;
      case 'like': return String(entry[property] || '').indexOf(value) >= 0;
      case 'unequals': return entry[property] !== value;
      default: return entry[property] === value;
    }
  },
};

function createfilter(qbtree) {
  // look up a function for the type
  const applicable = filters[qbtree._type] ? filters[qbtree._type] : defaultfilter;
  const filterfn = applicable(qbtree);

  const offset = Number.isInteger(qbtree.offset) ? qbtree.offset : 0;
  const limit = Number.isInteger(qbtree.limit) ? offset + qbtree.limit : undefined;

  // return a function that can filter the data
  return (data) => data.filter(filterfn).slice(offset, limit);
}

function createtest(qbtree) {
  // look up a function for the type
  const applicable = filters[qbtree._type] ? filters[qbtree._type] : defaultfilter;
  return applicable(qbtree);
}

function defaultfilter() {
  return () => true;
}


module.exports = { createfilter };
