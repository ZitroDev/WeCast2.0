const express = require("express");

const router = express.Router();

router.use(require("./routes/router-post.js"));
router.use(require("./routes/router-get.js"));
router.use(require("./routes/router-put.js"));
router.use(require("./routes/router-delete.js"));
router.use(require("./routes/router-head.js"));

module.exports = router;