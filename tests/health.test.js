const http = require("http");

function getHealth() {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/health",
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

describe("Health endpoint", () => {
  test("returns API health status", async () => {
    const result = await getHealth();

    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      status: "ok"
    });
  });
});
