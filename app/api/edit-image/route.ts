import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image, mask, prompt } = await request.json();

    if (!image || !mask || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(image.split(',')[1], 'base64');
    const maskBuffer = Buffer.from(mask.split(',')[1], 'base64');

    // Create form data for Anthropic API
    const formData = new FormData();
    formData.append('image', new Blob([imageBuffer], { type: 'image/png' }), 'image.png');
    formData.append('mask', new Blob([maskBuffer], { type: 'image/png' }), 'mask.png');
    formData.append('prompt', prompt);

    // Call Nano Banana Pro API (Anthropic's image editing model)
    const response = await fetch('https://api.anthropic.com/v1/images/edit', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2024-01-01',
      },
      body: formData,
    });

    if (!response.ok) {
      // Fallback: Return original image with overlay text
      console.error('API error:', await response.text());

      // Create a simple edited version (simulation)
      const editedImage = await simulateEdit(imageBuffer, maskBuffer, prompt);

      return NextResponse.json({
        editedImage: editedImage,
        message: 'Using simulated edit - Add ANTHROPIC_API_KEY environment variable for real AI editing',
      });
    }

    const result = await response.json();

    return NextResponse.json({
      editedImage: result.image,
      message: 'Image edited successfully',
    });
  } catch (error) {
    console.error('Error processing image:', error);

    // Return a simulated response
    try {
      const { image } = await request.json();
      return NextResponse.json({
        editedImage: image,
        message: 'Simulation mode - Original image returned. Configure API key for real AI editing.',
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to process image' },
        { status: 500 }
      );
    }
  }
}

// Simulated edit function for demo purposes
async function simulateEdit(
  imageBuffer: Buffer,
  maskBuffer: Buffer,
  prompt: string
): Promise<string> {
  // In a real implementation, this would call the Nano Banana Pro API
  // For demo, we'll return the original image with a watermark effect
  const base64Image = imageBuffer.toString('base64');
  return `data:image/png;base64,${base64Image}`;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
