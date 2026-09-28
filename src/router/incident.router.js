import Router from "express";
import { authorize, isAuthenticated } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";
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
} from "../controller/incident.controller.js";

const router = Router();

router.post(
  "/:workspaceId/create",
  isAuthenticated,
  authorize("MEMBER"),
  validate(createIncidentSchema),
  createIncident,
);
router.get("/:workspaceId/", isAuthenticated, authorize("VIEWER"), getIncident);
router.get(
  "/:workspaceId/:incidentId",
  isAuthenticated,
  authorize("VIEWER"),
  getIncidentbyId,
);
router.put(
  "/:workspaceId/:incidentId",
  isAuthenticated,
  authorize("MEMBER"),
  validate(updateIncidentSchema),
  updateIncidentbyId,
);
router.delete(
  "/:workspaceId/:incidentId",
  isAuthenticated,
  authorize("ADMIN"),
  deleteIncident,
);
router.post(
  "/:workspaceId/:incidentId/comment",
  isAuthenticated,
  authorize("MEMEBER"),
  createComment,
);
router.get(
  "/:workspaceId/:incidentId/comment",
  isAuthenticated,
  authorize("VIEWER"),
  getComment,
);
router.delete(
  "/:workspaceId/:incidentId/:commentId",
  isAuthenticated,
  deleteComment,
);

export default router;
