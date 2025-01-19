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

.PHONY: dockerc
dockerc: ## Docker compose and run fe and be containers
	@docker-compose up --build