import { NextRequest, NextResponse } from "next/server";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../../../firebase/config";

export async function POST(request: NextRequest) {
  try {
    const { name, sourceAppId, userId } = await request.json();

    if (!name || !sourceAppId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: name, sourceAppId, userId" },
        { status: 400 }
      );
    }

    const contactData = {
      userId,
      name,
      sourceAppId,
    };

    const docRef = await addDoc(collection(db, "contacts"), contactData);

    return NextResponse.json({
      success: true,
      contactId: docRef.id,
      contact: { id: docRef.id, ...contactData },
    });
  } catch (error) {
    console.error("Error importing contact:", error);
    return NextResponse.json(
      { error: "Failed to import contact" },
      { status: 500 }
    );
  }
}


