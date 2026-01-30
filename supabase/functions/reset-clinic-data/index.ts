import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ResetRequest {
  resetCode: string;
  clinicId: string;
}

interface ResetResponse {
  success: boolean;
  deletedCounts: {
    reportImages: number;
    reports: number;
    patients: number;
  };
  timestamp: string;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resetCode, clinicId }: ResetRequest = await req.json();

    // Verify reset code
    const adminResetCode = Deno.env.get("ADMIN_RESET_CODE");
    if (!adminResetCode) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Reset functionality not configured",
        } as ResetResponse),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (resetCode !== adminResetCode) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid reset code",
        } as ResetResponse),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for deletion
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get all report IDs for this clinic
    const { data: reports, error: reportsQueryError } = await supabase
      .from("reports")
      .select("id")
      .eq("clinic_id", clinicId);

    if (reportsQueryError) {
      throw new Error(`Failed to query reports: ${reportsQueryError.message}`);
    }

    const reportIds = reports?.map((r) => r.id) || [];

    // Step 2: Delete report_images for those reports
    let deletedImages = 0;
    if (reportIds.length > 0) {
      const { data: deletedImagesData, error: imagesError } = await supabase
        .from("report_images")
        .delete()
        .in("report_id", reportIds)
        .select();

      if (imagesError) {
        throw new Error(`Failed to delete report images: ${imagesError.message}`);
      }
      deletedImages = deletedImagesData?.length || 0;
    }

    // Step 3: Delete reports for the clinic
    const { data: deletedReportsData, error: reportsError } = await supabase
      .from("reports")
      .delete()
      .eq("clinic_id", clinicId)
      .select();

    if (reportsError) {
      throw new Error(`Failed to delete reports: ${reportsError.message}`);
    }
    const deletedReports = deletedReportsData?.length || 0;

    // Step 4: Delete patients for the clinic
    const { data: deletedPatientsData, error: patientsError } = await supabase
      .from("patients")
      .delete()
      .eq("clinic_id", clinicId)
      .select();

    if (patientsError) {
      throw new Error(`Failed to delete patients: ${patientsError.message}`);
    }
    const deletedPatients = deletedPatientsData?.length || 0;

    const response: ResetResponse = {
      success: true,
      deletedCounts: {
        reportImages: deletedImages,
        reports: deletedReports,
        patients: deletedPatients,
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Reset error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      } as ResetResponse),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
