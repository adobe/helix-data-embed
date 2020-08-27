# Helix Data Embed

> Turns structured data from data sources around the web into nice JSON arrays that can be embedded using Helix-Pipeline

## Status
[![codecov](https://img.shields.io/codecov/c/github/adobe/helix-data-embed.svg)](https://codecov.io/gh/adobe/helix-data-embed)
[![CircleCI](https://img.shields.io/circleci/project/github/adobe/helix-data-embed.svg)](https://circleci.com/gh/adobe/helix-data-embed)
[![GitHub license](https://img.shields.io/github/license/adobe/helix-data-embed.svg)](https://github.com/adobe/helix-data-embed/blob/master/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/helix-data-embed.svg)](https://github.com/adobe/helix-data-embed/issues)
[![LGTM Code Quality Grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/adobe/helix-data-embed.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/adobe/helix-data-embed)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Installation

## Usage

```bash
curl https://adobeioruntime.net/api/v1/web/helix/helix-services/data-embed@v1/https://blogs.adobe.com/psirt/?feed=atom
```

While the above is simple to type, it is more safe to escape the url and optionally pass it as `src` query parameter:

```bash
curl https://adobeioruntime.net/api/v1/web/helix/helix-services/data-embed@v1/https%3A%2F%2Fblogs.adobe.com%2Fpsirt%2F%3Ffeed%3Datom
```

or

```bash
curl https://adobeioruntime.net/api/v1/web/helix/helix-services/data-embed@v1?src=https%3A%2F%2Fblogs.adobe.com%2Fpsirt%2F%3Ffeed%3Datom
```

### Data Sources

Supported data sources include:

- Microsoft Excel (in Excel, share with `helix@adobe.com` then copy the sharable URL)
- Google Sheets (in Google Sheets, share with `helix.integration@gmail.com` and copy the URL from the browser)
- Atom Feeds (must have `atom` somewhere in the URL)

### Filtering Results

`helix-data-embed` supports the [AEM Query Builder syntax](https://docs.adobe.com/content/help/en/experience-manager-65/developing/platform/query-builder/querybuilder-predicate-reference.html) for reducing the result set.

In order to avoid collisions with existing URL parameters, each QueryBuilder parameter must start with `hlx_`. For example to filter entries that have a property `bar` with the value `foo`, append the following to the URL:

```
hlx_property=foo&hlx_value=bar
```

If you want to restrict by range, use:

```
hlx_rangeproperty.property=age&hlx_rangeproperty.lowerBound=18&hlx_rangeproperty.upperBound=99
```

The predicates supported so far include:

- [`property`](https://docs.adobe.com/content/help/en/experience-manager-65/developing/platform/query-builder/querybuilder-predicate-reference.html#property)
- [`rangeproperty`](https://docs.adobe.com/content/help/en/experience-manager-65/developing/platform/query-builder/querybuilder-predicate-reference.html#rangeproperty)

(Just remember to add `hlx_` before each URL parameter name)

Furthermore, it is possible to limit the result set using `hlx_p.limit` and page through the result set using `hlx_p.offset`.

For more, see the [API documentation](docs/API.md).

## Working with Excel and Google Sheets

- The sheet inside an Excel workbook or Google spreadsheet can be addressed using the `sheet` parameter. 
- Only sheets having the `helix-` prefix can be addressed.
- If the workbook or spreadsheet does not have any `helix-` prefixed sheets, the first sheet is returned.
- By default, the _used range_ of the selected sheet is returned.
- For excel, A table can be addressed using the `table` request parameter, which can be a table name or an index. For example, `table=Table1` will return the table with the name `Table1`, `table=1` will return the second table in the sheet.

## Development

### Deploying Helix Data Embed

Deploying Helix Data Embed requires the `wsk` command line client, authenticated to a namespace of your choice. For Project Helix, we use the `helix` namespace.

All commits to master that pass the testing will be deployed automatically. All commits to branches that will pass the testing will get commited as `/helix-services/data-embed@ci<num>` and tagged with the CI build number.
