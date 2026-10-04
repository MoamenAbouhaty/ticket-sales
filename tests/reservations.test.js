const http = require("http");

function reserveSeat(seatId, customerName) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      customerName
    });

    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path: `/seats/${seatId}/reserve`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data)
        }
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

    req.write(data);
    req.end();
  });
}

describe("Seat reservation concurrency", () => {
  test("only one concurrent reservation succeeds", async () => {
    const seatId = 20499;

    const results = await Promise.all([
      reserveSeat(seatId, "Customer A"),
      reserveSeat(seatId, "Customer B")
    ]);

    const statuses = results
      .map((result) => result.status)
      .sort();

    expect(statuses).toEqual([201, 409]);
  });
});

describe("Seat reservation errors", () => {
  test("returns 404 when the seat does not exist", async () => {
    const result = await reserveSeat(999999, "Customer Not Found");

    expect(result.status).toBe(404);
    expect(result.body).toEqual({
      error: "Seat not found"
    });
  });

  test("returns 409 when the seat is already reserved", async () => {
    const seatId = 20500;

    const firstReservation = await reserveSeat(
      seatId,
      "Customer First"
    );

    const secondReservation = await reserveSeat(
      seatId,
      "Customer Second"
    );

    expect(firstReservation.status).toBe(201);
    expect(secondReservation.status).toBe(409);
    expect(secondReservation.body).toEqual({
      error: "Seat is already reserved"
    });
  });
});