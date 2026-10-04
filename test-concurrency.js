const http = require("http");

const seatId = 10002;

function reserve(customerName) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      customerName
    });

    const request = http.request(
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
      (response) => {
        let body = "";

        response.on("data", (chunk) => {
          body += chunk;
        });

        response.on("end", () => {
          resolve({
            status: response.statusCode,
            body
          });
        });
      }
    );

    request.on("error", reject);

    request.write(data);
    request.end();
  });
}

async function main() {
  const results = await Promise.all([
    reserve("Customer A"),
    reserve("Customer B")
  ]);

  console.log("Concurrent reservation results:");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});