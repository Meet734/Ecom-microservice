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
> All 8 microservices and the API Gateway are fully implemented, dockerized, and wired. event-driven flows via RabbitMQ connect payment, orders, inventory, and notifications. Frontend auth, order, and checkout/payment flows are 100% complete.

**Last Update:** 2026-06-18

## Working
- Microservices: auth-service, user-service, product-service, inventory-service, order-service, payment-service, notification-service, api-gateway
- Frontend: Auth (login/register/logout), Dashboard, Profile, Addresses, Products, Categories, Inventory, Orders, and Checkout/Payment pages
- Event Architecture: Asynchronous RabbitMQ loops (stock reservation, payment confirmation, order cancellation, and email templates dispatch)
- Docker: Single command `docker compose up -d` boots all 8 services, 6 databases, Redis, RabbitMQ, and Elasticsearch

## Broken
- None. All major services, integrations, UI forms, and event logic have been completed and verified.

## Focus right now
- Interview & Resume Presentation: Ready for deployment on local dev machines or AWS ECS/EKS.

## Key Decisions Made
These are settled. Do not reopen without a good reason.

- **Language:** Javascript (ES Modules)
- **Framework:** Next.js (App Router), Express.js
- **Database:** PostgreSQL, Redis
- **Package manager:** npm