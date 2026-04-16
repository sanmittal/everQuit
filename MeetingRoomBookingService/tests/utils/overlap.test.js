const { isOverlapping } = require("../../src/utils/overlap");

test("overlap true", () => {
  expect(
    isOverlapping(
      new Date("2026-01-01T10:00:00"),
      new Date("2026-01-01T11:00:00"),
      new Date("2026-01-01T10:30:00"),
      new Date("2026-01-01T11:30:00")
    )
  ).toBe(true);
});