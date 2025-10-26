/*
  Warnings:

  - You are about to drop the column `duration` on the `courses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."courses" ADD COLUMN     "durationUnit" TEXT,
ADD COLUMN     "durationValue" INTEGER;

-- Migrate existing duration data
UPDATE "public"."courses"
SET
  "durationValue" = CASE
    WHEN "duration" ~ '^\d+' THEN (regexp_match("duration", '^\d+'))[1]::INTEGER
    ELSE NULL
  END,
  "durationUnit" = CASE
    WHEN "duration" ILIKE '%ساعة%' OR "duration" ILIKE '%ساعات%' THEN 'hours'
    WHEN "duration" ILIKE '%أسبوع%' OR "duration" ILIKE '%أسابيع%' THEN 'weeks'
    WHEN "duration" ILIKE '%يوم%' OR "duration" ILIKE '%أيام%' THEN 'days'
    WHEN "duration" ILIKE '%دقيقة%' OR "duration" ILIKE '%دقائق%' THEN 'minutes'
    WHEN "duration" ILIKE '%hour%' OR "duration" ILIKE '%hours%' THEN 'hours'
    WHEN "duration" ILIKE '%week%' OR "duration" ILIKE '%weeks%' THEN 'weeks'
    WHEN "duration" ILIKE '%day%' OR "duration" ILIKE '%days%' THEN 'days'
    WHEN "duration" ILIKE '%minute%' OR "duration" ILIKE '%minutes%' THEN 'minutes'
    ELSE 'hours' -- default fallback
  END
WHERE "duration" IS NOT NULL;

-- Drop the old column
ALTER TABLE "public"."courses" DROP COLUMN "duration";
