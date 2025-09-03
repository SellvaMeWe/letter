import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl } = await request.json();

    if (!pdfUrl) {
      return NextResponse.json(
        { error: "PDF URL is required" },
        { status: 400 }
      );
    }

    // Fetch the PDF from Firebase Storage
    const response = await fetch(pdfUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`);
    }

    // Get the PDF as ArrayBuffer
    const pdfBuffer = await response.arrayBuffer();

    // Return the PDF buffer as base64
    const base64 = Buffer.from(pdfBuffer).toString("base64");
    const dataUrl = `data:application/pdf;base64,${base64}`;

    return NextResponse.json({
      success: true,
      dataUrl,
      size: pdfBuffer.byteLength,
    });
  } catch (error) {
    console.error("Error fetching PDF for thumbnail:", error);
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 });
  }
}
