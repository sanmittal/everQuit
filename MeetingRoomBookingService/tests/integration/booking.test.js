const request = require("supertest");
const app = require("../../src/app");

describe("Booking API", () => {
  let roomId;

  beforeAll(async () => {
    const room = await request(app)
      .post("/rooms")
      .send({
        name: "Integration Room",
        capacity: 5,
        floor: 1,
        amenities: ["projector", "whiteboard"]
      });

    roomId = room.body.id;
  });

  test("create booking success", async () => {
    const res = await request(app)
      .post("/bookings")
      .set("Idempotency-Key", "abc")
      .send({
        roomId,
        title: "Test Booking",
        organizerEmail: "a@test.com",
        startTime: "2026-01-02T10:00:00",
        endTime: "2026-01-02T11:00:00"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      roomId,
      title: "Test Booking",
      organizerEmail: "a@test.com",
      status: "confirmed"
    });
  });

  test("same idempotency key returns same booking", async () => {
    const payload = {
      roomId,
      title: "Idempotent Booking",
      organizerEmail: "b@test.com",
      startTime: "2026-01-02T12:00:00",
      endTime: "2026-01-02T13:00:00"
    };

    const first = await request(app)
      .post("/bookings")
      .set("Idempotency-Key", "same-key")
      .send(payload);

    const second = await request(app)
      .post("/bookings")
      .set("Idempotency-Key", "same-key")
      .send(payload);

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(201);
    expect(second.body.id).toBe(first.body.id);
  });
});