import type { Response, NextFunction } from "express";
import { createError } from "./errorHandler.js";
import type { AuthRequest } from "./auth.js";

type Role = "guest" | "user" | "mod" | "admin";

const roleHierarchy: Record<Role, number> = {
  guest: 0,
  user: 1,
  mod: 2,
  admin: 3
};

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createError("Требуется аутентификация", 401, "UNAUTHORIZED");
    }

    const userRole = req.user.role as Role;
    
    if (!allowedRoles.includes(userRole)) {
      throw createError(
        "Недостаточно прав доступа",
        403,
        "FORBIDDEN",
        { required: allowedRoles, current: userRole }
      );
    }

    next();
  };
}

export function requireMinRole(minRole: Role) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw createError("Требуется аутентификация", 401, "UNAUTHORIZED");
    }

    const userRole = req.user.role as Role;
    const userLevel = roleHierarchy[userRole] ?? 0;
    const minLevel = roleHierarchy[minRole] ?? 0;

    if (userLevel < minLevel) {
      throw createError(
        "Недостаточно прав доступа",
        403,
        "FORBIDDEN",
        { required: minRole, current: userRole }
      );
    }

    next();
  };
}
