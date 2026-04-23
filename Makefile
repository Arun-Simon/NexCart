.PHONY: up down logs restart ps db-shell rabbit clean

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

restart:
	docker compose down && docker compose up --build -d

ps:
	docker compose ps

db-shell-auth:
	docker compose exec postgres-auth psql -U nexcart -d nexcart

db-shell-products:
	docker compose exec postgres-products psql -U nexcart -d nexcart

db-shell-orders:
	docker compose exec postgres-orders psql -U nexcart -d nexcart

db-shell-notifications:
	docker compose exec postgres-notifications psql -U nexcart -d nexcart

rabbit:
	open http://localhost:15672 || xdg-open http://localhost:15672 || start http://localhost:15672

clean:
	docker compose down -v --rmi all
