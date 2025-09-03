import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const otp = searchParams.get("otp");

    if (!otp) {
      return NextResponse.json(
        { error: "OTP parameter is required" },
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
      `${HOST}/api/dev/token?otp=${otp}`,
      {
        method: "GET",
        headers: {
          "X-App-Id": APP_ID,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MeWe token request failed:", response.status, errorText);
      return NextResponse.json(
        { error: `MeWe token request failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(
      "Got MeWe token response xxxxxxxxx:",
      JSON.stringify(data, null, 2)
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in MeWe token API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
