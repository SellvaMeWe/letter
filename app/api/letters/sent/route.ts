import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase/config";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const lettersQuery = query(
      collection(db, "letters"),
      where("senderId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(lettersQuery);
    const letters = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));

    return NextResponse.json({
      success: true,
      letters,
    });
  } catch (error) {
    console.error("Error fetching sent letters:", error);
    return NextResponse.json(
      { error: "Failed to fetch sent letters" },
      { status: 500 }
    );
  }
}


