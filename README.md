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

For more, see the [API documentation](docs/API.md).

## Development

### Deploying Helix Data Embed

Deploying Helix Data Embed requires the `wsk` command line client, authenticated to a namespace of your choice. For Project Helix, we use the `helix` namespace.

All commits to master that pass the testing will be deployed automatically. All commits to branches that will pass the testing will get commited as `/helix-services/data-embed@ci<num>` and tagged with the CI build number.
