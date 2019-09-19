const express = require("express");

const router = express.Router();

router = router.route("/api/2.1/");

router.get("test2", (req, res) => {
    res.end("U end test2");
});

module.exports = router;