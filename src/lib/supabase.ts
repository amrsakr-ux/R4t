import { createClient } from "@supabase/supabase-js";

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "cv-documents";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin credentials not configured");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function uploadCV(
  file: Buffer,
  fileName: string,
  candidateId: string,
  mimeType: string
): Promise<{ url: string; path: string }> {
  const admin = getSupabaseAdmin();
  const fileExt = fileName.split(".").pop();
  const filePath = `${candidateId}/${Date.now()}.${fileExt}`;

  const { error } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Failed to upload CV: ${error.message}`);

  const { data: urlData } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return { url: urlData.publicUrl, path: filePath };
}

export async function deleteCV(filePath: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin.storage.from(STORAGE_BUCKET).remove([filePath]);
  if (error) throw new Error(`Failed to delete CV: ${error.message}`);
}
