const express = require("express");


const router = express.Router();

// Log a user out
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

router.get("/callback", (req, res) => {
  
});

module.exports = router;
