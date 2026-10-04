# Ticket Sales API

A simple ticket sales backend API built with Node.js, Express, and SQLite.

The project models events, seats, and orders, seeds 10,000 seats across multiple events, lists available seats, and safely handles concurrent seat reservations.

## Tech Stack

* Node.js
* Express.js
* SQLite
* better-sqlite3
* Jest

## Prerequisites

* Node.js 20 or later
* npm 10 or later
* Git

No external database server is required. The project uses SQLite.

## Environment Variables

This project does not require any environment variables.

The API can be installed, seeded, and started without a `.env` file.

## Database Design

The application uses three related tables.

### Events

Stores event information.

* `id`
* `name`
* `event_date`

### Seats

Stores seats belonging to events.

* `id`
* `event_id`
* `seat_number`
* `status`

Each seat belongs to an event through a foreign key.

### Orders

Stores successful seat reservations.

* `id`
* `seat_id`
* `customer_name`
* `created_at`

Each order references a seat through a foreign key, and `seat_id` is unique to prevent multiple orders for the same seat.

## Seed Data

The database is seeded with:

* 20 events
* 500 seats per event
* 10,000 seats total

Run:

```bash
npm run seed
```

Example output:

```text
Seed completed: 40.151ms

Events: 20
Seats: 10000
```

The exact seed execution time may vary between machines.

## Running the API

Clone the repository:

```bash
git clone https://github.com/MoamenAbouhaty/ticket-sales.git
cd ticket-sales
```

Install dependencies:

```bash
npm install
```

Seed the database:

```bash
npm run seed
```

Start the server:

```bash
npm start
```

The API runs at:

```text
http://localhost:3000
```

### Health Check

Run:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

Expected status:

```text
200 OK
```

### Quick Verification

After starting the API, verify the service with these commands.

First, check the API health:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

Then, list the available seats for Event 1:

```bash
curl http://localhost:3000/events/41/seats/available
```

A successful response confirms that the server is running, the database is available, and the seeded event data can be queried.

If the second command returns an array of available seats, the project is ready for the reservation examples below.

At this point, the API is running and can be tested through the documented endpoints below.

## API Endpoints

### GET /health

Returns the current API health status.

#### Input

No parameters or request body are required.

#### Response

```json
{
  "status": "ok"
}
```

#### Status Codes

* `200 OK` — API is running successfully.

---

### GET /events/:eventId/seats/available

Returns the available seats for a specific event.

#### Input

Path parameter:

* `eventId` — ID of the event.

No request body is required.

#### Example

After seeding the database, Event 1 uses event ID `41`.

```bash
curl http://localhost:3000/events/41/seats/available
```

#### Response

The endpoint returns only seats whose status is `free`.

Example:

```json
[
  {
    "id": 20001,
    "seat_number": 1
  }
]
```

The seeded Event 1 contains 500 seats.

#### Status Codes

* `200 OK` — Available seats were returned successfully.
* `404 Not Found` — The requested event does not exist.

### Query Performance

The database has an index on:

```sql
(event_id, status)
```

This index is used to make available-seat queries efficient.

---

### POST /seats/:seatId/reserve

Reserves a specific seat for a customer.

#### Input

Path parameter:

* `seatId` — ID of the seat to reserve.

Request body:

```json
{
  "customerName": "Moamen"
}
```

#### Example

```bash
curl -X POST "http://localhost:3000/seats/20001/reserve" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Moamen"}'
```

#### Successful Response

Example:

```json
{
  "message": "Seat reserved successfully",
  "orderId": 4,
  "seatId": 20001
}
```

Status:

```text
201 Created
```

#### Already Reserved

If the seat has already been reserved:

```json
{
  "error": "Seat is already reserved"
}
```

Status:

```text
409 Conflict
```

#### Seat Not Found

If the requested seat does not exist:

```json
{
  "error": "Seat not found"
}
```

Status:

```text
404 Not Found
```

#### Status Codes

* `201 Created` — Seat was successfully reserved.
* `404 Not Found` — The requested seat does not exist.
* `409 Conflict` — The seat has already been reserved.

## Concurrent Reservation Protection

The main requirement of this exercise is preventing two concurrent requests from successfully reserving the same seat.

The reservation uses a database transaction together with an atomic update:

```sql
UPDATE seats
SET status = 'reserved'
WHERE id = ?
  AND status = 'free'
```

The `orders.seat_id` column is also protected by a `UNIQUE` constraint.

This ensures that once one request successfully changes the seat from `free` to `reserved`, another concurrent request cannot successfully reserve the same seat.

