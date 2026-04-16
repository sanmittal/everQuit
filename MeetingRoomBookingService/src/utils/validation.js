function validateTime(start, end) {
  if (start >= end) {
    throw { status: 400, message: "startTime must be before endTime" };
  }
}

function validateDuration(start, end) {
  const minutes = (end - start) / (1000 * 60);

  if (minutes < 15 || minutes > 240) {
    throw { status: 400, message: "Duration must be 15–240 minutes" };
  }
}

function validateWorkingHours(start, end) {
  const startDay = start.getDay();
  const endDay = end.getDay();

  if (startDay === 0 || startDay === 6 || endDay === 0 || endDay === 6) {
    throw { status: 400, message: "Bookings are allowed only Monday through Friday" };
  }

  if (start.toDateString() !== end.toDateString()) {
    throw { status: 400, message: "Bookings must begin and end on the same business day" };
  }

  const businessStart = new Date(start);
  businessStart.setHours(8, 0, 0, 0);

  const businessEnd = new Date(start);
  businessEnd.setHours(20, 0, 0, 0);

  if (start < businessStart || end > businessEnd) {
    throw { status: 400, message: "Bookings must be within 08:00–20:00 on business days" };
  }
}

module.exports = {
  validateTime,
  validateDuration,
  validateWorkingHours
};