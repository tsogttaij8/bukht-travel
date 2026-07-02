import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { getSupabaseAdmin, isSupabaseEnabled } from "../../../../lib/server/supabase"
import { readSessionFromCookieHeader } from "../../../../lib/server/session"

const maxCompressedImageBytes = 1_000_000

export async function POST(request: Request): Promise<NextResponse> {
  const session = readSessionFromCookieHeader(request.headers.get("cookie") ?? "")
  if (!session) return NextResponse.json({ message: "Зураг оруулахын өмнө нэвтэрнэ үү." }, { status: 401 })
  if (!isSupabaseEnabled()) return NextResponse.json({ message: "Supabase тохиргоо дутуу байна." }, { status: 500 })

  const bucket = process.env.SUPABASE_PRODUCT_IMAGE_BUCKET ?? process.env.SUPABASE_STORAGE_BUCKET
  if (!bucket) return NextResponse.json({ message: "Supabase Storage bucket тохиргоо дутуу байна." }, { status: 500 })

  const formData = await request.formData()
  const image = formData.get("image")
  if (!(image instanceof File)) return NextResponse.json({ message: "Зураг илгээнэ үү." }, { status: 400 })
  if (!["image/jpeg", "image/webp"].includes(image.type)) return NextResponse.json({ message: "Зураг JPEG эсвэл WebP байх хэрэгтэй." }, { status: 400 })
  if (image.size > maxCompressedImageBytes) return NextResponse.json({ message: "Шахагдсан зураг хэт том байна." }, { status: 400 })

  const extension = image.type === "image/jpeg" ? "jpg" : "webp"
  const owner = session.email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "user"
  const path = `${owner}/${randomUUID()}.${extension}`
  const supabase = getSupabaseAdmin()

  const bucketError = await ensureProductImageBucket(supabase, bucket)
  if (bucketError) return NextResponse.json({ message: bucketError }, { status: 500 })

  const { error } = await supabase.storage.from(bucket).upload(path, image, {
    contentType: image.type,
    upsert: false,
  })

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return NextResponse.json({ imageUrl: data.publicUrl }, { status: 201 })
}

async function ensureProductImageBucket(supabase: ReturnType<typeof getSupabaseAdmin>, bucket: string): Promise<string | null> {
  const { error } = await supabase.storage.getBucket(bucket)
  if (!error) return null
  if (!isMissingBucketError(error)) return error.message

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    allowedMimeTypes: ["image/jpeg", "image/webp"],
  })

  if (!createError || isExistingBucketError(createError)) return null
  return createError.message
}

function isMissingBucketError(error: { message?: string; statusCode?: string | number }): boolean {
  const message = error.message?.toLowerCase() ?? ""
  return error.statusCode === 404 || message.includes("not found") || message.includes("does not exist")
}

function isExistingBucketError(error: { message?: string; statusCode?: string | number }): boolean {
  const message = error.message?.toLowerCase() ?? ""
  return error.statusCode === 409 || message.includes("already exists")
}
