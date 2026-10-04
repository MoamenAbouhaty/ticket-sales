const express = require("express");

const eventsRouter = require("./routes/events");
const reservationsRouter = require("./routes/reservations");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

app.use("/events", eventsRouter);
app.use("/seats", reservationsRouter);

module.exports = app;