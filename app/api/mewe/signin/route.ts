import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const APP_ID = process.env.NEXT_PUBLIC_MEWE_APP_ID;
    const API_KEY = process.env.NEXT_PUBLIC_MEWE_API_KEY;
    const HOST = process.env.NEXT_PUBLIC_MEWE_HOST;

    if (!APP_ID || !API_KEY) {
      return NextResponse.json(
        { error: "MeWe API credentials not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${HOST}/api/dev/signin`,
      {
        method: "POST",
        headers: {
          "X-App-Id": APP_ID,
          "X-Api-Key": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MeWe signin failed:", response.status, errorText);
      return NextResponse.json(
        { error: `MeWe signin failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in MeWe signin API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
