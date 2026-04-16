const {
  validateTime,
  validateDuration,
  validateWorkingHours
} = require("../../src/utils/validation");

test("should fail when start >= end", () => {
  expect(() =>
    validateTime(new Date("2026-01-01T10:00"), new Date("2026-01-01T09:00"))
  ).toThrow();
});

test("should fail invalid duration", () => {
  expect(() =>
    validateDuration(new Date("2026-01-01T10:00"), new Date("2026-01-01T10:05"))
  ).toThrow();
});

test("should fail when booking is outside business hours", () => {
  expect(() =>
    validateWorkingHours(
      new Date("2026-01-02T07:30:00"),
      new Date("2026-01-02T08:30:00")
    )
  ).toThrow();
});

test("should fail when booking spans multiple days", () => {
  expect(() =>
    validateWorkingHours(
      new Date("2026-01-02T19:00:00"),
      new Date("2026-01-03T09:00:00")
    )
  ).toThrow();
});