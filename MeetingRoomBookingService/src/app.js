const express = require("express");
const app = express();

app.use(express.json());

app.use(require("./routes"));

app.use(require("./middleware/error"));

module.exports = app;