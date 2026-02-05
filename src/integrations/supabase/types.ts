export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clinics: {
        Row: {
          accent_color: string | null
          address: string | null
          border_style: string | null
          contact_display_format: string | null
          created_at: string
          created_by: string | null
          email: string | null
          enable_qr_code: boolean | null
          font_size: string | null
          footer_text: string | null
          header_text: string | null
          id: string
          logo_url: string | null
          name: string
          page_size: string | null
          phone: string | null
          secondary_color: string | null
          show_abnormal_summary: boolean | null
          show_logo_on_all_pages: boolean | null
          show_patient_id: boolean | null
          signature_title_left: string | null
          signature_title_right: string | null
          tagline: string | null
          updated_at: string
          watermark_text: string | null
          website: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          border_style?: string | null
          contact_display_format?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          enable_qr_code?: boolean | null
          font_size?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          logo_url?: string | null
          name: string
          page_size?: string | null
          phone?: string | null
          secondary_color?: string | null
          show_abnormal_summary?: boolean | null
          show_logo_on_all_pages?: boolean | null
          show_patient_id?: boolean | null
          signature_title_left?: string | null
          signature_title_right?: string | null
          tagline?: string | null
          updated_at?: string
          watermark_text?: string | null
          website?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          border_style?: string | null
          contact_display_format?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          enable_qr_code?: boolean | null
          font_size?: string | null
          footer_text?: string | null
          header_text?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          page_size?: string | null
          phone?: string | null
          secondary_color?: string | null
          show_abnormal_summary?: boolean | null
          show_logo_on_all_pages?: boolean | null
          show_patient_id?: boolean | null
          signature_title_left?: string | null
          signature_title_right?: string | null
          tagline?: string | null
          updated_at?: string
          watermark_text?: string | null
          website?: string | null
        }
        Relationships: []
      }
      custom_templates: {
        Row: {
          base_template: string
          clinic_id: string | null
          created_at: string
          customizations: Json
          id: string
          updated_at: string
        }
        Insert: {
          base_template: string
          clinic_id?: string | null
          created_at?: string
          customizations?: Json
          id?: string
          updated_at?: string
        }
        Update: {
          base_template?: string
          clinic_id?: string | null
          created_at?: string
          customizations?: Json
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_templates_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          clinic_id: string
          created_at: string
          date_of_birth: string
          email: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          patient_id_number: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          clinic_id: string
          created_at?: string
          date_of_birth: string
          email?: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          id?: string
          patient_id_number?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          clinic_id?: string
          created_at?: string
          date_of_birth?: string
          email?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          patient_id_number?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          clinic_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clinic_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clinic_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      report_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          report_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          report_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_images_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          clinic_id: string
          clinical_notes: string | null
          created_at: string
          created_by: string | null
          id: string
          included_tests: string[] | null
          patient_id: string
          referring_doctor: string | null
          report_data: Json
          report_number: string
          report_type: Database["public"]["Enums"]["report_type"]
          status: string
          test_date: string
          updated_at: string
        }
        Insert: {
          clinic_id: string
          clinical_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          included_tests?: string[] | null
          patient_id: string
          referring_doctor?: string | null
          report_data?: Json
          report_number: string
          report_type: Database["public"]["Enums"]["report_type"]
          status?: string
          test_date?: string
          updated_at?: string
        }
        Update: {
          clinic_id?: string
          clinical_notes?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          included_tests?: string[] | null
          patient_id?: string
          referring_doctor?: string | null
          report_data?: Json
          report_number?: string
          report_type?: Database["public"]["Enums"]["report_type"]
          status?: string
          test_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_clinic_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "lab_technician" | "receptionist"
      gender: "male" | "female" | "other"
      report_type:
        | "blood_test"
        | "urine_analysis"
        | "hormone_immunology"
        | "microbiology"
        | "ultrasound"
        | "screening_tests"
        | "blood_group_typing"
        | "cbc"
        | "lft"
        | "rft"
        | "lipid_profile"
        | "esr"
        | "bsr"
        | "bsf"
        | "serum_calcium"
        | "mp"
        | "typhoid"
        | "hcv"
        | "hbsag"
        | "hiv"
        | "vdrl"
        | "h_pylori"
        | "blood_group"
        | "ra_factor"
        | "combined"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "lab_technician", "receptionist"],
      gender: ["male", "female", "other"],
      report_type: [
        "blood_test",
        "urine_analysis",
        "hormone_immunology",
        "microbiology",
        "ultrasound",
        "screening_tests",
        "blood_group_typing",
        "cbc",
        "lft",
        "rft",
        "lipid_profile",
        "esr",
        "bsr",
        "bsf",
        "serum_calcium",
        "mp",
        "typhoid",
        "hcv",
        "hbsag",
        "hiv",
        "vdrl",
        "h_pylori",
        "blood_group",
        "ra_factor",
        "combined",
      ],
    },
  },
} as const
