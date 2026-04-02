import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { v4 as uuid } from "uuid";

// Generate signed upload URLs so the browser uploads directly to Supabase
// This bypasses Vercel's 4.5MB body limit
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { files } = await req.json() as { files: { name: string; type: string }[] };

  if (!files || !Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }

  const results = [];

  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const filename = `${uuid()}.${ext}`;

    const { data, error } = await supabase.storage
      .from("media")
      .createSignedUploadUrl(filename);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const videoExts = ["mp4", "mov", "webm", "avi"];
    const mediaType = videoExts.includes(ext) ? "video" : "image";

    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(filename);

    results.push({
      signedUrl: data.signedUrl,
      token: data.token,
      path: filename,
      publicUrl: urlData.publicUrl,
      type: mediaType,
    });
  }

  return NextResponse.json(results);
}
