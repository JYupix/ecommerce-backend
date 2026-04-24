/*
  Warnings:

  - You are about to drop the column `passwordChangeAt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "passwordChangeAt",
ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;
