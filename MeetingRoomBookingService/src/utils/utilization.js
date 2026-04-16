function calculateOverlapHours(startA, endA, startB, endB) {
  const start = new Date(Math.max(startA, startB));
  const end = new Date(Math.min(endA, endB));

  if (start >= end) return 0;

  return (end - start) / (1000 * 60 * 60);
}

function isWeekday(date) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function calculateBusinessHours(start, end) {
  if (start >= end) return 0;

  let current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const limit = new Date(end);
  limit.setHours(0, 0, 0, 0);

  let hours = 0;

  while (current <= limit) {
    if (isWeekday(current)) {
      const dayStart = new Date(current);
      dayStart.setHours(8, 0, 0, 0);

      const dayEnd = new Date(current);
      dayEnd.setHours(20, 0, 0, 0);

      const overlapStart = new Date(Math.max(dayStart, start));
      const overlapEnd = new Date(Math.min(dayEnd, end));

      if (overlapStart < overlapEnd) {
        hours += (overlapEnd - overlapStart) / (1000 * 60 * 60);
      }
    }
    current.setDate(current.getDate() + 1);
  }

  return hours;
}

module.exports = {
  calculateOverlapHours,
  calculateBusinessHours
};