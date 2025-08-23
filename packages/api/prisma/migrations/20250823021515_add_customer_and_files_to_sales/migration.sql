-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "customer_id" TEXT,
ADD COLUMN     "file_ids" TEXT[];

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "gym_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;