function requireAuth(roles = []) {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    if (roles.length && !roles.includes(req.session.user.role)) {
      return res.status(403).send("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
    }

    next();
  };
}

// ❗ สำหรับหน้า login / register
function requireGuest() {
  return (req, res, next) => {
    if (req.session.user) {
      return res.redirect("/"); // หรือ /profile
    }
    next();
  };
}

module.exports = { requireAuth, requireGuest };
