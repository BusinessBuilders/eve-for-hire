/*
  Warnings:

  - A unique constraint covering the columns `[seq]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seq` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "userId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerName" TEXT,
    "state" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requirements" TEXT,
    "payment" TEXT,
    "domain" TEXT,
    "deploy" TEXT,
    "auditTrail" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("auditTrail", "createdAt", "customerEmail", "customerName", "deploy", "domain", "id", "idempotencyKey", "identifier", "payment", "requirements", "state", "updatedAt", "userId", "seq") 
SELECT "auditTrail", "createdAt", "customerEmail", "customerName", "deploy", "domain", "id", "idempotencyKey", "identifier", "payment", "requirements", "state", "updatedAt", "userId", 
  CAST(SUBSTR(identifier, 5) AS INTEGER) 
FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_identifier_key" ON "Order"("identifier");
CREATE UNIQUE INDEX "Order_seq_key" ON "Order"("seq");
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
