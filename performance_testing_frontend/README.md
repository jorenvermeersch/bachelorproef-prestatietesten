# Performance testing

These performance tests were written for the development environment (i.e. NODE_ENV=development).

## Install required packages

The load tests are run using [Google Lighthouse](https://www.npmjs.com/package/lighthouse).

```
yarn global add lighthouse
```

Install the other required package:

```
yarn install
```

## Set environment variables

1. Create an .env-file in this directory. Copy-paste the contents of .env.example into the file.
2. Complete the API configuration. Check the [REST API README](https://github.com/jorenvermeersch/bachelorproef-backend) for more information.
3. Complete the `API_DIRECTORY` and `FRONTEND_DIRECTORY` fields.

## Run performance tests

```
node --env-file=.env ./performance_tests.js
```

### Configuration

The configuration for the test script is stored in the `config.json` file.
