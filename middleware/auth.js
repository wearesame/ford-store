function requireAuth(roles = []) {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        if (roles.length && !roles.includes(req.session.user.role)) {
            return res.status(403).send('พ่องตายมาทำเหั้ยไรยศแค่');
        }

        next();
    };
}

module.exports = { requireAuth };
