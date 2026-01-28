const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth(['ADMIN']), (req, res) => {
    res.render('dashboard/index', {
        title: 'Admin',
        user: req.session.user,
    });
});

router.get('/addProduct', requireAuth(['ADMIN']), (req, res) => {
    res.render('dashboard/addProduct', {
        title: 'Admin',
        user: req.session.user,
    });
});

module.exports = router;
