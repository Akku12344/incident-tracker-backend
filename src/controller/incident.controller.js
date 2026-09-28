import { z } from "zod";
import { prisma } from "../config/db.js";

export const createIncidentSchema = z.object({
  body: z.object({
    number: z.number().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
  }),

  params: z.object({
    workspaceId: z.string().min(1),
  }),
});

export const updateIncidentSchema = z.object({
  status: z.enum(["OPEN", "INVESTIGATING", "RESOLVED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  assigneeId: z.string().optional(),
});

export const commentSchema = z.object({
  body: z.string(),
});

async function asigneeValidation(id, workspaceId) {
  const membership = await prisma.membership.findFirst({
    where: {
      userId: id,
      workspaceId,
    },
  });

  if (!membership) {
    throw new Error("user not a member of workspace");
  }

  return true;
}

export const createIncident = async (req, res, next) => {
  try {
    const validatedData = createIncidentSchema.parse(req.body);
    const { number, title, description } = validatedData;
    const { workspaceId } = req.params;
    const { user } = req;

    const result = await prisma.$transaction(async (tx) => {
      const incident = await tx.incident.create({
        data: {
          number,
          title,
          description,
          workspaceId,
          createdById: user.id,
        },
      });

      await tx.auditEvent.create({
        data: {
          action: "incident.created",
          entityType: "incident",
          entityId: incident.id,
          actorId: user.id,
          metadata: {
            name: incident.title,
          },
        },
      });

      return incident;
    });

    res.status(201).json({
      success: true,
      message: `incident created by ${user.id} in workspace ${workspaceId}`,
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const getIncident = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const workspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId,
      },
    });

    if (!workspace) {
      throw new Error("workspace not exist");
    }

    const incidentsCount = await prisma.incident.count({
      where: {
        workspaceId: workspaceId,
      },
    });

    const totalPages = Math.ceil(incidentsCount / limit);

    const incidents = await prisma.incident.findMany({
      where: {
        workspaceId: workspaceId,
      },
      skip,
      take: limit,
    });

    res.status(200).json({
      success: true,
      message: "fetched incident",
      incidents,
      pagination: {
        page,
        limit,
        total: incidentsCount,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getIncidentbyId = async (req, res, next) => {
  try {
    const { incidentId, workspaceId } = req.params;

    const incident = await prisma.incident.findFirst({
      where: {
        workspaceId: workspaceId,
        id: incidentId,
      },
    });

    if (!incident) {
      throw new Error("incident not found");
    }

    res.status(200).json({
      success: true,
      message: "fetched incident",
      incident,
    });
  } catch (error) {
    next(error);
  }
};

export const updateIncidentbyId = async (req, res, next) => {
  try {
    const { workspaceId, incidentId } = req.params;

    const validatedData = updateIncidentSchema.parse(req.body);
    const { assigneeId, status, priority } = validatedData;
    const { user } = req;

    const incidentExist = await prisma.incident.findFirst({
      where: {
        id: incidentId,
        workspaceId,
      },
    });

    if (!incidentExist) {
      throw new Error("incident not found");
    }

    const currentStatus = incidentExist.status;
    let newStatus;
    if (
      (currentStatus == "OPEN" && status == "INVESTIGATING") ||
      (currentStatus == "INVESTIGATING" && status == "MONITORING") ||
      (currentStatus == "MONITORING" && status == "RESOLVED") ||
      (currentStatus == "RESOLVED" && status == "OPEN")
    ) {
      newStatus = status;
    } else {
      throw new Error(
        `no you have done this ${currentStatus} after this ${status}`,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const incident = await tx.incident.update({
        where: {
          id: incidentId,
        },
        data: {
          status: newStatus,
          priority: priority,
          assigneeId: asigneeValidation(assigneeId, workspaceId),
        },
      });

      await tx.auditEvent.create({
        data: {
          action: "incident.updated",
          entityType: "incident",
          entityId: incidentId,
          actorId: user.id,
          metadata: {
            name: incident.title,
            assignee: assigneeId,
            status: incident.status,
            priority: incident.priority,
          },
        },
      });
      return incident;
    });

    res.status(200).json({
      success: true,
      message: "incident updated",
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteIncident = async (req, res, next) => {
  try {
    const { workspaceId, incidentId } = req.params;
    const { user } = req;
    const incident = await prisma.incident.findFirst({
      where: {
        workspaceId,
        id: incidentId,
      },
    });

    if (!incident) {
      throw new Error("incident not existed");
    }

    const result = await prisma.$transaction(async (tx) => {
      const inci = await tx.incident.delete({
        where: {
          id: incidentId,
          workspaceId,
        },
      });

      await tx.auditEvent.create({
        data: {
          action: "incident.deleted",
          entityType: "incident",
          entityId: incidentId,
          actorId: user.id,
          metadata: {
            name: incident.title,
          },
        },
      });
      return inci;
    });
    res.status(200).json({
      success: true,
      message: "incident deleted",
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req, res, next) => {
  try {
    const validateData = commentSchema(req.body);
    const { body } = validateData;
    const { workspaceId, incidentId } = req.params;
    const { user } = req;

    const incident = await prisma.incident.findFirst({
      where: {
        id: incidentId,
        workspaceId,
      },
    });

    if (!incident) {
      throw new Error("incident not found");
    }

    const result = await prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          body: body,
          incidentId,
          authorId: user.id,
        },
      });

      await tx.auditEvent.create({
        data: {
          action: "comment.created",
          entityType: "comment",
          entityId: comment.id,
          workspaceId,
          actorId: user.id,
        },
      });

      return comment;
    });
    res.status(201).json({
      success: true,
      message: `comment created by user ${user.id} `,
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const getComment = async (req, res, next) => {
  try {
    const { workspaceId, incidentId } = req.params;

    const incident = await prisma.incident.findFirst({
      where: {
        id: incidentId,
        workspaceId,
      },
    });

    if (!incident) {
      throw new Error("incident not found");
    }

    const comment = await prisma.comment.findMany({
      where: {
        incidentId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "fetched comment",
      comment,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req, res, next) => {
  try {
    const { workspaceId, incidentId, commentId } = req.params;
    const { user } = req;

    const incident = await prisma.incident.findFirst({
      where: {
        id: incidentId,
        workspaceId,
      },
    });

    if (!incident) {
      throw new Error("incident not found");
    }

    const existcomment = await prisma.comment.findUnique({
      where: {
        incidentId_id: {
          incidentId,
          id: commentId,
        },
      },
    });

    if (!existcomment) {
      throw new Error("comment not found");
    }

    const result = await prisma.$transaction(async (tx) => {
      const comment = await tx.comment.delete({
        where: {
          incidentId_id: {
            incidentId,
            id: commentId,
          },
        },
      });

      await tx.auditEvent.create({
        data: {
          action: "comment.deleted",
          entityType: "comment",
          entityId: comment.id,
          workspaceId,
          actorId: user.id,
        },
      });
      return comment;
    });

    res.status(200).json({
      success: true,
      message: `comment deleted by ${user.id}`,
      result,
    });
  } catch (error) {
    next(error);
  }
};
