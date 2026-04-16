const roomService = require("../services/room.service");

exports.createRoom = async (req, res, next) => {
  try {
    const room = await roomService.createRoom(req.body);
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
};

exports.listRooms = async (req, res, next) => {
  try {
    const rooms = await roomService.listRooms(req.query);
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};