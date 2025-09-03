import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const authToken = searchParams.get("token");
    const searchStr = searchParams.get("searchStr");
    const nextId = searchParams.get("nextId");
    const limit = searchParams.get("limit");
    const maxResults = searchParams.get("maxResults");
    const afterId = searchParams.get("afterId");

    if (!authToken) {
      return NextResponse.json(
        { error: "Authentication token is required" },
        { status: 401 }
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

    // Build query parameters
    const params = new URLSearchParams();
    if (searchStr) params.append("searchStr", searchStr);
    if (nextId) params.append("nextId", nextId);
    if (limit) params.append("limit", limit);
    if (maxResults) params.append("maxResults", maxResults);
    if (afterId) params.append("afterId", afterId);

    const url = `${HOST}/api/dev/socialgraph/followed${
      params.toString() ? `?${params.toString()}` : ""
    }`;
    console.log("MeWe contacts url:", url, APP_ID, authToken);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        'X-App-Id': APP_ID,
        'Authorization': `Bearer ${authToken}`,
        'accept': '*/*',
        'requiredPermissions': 'user_social_graph'
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "MeWe contacts request failed:",
        response.status,
        errorText
      );
      return NextResponse.json(
        { error: `MeWe contacts request failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("MeWe contacts data:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in MeWe contacts API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
