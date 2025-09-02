import { NextRequest, NextResponse } from "next/server";
import { addDoc, collection } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../firebase/config";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const senderId = formData.get("senderId") as string;
    const recipientId = formData.get("recipientId") as string;
    const description = formData.get("description") as string;
    const image = formData.get("image") as File;

    if (!senderId || !recipientId || !description || !image) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: senderId, recipientId, description, image",
        },
        { status: 400 }
      );
    }

    // Upload image to Firebase Storage
    const storageRef = ref(
      storage,
      `letters/${senderId}/${Date.now()}_${image.name}`
    );
    const uploadResult = await uploadBytes(storageRef, image);
    const imageUrl = await getDownloadURL(uploadResult.ref);

    // Save letter metadata to Firestore
    const letterData = {
      senderId,
      recipientId,
      description,
      imageUrl,
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "letters"), letterData);

    return NextResponse.json({
      success: true,
      letterId: docRef.id,
      letter: { id: docRef.id, ...letterData },
    });
  } catch (error) {
    console.error("Error uploading letter:", error);
    return NextResponse.json(
      { error: "Failed to upload letter" },
      { status: 500 }
    );
  }
}


