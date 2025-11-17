import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// Simple image upload endpoint that accepts base64 data URLs
// In production, this should upload to Supabase Storage or another CDN
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { imageData } = body

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      )
    }

    // Validate that it's a data URL
    if (!imageData.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format. Must be a data URL' },
        { status: 400 }
      )
    }

    // Extract mime type and validate
    const mimeTypeMatch = imageData.match(/^data:(image\/[a-z]+);base64,/)
    if (!mimeTypeMatch) {
      return NextResponse.json(
        { error: 'Invalid data URL format' },
        { status: 400 }
      )
    }

    const mimeType = mimeTypeMatch[1]
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported image type. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Check file size (base64 is ~33% larger than actual file)
    const sizeInBytes = Math.ceil((imageData.length - imageData.indexOf(',') - 1) * 0.75)
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (sizeInBytes > maxSize) {
      return NextResponse.json(
        { error: 'Image size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // For now, return the data URL as-is
    // In production, upload to Supabase Storage and return public URL
    return NextResponse.json({
      imageUrl: imageData,
      mimeType,
      size: sizeInBytes,
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    )
  }
}
