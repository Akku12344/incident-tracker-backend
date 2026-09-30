import Router from "express";
import { z } from "zod";
import { authorize, isAuthenticated } from "../middleware/auth.middleware.js";
import {
  validate,
  validateBody,
  validateParams,
} from "../middleware/validate.middleware.js";
import {
  createComment,
  createIncident,
  createIncidentSchema,
  deleteComment,
  deleteIncident,
  getComment,
  getIncident,
  getIncidentbyId,
  updateIncidentbyId,
  updateIncidentSchema,
  commentSchema,
} from "../controller/incident.controller.js";

const router = Router();
const workspaceParamsSchema = z.object({ workspaceId: z.uuid() });
const incidentParamsSchema = workspaceParamsSchema.extend({ incidentId: z.uuid() });
const commentParamsSchema = incidentParamsSchema.extend({ commentId: z.uuid() });

router.post(
  "/:workspaceId/create",
  isAuthenticated,
  validate(createIncidentSchema),
  authorize("MEMBER"),
  createIncident,
);
router.get("/:workspaceId/", isAuthenticated, validateParams(workspaceParamsSchema), authorize("VIEWER"), getIncident);
router.get(
  "/:workspaceId/:incidentId",
  isAuthenticated,
  validateParams(incidentParamsSchema),
  authorize("VIEWER"),
  getIncidentbyId,
);
router.put(
  "/:workspaceId/:incidentId",
  isAuthenticated,
  validateParams(incidentParamsSchema),
  authorize("MEMBER"),
  validateBody(updateIncidentSchema),
  updateIncidentbyId,
);
router.delete(
  "/:workspaceId/:incidentId",
  isAuthenticated,
  validateParams(incidentParamsSchema),
  authorize("ADMIN"),
  deleteIncident,
);
router.post(
  "/:workspaceId/:incidentId/comment",
  isAuthenticated,
  validateParams(incidentParamsSchema),
  authorize("MEMBER"),
  validateBody(commentSchema),
  createComment,
);
router.get(
  "/:workspaceId/:incidentId/comment",
  isAuthenticated,
  validateParams(incidentParamsSchema),
  authorize("VIEWER"),
  getComment,
);
router.delete(
  "/:workspaceId/:incidentId/:commentId",
  isAuthenticated,
  validateParams(commentParamsSchema),
  authorize("ADMIN"),
  deleteComment,
);

export default router;
