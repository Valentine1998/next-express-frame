const express = require("express");
const router = express.Router();

router.get("/api/messages", (req, res) => {
   res.json({ message: "Your Next Express app is working!" });
});

module.exports = router;
