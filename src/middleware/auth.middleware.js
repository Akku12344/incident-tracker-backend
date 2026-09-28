import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      throw new Error("Authentication required");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.userId,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const roleRank = {
  VIEWER: 1,
  MEMBER: 2,
  ADMIN: 3,
  OWNER: 4,
};

export const authorize = (requiredRole, exact = false) => {
  return async (req, res, next) => {
    try {
      const { workspaceId } = req.params;
      const userId = req.user.id;

      const membership = await prisma.membership.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId,
          },
        },
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this workspace",
        });
      }

      const hasPermission = exact
        ? membership.role === requiredRole
        : roleRank[membership.role] >= roleRank[requiredRole];

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission for this action",
        });
      }

      req.membership = membership;

      next();
    } catch (error) {
      next(error);
    }
  };
};
