const express = require("express")
const router = express.Router();

const { prisma } = require("../lib/prisma");

router.get("/:id", async (req, res) => {
    res.send(req.params.id)
})

module.exports = router;