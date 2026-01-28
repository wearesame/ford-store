const express = require('express');
const router = express.Router();

router.get("/", (_req, res) => {
    res.render("auth/login", {
        title: "login"
    })
})

router.post("/", (req, res) => {
    res.json({
        status: "success",
        msg: "Login สำเร็จ",
        data: req.body.test
    });
});

module.exports = router;