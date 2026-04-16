function isOverlapping(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

module.exports = { isOverlapping };