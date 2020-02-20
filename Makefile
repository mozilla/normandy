geo_data: GeoLite2-Country.mmdb 

GeoLite2-Country.mmdb:
	./bin/download_geolite2.sh

build:
	docker-compose build

createuser: build
	docker-compose run app python manage.py createsuperuser

check_migrations: build
	docker-compose run app sh -c "/app/bin/wait-for-it.sh db:5432 -- python manage.py makemigrations --check --dry-run --noinput"

makemigrations: build
	docker-compose run app sh -c "/app/bin/wait-for-it.sh db:5432 --  python manage.py makemigrations"

migrate: build
	docker-compose run app sh -c "/app/bin/wait-for-it.sh db:5432 -- python manage.py migrate"

load_geo_location: build
	docker-compose run app ./bin/download_geolite2.sh

update_actions: build
	docker-compose run app python manage.py update_actions

update_product_details: build
	docker-compose run app python manage.py update_product_details
	
load_initial_data: build
	docker-compose run app python manage.py initial_data

load_data: migrate update_actions load_initial_data

lint: SHELL:=/bin/bash -O extglob
lint:
	docker-compose run app therapist run --disable-git ./!(node_modules|assets|docs)

code_format: SHELL:=/bin/bash -O extglob
code_format:
	docker-compose run app therapist run --fix --disable-git ./!(node_modules|assets|docs)
check: check_migrations lint test

kill:
	docker ps -a -q | xargs docker kill;docker ps -a -q | xargs docker rm

test: build
	docker-compose run -e DJANGO_CONFIGURATION=Test app sh -c "/app/bin/wait-for-it.sh db:5432 -- pytest"

shell: build
	docker-compose run app python manage.py shell

bash: build
	docker-compose run app bash

up: build
	docker-compose up

refresh: kill migrate load_data

# Usage: make generate_deploy_bug FROM=fromtag TO=totag
generate_deploy_bug: build
	docker-compose run app python bin/generate_deploy_bug.py $(FROM) $(TO)
