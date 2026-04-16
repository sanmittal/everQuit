const { buildKey } = require("../../src/utils/idempotency");

test("buildKey returns structured key object", () => {
  const result = buildKey("abc", "user@test.com");
  expect(result).toEqual({
    key: "abc",
    organizerEmail: "user@test.com"
  });
});

test("buildKey throws if idempotency key is missing", () => {
  expect(() => buildKey(null, "user@test.com")).toThrow();
});

test("buildKey throws if organizerEmail is missing", () => {
  expect(() => buildKey("abc", null)).toThrow();
});
