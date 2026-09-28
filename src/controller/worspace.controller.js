import slugify from "slugify";
import { prisma } from "../config/db";

export const createWorkspace = async (req, res, next) => {
  try {
    const { name } = req.body;
    const { user } = req;
    const slug = slugify(name, {
      lower: true,
      strict: true,
    });

    const workspaceC = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name,
          slug,
          createdById: user.id,
          memberships: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
          labels: {
            create: [
              { name: "customer-impact", color: "#DC2626" },
              { name: "infrastructure", color: "#7C3AED" },
              { name: "follow-up", color: "#0284C7" },
            ],
          },
        },
        include: { labels: true },
      });

      await tx.auditEvent.create({
        data: {
          action: "workspace.created",
          entityType: "workspace",
          entityId: workspace.id,
          workspaceId: workspace.id,
          actorId: user.id,
          metadata: {
            name: workspace.name,
          },
        },
      });
    });
    return res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      data: workspaceC,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllMyworkSpaces = async (req, res, next) => {
  try {
    const { user } = req;
    const myWorkspaces = await prisma.workspace.findMany({
      where: {
        memberships: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `all Workspaces fetched by user - ${user.id}`,
      myWorkspaces,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyWorkSpaceswithslug = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { user } = req;
    const currentWorkspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
      },
      include: {
        memberships: {
          select: {
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        labels: { orderBy: { name: "asc" } },
        _count: { select: { incidents: true } },
      },
    });

    if (!currentWorkspace) throw new Error("Workspace not found");

    res.status(200).json({
      success: true,
      message: `user - ${user.id} fetch the currentWorkspace with ${currentWorkspace.id} and ${currentWorkspace.name}`,
      currentWorkspace,
    });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { email } = req.body;
    const { user } = req;
    const newUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!newUser) {
      throw new Error("user not found");
    }

    const checkWorkspaceExist = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
      },
    });

    if (!checkWorkspaceExist) {
      throw new Error(`user with this ${email} not existed in workspace`);
    }

    const existingMembership = await prisma.membership.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: newUser.id,
        },
      },
    });

    if (existingMembership) {
      throw new Error("User is already a member of this workspace");
    }

    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.create({
        data: {
          workspaceId: workspaceId,
          userId: newUser.id,
          role: "MEMBER",
        },
      });

      await tx.auditEvent.create({
        data: {
          action: "membership.created",
          entityType: "membership",
          entityId: workspaceId,
          workspaceId: workspaceId,
          actorId: user.id,
          metadata: {
            name: "add member",
          },
        },
      });
      return membership;
    });

    res.status(200).json({
      success: true,
      message: `member only`,
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req, res, next) => {
  try {
    const { user } = req;
    const { workspaceId, userId } = req.params;

    const existWorkspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
    });

    if (!existWorkspace) {
      throw new Error("worksapce not found");
    }

    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: userId,
          workspaceId,
        },
      },
      include: {
        user: true,
      },
    });

    if (!membership) {
      throw new Error("Member not found in workspace");
    }

    await prisma.$transaction(async (tx) => {
      const removemember = await tx.membership.delete({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId,
          },
        },
      });

      await tx.auditEvent.create({
        data: {
          action: "member removed",
          entityType: "membership",
          entityId: workspaceId,
          workspaceId: workspaceId,
          actorId: user.id,
          metadata: {
            name: "member removed",
          },
        },
      });
    });

    res.status(200).json({
      success: true,
      message: "member removed by owner",
    });
  } catch (error) {
    next(error);
  }
};

export const changeRole = async (req, res, next) => {
  try {
    const { userId, workspaceId } = req.params;
    const { user } = req;

    const existWorkspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
    });

    if (!existWorkspace) {
      throw new Error("workspace not existed");
    }

    const membership = await prisma.membership.findUnique({
      where: {
        workspaceId_userId: {
          userId: userId,
          workspaceId,
        },
      },
    });

    const previousRole = membership.role;

    if (!membership) {
      throw new Error(
        `user with ${userId} not a member of workspace with ${workspaceId}`,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedMember = await tx.membership.update({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId,
          },
        },
        data: {
          role: "ADMIN",
        },
      });

      await tx.auditEvent.create({
        data: {
          action: "member updated",
          entityType: "membership",
          entityId: workspaceId,
          workspaceId: workspaceId,
          actorId: user.id,
          metadata: {
            name: "role updated",
            previousRole,
            newRole: updatedMember.role,
          },
        },
      });

      return updatedMember;
    });

    res.status(200).json({
      success: true,
      message: `member updated with ${userId}`,
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const members = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const existWorkspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
      include: {
        user: true,
      },
    });

    if (!existWorkspace) {
      throw new Error("worspace not exist");
    }

    const Allmember = await prisma.membership.findMany({
      where: {
        workspaceId: workspaceId,
      },
    });

    res.status(200).json({
      success: true,
      message: `all member with this worskpace ${workspaceId}`,
      Allmember,
    });
  } catch (error) {
    next(error);
  }
};
