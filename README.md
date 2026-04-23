# NexCart Microservices Platform

A complete, production-ready microservices e-commerce application built with Node.js, Express, PostgreSQL, RabbitMQ, and React.

## 🏗 Architecture

The application consists of 5 backend microservices and 1 frontend application:

1.  **Auth Service** (Port 3001) - Handles user registration, login, JWT generation, and validation.
2.  **Products Service** (Port 3002) - Manages product catalog, categories, and inventory. Seeds data on first run.
3.  **Orders Service** (Port 3003) - Manages shopping cart, checkout process, and publishes `order.placed` events to RabbitMQ.
4.  **Notifications Service** (Port 3004) - Subscribes to RabbitMQ events and stores notifications for users.
5.  **API Gateway** (Port 3000) - Central entry point. Proxies requests to appropriate services, handles CORS, and rate-limiting.
6.  **Frontend** (Port 5173) - Modern React SPA built with Vite, Tailwind CSS, and Axios.

### Database
Each backend service has its own completely isolated PostgreSQL instance, ensuring true microservice data boundaries. They are exposed to the host machine on ports `5432` through `5435` for debugging purposes.

---

## 🐳 Running with Docker

### Prerequisites
- Docker 24+
- Docker Compose v2

### Commands
- `make up` - Start all services in the background
- `make logs` - View logs for all services
- `make down` - Stop all services

### Service URLs

| Service | URL |
|---|---|
| Frontend | http://localhost |
| API Gateway | http://localhost:3000 |
| RabbitMQ UI | http://localhost:15672 |
| PostgreSQL (Auth) | localhost:5432 |
| PostgreSQL (Products) | localhost:5433 |
| PostgreSQL (Orders) | localhost:5434 |
| PostgreSQL (Notifications)| localhost:5435 |

---

## 🚀 Running Locally (Without Docker)

### Prerequisites
1.  **Node.js** (v18+ recommended)
2.  **PostgreSQL** (Running on localhost:5432)
3.  **RabbitMQ** (Running on localhost:5672)

### Step 1: Database Setup

Ensure PostgreSQL is running. Run the unified init script against your database (default DB name is `nexcart`, user `postgres`, pass `postgres`):

```bash
# Example using psql
psql -U postgres -d postgres -c "CREATE DATABASE nexcart;"
psql -U postgres -d nexcart -f db/init.sql
```

*(You can adjust DB credentials via `.env` files in each service if needed).*

### Step 2: Install Dependencies

You'll need to run `npm install` in every service directory and the frontend:

```bash
# Backend services
cd services/gateway && npm install
cd ../auth && npm install
cd ../products && npm install
cd ../orders && npm install
cd ../notifications && npm install

# Frontend
cd ../../frontend && npm install
```

### Step 3: Start the Services

You must start all services. Open a new terminal for each service:

**Terminal 1 (Auth):**
```bash
cd services/auth && npm run dev
```

**Terminal 2 (Products):**
```bash
cd services/products && npm run dev
```

**Terminal 3 (Orders):**
```bash
cd services/orders && npm run dev
```

**Terminal 4 (Notifications):**
```bash
cd services/notifications && npm run dev
```

**Terminal 5 (Gateway):**
```bash
cd services/gateway && npm run dev
```

**Terminal 6 (Frontend):**
```bash
cd frontend && npm run dev
```

### Step 4: Access the Application

Open your browser and navigate to: **http://localhost:5173**

- The Products service will automatically seed 10 sample products and 5 categories on its first startup.
- You can create a new account or use the demo credentials provided on the login page.
