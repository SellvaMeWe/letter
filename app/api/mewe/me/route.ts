import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token parameter is required" },
        { status: 400 }
      );
    }

    const APP_ID = process.env.NEXT_PUBLIC_MEWE_APP_ID;
    const HOST = process.env.NEXT_PUBLIC_MEWE_HOST;

    if (!APP_ID) {
      return NextResponse.json(
        { error: "MeWe API credentials not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${HOST}/api/dev/me`,
      {
        method: "GET",
        headers: {
          "X-App-Id": APP_ID,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "MeWe user info request failed:",
        response.status,
        errorText
      );
      return NextResponse.json(
        { error: `MeWe user info request failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Got MeWe user info:", JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in MeWe user info API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
