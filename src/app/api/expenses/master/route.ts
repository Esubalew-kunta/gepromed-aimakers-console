import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { masterInfo } from "@/lib/expenses/storage";
import { isExtractionConfigured } from "@/lib/expenses/extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tells the UI whether a saved master template exists (so Nathalie can reuse it
// without re-uploading) and whether AI extraction is configured.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const info = await masterInfo(user.email);
  return NextResponse.json({
    savedMaster: info?.exists ?? false,
    extractionReady: isExtractionConfigured(),
    employeeName: user.name,
  });
}
