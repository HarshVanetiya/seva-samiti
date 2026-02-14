/*
  Warnings:

  - The values [NEW,OLD] on the enum `LoanScheme` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LoanScheme_new" AS ENUM ('NEW_SCHEME', 'OLD_SCHEME');
ALTER TABLE "public"."loans" ALTER COLUMN "scheme" DROP DEFAULT;
ALTER TABLE "loans" ALTER COLUMN "scheme" TYPE "LoanScheme_new" USING ("scheme"::text::"LoanScheme_new");
ALTER TYPE "LoanScheme" RENAME TO "LoanScheme_old";
ALTER TYPE "LoanScheme_new" RENAME TO "LoanScheme";
DROP TYPE "public"."LoanScheme_old";
ALTER TABLE "loans" ALTER COLUMN "scheme" SET DEFAULT 'NEW_SCHEME';
COMMIT;

-- AlterTable
ALTER TABLE "loans" ALTER COLUMN "scheme" SET DEFAULT 'NEW_SCHEME';
