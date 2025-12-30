# Recommended Technology Stack & Libraries

Based on the **PlayLocal** system architecture (Polyglot Persistence, SOA, Real-time features) and the current project scaffolding (Spring Boot + Next.js), the following libraries and frameworks are recommended.

## 1. Backend (Spring Boot)

The backend requires robust support for multiple database types, transaction management, and asynchronous messaging.

### A. Data Access Layers (Polyglot Persistence)

| Category | Requirement | Recommended Library | Justification |
| :--- | :--- | :--- | :--- |
| **Relational** | ACID compliance, User/Game data | **Spring Data JPA (Hibernate)** | Standard for Spring Boot. Provides repository abstraction and transaction management (`@Transactional`) required for the *Reputation Service*. |
| **Graph** | Social Graph (Friends, Mutuals) | **Spring Data Neo4j** | First-class support for Neo4j. Allows mapping nodes/relationships to Java objects, essential for the *Social Graph Service*. |
| **Document** | Chat Messages (High volume) | **Spring Data MongoDB** | Efficient for storing chat logs. Flexible schema allows for evolving message formats in the *Chat Service*. |
| **Migrations** | Schema Versioning | **Flyway** | Essential for the Relational DB (PostgreSQL) to manage schema changes (tables, foreign keys) reliably across environments. |

### B. Service Communication & Architecture

| Category | Requirement | Recommended Library | Justification |
| :--- | :--- | :--- | :--- |
| **API Gateway** | Routing, Single Entry Point | **Spring Cloud Gateway** | Built on Spring WebFlux. Native integration with Spring Boot ecosystem for routing requests to User, Game, or Chat services. |
| **Messaging** | Async Notifications | **Spring AMQP (RabbitMQ)** | Robust abstraction for RabbitMQ. Ideal for decoupling the *Game Completion Trigger* from the *Notification Service*. |
| **Real-time** | In-game Chat | **Spring WebSocket (STOMP)** | Provides WebSocket support with STOMP protocol, allowing for pub/sub messaging needed for chat rooms. |

### C. Testing & Quality

| Category | Recommended Library | Justification |
| :--- | :--- | :--- |
| **Integration Testing** | **Testcontainers** | **Critical for Polyglot Persistence.** Allows spinning up real Docker containers for PostgreSQL, Neo4j, and MongoDB during tests to ensure queries work against actual databases, not just mocks. |
| **Unit Testing** | **JUnit 5 + Mockito** | Standard Java testing stack (already included in `spring-boot-starter-test`). |

---

## 2. Frontend (Next.js / React)

The frontend needs to handle complex state (social graph data), real-time updates (chat), and a polished UI.

### A. Core Application Logic

| Category | Requirement | Recommended Library | Justification |
| :--- | :--- | :--- | :--- |
| **Data Fetching** | API Interaction | **TanStack Query (React Query)** | Manages server state (caching, loading states, re-fetching). Essential for keeping the UI in sync with the backend services without manual `useEffect` spaghetti. |
| **State Management** | Client-side State | **Zustand** | Lightweight and simpler than Redux. Perfect for managing global client state like "Current User Session" or "Active Chat Room" without boilerplate. |
| **Forms** | User Input | **React Hook Form + Zod** | Performant form validation. Zod allows defining schemas that can be shared or synced with backend DTOs. |

### B. UI & UX

| Category | Requirement | Recommended Library | Justification |
| :--- | :--- | :--- | :--- |
| **Component Library** | UI Consistency | **shadcn/ui** | Built on top of Tailwind CSS (which is already installed). Provides accessible, customizable components that copy directly into your project, avoiding "fighting the framework." |
| **Icons** | Visuals | **Lucide React** | Clean, consistent icon set that pairs well with shadcn/ui. |
| **Dates** | Scheduling Games | **date-fns** | Lightweight date manipulation library. Essential for formatting game times and countdowns. |

### C. Real-time Client

| Category | Requirement | Recommended Library | Justification |
| :--- | :--- | :--- | :--- |
| **WebSocket Client** | Chat Connection | **@stomp/stompjs** | The standard JavaScript client for connecting to Spring Boot's STOMP-over-WebSocket endpoints. |

---

## 3. Infrastructure & Dev Environment

To support the "Polyglot Persistence" locally without installing 3 different databases on every developer's machine:

*   **Docker Compose:** Create a `docker-compose.yml` at the root to spin up:
    *   PostgreSQL (Port 5432)
    *   Neo4j (Port 7474/7687)
    *   MongoDB (Port 27017)
    *   RabbitMQ (Port 5672/15672)

This ensures all developers (`mvn spring-boot:run`) connect to the same infrastructure configuration.
