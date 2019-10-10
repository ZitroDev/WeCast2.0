const express = require("express");

const router = express.Router();

router.use("/api/2.1", require("./routes/api/2.1/router-post.js"));
router.use("/api/2.1", require("./routes/api/2.1/router-get.js"));
router.use("/api/2.1", require("./routes/api/2.1/router-put.js"));
router.use("/api/2.1", require("./routes/api/2.1/router-delete.js"));
router.use("/api/2.1", require("./routes/api/2.1/router-head.js"));

module.exports = router;