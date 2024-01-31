# Load testing

These load tests only work in the development environment (i.e. NODE_ENV=development). 

## Install required packages

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

1. Create an .env-file in this directory. Copy-paste the contents of .env.example into the file.
2. Complete the API configuration. Check the [REST API README](https://github.com/jorenvermeersch/bachelorproef-backend) for more information. 
3. Complete the `YARN_EXECUTABLE` and `API_DIRECTORY` fields. 

## Run load tests

```
python load_tests.py [NUMBER_OF_RUNS]
```

### Run one scenario

```
artillery run -e development --config ./config.yaml ./scenarios/[SCENARIO_FILENAME.yaml]
```

**Note**: Do not add the `--config` flag to the login test. 