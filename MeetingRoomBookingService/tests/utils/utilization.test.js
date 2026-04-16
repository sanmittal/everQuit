const { calculateOverlapHours, calculateBusinessHours } = require("../../src/utils/utilization");

test("calculate overlap returns 0 when intervals do not intersect", () => {
  const hours = calculateOverlapHours(
    new Date("2026-01-01T08:00:00"),
    new Date("2026-01-01T10:00:00"),
    new Date("2026-01-01T10:00:00"),
    new Date("2026-01-01T12:00:00")
  );

  expect(hours).toBe(0);
});

test("calculate overlap returns correct hours for partial overlap", () => {
  const hours = calculateOverlapHours(
    new Date("2026-01-01T09:00:00"),
    new Date("2026-01-01T12:00:00"),
    new Date("2026-01-01T11:00:00"),
    new Date("2026-01-01T13:00:00")
  );

  expect(hours).toBe(1);
});

test("calculate business hours across a multi-day weekday range", () => {
  const hours = calculateBusinessHours(
    new Date("2026-01-05T10:00:00"),
    new Date("2026-01-07T18:00:00")
  );

  expect(hours).toBe(10 + 12 + 10);
});
