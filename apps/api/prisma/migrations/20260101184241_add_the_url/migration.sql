/*
  Warnings:

  - Added the required column `gitCloneUrl` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gitRepoUrl` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `language` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "gitCloneUrl" TEXT NOT NULL,
ADD COLUMN     "gitRepoUrl" TEXT NOT NULL,
ADD COLUMN     "language" TEXT NOT NULL;
