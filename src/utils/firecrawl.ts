// Firecrawl API utility
const API_KEY = "fc-9e613cb0c34645c4bebb041ac9af3ba8";

interface CrawlResponse {
  success: boolean;
  id?: string;
  url?: string;
  status?: string;
  completed?: number;
  total?: number;
  creditsUsed?: number;
  expiresAt?: string;
  data?: {
    markdown: string;
    metadata: {
      url: string;
      [key: string]: any;
    };
  }[];
  error?: string;
  next?: string;
}

export async function crawlWebsite(url: string): Promise<CrawlResponse> {
  try {
    console.log("Starting crawl for URL:", url);
    // Initial crawl request
    const crawlResponse = await fetch("https://api.firecrawl.dev/v1/crawl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        url,
        limit: 10,
        scrapeOptions: {
          formats: ["markdown"],
          metadata: true // Enable metadata in response
        }
      })
    });

    if (!crawlResponse.ok) {
      const errorData = await crawlResponse.json();
      console.error("Crawl request failed:", errorData);
      return { success: false, error: errorData.message || "Failed to start crawl" };
    }

    const { id, success } = await crawlResponse.json();
    console.log("Crawl initiated successfully, ID:", id);
    
    if (!success || !id) {
      return { success: false, error: "Failed to initiate crawl" };
    }

    // Poll for results
    return await pollForResults(`https://api.firecrawl.dev/v1/crawl/${id}`);
  } catch (error) {
    console.error("Error during crawl:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred"
    };
  }
}

async function pollForResults(resultUrl: string, maxAttempts = 60): Promise<CrawlResponse> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Polling for results, attempt ${attempts}/${maxAttempts}`);
    
    try {
      const response = await fetch(resultUrl, {
        headers: {
          "Authorization": `Bearer ${API_KEY}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error fetching results:", errorData);
        return { 
          success: false, 
          error: errorData.message || "Failed to fetch results" 
        };
      }
      
      const result = await response.json();
      console.log("Poll response:", result.status, "Completed:", result.completed, "Total:", result.total);
      
      // If completed or has data, return the results
      if (result.status === "completed" || (result.data && result.data.length > 0)) {
        console.log("Crawl completed successfully!");
        return result;
      }
      
      // Wait before checking again - increased to 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error("Error polling for results:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch results" 
      };
    }
  }
  
  return { success: false, error: "Timeout waiting for results" };
}
