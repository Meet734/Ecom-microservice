# Ecom-Microservice
Architected a distributed e-commerce backend decomposed into 8 independently deployable microservices (Auth, User, Product, Order, Payment, Inventory, Notification, API Gateway), each owning an isolated PostgreSQL instance to enforce strict service boundaries and eliminate cross-service data coupling. Designed and implemented JWT-based authentication with short-lived access tokens (15min), rotating refresh tokens (7d), and Redis-backed token blacklisting to handle secure logout and session revocation across stateless services. Built an event-driven async pipeline using RabbitMQ — order placement publishes events consumed independently by the Inventory Service (stock deduction) and Notification Service (email dispatch), achieving loose coupling and eventual consistency without synchronous inter-service calls.
Integrated Elasticsearch for full-text product search with relevance ranking, and Redis for product catalog caching, reducing read latency on high-traffic product listing endpoints. Deployed an Nginx API Gateway as the single entry point, handling reverse proxying, rate limiting (100 req/min per IP), CORS, and request header injection for downstream service identity propagation. Containerized the entire platform using Docker and Docker Compose — all 8 services, 6 PostgreSQL instances, Redis, RabbitMQ, and Elasticsearch orchestrated with a single docker compose up command, with health checks and automatic service restart policies.

## Tech Stack
|Layer|Tool|
|---|---|
|Note vault|Obsidian {Local Markdown files}|
|AI assistant|Github Copilot|
|Frontend|Next.js|
|Backend|Node.js, Express.js|
|Database|PostgreSQL, Redis|
|MQTP|RabbitMQ|
|Search|Elasticsearch|
|Deployment|Docker, Nginx|

## Current State
> All 5 core microservices running. order-service built and deployed. Frontend auth flows fixed. Role-based permission bugs resolved.

**Last Update:** 2026-06-14

## Working
- Microservices: auth-service, inventory-service, notification-service, product-service, user-service, **order-service**
- Frontend: Auth (login/register/logout) fully wired. Dashboard, Profile, Addresses, Products, Inventory pages working with correct role gating.
- Docker: All services in docker-compose, deploying fine. All services have individual Dockerfiles.
- Vault: bug log up to date (bugs 01–08 documented and closed)

## Broken
- Frontend: Very basic UI. order-service pages not yet built in frontend.
- Microservices: api-gateway (Nginx), payment-service still not implemented.

## Focus right now
- High priority: api-gateway (Nginx), payment-service implementation.
- Medium priority: Frontend order flow pages (place order, order history, order detail).
- Low priority: Unit/integration tests, security hardening, UX polish.

## Key Decisions Made
These are settled. Do not reopen without a good reason.

- **Language:** Javascript, TypeScript
- **Framework:** Next.js, Express.js
- **Database: ** PostgreSQL, Redis
- **Package manager:** npm