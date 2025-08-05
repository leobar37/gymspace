-- AlterTable
ALTER TABLE "gym_membership_plans" ADD COLUMN "duration_days" INTEGER;

-- Make durationMonths nullable since we'll have either days or months
ALTER TABLE "gym_membership_plans" ALTER COLUMN "duration_months" DROP NOT NULL;