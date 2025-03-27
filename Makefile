.PHONY: help
help: targets

.PHONY: targets
targets:
	@echo "\033[34m---------------------------------------------------------------\033[0m"
	@echo "\033[34mDevelopment Targets\033[0m"
	@echo "\033[34m---------------------------------------------------------------\033[0m"
	@awk '/^[a-zA-Z_-]+:.*## / {printf "\033[33m%-23s\033[0m %s\n", $$1, substr($$0, index($$0, "## ") + 3)}' $(MAKEFILE_LIST)

########################################################################################################################

.PHONY: run-fe
run-fe: ## Run the frontend (React)
	@cd frontend && npm run dev

.PHONY: setup-fe
setup-fe: ## Setup the frontend (install dependencies)
	@cd frontend && npm install

########################################################################################################################

.PHONY: run-be
run-be: ## Run the backend (Django)
	@cd backend && python3 manage.py runserver

.PHONY: setup-be
setup-be: ## Setup the backend (install dependencies)
	@cd backend && pip3 install -r requirements.txt

.PHONY: migrate
migrate: ## Run the migrations
	@cd backend && python3 manage.py migrate

########################################################################################################################

.PHONY: docker-up-local
docker-up-local: ## Run containers in development mode (with .env.local)
	@docker compose -f docker/compose.base.yml -f docker/compose.local.yml --env-file .env.local up --build

.PHONY: docker-up-prod
docker-up-prod: ## Run containers in production mode (with .env.prod)
	@docker compose -f docker/compose.base.yml -f docker/compose.prod.yml --env-file .env.prod up --build -d

.PHONY: docker-down-local
docker-down-local: ## Stop local containers
	@docker compose -f docker/compose.base.yml -f docker/compose.local.yml --env-file .env.local down

.PHONY: docker-down-prod
docker-down-prod: ## Stop prod containers
	@docker compose -f docker/compose.base.yml -f docker/compose.prod.yml --env-file .env.prod down
