# HQ Payment

## Usage

* `npm install`
* postgres db/user/grant (below)
* `gulp`
* `node app.js`
* http://localhost:8080 (default)

## Postgres commands (default)

* `> create database hq;`
* `> create user hq with password 'sdafu712ns';`
* `> grant all on database hq to hq;`

## Dependencies
* node.js >= 0.10
* PostgreSQL >= 9.3

## Testing
* `npm test`
