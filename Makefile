build:
	docker-compose build

makemigrations: build
	docker-compose run app python manage.py makemigrations

migrate: build
	docker-compose run app python manage.py migrate

load_geo_location: build
	docker-compose run app ./bin/download_geolite2.sh

update_actions: build
	docker-compose run app python manage.py update_actions

update_product_details: build
	docker-compose run app python manage.py update_product_details
	
load_initial_data: build
	docker-compose run app python manage.py initial_data

load_data: migrate load_geo_location update_actions load_initial_data

kill:
	docker ps -a -q | xargs docker kill;docker ps -a -q | xargs docker rm

test:
	docker-compose run -u root -e DJANGO_CONFIGURATION=Test app pytest

shell: build
	docker-compose run app python manage.py shell

bash: build
	docker-compose run app bash

up: build
	docker-compose up

refresh: kill migrate load_data
