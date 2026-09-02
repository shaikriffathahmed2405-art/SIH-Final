export function readJsonBody(req, maxSize = 8_000_000) {
  return new Promise((resolve, reject) => {
    let data = "";
    let size = 0;

    req.on("data", chunk => {
      size += chunk.length;
      if (size > maxSize) {
        req.destroy();
        reject(new Error("Payload Too Large: Request body exceeds maximum allowed limit."));
        return;
      }
      data += chunk;
    });

    req.on("end", () => {
      if (!data) return resolve({});
      try {
        const parsed = JSON.parse(data);
        resolve(parsed);
      } catch (err) {
        reject(new Error("Invalid JSON: Unable to parse request body."));
      }
    });

    req.on("error", reject);
  });
}
