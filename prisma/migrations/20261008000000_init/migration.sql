-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Org" (
    "id" TEXT NOT NULL,
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
    "ecociateScore" DOUBLE PRECISION,
    "ecociateRemarks" TEXT,
    "verdict" TEXT,
    "verdictComment" TEXT,
    "verdictAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Org_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JuryScore" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "jurorId" TEXT NOT NULL,
    "entries" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JuryScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Org_key_key" ON "Org"("key");

-- CreateIndex
CREATE UNIQUE INDEX "JuryScore_orgId_jurorId_key" ON "JuryScore"("orgId", "jurorId");

-- AddForeignKey
ALTER TABLE "JuryScore" ADD CONSTRAINT "JuryScore_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JuryScore" ADD CONSTRAINT "JuryScore_jurorId_fkey" FOREIGN KEY ("jurorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

