function buildKey(key, organizerEmail) {
  if (!key) {
    throw { status: 400, message: "Missing Idempotency-Key" };
  }

  if (!organizerEmail || typeof organizerEmail !== "string" || !organizerEmail.trim()) {
    throw { status: 400, message: "organizerEmail is required for idempotency" };
  }

  return {
    key,
    organizerEmail: organizerEmail.trim()
  };
}

module.exports = { buildKey };