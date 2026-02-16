/**
 * Fetch bearer token from an API endpoint
 * @param apiUrl - The base API URL
 * @param endpoint - The endpoint path
 * @returns The token payload or null if request fails
 */
let inFlightTokenRequest: Promise<any> | null = null;

export const fetchTokenFromEndpoint = async (apiUrl: string, endpoint: string) => {
  if (inFlightTokenRequest) {
    return inFlightTokenRequest;
  }

  inFlightTokenRequest = (async () => {
    try {
      const url = apiUrl + endpoint;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: 'value' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const tokenPayload = await response.json();
      return tokenPayload;
    } catch (error) {
      console.error(`Error fetching token from ${endpoint}:`, error);
      return null;
    } finally {
      inFlightTokenRequest = null;
    }
  })();

  return inFlightTokenRequest;
};
