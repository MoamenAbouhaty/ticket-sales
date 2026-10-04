const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/:eventId/seats/available", (req, res) => {
  const eventId = Number(req.params.eventId);

  if (!Number.isInteger(eventId) || eventId <= 0) {
    return res.status(400).json({
      error: "Invalid event ID"
    });
  }

  const event = db
    .prepare(`
      SELECT id, name, event_date
      FROM events
      WHERE id = ?
    `)
    .get(eventId);

  if (!event) {
    return res.status(404).json({
      error: "Event not found"
    });
  }

  const seats = db
    .prepare(`
      SELECT id, seat_number
      FROM seats
      WHERE event_id = ?
        AND status = 'free'
      ORDER BY seat_number
    `)
    .all(eventId);

  return res.json({
    event,
    count: seats.length,
    seats
  });
});

module.exports = router;