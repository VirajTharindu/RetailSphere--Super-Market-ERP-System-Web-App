/**
 * Role-Based Access Control middleware
 * @param  {...string} allowedRoles
 */
const rbacMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.UserRole) {
      return res.status(403).json({
        error: "Access denied. Role information missing.",
      });
    }

    const userRole = req.user.UserRole;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

export default rbacMiddleware;
