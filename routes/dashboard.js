const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
    res.render('dashboard', {
        title: 'Dashboard',
        user: req.session.user
    });
});

module.exports = router;
