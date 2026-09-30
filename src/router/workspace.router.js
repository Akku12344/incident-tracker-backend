import { Router } from "express";
import { z } from "zod";

import {
  addMember,
  addMemberSchema,
  changeRole,
  changeRoleSchema,
  createWorkspace,
  createWorkspaceSchema,
  getAllMyworkSpaces,
  getMyWorkSpaceswithslug,
  members,
  removeMember,
} from "../controller/worspace.controller.js";

import { authorize, isAuthenticated } from "../middleware/auth.middleware.js";
import {
  validateBody,
  validateParams,
} from "../middleware/validate.middleware.js";

const router = Router();
const workspaceParamsSchema = z.object({ workspaceId: z.uuid() });
const memberParamsSchema = workspaceParamsSchema.extend({ userId: z.uuid() });

router.post(
  "/create",
  isAuthenticated,
  validateBody(createWorkspaceSchema),
  createWorkspace,
);

router.get("/", isAuthenticated, getAllMyworkSpaces);

router.get(
  "/:workspaceId",
  isAuthenticated,
  validateParams(workspaceParamsSchema),
  authorize("VIEWER"),
  getMyWorkSpaceswithslug,
);

router.post(
  "/:workspaceId/members",
  isAuthenticated,
  validateParams(workspaceParamsSchema),
  authorize("OWNER", true),
  validateBody(addMemberSchema),
  addMember,
);

router.delete(
  "/:workspaceId/members/:userId",
  isAuthenticated,
  validateParams(memberParamsSchema),
  authorize("OWNER", true),
  removeMember,
);

router.patch(
  "/:workspaceId/members/:userId/role",
  isAuthenticated,
  validateParams(memberParamsSchema),
  authorize("OWNER", true),
  validateBody(changeRoleSchema),
  changeRole,
);

router.get(
  "/:workspaceId/members",
  isAuthenticated,
  validateParams(workspaceParamsSchema),
  authorize("VIEWER"),
  members,
);

export default router;
