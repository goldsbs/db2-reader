# An application to read data from a remote IBM Db2 database
This has been tested with a remote Db2 database running on an AIX system hosted in the IBM CECC. It is part of a wider demo looking at connecting new OpenShift based Cloud applications to data stored in on-premises systems.

## Usage
This application presents a number of API endpoints over http to read data from a remote Db2 database. By default it listens on port 8080.

Host details and user credentials are provided as environment variables. When deploying using Red Hat OpenShift Container Platform these should be provided within a key/value secret to be passed into the microservice pod. When deployed through other means the environment variables listed below need to be passed to the runtime.

The data to use comes from the sample dataset available with the Db2 installer, which includes small scale tables of data based on common business data.

## Endpoints
`/getProducts` provides a JSON object where `data` is an array of products with relevant information.

`/getEmployees` provides a JSON objcet where `data` is an array of employees with limited information.
Returns the employee number, first name, last name and job title of each employee.

`/getAllEmployees` provides a JSON objcet where `data` is an array of employees with limited information.
Returns the employee number, first name, last name, job title, and department name of each employee. This uses a table join in the Db2 query.

`/getEmployee` expects an input value of `id` which is the employee number. It then returns the full information record of that employee in the `data` component of the returned JSON object.

## Environment Variables
The following environment variables need to be passed to the running instance of this application to provide connection details for the Db2 database.

`DB_DATABASE` is the name of the database being queried - for the demo this is 'sample'

`DB_HOSTNAME` is the IP address or hostname of the server running Db2 - for the demo this is the CECC provided host

`DB_PORT` is the port used to connect to Db2 - for the demo this is 6443

`DB_UID` is the username of the user running the Db2 instance - for the demo this is 'cecuser'

`DB_PWD` is the password of the user running the Db2 instance

`DB_SCHEMA` is the schema used to create the database `DB_DATABASE` - for the demo this is 'cecuser'

## Requirements
The system or OpenShift cluster that is running this code must have network connectivity to the server and port running IBM Db2.
The Db2 database manager must be set up and running the SAMPLE database prepopulated with data.