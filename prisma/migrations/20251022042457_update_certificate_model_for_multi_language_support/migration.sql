/*
  Warnings:

  - You are about to drop the column `templateId` on the `certificates` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "public"."RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."certificates" DROP CONSTRAINT "certificates_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."certificates" DROP CONSTRAINT "certificates_templateId_fkey";

-- AlterTable
ALTER TABLE "public"."certificate_templates" ADD COLUMN     "backgroundHeight" INTEGER NOT NULL DEFAULT 3508,
ADD COLUMN     "backgroundWidth" INTEGER NOT NULL DEFAULT 2480;

-- AlterTable
ALTER TABLE "public"."certificates" DROP COLUMN "templateId",
ADD COLUMN     "arTemplateId" TEXT,
ADD COLUMN     "enTemplateId" TEXT;

-- AlterTable
ALTER TABLE "public"."courses" ADD COLUMN     "authorNameEnglish" TEXT;

-- CreateTable
CREATE TABLE "public"."payment_orders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paypalOrderId" TEXT,
    "paypalPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_transactions" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paypalTransactionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paypalFee" DOUBLE PRECISION,
    "netAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payment_refunds" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "paypalRefundId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "reason" TEXT,
    "status" "public"."RefundStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_paypalTransactionId_key" ON "public"."payment_transactions"("paypalTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_refunds_paypalRefundId_key" ON "public"."payment_refunds"("paypalRefundId");

-- AddForeignKey
ALTER TABLE "public"."certificates" ADD CONSTRAINT "certificates_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."course_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_orders" ADD CONSTRAINT "payment_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_orders" ADD CONSTRAINT "payment_orders_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_transactions" ADD CONSTRAINT "payment_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."payment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_refunds" ADD CONSTRAINT "payment_refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."payment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
