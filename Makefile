.PHONY: dev backend frontend install test docker-up docker-down clean mobile mobile-ios mobile-android mobile-test dev-all

# Development - run both services
dev:
	@echo "Starting backend and frontend..."
	@make -j2 backend frontend

# Backend only
backend:
	cd backend && python main.py

# Frontend only
frontend:
	cd frontend && npm run dev

# Mobile
mobile:
	cd apps/mobile && npx expo start

mobile-ios:
	cd apps/mobile && npx expo run:ios

mobile-android:
	cd apps/mobile && npx expo run:android

mobile-test:
	cd apps/mobile && npx jest

# Full stack with mobile
dev-all:
	@echo "Starting backend, frontend, and mobile..."
	@make -j3 backend frontend mobile

# Install all dependencies
install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install
	npm install

# Run tests
test:
	cd backend && pytest tests/ -v
	cd apps/mobile && npx jest

# Docker commands
docker-up:
	docker-compose up --build

docker-down:
	docker-compose down

# Clean build artifacts
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "dist" -exec rm -rf {} + 2>/dev/null || true

# Help
help:
	@echo "Available commands:"
	@echo "  make dev          - Run backend + frontend (development)"
	@echo "  make dev-all      - Run backend + frontend + mobile"
	@echo "  make backend      - Run backend only"
	@echo "  make frontend     - Run frontend only"
	@echo "  make mobile       - Run Expo mobile dev server"
	@echo "  make mobile-ios   - Run mobile on iOS"
	@echo "  make mobile-android - Run mobile on Android"
	@echo "  make mobile-test  - Run mobile unit tests"
	@echo "  make install      - Install all dependencies"
	@echo "  make test         - Run all tests (backend + mobile)"
	@echo "  make docker-up    - Start with Docker Compose"
	@echo "  make docker-down  - Stop Docker Compose"
	@echo "  make clean        - Remove build artifacts"
