# Load testing

These load tests only work in the development environment (i.e. NODE_ENV=development). 

## Required packages

The load tests are run using [Artillery](https://www.artillery.io/).

```
npm install -g artillery
```

Then create a Python virtual environment and install the required packages. 

```
python -m venv venv

# Bash:
source venv\Scripts\activate

# Windows:
venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

## Set environment variables

1. Create an .env-file in this directory. Copy-paste the contents below into the file.
2. Change the API configuration. Check the API README for more information. 
3. Complete the `DATABASE_PASSWORD`, `YARN_EXECUTABLE` and `API_DIRECTORY` fields. 

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
YARN_EXECUTABLE="path/to/yarn/executable"
API_DIRECTORY="path/to/api/directory"
```


## Run load tests

```
python load_tests.py [NUMBER_OF_RUNS]
```

## Run one scenario

```
artillery run -e development --config ./config.yaml ./scenarios/[SCENARIO_FILENAME.yaml]
```