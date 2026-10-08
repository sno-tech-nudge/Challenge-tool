-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Org" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slot" TEXT,
    "sector" TEXT,
    "location" TEXT,
    "website" TEXT,
    "summary" TEXT,
    "about" TEXT,
    "internalQueries" TEXT,
    "internalSwot" TEXT,
    "ecociateScore" REAL,
    "ecociateRemarks" TEXT,
    "verdict" TEXT,
    "verdictComment" TEXT,
    "verdictAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "JuryScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgId" TEXT NOT NULL,
    "jurorId" TEXT NOT NULL,
    "entries" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JuryScore_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JuryScore_jurorId_fkey" FOREIGN KEY ("jurorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Org_key_key" ON "Org"("key");

-- CreateIndex
CREATE UNIQUE INDEX "JuryScore_orgId_jurorId_key" ON "JuryScore"("orgId", "jurorId");
