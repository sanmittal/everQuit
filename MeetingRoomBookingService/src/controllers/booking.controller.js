const bookingService = require("../services/booking.service");

exports.createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(
      req.body,
      req.headers["idempotency-key"]
    );

    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
};

exports.listBookings = async (req, res, next) => {
  try {
    const result = await bookingService.listBookings(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id);
    res.json(booking);
  } catch (err) {
    next(err);
  }
};

exports.utilization = async (req, res, next) => {
  try {
    const report = await bookingService.getUtilization(req.query);
    res.json(report);
  } catch (err) {
    next(err);
  }
};