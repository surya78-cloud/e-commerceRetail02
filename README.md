# Fieldwork Retail

A full-stack retail-management platform with a React storefront and operations console and a Spring Boot REST API. It supports MongoDB or in-memory storage; in-memory mode is suitable for demos but does not persist data across restarts.

## Features

- **Store Operations Overview**: Real-time sales revenue, order count, product count, total units on hand, and low-stock metrics.
- **Product Catalogue**: Full CRUD support—create products, edit details (price, stock, SKU, category, status), search, filter by category, and delete.
- **Inventory Management**: Dedicated low-stock filter (&le; 5 units) with instant visual stock indicators.
- **Storefront & Shopping Bag**: Customer-facing catalogue with category filters, search, responsive product cards, cart quantity controls (+ / - / remove), and stock limits.
- **Interactive Checkout**: Dedicated checkout modal that places orders, validates inventory availability, and immediately decrements stock.
- **Order Management**: View all orders, view order line items breakdown, update order status (`New`, `Processing`, `Shipped`, `Completed`, `Cancelled`), and delete orders.
- **Stock Replenishment on Cancellation**: Cancelling an order automatically restores the items back to available inventory.
- **Storage Options**: Supports MongoDB persistence or in-memory storage for zero-configuration development and demos.

## Prerequisites

- **Java**: Java 21 (LTS) or newer (tested on Java 21 and Java 23)
- **Maven**: Maven 3.9+ or the included Maven Wrapper (`mvnw` / `mvnw.cmd`)
- **Node.js**: Node.js 18+ or 20+ with npm
- **Database (Optional)**: MongoDB is only needed when persistent storage is required.

## Run Locally

### 1. (Optional) Configure MongoDB

To use MongoDB for persistent storage, start a local MongoDB server or provide `MONGODB_URI`. If you skip MongoDB, the backend automatically uses in-memory storage.

```powershell
docker compose up -d mongodb
```

> **Note**: In-memory data is temporary and is lost when the backend restarts.

### 2. Start the Backend API

From the project root:

```powershell
cd backend
$env:ADMIN_USERNAME="owner"
$env:ADMIN_PASSWORD="replace-with-a-random-secret-of-at-least-16-characters"
.\mvnw.cmd spring-boot:run
```

*(On macOS/Linux, run `./mvnw spring-boot:run` or `mvn spring-boot:run`)*

The API starts on `http://localhost:8080`.

### 3. Start the React Frontend

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

### 4. Open the App

Open your browser to the URL printed by Vite, typically [http://localhost:5173](http://localhost:5173).

## Deploy to Render

The root `Dockerfile` builds the React frontend and Spring Boot backend into one service. The frontend is served by Spring Boot, so the app and `/api` endpoints share the same public URL. The Render Blueprint runs in-memory mode and requires no MongoDB or MySQL service.

1. In Render, create a Blueprint from this GitHub repository. Render reads the root `render.yaml` and builds the app from the root `Dockerfile`.
2. During Blueprint setup, provide a store-owner `ADMIN_USERNAME` and a unique `ADMIN_PASSWORD` with at least 16 characters. These are secret values; never commit them or share them in chat.
3. Deploy the Blueprint. It configures in-memory storage and `SESSION_COOKIE_SECURE=true`, and checks the public `/api/products` endpoint for health.

The store-owner console requires the configured username and password. Product browsing and customer checkout remain public; product changes, order administration, and dashboard data require an authenticated session. In-memory products and orders reset whenever the service restarts or redeploys. This is appropriate only for a demo; do not use it for production or important customer orders.

The Render Blueprint targets the Free web-service plan for a no-cost demo. Free services can spin down after inactivity and take about a minute to wake; Render does not recommend them for production.

## Environment Variables

- `APP_STORAGE_MODE`: `in-memory` to disable database connections, `mongodb` to require a reachable MongoDB instance, or `auto` (default) to probe MongoDB and fall back to in-memory mode.
- `MONGODB_URI`: MongoDB connection string used when `APP_STORAGE_MODE` is `auto` or `mongodb` (defaults to `mongodb://localhost:27017/retail_store`).
- `PORT`: Custom API port (defaults to `8080`).
- `ADMIN_USERNAME`: Required store-owner account name.
- `ADMIN_PASSWORD`: Required store-owner password (minimum 16 characters).
- `SESSION_COOKIE_SECURE`: Set to `true` when deployed behind HTTPS (Railway).
- `VITE_API_URL`: Optional frontend API base URL override (defaults to `/api`, which works for local Vite proxying and same-origin production hosting).

## API Endpoints

- `GET /api/products` — List all products
- `GET /api/products/{id}` — Get single product details
- `POST /api/products` — Create a new product (validates SKU uniqueness)
- `PUT /api/products/{id}` — Update existing product
- `DELETE /api/products/{id}` — Delete a product
- `GET /api/orders` — List orders (sorted by newest first)
- `GET /api/orders/{id}` — Get order details including line items
- `POST /api/orders` — Place order and decrement inventory
- `PATCH /api/orders/{id}/status?value={status}` — Update order status (restores stock if cancelled)
- `DELETE /api/orders/{id}` — Delete an order
- `GET /api/dashboard/summary` — Overview metrics and storage engine status
- `GET /api/auth/csrf` and `POST /api/auth/login` — Initialize CSRF protection and sign in
- `GET /api/auth/session` and `POST /api/auth/logout` — Check or end the store-owner session
