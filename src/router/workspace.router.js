import { Router } from "express";

import {
  addMember,
  changeRole,
  createWorkspace,
  getAllMyworkSpaces,
  getMyWorkSpaceswithslug,
  members,
  removeMember,
} from "../controller/worspace.controller.js";

import { authorize, isAuthenticated } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/create", isAuthenticated, createWorkspace);

router.get("/", isAuthenticated, getAllMyworkSpaces);

router.get(
  "/:workspaceId",
  isAuthenticated,
  authorize("VIEWER"),
  getMyWorkSpaceswithslug,
);

router.post(
  "/:workspaceId/members",
  isAuthenticated,
  authorize("OWNER", true),
  addMember,
);

router.delete(
  "/:workspaceId/members/:userId",
  isAuthenticated,
  authorize("OWNER", true),
  removeMember,
);

router.patch(
  "/:workspaceId/members/:userId/role",
  isAuthenticated,
  authorize("OWNER", true),
  changeRole,
);

router.get(
  "/:workspaceId/members",
  isAuthenticated,
  authorize("VIEWER"),
  members,
);

export default router;
