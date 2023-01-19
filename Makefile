build:
	docker-compose up --build -d

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -t -f --tail 40