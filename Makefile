.PHONY: dev backend frontend install test docker-up docker-down clean

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

# Install all dependencies
install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

# Run tests
test:
	cd backend && pytest tests/ -v

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
	@echo "  make dev        - Run backend + frontend (development)"
	@echo "  make backend    - Run backend only"
	@echo "  make frontend   - Run frontend only"
	@echo "  make install    - Install all dependencies"
	@echo "  make test       - Run backend tests"
	@echo "  make docker-up  - Start with Docker Compose"
	@echo "  make docker-down- Stop Docker Compose"
	@echo "  make clean      - Remove build artifacts"
