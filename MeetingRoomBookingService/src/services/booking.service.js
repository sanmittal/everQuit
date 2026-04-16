const prisma = require("../prisma");

const {
  validateTime,
  validateDuration,
  validateWorkingHours
} = require("../utils/validation");

const { buildKey } = require("../utils/idempotency");
const { calculateOverlapHours, calculateBusinessHours } = require("../utils/utilization");

function normalizeBookingPayload(data) {
  const { roomId, title, organizerEmail, startTime, endTime } = data;

  if (!roomId) {
    throw { status: 400, message: "roomId is required" };
  }

  if (!title || typeof title !== "string" || !title.trim()) {
    throw { status: 400, message: "title is required" };
  }

  if (!organizerEmail || typeof organizerEmail !== "string" || !organizerEmail.trim()) {
    throw { status: 400, message: "organizerEmail is required" };
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw { status: 400, message: "startTime and endTime must be valid ISO-8601 strings" };
  }

  return {
    roomId: String(roomId),
    title: title.trim(),
    organizerEmail: organizerEmail.trim(),
    startTime: start,
    endTime: end
  };
}

function buildIdempotencyWhere(key, organizerEmail) {
  return {
    key_organizerEmail: {
      key,
      organizerEmail
    }
  };
}

async function waitForCompletedIdempotency(key, organizerEmail, maxAttempts = 20, delayMs = 100) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const existing = await prisma.idempotencyKey.findUnique({
      where: buildIdempotencyWhere(key, organizerEmail)
    });

    if (!existing) {
      return null;
    }

    if (existing.status === "completed") {
      return existing.response;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw { status: 409, message: "Idempotency request is still in progress" };
}

exports.createBooking = async (data, idempotencyKey) => {
  const { key, organizerEmail } = buildKey(idempotencyKey, data.organizerEmail);
  const payload = normalizeBookingPayload(data);

  const existing = await prisma.idempotencyKey.findUnique({
    where: buildIdempotencyWhere(key, organizerEmail)
  });

  if (existing && existing.status === "completed") {
    return existing.response;
  }

  if (existing && existing.status === "in_progress") {
    return waitForCompletedIdempotency(key, organizerEmail);
  }

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.idempotencyKey.create({
        data: {
          key,
          organizerEmail,
          status: "in_progress",
          response: null
        }
      });

      const room = await tx.room.findUnique({ where: { id: payload.roomId } });
      if (!room) {
        throw { status: 404, message: "Unknown room" };
      }

      validateTime(payload.startTime, payload.endTime);
      validateDuration(payload.startTime, payload.endTime);
      validateWorkingHours(payload.startTime, payload.endTime);

      const conflict = await tx.booking.findFirst({
        where: {
          roomId: payload.roomId,
          status: "confirmed",
          AND: [
            { startTime: { lt: payload.endTime } },
            { endTime: { gt: payload.startTime } }
          ]
        }
      });

      if (conflict) {
        throw { status: 409, message: "Booking overlap detected" };
      }

      const booking = await tx.booking.create({
        data: {
          roomId: payload.roomId,
          title: payload.title,
          organizerEmail: payload.organizerEmail,
          startTime: payload.startTime,
          endTime: payload.endTime,
          status: "confirmed"
        }
      });

      await tx.idempotencyKey.update({
        where: buildIdempotencyWhere(key, organizerEmail),
        data: {
          status: "completed",
          response: JSON.parse(JSON.stringify(booking))
        }
      });

      return booking;
    });
  } catch (error) {
    if (error.code === "P2002") {
      const completed = await prisma.idempotencyKey.findUnique({
        where: buildIdempotencyWhere(key, organizerEmail)
      });

      if (completed && completed.status === "completed") {
        return completed.response;
      }

      return waitForCompletedIdempotency(key, organizerEmail);
    }

    throw error;
  }
};

exports.listBookings = async (query) => {
  const where = {};
  const { roomId, from, to } = query;
  const limit = query.limit ? Number(query.limit) : 50;
  const offset = query.offset ? Number(query.offset) : 0;

  if (roomId !== undefined) {
    where.roomId = String(roomId);
  }

  if (from && isNaN(new Date(from).getTime())) {
    throw { status: 400, message: "from must be a valid ISO-8601 datetime" };
  }

  if (to && isNaN(new Date(to).getTime())) {
    throw { status: 400, message: "to must be a valid ISO-8601 datetime" };
  }

  if (from || to) {
    const fromDate = from ? new Date(from) : new Date(0);
    const toDate = to ? new Date(to) : new Date("9999-12-31T23:59:59.999Z");

    if (fromDate >= toDate) {
      throw { status: 400, message: "from must be before to" };
    }

    where.OR = [
      {
        AND: [
          { startTime: { gte: fromDate } },
          { startTime: { lte: toDate } }
        ]
      },
      {
        AND: [
          { endTime: { gte: fromDate } },
          { endTime: { lte: toDate } }
        ]
      },
      {
        AND: [
          { startTime: { lt: fromDate } },
          { endTime: { gt: toDate } }
        ]
      }
    ];
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw { status: 400, message: "limit must be a positive integer" };
  }

  if (!Number.isInteger(offset) || offset < 0) {
    throw { status: 400, message: "offset must be a non-negative integer" };
  }

  const [items, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { startTime: "asc" }
    }),
    prisma.booking.count({ where })
  ]);

  return {
    items,
    total,
    limit,
    offset
  };
};

exports.cancelBooking = async (id) => {
  const booking = await prisma.booking.findUnique({ where: { id } });

  if (!booking) {
    throw { status: 404, message: "Booking not found" };
  }

  if (booking.status === "cancelled") {
    return booking;
  }

  const now = new Date();
  const diffMs = booking.startTime.getTime() - now.getTime();

  if (diffMs < 1000 * 60 * 60) {
    throw {
      status: 400,
      message: "Booking can only be cancelled at least one hour before start time"
    };
  }

  return prisma.booking.update({
    where: { id },
    data: { status: "cancelled" }
  });
};

exports.getUtilization = async ({ from, to }) => {
  if (!from || !to) {
    throw { status: 400, message: "from and to query parameters are required" };
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw { status: 400, message: "from and to must be valid ISO-8601 datetimes" };
  }

  if (fromDate >= toDate) {
    throw { status: 400, message: "from must be before to" };
  }

  const rooms = await prisma.room.findMany({
    include: {
      bookings: {
        where: {
          status: "confirmed",
          AND: [
            { startTime: { lt: toDate } },
            { endTime: { gt: fromDate } }
          ]
        }
      }
    }
  });

  const businessHours = calculateBusinessHours(fromDate, toDate);

  return rooms.map((room) => {
    const totalBookingHours = room.bookings.reduce(
      (sum, booking) =>
        sum +
        calculateOverlapHours(
          booking.startTime,
          booking.endTime,
          fromDate,
          toDate
        ),
      0
    );

    return {
      roomId: room.id,
      roomName: room.name,
      totalBookingHours,
      utilizationPercent: businessHours === 0 ? 0 : Number((totalBookingHours / businessHours).toFixed(4))
    };
  });
};