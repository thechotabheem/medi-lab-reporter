import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resetCode, clinicId } = await req.json();

    const adminResetCode = Deno.env.get("ADMIN_RESET_CODE");
    if (!adminResetCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Reset functionality not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (resetCode !== adminResetCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid reset code" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: reports } = await supabase
      .from("reports")
      .select("id")
      .eq("clinic_id", clinicId);

    const reportIds = reports?.map((r) => r.id) || [];

    let deletedImages = 0;
    if (reportIds.length > 0) {
      const { data: deletedImagesData } = await supabase
        .from("report_images")
        .delete()
        .in("report_id", reportIds)
        .select();
      deletedImages = deletedImagesData?.length || 0;
    }

    const { data: deletedReportsData } = await supabase
      .from("reports")
      .delete()
      .eq("clinic_id", clinicId)
      .select();
    const deletedReports = deletedReportsData?.length || 0;

    const { data: deletedPatientsData } = await supabase
      .from("patients")
      .delete()
      .eq("clinic_id", clinicId)
      .select();
    const deletedPatients = deletedPatientsData?.length || 0;

    return new Response(
      JSON.stringify({
        success: true,
        deletedCounts: { reportImages: deletedImages, reports: deletedReports, patients: deletedPatients },
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Reset error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
