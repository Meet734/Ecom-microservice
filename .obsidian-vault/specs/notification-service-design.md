# Notification Service Design Spec

## Overview
The Notification Service is a core utility in the ShopStack microservices architecture. It functions primarily as an **Event-Driven Background Worker**, consuming events from RabbitMQ and delivering messages to users via multiple channels (Email, potentially SMS/Push).

Following the project's established patterns (Node.js, ES Modules, RabbitMQ, Sequelize), this service will handle template-based communication without exposing a public HTTP surface, though internal APIs may be added for specific triggers.

## Core Functionalities
1.  **Multi-Channel Delivery**: Support for Email (Nodemailer) with a roadmap for SMS and In-app notifications.
2.  **Dynamic Templating**: Use a rendering engine (e.g., Handlebars) to inject dynamic data (order details, user names) into pre-defined layouts.
3.  **Event Consumption**: Listen to domain events across the system:
    -   `auth.user.registered`: Welcome email.
    -   `order.confirmed`: Order receipt.
    -   `order.shipped`: Tracking information.
    -   `inventory.low_stock`: Admin alerts.
4.  **Reliability & Retries**: Persistent message queueing with RabbitMQ and a dead-letter-exchange (DLX) for failed deliveries.
5.  **Audit Trail**: Store a record of all sent notifications for customer support and debugging.

## Technical Architecture

### 1. Event Flow
1.  **Producer**: A service (e.g., `order-service`) publishes an event to a RabbitMQ exchange (e.g., `order.events`).
2.  **Broker**: RabbitMQ routes the message to the `notification.queue`.
3.  **Consumer**: `notification-service` consumes the message.
4.  **Processor**: The service identifies the required template and channel.
5.  **Renderer**: Data is merged with a template.
6.  **Provider**: The final message is sent via an external provider (SMTP/SendGrid).

### 2. Service Structure (Existing Patterns)
-   `src/config/`: SMTP settings, RabbitMQ connections, Env validation.
-   `src/events/consumer.js`: Main event routing logic.
-   `src/handlers/`: Specific logic for each event type (e.g., `handleOrderConfirmed.js`).
-   `src/templates/`: Handlebars/HTML files for emails.
-   `src/services/`: Core logic for sending (EmailService, TemplateService).
-   `src/models/`: `NotificationLog` and `UserNotificationPreference`.

### 3. Data Model (Sequelize)
**NotificationLog**
-   `id`: UUID
-   `user_id`: UUID
-   `type`: String (ORDER_CONFIRMATION, WELCOME_EMAIL)
-   `channel`: Enum (email, sms)
-   `recipient`: String (email address or phone)
-   `status`: Enum (pending, sent, failed)
-   `error_details`: Text
-   `metadata`: JSONB (Store the original event payload for reference)

## API Design (Internal)
While primarily a worker, the following internal endpoints can be exposed for service-to-service communication:

-   `POST /internal/send`: Manually trigger a notification.
-   `GET /internal/history/:userId`: Fetch recent notifications for a user (to show in a "Notifications" dashboard).
-   `GET /internal/preferences/:userId`: Fetch user-specific notification settings.

## Implementation Roadmap
1.  [ ] **Phase 1**: Implement `EmailService` using Nodemailer and Handlebars.
2.  [ ] **Phase 2**: Map RabbitMQ events to specific email handlers.
3.  [ ] **Phase 3**: Add Sequelize models for logging and audit.
4.  [ ] **Phase 4**: Implement retry logic for transient failures (e.g., SMTP timeouts).
5.  [ ] **Phase 5**: Add support for user preferences (opt-in/opt-out).

## Coding Style Alignment
-   Use **Joi** for validating event payloads within handlers.
-   Follow the **Controller-Service-Model** pattern if HTTP endpoints are added.
-   Use **Sequelize Transactions** when updating logs and preferences.
-   Maintain **strict env validation** using `envalid`.
