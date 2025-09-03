interface MeWeLoginResponse {
  loginRequestToken: string;
}

interface MeWeTokenResponse {
  pending: boolean;
  expiresAt: string;
  token: string;
}

interface MeWeContact {
  userId: string;
  name: string;
  handle: string;
  // Add other contact fields as needed based on actual API response
}

interface MeWeContactsResponse {
  list: {user: MeWeContact}[];
  nextPage?: string;
  // Add other response fields as needed
}

class MeWeService {
  // No need for credentials in frontend service anymore
  // Credentials are now handled by backend API routes

  /**
   * Step 1: Get login request token
   */
  async getLoginRequestToken(username: string): Promise<string> {
    try {
      const response = await fetch("/api/mewe/signin", {
        method: "POST",
        headers: {
          "accept": "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `MeWe signin failed: ${response.status}`
        );
      }

      const data: MeWeLoginResponse = await response.json();
      return data.loginRequestToken;
    } catch (error) {
      console.error("Error getting MeWe login request token:", error);
      throw error;
    }
  }

  /**
   * Step 2: Get authentication token using OTP
   */
  async getAuthToken(loginRequestToken: string): Promise<MeWeTokenResponse> {
    try {
      const response = await fetch(`/api/mewe/token?otp=${loginRequestToken}`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `MeWe token request failed: ${response.status}`
        );
      }

      const data: MeWeTokenResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting MeWe auth token:", error);
      throw error;
    }
  }

  /**
   * Get contacts from MeWe
   */
  async getContacts(
    authToken: string,
    options: {
      searchStr?: string;
      nextId?: string;
      limit?: number;
      maxResults?: number;
      afterId?: string;
    } = {}
  ): Promise<MeWeContactsResponse> {
    try {
      const params = new URLSearchParams();
      params.append("token", authToken);

      if (options.searchStr) params.append("searchStr", options.searchStr);
      if (options.nextId) params.append("nextId", options.nextId);
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.maxResults)
        params.append("maxResults", options.maxResults.toString());
      if (options.afterId) params.append("afterId", options.afterId);

      const url = `/api/mewe/contacts?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `MeWe contacts request failed: ${response.status}`
        );
      }

      const data: MeWeContactsResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting MeWe contacts:", error);
      throw error;
    }
  }

  /**
   * Complete authentication flow and return token
   */
  async authenticate(username: string): Promise<MeWeTokenResponse> {
    try {
      // Step 1: Get login request token
      const loginRequestToken = await this.getLoginRequestToken(username);
      console.log("Got MeWe login request token:", loginRequestToken);

      // Step 2: Get auth token
      const tokenResponse = await this.getAuthToken(loginRequestToken);
      console.log(
        "Got MeWe auth token response:",
        JSON.stringify(tokenResponse, null, 2)
      );

      return tokenResponse;
    } catch (error) {
      console.error("MeWe authentication failed:", error);

      // If it's a network error or API unavailable, provide a helpful message
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "MeWe API is currently unavailable. Please try again later."
        );
      }

      throw error;
    }
  }

  /**
   * Check if MeWe service is properly configured
   * Now always returns true since credentials are handled by backend
   */
  isConfigured(): boolean {
    return true;
  }
}

export const meweService = new MeWeService();
export type { MeWeContact, MeWeContactsResponse, MeWeTokenResponse };
