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
  or: qbtree => data => qbtree.predicates.reduce((filtered, predicate) => {
    const predicatefilter = createfilter(predicate);
    // all entries that satisfy the current predicate
    const accepted = predicatefilter(data);

    // return any entry that either satisfies the current or any previous predicate
    return data.filter((entry) => accepted.indexOf(entry) >= 0 || filtered.indexOf(entry) >= 0);
  }, []), // start with an empty set and build

  // go over the predicates until all satisfy, then return
  and: qbtree => data => qbtree.predicates.reduce((filtered, predicate) => {
    const predicatefilter = createfilter(predicate);
    // all entries that satisfy the current predicate
    const accepted = predicatefilter(data);

    // return any entry that either satisfies the current or any previous predicate
    return data.filter((entry) => accepted.indexOf(entry) >= 0 && filtered.indexOf(entry) >= 0);
  }, data) // start with all data, then whittle down
};

function createfilter(qbtree) {
  // look up a function for the type
  const applicable = filters[qbtree._type] ? filters[qbtree._type] : defaultfilter;
  const filterfn = applicable(qbtree);

  // return a function that can filter the data
  return (data) => data.filter(filterfn);
}

function defaultfilter() {
  return () => true;
}


module.exports = { createfilter };
