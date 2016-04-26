This is a repo to hold all the bits to get a prod-like Normandy running using [Docker Compose][].

[Docker Compse]: https://docs.docker.com/compose/

1. Install [Docker][] and Docker Compose, and start the Docker daemon (possibly via [Docker Machine][]).
2. Clone this repo, and `cd` into it.
3. `./bin/genkeys.sh` to create keys for HTTPS.
4. `docker-compose up -d` to download Docker images, and run them in the background.
5. `docker-compose run normandy ./manage.py migrate` to create the needed database tables.
6. `docker-compose run normandy ./manage.py createsuperuser` to create a user you can log in with.
7. Open `http://localhost:8000` or `http://$(docker-machine ip):8000` in your browser. Accept the self-signed certificate.
8. Later, run `docker-compose down` to shut everything down.

[Docker Machine]: https://docs.docker.com/machine/
