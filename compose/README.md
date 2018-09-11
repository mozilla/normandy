This project holds all the bits to get a prod-like Normandy running using
[Docker Compose][].

# Setup
1.  Install [Docker][] and Docker Compose, and start the Docker daemon.
1.  Clone this repo and cd into it
1.  cd compose
1.  `./bin/genkeys.sh` to create keys for HTTPS.
1.  `docker-compose up -d` to download Docker images, and run them in the background.
1.  `docker-compose run normandy ./manage.py migrate` to create the needed database tables.
1.  `docker-compose run normandy ./manage.py createsuperuser` to create a user you can log in with.
1.  `docker-compose run normandy ./manage.py update_actions` to load the action code into the database.
1.  `docker-compose run normandy ./manage.py initial_data` to load the initial channel and country data.
1.  Open `http://localhost:8000` in your browser. Accept the self-signed certificate.
1.  Later, run `docker-compose stop` to shut everything down.

# Local Development
To create an environment for local development, follow all of the above steps and then execute the following command:

1.  `docker-compose -f docker-compose-dev.yml up`

This will create a development environment that hosts your local copy of the Normandy service.

[Docker Compose]: https://docs.docker.com/compose/
[Docker]: https://docker.io

# Signing

This compose configuration is set up to use [Autograph][] to sign recipes. These signatures are required for the recipe client in Firefox. They are signed using a development key, which is publically known and shouldn't be trusted for anything serious. To instruct Firefox to trust this development key, set the pref `security.content.signature.root_hash` to `4C:35:B1:C3:E3:12:D9:55:E7:78:ED:D0:A7:E7:8A:38:83:04:EF:01:BF:FA:03:29:B2:46:9F:3C:C5:EC:36:04`.

[Autograph]: https://github.com/mozilla-services/autograph
