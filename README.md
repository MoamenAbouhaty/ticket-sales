# Ticket Sales API

A simple ticket sales backend API built with Node.js, Express, and SQLite.

The project models events, seats, and orders, seeds 10,000 seats across multiple events, lists available seats, and safely handles concurrent seat reservations.

## Tech Stack

* Node.js
* Express.js
* SQLite
* better-sqlite3
* Jest

## Database Design

The application uses three related tables:

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

## Running the API

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

The API runs on:

```text
http://localhost:3000
```

Health check:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## API Endpoints

### List Available Seats

```http
GET /events/:eventId/seats/available
```

Example:

```bash
curl http://localhost:3000/events/21/seats/available
```

The endpoint returns only seats whose status is `free`.

The database has an index on:

```sql
(event_id, status)
```

to make available-seat queries efficient.

### Reserve a Seat

```http
POST /seats/:seatId/reserve
```

Example:

```bash
curl -X POST "http://localhost:3000/seats/10001/reserve" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Moamen"}'
```

Successful response:

```json
{
  "message": "Seat reserved successfully",
  "orderId": 1,
  "seatId": 10001
}
```

If the seat has already been reserved:

```json
{
  "error": "Seat is already reserved"
}
```

with HTTP status:

```text
409 Conflict
```

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

### Demonstration

Two requests were sent concurrently for seat `10002`.

Command:

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

Result:

```text
Concurrent reservation results:
[
  {
    "status": 201,
    "body": "{\"message\":\"Seat reserved successfully\",\"orderId\":2,\"seatId\":10002}"
  },
  {
    "status": 409,
    "body": "{\"error\":\"Seat is already reserved\"}"
  }
]
```

Only one request succeeded with `201 Created`.

The other request received `409 Conflict`.

Therefore, both requests cannot reserve the same seat.

## Automated Concurrency Test

The concurrency behavior is also covered by Jest.

Run:

```bash
npm test
```

Result:

```text
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        13.097 s
Ran all test suites.
```

The test verifies that two concurrent reservation requests produce exactly:

```text
201
409
```

## Performance

The available-seat endpoint was tested against the seeded database containing 10,000 seats.

Command:

```bash
for i in {1..10}; do
  curl -s -o /dev/null \
    -w "%{http_code} %{time_total}s\n" \
    "http://localhost:3000/events/21/seats/available"
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

approximately:

```text
4.3 ms
```

This is well below the required 200 ms target.

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
│   └── reservations.test.js
├── test-concurrency.js
├── .gitignore
├── package.json
└── README.md
```

## Available Scripts

```bash
npm start
```

Starts the API server.

```bash
npm run seed
```

Creates the database and seeds 20 events with 10,000 seats.

```bash
npm test
```

Runs the automated Jest tests.

## Requirements Checklist

| Requirement                       | Status |
| --------------------------------- | ------ |
| Events, seats and orders modeled  | ✅      |
| Three related tables              | ✅      |
| Foreign keys                      | ✅      |
| 10,000+ seeded seats              | ✅      |
| Available-seat endpoint           | ✅      |
| Seat reservation endpoint         | ✅      |
| Concurrent reservation protection | ✅      |
| Concurrency demonstrated          | ✅      |
| Automated concurrency test        | ✅      |
| Available-seat query under 200 ms | ✅      |

## Author

**Moamen Abouhaty**

Backend Developer — Node.js
