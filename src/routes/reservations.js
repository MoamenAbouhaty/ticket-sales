const express = require("express");
const db = require("../db");

const router = express.Router();

const reserveSeat = db.transaction((seatId, customerName) => {
  const seat = db
    .prepare(`
      SELECT id, event_id, seat_number, status
      FROM seats
      WHERE id = ?
    `)
    .get(seatId);

  if (!seat) {
    return {
      success: false,
      reason: "NOT_FOUND"
    };
  }

  if (seat.status !== "free") {
    return {
      success: false,
      reason: "ALREADY_RESERVED"
    };
  }

  const result = db
    .prepare(`
      UPDATE seats
      SET status = 'reserved'
      WHERE id = ?
        AND status = 'free'
    `)
    .run(seatId);

  if (result.changes !== 1) {
    return {
      success: false,
      reason: "ALREADY_RESERVED"
    };
  }

  try {
    const order = db
      .prepare(`
        INSERT INTO orders (seat_id, customer_name)
        VALUES (?, ?)
      `)
      .run(seatId, customerName);

    return {
      success: true,
      orderId: Number(order.lastInsertRowid),
      seatId
    };
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return {
        success: false,
        reason: "ALREADY_RESERVED"
      };
    }

    throw error;
  }
});

router.post("/:seatId/reserve", (req, res) => {
  const seatId = Number(req.params.seatId);
  const customerName = req.body?.customerName;

  if (!Number.isInteger(seatId) || seatId <= 0) {
    return res.status(400).json({
      error: "Invalid seat ID"
    });
  }

  if (
    typeof customerName !== "string" ||
    customerName.trim().length === 0
  ) {
    return res.status(400).json({
      error: "customerName is required"
    });
  }

  const result = reserveSeat(
    seatId,
    customerName.trim()
  );

  if (!result.success) {
    if (result.reason === "NOT_FOUND") {
      return res.status(404).json({
        error: "Seat not found"
      });
    }

    return res.status(409).json({
      error: "Seat is already reserved"
    });
  }

  return res.status(201).json({
    message: "Seat reserved successfully",
    orderId: result.orderId,
    seatId: result.seatId
  });
});

module.exports = router;