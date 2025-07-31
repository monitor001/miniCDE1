/*
  Warnings:

  - Added the required column `title` to the `ProjectNote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProjectNote" ADD COLUMN     "title" TEXT NOT NULL;
