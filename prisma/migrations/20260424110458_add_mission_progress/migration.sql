-- CreateTable
CREATE TABLE "MissionProgress" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'current',
    "totalRaised" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);
