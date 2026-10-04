const http = require("http");

function getAvailableSeats(eventId) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path: `/events/${eventId}/seats/available`,
        method: "GET"
      },
      (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          resolve({
            status: res.statusCode,
            body: JSON.parse(body)
          });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

describe("Available seats endpoint", () => {
  test("returns available seats for an existing event", async () => {
    const result = await getAvailableSeats(41);

    expect(result.status).toBe(200);
    expect(result.body.event.id).toBe(41);
    expect(result.body.count).toBeGreaterThan(0);
    expect(Array.isArray(result.body.seats)).toBe(true);
    expect(result.body.seats.length).toBe(result.body.count);
  });
});
