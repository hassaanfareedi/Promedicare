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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointment_payments: {
        Row: {
          amount: number
          appointment_id: string
          collected_at: string
          collected_by: string | null
          created_at: string
          currency: string
          hospital_id: string
          id: string
          method: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id: string
          collected_at?: string
          collected_by?: string | null
          created_at?: string
          currency?: string
          hospital_id: string
          id?: string
          method?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string
          collected_at?: string
          collected_by?: string | null
          created_at?: string
          currency?: string
          hospital_id?: string
          id?: string
          method?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_payments_collected_by_fkey"
            columns: ["collected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_payments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cancelled_at: string | null
          cancelled_reason: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          department_id: string | null
          doctor_id: string | null
          hospital_id: string
          id: string
          notes: string | null
          patient_id: string
          prediction_id: string | null
          queue_number: number | null
          reason: string | null
          scheduled_end: string
          scheduled_start: string
          source: Database["public"]["Enums"]["appointment_source"]
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department_id?: string | null
          doctor_id?: string | null
          hospital_id: string
          id?: string
          notes?: string | null
          patient_id: string
          prediction_id?: string | null
          queue_number?: number | null
          reason?: string | null
          scheduled_end: string
          scheduled_start: string
          source?: Database["public"]["Enums"]["appointment_source"]
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_reason?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          department_id?: string | null
          doctor_id?: string | null
          hospital_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          prediction_id?: string | null
          queue_number?: number | null
          reason?: string | null
          scheduled_end?: string
          scheduled_start?: string
          source?: Database["public"]["Enums"]["appointment_source"]
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_notes: {
        Row: {
          appointment_id: string
          assessment: string | null
          created_at: string
          deleted_at: string | null
          diagnosis: string | null
          doctor_id: string | null
          id: string
          medications: Json | null
          objective: string | null
          patient_id: string | null
          plan: string | null
          prescription: string | null
          subjective: string | null
          updated_at: string
        }
        Insert: {
          appointment_id: string
          assessment?: string | null
          created_at?: string
          deleted_at?: string | null
          diagnosis?: string | null
          doctor_id?: string | null
          id?: string
          medications?: Json | null
          objective?: string | null
          patient_id?: string | null
          plan?: string | null
          prescription?: string | null
          subjective?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          assessment?: string | null
          created_at?: string
          deleted_at?: string | null
          diagnosis?: string | null
          doctor_id?: string | null
          id?: string
          medications?: Json | null
          objective?: string | null
          patient_id?: string | null
          plan?: string | null
          prescription?: string | null
          subjective?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          hospital_id: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          hospital_id: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          hospital_id?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_availability: {
        Row: {
          created_at: string
          doctor_id: string
          end_time: string
          id: string
          is_active: boolean
          slot_minutes: number
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          doctor_id: string
          end_time: string
          id?: string
          is_active?: boolean
          slot_minutes?: number
          start_time: string
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          doctor_id?: string
          end_time?: string
          id?: string
          is_active?: boolean
          slot_minutes?: number
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctor_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          bio: string | null
          consultation_fee: number | null
          created_at: string
          deleted_at: string | null
          department_id: string | null
          hospital_id: string
          id: string
          is_active: boolean
          license_number: string | null
          profile_id: string
          specialty_id: string | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          hospital_id: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          profile_id: string
          specialty_id?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string
          deleted_at?: string | null
          department_id?: string | null
          hospital_id?: string
          id?: string
          is_active?: boolean
          license_number?: string | null
          profile_id?: string
          specialty_id?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_attachments: {
        Row: {
          appointment_id: string | null
          created_at: string
          deleted_at: string | null
          file_name: string
          file_path: string
          hospital_id: string
          id: string
          kind: string
          mime_type: string | null
          patient_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          deleted_at?: string | null
          file_name: string
          file_path: string
          hospital_id: string
          id?: string
          kind?: string
          mime_type?: string | null
          patient_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          deleted_at?: string | null
          file_name?: string
          file_path?: string
          hospital_id?: string
          id?: string
          kind?: string
          mime_type?: string | null
          patient_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_attachments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_attachments_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_attachments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          read_at: string | null
          recipient_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          recipient_id: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          blood_group: string | null
          created_at: string
          deleted_at: string | null
          dob: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          hospital_id: string | null
          id: string
          patient_code: string
          phone: string | null
          profile_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          blood_group?: string | null
          created_at?: string
          deleted_at?: string | null
          dob?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          hospital_id?: string | null
          id?: string
          patient_code?: string
          phone?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          blood_group?: string | null
          created_at?: string
          deleted_at?: string | null
          dob?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          hospital_id?: string | null
          id?: string
          patient_code?: string
          phone?: string | null
          profile_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          confidence: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          explanation: string | null
          hospital_id: string | null
          id: string
          input_symptoms: Json
          input_text: string | null
          model: string
          model_version: string | null
          patient_id: string | null
          predicted_conditions: Json
          raw_output: Json | null
          recommended_specialty_id: string | null
          recommended_specialty_label: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          status: Database["public"]["Enums"]["prediction_status"]
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          explanation?: string | null
          hospital_id?: string | null
          id?: string
          input_symptoms?: Json
          input_text?: string | null
          model: string
          model_version?: string | null
          patient_id?: string | null
          predicted_conditions?: Json
          raw_output?: Json | null
          recommended_specialty_id?: string | null
          recommended_specialty_label?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level: Database["public"]["Enums"]["risk_level"]
          status?: Database["public"]["Enums"]["prediction_status"]
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          explanation?: string | null
          hospital_id?: string | null
          id?: string
          input_symptoms?: Json
          input_text?: string | null
          model?: string
          model_version?: string | null
          patient_id?: string | null
          predicted_conditions?: Json
          raw_output?: Json | null
          recommended_specialty_id?: string | null
          recommended_specialty_label?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"]
          status?: Database["public"]["Enums"]["prediction_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_recommended_specialty_id_fkey"
            columns: ["recommended_specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          full_name: string | null
          hospital_id: string | null
          id: string
          onboarding_completed: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          hospital_id?: string | null
          id: string
          onboarding_completed?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          hospital_id?: string | null
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      doctor_directory: {
        Row: {
          avatar_url: string | null
          bio: string | null
          consultation_fee: number | null
          department_id: string | null
          department_name: string | null
          full_name: string | null
          hospital_id: string | null
          id: string | null
          specialty_id: string | null
          specialty_name: string | null
          specialty_slug: string | null
          years_experience: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doctors_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_hospital_id_fkey"
            columns: ["hospital_id"]
            isOneToOne: false
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      book_appointment: {
        Args: {
          p_department?: string
          p_doctor: string
          p_hospital: string
          p_prediction?: string
          p_reason?: string
          p_start?: string
        }
        Returns: string
      }
      can_access_appointment: { Args: { p_appt: string }; Returns: boolean }
      can_access_patient: { Args: { p_patient: string }; Returns: boolean }
      can_manage_doctor: { Args: { p_doctor: string }; Returns: boolean }
      create_notification: {
        Args: {
          p_body?: string
          p_data?: Json
          p_recipient: string
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: string
      }
      current_doctor_id: { Args: never; Returns: string }
      current_hospital_id: { Args: never; Returns: string }
      current_patient_id: { Args: never; Returns: string }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_hospital_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_audit: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type?: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      visitor_lookup: {
        Args: { p_code: string; p_dob?: string; p_phone?: string }
        Returns: Json
      }
    }
    Enums: {
      appointment_source: "online" | "walk_in"
      appointment_status:
        | "pending"
        | "confirmed"
        | "checked_in"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      gender: "male" | "female" | "other" | "prefer_not_to_say"
      notification_type:
        | "appointment_booked"
        | "appointment_confirmed"
        | "appointment_reminder"
        | "appointment_cancelled"
        | "appointment_rescheduled"
        | "prediction_reviewed"
        | "system"
      prediction_status: "pending_review" | "reviewed" | "dismissed"
      risk_level: "low" | "medium" | "high" | "urgent"
      user_role:
        | "patient"
        | "doctor"
        | "receptionist"
        | "hospital_admin"
        | "super_admin"
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
      appointment_source: ["online", "walk_in"],
      appointment_status: [
        "pending",
        "confirmed",
        "checked_in",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      gender: ["male", "female", "other", "prefer_not_to_say"],
      notification_type: [
        "appointment_booked",
        "appointment_confirmed",
        "appointment_reminder",
        "appointment_cancelled",
        "appointment_rescheduled",
        "prediction_reviewed",
        "system",
      ],
      prediction_status: ["pending_review", "reviewed", "dismissed"],
      risk_level: ["low", "medium", "high", "urgent"],
      user_role: [
        "patient",
        "doctor",
        "receptionist",
        "hospital_admin",
        "super_admin",
      ],
    },
  },
} as const
