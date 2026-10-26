-- CreateTable
CREATE TABLE "OrgFactsheet" (
    "orgId" TEXT NOT NULL,
    "pdf" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgFactsheet_pkey" PRIMARY KEY ("orgId")
);

-- AddForeignKey
ALTER TABLE "OrgFactsheet" ADD CONSTRAINT "OrgFactsheet_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
