const prisma = require("../prisma");

function validateRoomPayload(data) {
  const { name, capacity, floor, amenities } = data;

  if (!name || typeof name !== "string" || !name.trim()) {
    throw { status: 400, message: "name is required and must be a non-empty string" };
  }

  if (!Number.isInteger(capacity) || capacity < 1) {
    throw { status: 400, message: "capacity must be an integer >= 1" };
  }

  if (!Number.isInteger(floor)) {
    throw { status: 400, message: "floor must be an integer" };
  }

  if (!Array.isArray(amenities) || amenities.some((item) => typeof item !== "string")) {
    throw { status: 400, message: "amenities must be an array of strings" };
  }

  return {
    name: name.trim(),
    capacity,
    floor,
    amenities
  };
}

exports.createRoom = async (data) => {
  const payload = validateRoomPayload(data);

  const existing = await prisma.room.findFirst({
    where: {
      name: {
        equals: payload.name,
        mode: "insensitive"
      }
    }
  });

  if (existing) {
    throw { status: 409, message: "Room name must be unique" };
  }

  return prisma.room.create({ data: payload });
};

exports.listRooms = async ({ minCapacity, amenity }) => {
  const where = {};

  if (minCapacity !== undefined) {
    const value = Number(minCapacity);
    if (Number.isNaN(value) || value < 0) {
      throw { status: 400, message: "minCapacity must be a non-negative number" };
    }
    where.capacity = { gte: value };
  }

  if (amenity !== undefined) {
    if (typeof amenity !== "string" || !amenity.trim()) {
      throw { status: 400, message: "amenity must be a non-empty string" };
    }
    where.amenities = { has: amenity };
  }

  return prisma.room.findMany({ where });
};

exports.getRoomById = async (id) => {
  return prisma.room.findUnique({ where: { id } });
};
