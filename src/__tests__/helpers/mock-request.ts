/**
 * Mock Request/Response Helpers
 * 
 * Next.js API routes expect Request objects.
 * These helpers create properly formatted mock requests.
 */

/**
 * Create a mock Request object for testing API routes
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Request {
  const { method = "GET", body, headers = {} } = options;

  const requestInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && method !== "GET") {
    requestInit.body = JSON.stringify(body);
  }

  return new Request(url, requestInit);
}

/**
 * Parse JSON response from API route
 */
export async function parseResponse<T>(response: Response): Promise<T> {
  return response.json();
}

/**
 * Common test data that can be reused across tests
 */
export const testData = {
  validUser: {
    name: "Alice Johnson",
    email: "alice@example.com",
    bio: "IMO gold medalist",
    skills: ["Mathematics", "Problem Solving"],
    olympiads: ["IMO", "IPhO"],
  },
  
  validTeam: {
    name: "Dream Team",
    description: "Looking for talented mathematicians",
    olympiad: "IMO",
    requiredSkills: ["Mathematics", "Geometry"],
    maxMembers: 4,
  },
};
