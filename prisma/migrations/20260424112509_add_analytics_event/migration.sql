-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event" TEXT NOT NULL,
    "sessionId" TEXT,
    "orderId" TEXT,
    "domain" TEXT,
    "email" TEXT,
    "props" TEXT,
    "ts" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_event_idx" ON "AnalyticsEvent"("event");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_ts_idx" ON "AnalyticsEvent"("ts");
