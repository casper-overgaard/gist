import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Asset, MergeOutput } from "@signalboard/domain";

function formatFragment(output: MergeOutput): string {
  const lines: string[] = [];
  lines.push(`# ${output.elementName}`, ``);
  lines.push(`> ${output.inferredIntent}`, ``);

  if (output.tokens.length > 0) {
    lines.push(`## Tokens`);
    lines.push(`| Name | Value | Use |`);
    lines.push(`|------|-------|-----|`);
    output.tokens.forEach((t) => lines.push(`| ${t.name} | ${t.value} | ${t.use} |`));
    lines.push(``);
  }

  if (output.classPatterns.length > 0) {
    lines.push(`## Class Patterns`);
    output.classPatterns.forEach((p) => {
      lines.push(`### ${p.component}`);
      lines.push(`\`\`\``);
      lines.push(p.classes);
      lines.push(`\`\`\``);
      lines.push(``);
    });
  }

  if (output.rules.length > 0) {
    lines.push(`## Rules`);
    output.rules.forEach((r) => lines.push(`- ${r}`));
  }

  return lines.join("\n");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string; elementSlug: string }> }
) {
  const { sessionId, elementSlug } = await params;

  if (!sessionId || !elementSlug) {
    return new NextResponse("Missing sessionId or elementSlug", { status: 400 });
  }

  try {
    const assetsRef = collection(db, `sessions/${sessionId}/assets`);
    const snap = await getDocs(assetsRef);

    let match: MergeOutput | null = null;
    snap.forEach((d) => {
      const asset = d.data() as Asset;
      if (asset.type === "output") {
        const mo = asset.metadata?.mergeOutput as MergeOutput | undefined;
        if (mo?.elementSlug === elementSlug) match = mo;
      }
    });

    if (!match) {
      return new NextResponse(
        `No spec fragment found for element "${elementSlug}" in session "${sessionId}".`,
        { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    return new NextResponse(formatFragment(match), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Element spec route error:", err);
    return new NextResponse("Failed to fetch element spec", { status: 500 });
  }
}
