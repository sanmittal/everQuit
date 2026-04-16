const router = require("express").Router();

const room = require("../controllers/room.controller");
const booking = require("../controllers/booking.controller");

router.post("/rooms", room.createRoom);
router.get("/rooms", room.listRooms);

router.post("/bookings", booking.createBooking);
router.get("/bookings", booking.listBookings);
router.post("/bookings/:id/cancel", booking.cancelBooking);

router.get("/reports/room-utilization", booking.utilization);

module.exports = router;