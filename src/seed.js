const db = require("./db");

const EVENTS_COUNT = 20;
const SEATS_PER_EVENT = 500;

const insertEvent = db.prepare(`
  INSERT INTO events (name, event_date)
  VALUES (?, ?)
`);

const insertSeat = db.prepare(`
  INSERT INTO seats (event_id, seat_number, status)
  VALUES (?, ?, 'free')
`);

const seed = db.transaction(() => {
  // Clear existing data so the seed is repeatable.
  db.prepare("DELETE FROM orders").run();
  db.prepare("DELETE FROM seats").run();
  db.prepare("DELETE FROM events").run();

  for (let eventNumber = 1; eventNumber <= EVENTS_COUNT; eventNumber++) {
    const eventDate = new Date(
      Date.now() + eventNumber * 24 * 60 * 60 * 1000
    ).toISOString();

    const event = insertEvent.run(
      `Event ${eventNumber}`,
      eventDate
    );

    for (
      let seatNumber = 1;
      seatNumber <= SEATS_PER_EVENT;
      seatNumber++
    ) {
      insertSeat.run(
        event.lastInsertRowid,
        seatNumber
      );
    }
  }
});

console.time("Seed completed");

seed();

const eventCount = db
  .prepare("SELECT COUNT(*) AS count FROM events")
  .get();

const seatCount = db
  .prepare("SELECT COUNT(*) AS count FROM seats")
  .get();

console.timeEnd("Seed completed");

console.log(`Events: ${eventCount.count}`);
console.log(`Seats: ${seatCount.count}`);

db.close();