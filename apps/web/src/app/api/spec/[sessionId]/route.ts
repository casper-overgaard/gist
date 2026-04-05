import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { OutputDocument } from "@signalboard/domain";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  if (!sessionId) {
    return new NextResponse("Missing sessionId", { status: 400 });
  }

  try {
    const outputsRef = collection(db, `sessions/${sessionId}/outputs`);
    const q = query(outputsRef, orderBy("version", "desc"), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) {
      return new NextResponse("No spec generated yet for this session.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const output = snap.docs[0].data() as OutputDocument;

    return new NextResponse(output.markdownBody, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Spec route error:", err);
    return new NextResponse("Failed to fetch spec", { status: 500 });
  }
}
