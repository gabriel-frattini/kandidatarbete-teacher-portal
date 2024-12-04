## Make sure to install nodemon.

## To run portal:

- npm init
- create .env and add "DATABASE_URL=<Your database url> (can be found in project->realtime database, you might need to create one)
- also add another variable called "SESSION_SECRET=<session key>", can be whatever or generated: https://theorangeone.net/projects/django-secret-key-generator/
- you need to generate key, in firebase project settings->service accounts->generate key
- add generated json file and rename to: tentamina.json
- nodemon index.js
