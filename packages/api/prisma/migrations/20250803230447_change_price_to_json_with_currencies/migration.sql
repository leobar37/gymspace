/*
  Warnings:

  - Changed the type of `price` on the `subscription_plans` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "subscription_plans" DROP COLUMN "price",
ADD COLUMN     "price" JSONB NOT NULL;
