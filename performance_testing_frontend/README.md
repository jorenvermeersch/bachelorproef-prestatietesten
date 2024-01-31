# Performance testing

These performance tests were written for the development environment (i.e. NODE_ENV=development). 

## Required packages

The load tests are run using [Google Lighthouse](https://www.npmjs.com/package/lighthouse).

```
yarn global add lighthouse
```

Install the other required package: 

```
yarn install
```

## Set environment variables

1. Create an .env-file in this directory. Copy-paste the following contents into the file.
2. Change the API configuration. Check the API README for more information. 
3. Change the `API_DIRECTORY` and `FRONTEND_DIRECTORY` paths. 


```
# --- API configuration ----. 
# General. 
NODE_ENV=development
HOST=localhost
PORT=9000

# Logging. 
LOG_DISABLED=true

# Database. 
DATABASE_HOST="localhost"
DATABASE_PORT=3306
DATABASE_NAME="budget"
DATABASE_USERNAME="root"
DATABASE_PASSWORD="root"

# Authorization. 
AUTH_DISABLED=
AUTH_JWT_SECRET="secret"

# --- Script configuration ---. 
API_DIRECTORY="path/to/api/directory"
FRONTEND_DIRECTORY="path/to/frontend/directory"
```

## Run performance tests

```
node --env-file=.env ./performance_tests.js
```


### Configuration

The configuration for the test script is stored in the `config.json` file. 
