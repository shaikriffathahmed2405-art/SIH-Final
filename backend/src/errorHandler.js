export function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Origin, X-Requested-With",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE"
  });
  res.end(payload);
}

export function handleServerError(res, err) {
  console.error("[SERVER ERROR]", err);
  sendJson(res, 500, {
    ok: false,
    error: "Internal server error.",
    message: err.message || String(err)
  });
}
