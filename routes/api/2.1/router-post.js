const express = require("express");

const router = express.Router();

router.post("/load", (req, res) => {
    res.contentType("json");
    res.end(JSON.stringify());
});

module.exports = router;