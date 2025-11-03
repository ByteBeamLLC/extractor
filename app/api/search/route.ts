import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Semantic search API endpoint
 * Searches across OCR markdown content and row data in extraction jobs
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();
    
    // Get authenticated user from cookies
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[search] Auth error:", authError);
      return NextResponse.json(
        { error: "Authentication failed" },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { query, schemaId } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    if (!schemaId || typeof schemaId !== "string") {
      return NextResponse.json(
        { error: "Schema ID is required" },
        { status: 400 }
      );
    }

    // Normalize search query for case-insensitive search
    const searchTerm = query.toLowerCase().trim();
    console.log(`[search] Performing semantic search for: "${searchTerm}" in schema: ${schemaId}`);

    // Fetch all jobs for this schema
    const { data: jobs, error: jobsError } = await supabase
      .from("extraction_jobs")
      .select("*")
      .eq("schema_id", schemaId)
      .eq("user_id", user.id);

    if (jobsError) {
      console.error("[search] Error fetching jobs:", jobsError);
      return NextResponse.json(
        { error: "Failed to fetch extraction jobs" },
        { status: 500 }
      );
    }

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        results: [],
        totalMatches: 0,
      });
    }

    // Helper to flatten all text content from an object for comprehensive search
    const extractAllText = (obj: any, parentKey = ""): string[] => {
      const texts: string[] = [];
      
      if (obj == null) return texts;
      
      if (typeof obj === "string") {
        texts.push(obj);
      } else if (typeof obj === "number" || typeof obj === "boolean") {
        texts.push(String(obj));
      } else if (Array.isArray(obj)) {
        obj.forEach((item) => {
          texts.push(...extractAllText(item, parentKey));
        });
      } else if (typeof obj === "object") {
        Object.entries(obj).forEach(([key, value]) => {
          texts.push(...extractAllText(value, key));
        });
      }
      
      return texts;
    };

    // Search through jobs with comprehensive semantic matching
    const matches = jobs
      .map((job) => {
        const matchLocations: string[] = [];
        let matchScore = 0;
        const allJobText: string[] = [];

        // 1. Search in file name (highest priority)
        if (job.file_name) {
          allJobText.push(job.file_name);
          if (job.file_name.toLowerCase().includes(searchTerm)) {
            matchLocations.push("file_name");
            matchScore += 20; // Higher weight for filename matches
          }
        }

        // 2. Search in OCR markdown content (very high priority - contains full document text)
        if (job.ocr_markdown) {
          allJobText.push(job.ocr_markdown);
          const ocrText = job.ocr_markdown.toLowerCase();
          if (ocrText.includes(searchTerm)) {
            matchLocations.push("ocr_content");
            // Count occurrences for relevance scoring
            const occurrences = (ocrText.match(new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "gi")) || []).length;
            matchScore += occurrences * 10; // Higher weight for OCR matches
          }
        }

        // 3. Search in ALL extraction results recursively (medium priority)
        if (job.results && typeof job.results === "object") {
          const resultTexts = extractAllText(job.results);
          allJobText.push(...resultTexts);
          
          const searchInObject = (obj: any, path: string = ""): void => {
            for (const [key, value] of Object.entries(obj)) {
              if (value == null) continue;
              
              const currentPath = path ? `${path}.${key}` : key;
              
              if (typeof value === "string") {
                if (value.toLowerCase().includes(searchTerm)) {
                  matchLocations.push(`results.${currentPath}`);
                  matchScore += 5;
                }
              } else if (typeof value === "number" || typeof value === "boolean") {
                if (String(value).toLowerCase().includes(searchTerm)) {
                  matchLocations.push(`results.${currentPath}`);
                  matchScore += 5;
                }
              } else if (Array.isArray(value)) {
                value.forEach((item, idx) => {
                  if (item && typeof item === "string") {
                    if (item.toLowerCase().includes(searchTerm)) {
                      matchLocations.push(`results.${currentPath}[${idx}]`);
                      matchScore += 3;
                    }
                  } else if (item && typeof item === "object") {
                    searchInObject(item, `${currentPath}[${idx}]`);
                  }
                });
              } else if (typeof value === "object") {
                searchInObject(value, currentPath);
              }
            }
          };

          searchInObject(job.results);
        }

        // 4. Natural language query enhancements
        // Split search term into words for partial matching
        const searchWords = searchTerm.split(/\s+/).filter(w => w.length > 2);
        const combinedText = allJobText.join(" ").toLowerCase();
        
        // Boost score if multiple search terms match
        const wordMatches = searchWords.filter(word => combinedText.includes(word));
        if (wordMatches.length > 0) {
          matchScore += wordMatches.length * 2;
        }

        // Boost for exact phrase match
        if (searchWords.length > 1 && combinedText.includes(searchTerm)) {
          matchScore += 15;
        }

        return {
          jobId: job.id,
          fileName: job.file_name,
          status: job.status,
          matchScore,
          matchLocations,
          hasMatch: matchLocations.length > 0 || wordMatches.length > 0,
        };
      })
      .filter((result) => result.hasMatch)
      .sort((a, b) => b.matchScore - a.matchScore);

    console.log(`[search] Found ${matches.length} matches for "${searchTerm}"`);

    return NextResponse.json({
      results: matches,
      totalMatches: matches.length,
      query: searchTerm,
    });
  } catch (error) {
    console.error("[search] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

