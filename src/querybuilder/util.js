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
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
function transformconjunctions(qbtree) {
  // this is not a group, just ignore it
  if (!qbtree.predicates) {
    return qbtree;
  }
  if (qbtree.conjunction === 'or' || qbtree.conjunction === 'and') {
    // we know the group type
    qbtree._type = qbtree.conjunction;
    delete qbtree.conjunction;
    return qbtree;
  }
  const groups = qbtree.predicates.reduce((grps, predicate) => {
    const name = `${predicate._type}:${predicate.property}`;
    if (!grps[name]) {
      grps[name] = [];
    }
    grps[name].push(predicate);
    return grps;
  }, {});

  qbtree._type = 'and';
  delete qbtree.or;
  delete qbtree.conjunction;
  qbtree.predicates = Object.values(groups).map((predicates) => {
    if (predicates.length === 1) {
      // no need to create an or group of a single predicate
      return predicates[0];
    }
    return {
      _type: 'or',
      predicates,
    };
  });

  return qbtree;
}

module.exports = { transformconjunctions };
