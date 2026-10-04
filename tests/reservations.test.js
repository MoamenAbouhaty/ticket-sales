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
    const seatId = 10003;

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