### Demonstration

Two requests were sent concurrently for seat `20002`.

Run:

```bash
node test-concurrency.js
```

The test sends two HTTP requests at the same time:

```javascript
Promise.all([
  reserve("Customer A"),
  reserve("Customer B")
]);
```

Observed result:

```text
Concurrent reservation results:

[
  {
    "status": 201,
    "body": "{\"message\":\"Seat reserved successfully\",\"orderId\":5,\"seatId\":20002}"
  },
  {
    "status": 409,
    "body": "{\"error\":\"Seat is already reserved\"}"
  }
]
```

Only one request succeeded with:

```text
201 Created
```

The other request received:

```text
409 Conflict
```

Therefore, both concurrent requests cannot successfully reserve the same seat.

The exact `orderId` may differ when the test is run again because it depends on the current database state.

## Automated Tests

The reservation and health endpoints are also covered by Jest.

Run:

```bash
npm test
```

Example result:

```text
Test Suites: 2 passed, 2 total
Tests:       4 passed, 4 total
Snapshots:   0 total
```

The automated tests cover:

* Health endpoint success response.
* Concurrent reservation protection.
* Reserving a non-existent seat.
* Attempting to reserve an already reserved seat.

The expected reservation outcomes for the concurrency test are:

```text
201
409
```

## Performance

The available-seat endpoint was tested against the seeded database containing 10,000 seats.

The performance test targets Event 1, which uses event ID `41` after seeding.

Command:

```bash
for i in {1..10}; do
  curl -s -o /dev/null \
    -w "%{http_code} %{time_total}s\n" \
    "http://localhost:3000/events/41/seats/available"
done
```

Observed results:

```text
200 0.004120s
200 0.003209s
200 0.004262s
200 0.002761s
200 0.004067s
200 0.001856s
200 0.003498s
200 0.003027s
200 0.001917s
200 0.003112s
```

The slowest observed request was:

```text
0.004262 seconds
```

Approximately:

```text
4.3 ms
```

This is well below the required 200 ms target for the seeded dataset.

## Project Structure

```text
ticket-sales/

├── src/
│   ├── db.js
│   ├── app.js
│   ├── server.js
│   ├── seed.js
│   └── routes/
│       ├── events.js
│       └── reservations.js
├── tests/
│   ├── health.test.js
│   └── reservations.test.js
├── test-concurrency.js
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```
- `tests/health.test.js` — automated tests for the health endpoint
## Available Scripts

### Start the API

```bash
npm start
```

Starts the API server on port `3000`.

### Seed the Database

```bash
npm run seed
```

Creates the SQLite database and seeds 20 events with 10,000 seats.

### Run Tests

```bash
npm test
```

Runs the automated Jest tests.

## Limitations and Known Issues

This project is a backend exercise and is not intended to provide all features of a production ticketing platform.

Current limitations include:

* No authentication or authorization.
* No real payment processing.
* No email or notification system.
* No rate limiting.
* No seat-hold expiration mechanism.
* The available-seat endpoint does not currently implement pagination.
* SQLite is used as the database and is intended for this exercise rather than a high-traffic production environment.
* The project does not include distributed application instances or a load balancer.

## Decisions to Revisit at 10x Traffic

If traffic increased by approximately 10x, I would revisit the following architectural decisions:

* Move from SQLite to PostgreSQL to support higher concurrent write traffic.
* Review and optimize database indexes using production query plans.
* Add pagination to the available-seat endpoint.
* Review database connection and transaction handling under higher concurrency.
* Add rate limiting to protect the API from excessive traffic.
* Consider caching for read-heavy event and seat availability queries where appropriate.
* Run multiple API instances behind a load balancer.
* Add structured logging, monitoring, and application metrics.
* Add stronger observability around reservation failures and database performance.

## Requirements Checklist

| Requirement                       | Status   |
| --------------------------------- | -------- |
| Events, seats and orders modeled  | Complete |
| Three related tables              | Complete |
| Foreign keys                      | Complete |
| 10,000+ seeded seats              | Complete |
| Available-seat endpoint           | Complete |
| Seat reservation endpoint         | Complete |
| Concurrent reservation protection | Complete |
| Concurrency demonstrated          | Complete |
| Automated concurrency test        | Complete |
| Available-seat query under 200 ms | Complete |
| README with setup instructions    | Complete |
| Environment variables documented  | Complete |
| Endpoint status codes documented  | Complete |
| Limitations documented            | Complete |
| 10x traffic decisions documented  | Complete |

## Author

**Moamen Abouhaty**

Backend Developer — Node.js
