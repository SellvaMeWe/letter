import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase/config";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const letterId = params.id;

    if (!letterId) {
      return NextResponse.json({ error: "Missing letter ID" }, { status: 400 });
    }

    const letterDoc = await getDoc(doc(db, "letters", letterId));

    if (!letterDoc.exists()) {
      return NextResponse.json({ error: "Letter not found" }, { status: 404 });
    }

    const letter = {
      id: letterDoc.id,
      ...letterDoc.data(),
      createdAt: letterDoc.data().createdAt?.toDate() || new Date(),
    };

    return NextResponse.json({
      success: true,
      letter,
    });
  } catch (error) {
    console.error("Error fetching letter:", error);
    return NextResponse.json(
      { error: "Failed to fetch letter" },
      { status: 500 }
    );
  }
}


