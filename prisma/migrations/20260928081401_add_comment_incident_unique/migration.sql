/*
  Warnings:

  - A unique constraint covering the columns `[incidentId,id]` on the table `Comment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Comment_incidentId_id_key" ON "Comment"("incidentId", "id");
