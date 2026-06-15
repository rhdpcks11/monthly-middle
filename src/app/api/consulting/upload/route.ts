import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServiceClient } from "@/lib/supabase";
import { getStudentByToken } from "@/lib/consulting/store";

const BUCKET = "coaching-photos";
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

// POST (multipart) { token, file } → 업로드 후 { url, path }
// 토큰만으로 접근하는 공개 라우트. 이미지 + 용량 검증.
export async function POST(req: Request) {
  const form = await req.formData();
  const token = String(form.get("token") || "");
  const file = form.get("file");

  const student = await getStudentByToken(token);
  if (!student) return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 404 });

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (!EXT[file.type]) {
    return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다 (png/jpg/webp/heic)." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "이미지 용량은 10MB 이하만 가능합니다." }, { status: 400 });
  }

  const ext = EXT[file.type];
  const path = `consulting/${student.id}/${crypto.randomUUID()}.${ext}`;

  const supabase = getServiceClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
