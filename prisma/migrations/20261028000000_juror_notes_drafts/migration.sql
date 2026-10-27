-- CreateTable
CREATE TABLE "JurorNote" (
    "orgId" TEXT NOT NULL,
    "jurorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JurorNote_pkey" PRIMARY KEY ("orgId","jurorId")
);

-- CreateTable
CREATE TABLE "ReviewDraft" (
    "orgId" TEXT NOT NULL,
    "jurorId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewDraft_pkey" PRIMARY KEY ("orgId","jurorId")
);

-- AddForeignKey
ALTER TABLE "JurorNote" ADD CONSTRAINT "JurorNote_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JurorNote" ADD CONSTRAINT "JurorNote_jurorId_fkey" FOREIGN KEY ("jurorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewDraft" ADD CONSTRAINT "ReviewDraft_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewDraft" ADD CONSTRAINT "ReviewDraft_jurorId_fkey" FOREIGN KEY ("jurorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
