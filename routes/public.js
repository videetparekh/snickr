const express = require("express");


const router = express.Router();

// Home page
router.get("/", (req, res) => {
  res.render("index");
});

router.get("/test", (req, res) => {
  res.render("test");
});

module.exports = router;
