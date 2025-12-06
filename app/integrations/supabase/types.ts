
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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address1: string | null
          address2: string | null
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          label: string | null
          lat: number | null
          lng: number | null
          person_id: string | null
          postal: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address1?: string | null
          address2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          label?: string | null
          lat?: number | null
          lng?: number | null
          person_id?: string | null
          postal?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address1?: string | null
          address2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          label?: string | null
          lat?: number | null
          lng?: number | null
          person_id?: string | null
          postal?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_responses: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          question_id: string | null
          response: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          question_id?: string | null
          response?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          question_id?: string | null
          response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_responses_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "intake_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string
          client_id: string | null
          created_at: string | null
          duration: number | null
          end_time: string | null
          homeowner_id: string | null
          id: string
          notes: string | null
          organization_id: string | null
          price: number | null
          route_order: number | null
          scheduled_date: string
          scheduled_time: string
          service_id: string | null
          service_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address: string
          client_id?: string | null
          created_at?: string | null
          duration?: number | null
          end_time?: string | null
          homeowner_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          price?: number | null
          route_order?: number | null
          scheduled_date: string
          scheduled_time: string
          service_id?: string | null
          service_name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          client_id?: string | null
          created_at?: string | null
          duration?: number | null
          end_time?: string | null
          homeowner_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          price?: number | null
          route_order?: number | null
          scheduled_date?: string
          scheduled_time?: string
          service_id?: string | null
          service_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          created_at: string | null
          id: string
          last_sync_at: string | null
          organization_id: string | null
          provider: string
          refresh_token: string | null
          sync_enabled: boolean | null
          token_expiry: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id?: string | null
          provider: string
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expiry?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          organization_id?: string | null
          provider?: string
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expiry?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_sends: {
        Row: {
          campaign_id: string | null
          channel: string
          clicked_at: string | null
          client_id: string | null
          created_at: string | null
          error: string | null
          error_message: string | null
          id: string
          opened_at: string | null
          person_id: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          channel: string
          clicked_at?: string | null
          client_id?: string | null
          created_at?: string | null
          error?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          person_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          channel?: string
          clicked_at?: string | null
          client_id?: string | null
          created_at?: string | null
          error?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
          person_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_sends_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audience_filter: Json | null
          channel: string
          clicked_count: number | null
          created_at: string | null
          id: string
          message: string
          name: string
          opened_count: number | null
          organization_id: string | null
          recipient_count: number | null
          scheduled_at: string | null
          segment: Json | null
          sent_at: string | null
          status: string | null
          subject: string | null
          template: Json | null
          updated_at: string | null
        }
        Insert: {
          audience_filter?: Json | null
          channel: string
          clicked_count?: number | null
          created_at?: string | null
          id?: string
          message: string
          name: string
          opened_count?: number | null
          organization_id?: string | null
          recipient_count?: number | null
          scheduled_at?: string | null
          segment?: Json | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template?: Json | null
          updated_at?: string | null
        }
        Update: {
          audience_filter?: Json | null
          channel?: string
          clicked_count?: number | null
          created_at?: string | null
          id?: string
          message?: string
          name?: string
          opened_count?: number | null
          organization_id?: string | null
          recipient_count?: number | null
          scheduled_at?: string | null
          segment?: Json | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_files: {
        Row: {
          client_id: string | null
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          organization_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          organization_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          organization_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_files_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_files_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          client_id: string | null
          content: string
          created_at: string | null
          direction: string
          external_id: string | null
          id: string
          message_type: string
          organization_id: string | null
          read_at: string | null
          sent_by: string | null
          status: string | null
          subject: string | null
        }
        Insert: {
          client_id?: string | null
          content: string
          created_at?: string | null
          direction: string
          external_id?: string | null
          id?: string
          message_type: string
          organization_id?: string | null
          read_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          client_id?: string | null
          content?: string
          created_at?: string | null
          direction?: string
          external_id?: string | null
          id?: string
          message_type?: string
          organization_id?: string | null
          read_at?: string | null
          sent_by?: string | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          client_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          note_type: string | null
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note_type?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note_type?: string | null
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          lifetime_value: number | null
          name: string
          notes: string | null
          organization_id: string | null
          phone: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          lifetime_value?: number | null
          name: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          lifetime_value?: number | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          email_opt_in: boolean | null
          id: string
          person_id: string
          sms_opt_in: boolean | null
          updated_at: string | null
        }
        Insert: {
          email_opt_in?: boolean | null
          id?: string
          person_id: string
          sms_opt_in?: boolean | null
          updated_at?: string | null
        }
        Update: {
          email_opt_in?: boolean | null
          id?: string
          person_id?: string
          sms_opt_in?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consents_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_providers: {
        Row: {
          created_at: string | null
          homeowner_id: string | null
          id: string
          organization_id: string | null
        }
        Insert: {
          created_at?: string | null
          homeowner_id?: string | null
          id?: string
          organization_id?: string | null
        }
        Update: {
          created_at?: string | null
          homeowner_id?: string | null
          id?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorite_providers_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_providers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      homes: {
        Row: {
          address: string
          city: string | null
          created_at: string | null
          homeowner_id: string | null
          id: string
          is_primary: boolean | null
          nickname: string | null
          property_type: string | null
          state: string | null
          updated_at: string | null
          zip: string | null
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string | null
          homeowner_id?: string | null
          id?: string
          is_primary?: boolean | null
          nickname?: string | null
          property_type?: string | null
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string | null
          homeowner_id?: string | null
          id?: string
          is_primary?: boolean | null
          nickname?: string | null
          property_type?: string | null
          state?: string | null
          updated_at?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homes_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_questions: {
        Row: {
          created_at: string | null
          id: string
          options: Json | null
          order_index: number | null
          organization_id: string | null
          question: string
          question_type: string
          required: boolean | null
          service_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          organization_id?: string | null
          question: string
          question_type: string
          required?: boolean | null
          service_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          organization_id?: string | null
          question?: string
          question_type?: string
          required?: boolean | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_questions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_questions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          booking_id: string | null
          client_id: string | null
          created_at: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          line_items: Json | null
          notes: string | null
          org_client_id: string | null
          organization_id: string | null
          paid_date: string | null
          payment_method: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          subtotal: number
          tax: number | null
          total: number
          total_cents: number | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          line_items?: Json | null
          notes?: string | null
          org_client_id?: string | null
          organization_id?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          subtotal: number
          tax?: number | null
          total: number
          total_cents?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          client_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          line_items?: Json | null
          notes?: string | null
          org_client_id?: string | null
          organization_id?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          total_cents?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_org_client_id_fkey"
            columns: ["org_client_id"]
            isOneToOne: false
            referencedRelation: "org_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address_id: string | null
          created_at: string | null
          end_at: string | null
          id: string
          notes: string | null
          org_client_id: string
          organization_id: string
          price_cents: number | null
          service_id: string | null
          start_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          address_id?: string | null
          created_at?: string | null
          end_at?: string | null
          id?: string
          notes?: string | null
          org_client_id: string
          organization_id: string
          price_cents?: number | null
          service_id?: string | null
          start_at: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          address_id?: string | null
          created_at?: string | null
          end_at?: string | null
          id?: string
          notes?: string | null
          org_client_id?: string
          organization_id?: string
          price_cents?: number | null
          service_id?: string | null
          start_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_org_client_id_fkey"
            columns: ["org_client_id"]
            isOneToOne: false
            referencedRelation: "org_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_reminders: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string
          home_id: string | null
          homeowner_id: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          home_id?: string | null
          homeowner_id?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          home_id?: string | null
          homeowner_id?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_reminders_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_reminders_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          data: Json | null
          id: string
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_client_settings: {
        Row: {
          created_at: string | null
          custom_fields: Json | null
          id: string
          org_client_id: string
          pricing_tier: string | null
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_fields?: Json | null
          id?: string
          org_client_id: string
          pricing_tier?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_fields?: Json | null
          id?: string
          org_client_id?: string
          pricing_tier?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_client_settings_org_client_id_fkey"
            columns: ["org_client_id"]
            isOneToOne: true
            referencedRelation: "org_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      org_clients: {
        Row: {
          created_at: string | null
          default_address_id: string | null
          id: string
          ltv_cents: number | null
          notes: Json | null
          organization_id: string
          person_id: string
          status: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_address_id?: string | null
          id?: string
          ltv_cents?: number | null
          notes?: Json | null
          organization_id: string
          person_id: string
          status?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_address_id?: string | null
          id?: string
          ltv_cents?: number | null
          notes?: Json | null
          organization_id?: string
          person_id?: string
          status?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_clients_default_address_id_fkey"
            columns: ["default_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_clients_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          business_name: string
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          logo_url: string | null
          onboarding_completed: boolean | null
          owner_id: string | null
          published_to_marketplace: boolean | null
          service_categories: string[] | null
          service_radius: number | null
          slug: string | null
          stripe_account_id: string | null
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          business_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          onboarding_completed?: boolean | null
          owner_id?: string | null
          published_to_marketplace?: boolean | null
          service_categories?: string[] | null
          service_radius?: number | null
          slug?: string | null
          stripe_account_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          business_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          onboarding_completed?: boolean | null
          owner_id?: string | null
          published_to_marketplace?: boolean | null
          service_categories?: string[] | null
          service_radius?: number | null
          slug?: string | null
          stripe_account_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          amount_cents: number | null
          captured_at: string | null
          client_id: string | null
          created_at: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          organization_id: string | null
          payment_link_url: string | null
          payment_method: string
          refund_amount: number | null
          status: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          amount_cents?: number | null
          captured_at?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          organization_id?: string | null
          payment_link_url?: string | null
          payment_method: string
          refund_amount?: number | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_cents?: number | null
          captured_at?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          organization_id?: string | null
          payment_link_url?: string | null
          payment_method?: string
          refund_amount?: number | null
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          primary_email: string | null
          primary_phone_e164: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          primary_email?: string | null
          primary_phone_e164?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          primary_email?: string | null
          primary_phone_e164?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      person_emails: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_primary: boolean | null
          person_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_primary?: boolean | null
          person_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_primary?: boolean | null
          person_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_emails_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      person_phones: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          person_id: string
          phone_e164: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          person_id: string
          phone_e164: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          person_id?: string
          phone_e164?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_phones_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_images: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          organization_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          organization_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_images_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          role: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      quotes: {
        Row: {
          client_id: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          line_items: Json | null
          notes: string | null
          organization_id: string | null
          quote_number: string | null
          service_id: string | null
          status: string | null
          subtotal: number
          tax: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          line_items?: Json | null
          notes?: string | null
          organization_id?: string | null
          quote_number?: string | null
          service_id?: string | null
          status?: string | null
          subtotal: number
          tax?: number | null
          total: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          line_items?: Json | null
          notes?: string | null
          organization_id?: string | null
          quote_number?: string | null
          service_id?: string | null
          status?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string | null
          id: string
          org_client_id: string
          organization_id: string
          payload: Json | null
          send_at: string
          sent_at: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_client_id: string
          organization_id: string
          payload?: Json | null
          send_at: string
          sent_at?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          org_client_id?: string
          organization_id?: string
          payload?: Json | null
          send_at?: string
          sent_at?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_org_client_id_fkey"
            columns: ["org_client_id"]
            isOneToOne: false
            referencedRelation: "org_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          homeowner_id: string | null
          id: string
          organization_id: string | null
          rating: number
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          homeowner_id?: string | null
          id?: string
          organization_id?: string | null
          rating: number
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          homeowner_id?: string | null
          id?: string
          organization_id?: string | null
          rating?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          price_max: number | null
          price_min: number | null
          pricing_type: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          price_max?: number | null
          price_min?: number | null
          pricing_type?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          price_max?: number | null
          price_min?: number | null
          pricing_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          frequency: string
          homeowner_id: string | null
          id: string
          next_service_date: string | null
          organization_id: string | null
          plan_name: string
          price: number
          service_id: string | null
          status: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          frequency: string
          homeowner_id?: string | null
          id?: string
          next_service_date?: string | null
          organization_id?: string | null
          plan_name: string
          price: number
          service_id?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          frequency?: string
          homeowner_id?: string | null
          id?: string
          next_service_date?: string | null
          organization_id?: string | null
          plan_name?: string
          price?: number
          service_id?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_homeowner_id_fkey"
            columns: ["homeowner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      user_person_links: {
        Row: {
          created_at: string | null
          id: string
          person_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          person_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          person_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_person_links_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      client_stats: {
        Args: { p_org_id: string }
        Returns: {
          active_clients: number
          avg_ltv_cents: number
          inactive_clients: number
          lead_clients: number
          total_clients: number
          total_ltv_cents: number
        }[]
      }
      client_timeline: {
        Args: { p_org_client_id: string }
        Returns: {
          created_at: string
          data: Json
          id: string
          type: string
        }[]
      }
      search_clients: {
        Args: { p_org_id: string; p_query: string }
        Returns: {
          created_at: string
          first_name: string
          last_name: string
          ltv_cents: number
          org_client_id: string
          person_id: string
          primary_email: string
          primary_phone_e164: string
          status: string
          tags: string[]
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
