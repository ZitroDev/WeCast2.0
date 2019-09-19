const express = require("express");

const router = express.Router();

router = router.route("/api/2.1/");

router.post("test", (req, res) => {
    res.end("U end test");
});

module.exports = router;