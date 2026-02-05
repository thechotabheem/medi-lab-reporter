import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { style = "default" } = await req.json();
    console.log("Generating logo with style:", style);

    // Build prompt based on style preference
    let styleDescription = "";
    switch (style) {
      case "monogram":
        styleDescription = "A stylized 'Z' monogram with subtle medical cross elements. Clean letterform design.";
        break;
      case "abstract":
        styleDescription = "Abstract geometric shape representing protection and nurturing. Flowing curves forming a protective embrace.";
        break;
      case "mother-child":
        styleDescription = "Elegant silhouette of mother and child in a caring embrace, integrated with a subtle medical symbol.";
        break;
      default:
        styleDescription = "A mother cradling a baby, combined with a subtle heartbeat or medical cross element. Gentle, nurturing design.";
    }

    const prompt = `Create a professional, modern logo icon for "Zia Clinic & Maternity Home", a medical clinic specializing in maternity care.

Design requirements:
- ${styleDescription}
- Colors: Use ONLY teal (#14b8a6) as the main color on a pure white or transparent background
- Style: Clean, minimalist, modern healthcare aesthetic
- Must work at small sizes (32px favicon)
- NO text in the logo - symbol/icon only
- Simple, memorable, professional
- Suitable as an app icon and favicon
- Vector-style clean edges
- Single color (teal) design for versatility

Create a logo that conveys trust, care, health, and the miracle of motherhood.`;

    console.log("Sending request to AI gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate logo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract the generated image
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textContent = data.choices?.[0]?.message?.content || "";

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No image was generated. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Logo generated successfully");

    return new Response(
      JSON.stringify({ 
        imageUrl,
        description: textContent,
        style 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating logo:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
