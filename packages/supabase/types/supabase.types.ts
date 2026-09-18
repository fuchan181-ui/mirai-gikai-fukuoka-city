export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_rate_limits: {
        Row: {
          key: string
          request_count: number
          window_start: string
        }
        Insert: {
          key: string
          request_count?: number
          window_start: string
        }
        Update: {
          key?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      bill_contents: {
        Row: {
          bill_id: string
          content: string
          created_at: string
          difficulty_level: Database["public"]["Enums"]["difficulty_level_enum"]
          id: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          bill_id: string
          content: string
          created_at?: string
          difficulty_level: Database["public"]["Enums"]["difficulty_level_enum"]
          id?: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          bill_id?: string
          content?: string
          created_at?: string
          difficulty_level?: Database["public"]["Enums"]["difficulty_level_enum"]
          id?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_contents_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_debates: {
        Row: {
          bill_id: string
          council_member_id: string | null
          created_at: string
          id: string
          seat_number: number | null
          source_url: string
          speaker_name: string
          stance: Database["public"]["Enums"]["debate_stance_enum"]
          summary: string | null
          updated_at: string
        }
        Insert: {
          bill_id: string
          council_member_id?: string | null
          created_at?: string
          id?: string
          seat_number?: number | null
          source_url: string
          speaker_name: string
          stance: Database["public"]["Enums"]["debate_stance_enum"]
          summary?: string | null
          updated_at?: string
        }
        Update: {
          bill_id?: string
          council_member_id?: string | null
          created_at?: string
          id?: string
          seat_number?: number | null
          source_url?: string
          speaker_name?: string
          stance?: Database["public"]["Enums"]["debate_stance_enum"]
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_debates_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_debates_council_member_id_fkey"
            columns: ["council_member_id"]
            isOneToOne: false
            referencedRelation: "council_members"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          bill_number: string | null
          bill_number_kind:
            | Database["public"]["Enums"]["bill_number_kind_enum"]
            | null
          bill_number_value: number | null
          category: Database["public"]["Enums"]["bill_category_enum"] | null
          committee_id: string | null
          committee_minutes_url: string | null
          committee_qa_count: number | null
          committee_result: string | null
          council_session_id: string | null
          created_at: string
          decided_on: string | null
          document_url: string | null
          explanation_source: string | null
          id: string
          is_featured: boolean
          is_review_completed: boolean
          knowledge_source: string | null
          legal_basis: string | null
          name: string
          publish_status: Database["public"]["Enums"]["bill_publish_status"]
          publish_status_order: number | null
          published_at: string | null
          share_thumbnail_url: string | null
          slug: string | null
          source_record_key: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["bill_status_enum"]
          status_note: string | null
          status_order: number | null
          submitted_date: string | null
          submitter: Database["public"]["Enums"]["bill_submitter_enum"] | null
          thumbnail_key: string | null
          thumbnail_url: string | null
          updated_at: string
          use_knowledge_source_in_chat: boolean
        }
        Insert: {
          bill_number?: string | null
          bill_number_kind?:
            | Database["public"]["Enums"]["bill_number_kind_enum"]
            | null
          bill_number_value?: number | null
          category?: Database["public"]["Enums"]["bill_category_enum"] | null
          committee_id?: string | null
          committee_minutes_url?: string | null
          committee_qa_count?: number | null
          committee_result?: string | null
          council_session_id?: string | null
          created_at?: string
          decided_on?: string | null
          document_url?: string | null
          explanation_source?: string | null
          id?: string
          is_featured?: boolean
          is_review_completed?: boolean
          knowledge_source?: string | null
          legal_basis?: string | null
          name: string
          publish_status?: Database["public"]["Enums"]["bill_publish_status"]
          publish_status_order?: number | null
          published_at?: string | null
          share_thumbnail_url?: string | null
          slug?: string | null
          source_record_key?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["bill_status_enum"]
          status_note?: string | null
          status_order?: number | null
          submitted_date?: string | null
          submitter?: Database["public"]["Enums"]["bill_submitter_enum"] | null
          thumbnail_key?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          use_knowledge_source_in_chat?: boolean
        }
        Update: {
          bill_number?: string | null
          bill_number_kind?:
            | Database["public"]["Enums"]["bill_number_kind_enum"]
            | null
          bill_number_value?: number | null
          category?: Database["public"]["Enums"]["bill_category_enum"] | null
          committee_id?: string | null
          committee_minutes_url?: string | null
          committee_qa_count?: number | null
          committee_result?: string | null
          council_session_id?: string | null
          created_at?: string
          decided_on?: string | null
          document_url?: string | null
          explanation_source?: string | null
          id?: string
          is_featured?: boolean
          is_review_completed?: boolean
          knowledge_source?: string | null
          legal_basis?: string | null
          name?: string
          publish_status?: Database["public"]["Enums"]["bill_publish_status"]
          publish_status_order?: number | null
          published_at?: string | null
          share_thumbnail_url?: string | null
          slug?: string | null
          source_record_key?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["bill_status_enum"]
          status_note?: string | null
          status_order?: number | null
          submitted_date?: string | null
          submitter?: Database["public"]["Enums"]["bill_submitter_enum"] | null
          thumbnail_key?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          use_knowledge_source_in_chat?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bills_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_diet_session_id_fkey"
            columns: ["council_session_id"]
            isOneToOne: false
            referencedRelation: "council_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      bills_tags: {
        Row: {
          bill_id: string
          created_at: string
          tag_id: string
        }
        Insert: {
          bill_id: string
          created_at?: string
          tag_id: string
        }
        Update: {
          bill_id?: string
          created_at?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_tags_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_usage_events: {
        Row: {
          cost_usd: number
          created_at: string
          id: string
          input_tokens: number
          metadata: Json | null
          model: string
          occurred_at: string
          output_tokens: number
          prompt_name: string | null
          session_id: string | null
          total_tokens: number
          user_id: string
        }
        Insert: {
          cost_usd?: number
          created_at?: string
          id?: string
          input_tokens?: number
          metadata?: Json | null
          model: string
          occurred_at?: string
          output_tokens?: number
          prompt_name?: string | null
          session_id?: string | null
          total_tokens?: number
          user_id: string
        }
        Update: {
          cost_usd?: number
          created_at?: string
          id?: string
          input_tokens?: number
          metadata?: Json | null
          model?: string
          occurred_at?: string
          output_tokens?: number
          prompt_name?: string | null
          session_id?: string | null
          total_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      chats: {
        Row: {
          bill_id: string
          created_at: string
          id: string
          message: string
          role: Database["public"]["Enums"]["chat_role_enum"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bill_id: string
          created_at?: string
          id?: string
          message: string
          role: Database["public"]["Enums"]["chat_role_enum"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bill_id?: string
          created_at?: string
          id?: string
          message?: string
          role?: Database["public"]["Enums"]["chat_role_enum"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chats_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_memberships: {
        Row: {
          committee_id: string
          council_member_id: string
          created_at: string
          role: string | null
        }
        Insert: {
          committee_id: string
          council_member_id: string
          created_at?: string
          role?: string | null
        }
        Update: {
          committee_id?: string
          council_member_id?: string
          created_at?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_memberships_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_memberships_council_member_id_fkey"
            columns: ["council_member_id"]
            isOneToOne: false
            referencedRelation: "council_members"
            referencedColumns: ["id"]
          },
        ]
      }
      committees: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["committee_kind_enum"]
          name: string
          short_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["committee_kind_enum"]
          name: string
          short_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["committee_kind_enum"]
          name?: string
          short_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      council_meeting_revisions: {
        Row: {
          closed_at: string | null
          committee_id: string | null
          council_session_id: string | null
          created_at: string
          day_number: number | null
          display_title: string
          held_on: string | null
          id: string
          kind: Database["public"]["Enums"]["council_meeting_kind_enum"]
          meeting_id: string
          opened_at: string | null
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          reviewed_at: string | null
          reviewed_by: string | null
          revision_number: number
          scheduled_on: string | null
          scheduled_starts_at: string | null
          source_support_status: Database["public"]["Enums"]["source_support_status_enum"]
          status: Database["public"]["Enums"]["council_meeting_status_enum"]
          venue: string | null
        }
        Insert: {
          closed_at?: string | null
          committee_id?: string | null
          council_session_id?: string | null
          created_at?: string
          day_number?: number | null
          display_title: string
          held_on?: string | null
          id?: string
          kind: Database["public"]["Enums"]["council_meeting_kind_enum"]
          meeting_id: string
          opened_at?: string | null
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number: number
          scheduled_on?: string | null
          scheduled_starts_at?: string | null
          source_support_status?: Database["public"]["Enums"]["source_support_status_enum"]
          status: Database["public"]["Enums"]["council_meeting_status_enum"]
          venue?: string | null
        }
        Update: {
          closed_at?: string | null
          committee_id?: string | null
          council_session_id?: string | null
          created_at?: string
          day_number?: number | null
          display_title?: string
          held_on?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["council_meeting_kind_enum"]
          meeting_id?: string
          opened_at?: string | null
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number?: number
          scheduled_on?: string | null
          scheduled_starts_at?: string | null
          source_support_status?: Database["public"]["Enums"]["source_support_status_enum"]
          status?: Database["public"]["Enums"]["council_meeting_status_enum"]
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "council_meeting_revisions_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "council_meeting_revisions_council_session_id_fkey"
            columns: ["council_session_id"]
            isOneToOne: false
            referencedRelation: "council_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "council_meeting_revisions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "council_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      council_meeting_source_evidence: {
        Row: {
          availability: Database["public"]["Enums"]["source_availability_enum"]
          created_at: string
          evidence_revision: number
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          id: string
          ingestion_source_id: string
          locator: string | null
          meeting_id: string
          meeting_source_occurrence_id: string
          observed_closed_at: string | null
          observed_day_number: number | null
          observed_held_on: string | null
          observed_opened_at: string | null
          observed_scheduled_on: string | null
          observed_starts_at: string | null
          observed_status:
            | Database["public"]["Enums"]["council_meeting_status_enum"]
            | null
          observed_title: string | null
          observed_venue: string | null
          parse_run_id: string | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          revision_id: string
          role: Database["public"]["Enums"]["council_meeting_evidence_role_enum"]
          source_evidence_key: string
          source_version_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          availability?: Database["public"]["Enums"]["source_availability_enum"]
          created_at?: string
          evidence_revision?: number
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          id?: string
          ingestion_source_id: string
          locator?: string | null
          meeting_id: string
          meeting_source_occurrence_id: string
          observed_closed_at?: string | null
          observed_day_number?: number | null
          observed_held_on?: string | null
          observed_opened_at?: string | null
          observed_scheduled_on?: string | null
          observed_starts_at?: string | null
          observed_status?:
            | Database["public"]["Enums"]["council_meeting_status_enum"]
            | null
          observed_title?: string | null
          observed_venue?: string | null
          parse_run_id?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          revision_id: string
          role: Database["public"]["Enums"]["council_meeting_evidence_role_enum"]
          source_evidence_key: string
          source_version_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          availability?: Database["public"]["Enums"]["source_availability_enum"]
          created_at?: string
          evidence_revision?: number
          extraction_method?: Database["public"]["Enums"]["extraction_method_enum"]
          id?: string
          ingestion_source_id?: string
          locator?: string | null
          meeting_id?: string
          meeting_source_occurrence_id?: string
          observed_closed_at?: string | null
          observed_day_number?: number | null
          observed_held_on?: string | null
          observed_opened_at?: string | null
          observed_scheduled_on?: string | null
          observed_starts_at?: string | null
          observed_status?:
            | Database["public"]["Enums"]["council_meeting_status_enum"]
            | null
          observed_title?: string | null
          observed_venue?: string | null
          parse_run_id?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          revision_id?: string
          role?: Database["public"]["Enums"]["council_meeting_evidence_role_enum"]
          source_evidence_key?: string
          source_version_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "council_meeting_evidence_occurrence_fk"
            columns: [
              "meeting_source_occurrence_id",
              "meeting_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "council_meeting_source_occurrences"
            referencedColumns: ["id", "meeting_id", "ingestion_source_id"]
          },
          {
            foreignKeyName: "council_meeting_evidence_parse_run_fk"
            columns: ["parse_run_id", "source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id", "source_version_id"]
          },
          {
            foreignKeyName: "council_meeting_evidence_revision_fk"
            columns: ["revision_id", "meeting_id"]
            isOneToOne: false
            referencedRelation: "council_meeting_revisions"
            referencedColumns: ["id", "meeting_id"]
          },
          {
            foreignKeyName: "council_meeting_evidence_source_version_fk"
            columns: ["source_version_id", "ingestion_source_id"]
            isOneToOne: false
            referencedRelation: "ingestion_source_versions"
            referencedColumns: ["id", "ingestion_source_id"]
          },
        ]
      }
      council_meeting_source_occurrences: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          ingestion_source_id: string
          meeting_id: string
          source_occurrence_key: string
          source_system: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          ingestion_source_id: string
          meeting_id: string
          source_occurrence_key: string
          source_system: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          ingestion_source_id?: string
          meeting_id?: string
          source_occurrence_key?: string
          source_system?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_meeting_source_occurrences_ingestion_source_id_fkey"
            columns: ["ingestion_source_id"]
            isOneToOne: false
            referencedRelation: "ingestion_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "council_meeting_source_occurrences_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "council_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      council_meetings: {
        Row: {
          canonical_meeting_key: string
          created_at: string
          id: string
        }
        Insert: {
          canonical_meeting_key: string
          created_at?: string
          id?: string
        }
        Update: {
          canonical_meeting_key?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      council_members: {
        Row: {
          created_at: string
          external_speaker_id: string | null
          faction_id: string | null
          id: string
          is_active: boolean
          name: string
          name_kana: string | null
          party: string | null
          photo_url: string | null
          seat_number: number | null
          term_end: string | null
          term_start: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_speaker_id?: string | null
          faction_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_kana?: string | null
          party?: string | null
          photo_url?: string | null
          seat_number?: number | null
          term_end?: string | null
          term_start?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_speaker_id?: string | null
          faction_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_kana?: string | null
          party?: string | null
          photo_url?: string | null
          seat_number?: number | null
          term_end?: string | null
          term_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "council_members_faction_id_fkey"
            columns: ["faction_id"]
            isOneToOne: false
            referencedRelation: "factions"
            referencedColumns: ["id"]
          },
        ]
      }
      council_sessions: {
        Row: {
          created_at: string
          end_date: string
          external_council_id: string | null
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["council_session_kind_enum"]
          name: string
          session_number: number | null
          slug: string | null
          source_url: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          external_council_id?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["council_session_kind_enum"]
          name: string
          session_number?: number | null
          slug?: string | null
          source_url?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          external_council_id?: string | null
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["council_session_kind_enum"]
          name?: string
          session_number?: number | null
          slug?: string | null
          source_url?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      expert_registrations: {
        Row: {
          affiliation: string
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliation: string
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliation?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      faction_votes: {
        Row: {
          against_count: number | null
          bill_id: string
          created_at: string
          faction_id: string
          for_count: number | null
          id: string
          source_url: string
          updated_at: string
          vote: Database["public"]["Enums"]["faction_vote_enum"]
        }
        Insert: {
          against_count?: number | null
          bill_id: string
          created_at?: string
          faction_id: string
          for_count?: number | null
          id?: string
          source_url: string
          updated_at?: string
          vote: Database["public"]["Enums"]["faction_vote_enum"]
        }
        Update: {
          against_count?: number | null
          bill_id?: string
          created_at?: string
          faction_id?: string
          for_count?: number | null
          id?: string
          source_url?: string
          updated_at?: string
          vote?: Database["public"]["Enums"]["faction_vote_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "faction_votes_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faction_votes_faction_id_fkey"
            columns: ["faction_id"]
            isOneToOne: false
            referencedRelation: "factions"
            referencedColumns: ["id"]
          },
        ]
      }
      factions: {
        Row: {
          created_at: string
          display_order: number
          external_group_id: string | null
          id: string
          is_active: boolean
          member_count: number | null
          name: string
          short_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          external_group_id?: string | null
          id?: string
          is_active?: boolean
          member_count?: number | null
          name: string
          short_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          external_group_id?: string | null
          id?: string
          is_active?: boolean
          member_count?: number | null
          name?: string
          short_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      fiscal_accounts: {
        Row: {
          account_type: Database["public"]["Enums"]["fiscal_account_type_enum"]
          code: string
          created_at: string
          id: string
          name: string
          predecessor_id: string | null
          valid_from_fiscal_year: number
          valid_to_fiscal_year: number | null
        }
        Insert: {
          account_type: Database["public"]["Enums"]["fiscal_account_type_enum"]
          code: string
          created_at?: string
          id?: string
          name: string
          predecessor_id?: string | null
          valid_from_fiscal_year: number
          valid_to_fiscal_year?: number | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["fiscal_account_type_enum"]
          code?: string
          created_at?: string
          id?: string
          name?: string
          predecessor_id?: string | null
          valid_from_fiscal_year?: number
          valid_to_fiscal_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_accounts_predecessor_id_fkey"
            columns: ["predecessor_id"]
            isOneToOne: false
            referencedRelation: "fiscal_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_amount_evidence: {
        Row: {
          amount_id: string
          amount_revision_id: string
          amount_set_id: string
          amount_set_revision_id: string
          amount_set_source_id: string
          amount_set_source_occurrence_id: string
          amount_source_occurrence_id: string
          confidence: number | null
          created_at: string
          evidence_revision: number
          id: string
          ingestion_source_id: string
          normalized_amount_yen: number | null
          normalized_null_reason:
            | Database["public"]["Enums"]["fiscal_null_reason_enum"]
            | null
          parse_run_id: string | null
          parse_run_identity_key: string | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          source_cell: string | null
          source_page: string | null
          source_table: string | null
          source_unit:
            | Database["public"]["Enums"]["fiscal_source_unit_enum"]
            | null
          source_value_numeric: number | null
          source_value_text: string | null
          source_version_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_id: string
          amount_revision_id: string
          amount_set_id: string
          amount_set_revision_id: string
          amount_set_source_id: string
          amount_set_source_occurrence_id: string
          amount_source_occurrence_id: string
          confidence?: number | null
          created_at?: string
          evidence_revision?: number
          id?: string
          ingestion_source_id: string
          normalized_amount_yen?: number | null
          normalized_null_reason?:
            | Database["public"]["Enums"]["fiscal_null_reason_enum"]
            | null
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          source_cell?: string | null
          source_page?: string | null
          source_table?: string | null
          source_unit?:
            | Database["public"]["Enums"]["fiscal_source_unit_enum"]
            | null
          source_value_numeric?: number | null
          source_value_text?: string | null
          source_version_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_id?: string
          amount_revision_id?: string
          amount_set_id?: string
          amount_set_revision_id?: string
          amount_set_source_id?: string
          amount_set_source_occurrence_id?: string
          amount_source_occurrence_id?: string
          confidence?: number | null
          created_at?: string
          evidence_revision?: number
          id?: string
          ingestion_source_id?: string
          normalized_amount_yen?: number | null
          normalized_null_reason?:
            | Database["public"]["Enums"]["fiscal_null_reason_enum"]
            | null
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          source_cell?: string | null
          source_page?: string | null
          source_table?: string | null
          source_unit?:
            | Database["public"]["Enums"]["fiscal_source_unit_enum"]
            | null
          source_value_numeric?: number | null
          source_value_text?: string | null
          source_version_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_amount_evidence_amount_revision_id_amount_id_amount_fkey"
            columns: [
              "amount_revision_id",
              "amount_id",
              "amount_set_revision_id",
              "amount_set_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_amount_revisions"
            referencedColumns: [
              "id",
              "amount_id",
              "amount_set_revision_id",
              "amount_set_id",
            ]
          },
          {
            foreignKeyName: "fiscal_amount_evidence_amount_set_source_id_amount_set_rev_fkey"
            columns: [
              "amount_set_source_id",
              "amount_set_revision_id",
              "amount_set_id",
              "amount_set_source_occurrence_id",
              "ingestion_source_id",
              "source_version_id",
              "parse_run_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_amount_set_sources"
            referencedColumns: [
              "id",
              "amount_set_revision_id",
              "amount_set_id",
              "amount_set_source_occurrence_id",
              "ingestion_source_id",
              "source_version_id",
              "parse_run_identity_key",
            ]
          },
          {
            foreignKeyName: "fiscal_amount_evidence_amount_source_occurrence_id_amount__fkey"
            columns: [
              "amount_source_occurrence_id",
              "amount_id",
              "amount_set_id",
              "amount_set_source_occurrence_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_amount_source_occurrences"
            referencedColumns: [
              "id",
              "amount_id",
              "amount_set_id",
              "amount_set_source_occurrence_id",
              "ingestion_source_id",
            ]
          },
          {
            foreignKeyName: "fiscal_amount_evidence_parse_run_id_source_version_id_fkey"
            columns: ["parse_run_id", "source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id", "source_version_id"]
          },
          {
            foreignKeyName: "fiscal_amount_evidence_source_version_id_ingestion_source__fkey"
            columns: ["source_version_id", "ingestion_source_id"]
            isOneToOne: false
            referencedRelation: "ingestion_source_versions"
            referencedColumns: ["id", "ingestion_source_id"]
          },
        ]
      }
      fiscal_amount_revisions: {
        Row: {
          amount_id: string
          amount_set_id: string
          amount_set_revision_id: string
          amount_yen: number | null
          created_at: string
          id: string
          null_reason:
            | Database["public"]["Enums"]["fiscal_null_reason_enum"]
            | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          revision_number: number
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_id: string
          amount_set_id: string
          amount_set_revision_id: string
          amount_yen?: number | null
          created_at?: string
          id?: string
          null_reason?:
            | Database["public"]["Enums"]["fiscal_null_reason_enum"]
            | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          revision_number: number
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_id?: string
          amount_set_id?: string
          amount_set_revision_id?: string
          amount_yen?: number | null
          created_at?: string
          id?: string
          null_reason?:
            | Database["public"]["Enums"]["fiscal_null_reason_enum"]
            | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          revision_number?: number
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_amount_revisions_amount_id_amount_set_id_fkey"
            columns: ["amount_id", "amount_set_id"]
            isOneToOne: false
            referencedRelation: "fiscal_amounts"
            referencedColumns: ["id", "amount_set_id"]
          },
          {
            foreignKeyName: "fiscal_amount_revisions_amount_set_revision_id_amount_set__fkey"
            columns: ["amount_set_revision_id", "amount_set_id"]
            isOneToOne: false
            referencedRelation: "fiscal_amount_set_revisions"
            referencedColumns: ["id", "amount_set_id"]
          },
        ]
      }
      fiscal_amount_set_revisions: {
        Row: {
          account_id: string | null
          account_identity_key: string | null
          amount_set_id: string
          created_at: string
          effective_on: string | null
          event_kind: Database["public"]["Enums"]["fiscal_event_kind_enum"]
          fiscal_event_id: string
          fiscal_year: number
          id: string
          membership_observation_id: string | null
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          reporting_scope_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          revision_number: number
          scope_membership_id: string | null
        }
        Insert: {
          account_id?: string | null
          account_identity_key?: string | null
          amount_set_id: string
          created_at?: string
          effective_on?: string | null
          event_kind: Database["public"]["Enums"]["fiscal_event_kind_enum"]
          fiscal_event_id: string
          fiscal_year: number
          id?: string
          membership_observation_id?: string | null
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reporting_scope_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number: number
          scope_membership_id?: string | null
        }
        Update: {
          account_id?: string | null
          account_identity_key?: string | null
          amount_set_id?: string
          created_at?: string
          effective_on?: string | null
          event_kind?: Database["public"]["Enums"]["fiscal_event_kind_enum"]
          fiscal_event_id?: string
          fiscal_year?: number
          id?: string
          membership_observation_id?: string | null
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reporting_scope_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number?: number
          scope_membership_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_amount_set_revisions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fiscal_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_amount_set_revisions_amount_set_id_fiscal_event_id__fkey"
            columns: ["amount_set_id", "fiscal_event_id", "event_kind"]
            isOneToOne: false
            referencedRelation: "fiscal_amount_sets"
            referencedColumns: ["id", "fiscal_event_id", "event_kind"]
          },
          {
            foreignKeyName: "fiscal_amount_set_revisions_fiscal_event_id_reporting_scop_fkey"
            columns: [
              "fiscal_event_id",
              "reporting_scope_id",
              "fiscal_year",
              "account_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_events"
            referencedColumns: [
              "id",
              "reporting_scope_id",
              "fiscal_year",
              "account_identity_key",
            ]
          },
          {
            foreignKeyName: "fiscal_amount_set_revisions_membership_observation_id_scop_fkey"
            columns: [
              "membership_observation_id",
              "scope_membership_id",
              "reporting_scope_id",
              "fiscal_year",
              "account_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_reporting_scope_membership_observations"
            referencedColumns: [
              "id",
              "membership_id",
              "reporting_scope_id",
              "fiscal_year",
              "account_identity_key",
            ]
          },
        ]
      }
      fiscal_amount_set_source_occurrences: {
        Row: {
          amount_set_id: string
          created_at: string
          edition_id: string
          edition_source_occurrence_id: string
          id: string
          ingestion_source_id: string
          source_amount_set_key: string
        }
        Insert: {
          amount_set_id: string
          created_at?: string
          edition_id: string
          edition_source_occurrence_id: string
          id?: string
          ingestion_source_id: string
          source_amount_set_key: string
        }
        Update: {
          amount_set_id?: string
          created_at?: string
          edition_id?: string
          edition_source_occurrence_id?: string
          id?: string
          ingestion_source_id?: string
          source_amount_set_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_amount_set_source_occu_edition_source_occurrence_id_fkey"
            columns: [
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_edition_source_occurrences"
            referencedColumns: ["id", "edition_id", "ingestion_source_id"]
          },
          {
            foreignKeyName: "fiscal_amount_set_source_occurrences_amount_set_id_fkey"
            columns: ["amount_set_id"]
            isOneToOne: false
            referencedRelation: "fiscal_amount_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_amount_set_sources: {
        Row: {
          amount_set_id: string
          amount_set_revision_id: string
          amount_set_source_occurrence_id: string
          created_at: string
          edition_id: string
          edition_observation_id: string
          edition_source_occurrence_id: string
          evidence_revision: number
          evidence_role: Database["public"]["Enums"]["fiscal_evidence_role_enum"]
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          id: string
          ingestion_source_id: string
          parse_run_id: string | null
          parse_run_identity_key: string | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          source_locator: string | null
          source_version_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_set_id: string
          amount_set_revision_id: string
          amount_set_source_occurrence_id: string
          created_at?: string
          edition_id: string
          edition_observation_id: string
          edition_source_occurrence_id: string
          evidence_revision?: number
          evidence_role: Database["public"]["Enums"]["fiscal_evidence_role_enum"]
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          id?: string
          ingestion_source_id: string
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          source_locator?: string | null
          source_version_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_set_id?: string
          amount_set_revision_id?: string
          amount_set_source_occurrence_id?: string
          created_at?: string
          edition_id?: string
          edition_observation_id?: string
          edition_source_occurrence_id?: string
          evidence_revision?: number
          evidence_role?: Database["public"]["Enums"]["fiscal_evidence_role_enum"]
          extraction_method?: Database["public"]["Enums"]["extraction_method_enum"]
          id?: string
          ingestion_source_id?: string
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          source_locator?: string | null
          source_version_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_amount_set_sources_amount_set_revision_id_amount_se_fkey"
            columns: ["amount_set_revision_id", "amount_set_id"]
            isOneToOne: false
            referencedRelation: "fiscal_amount_set_revisions"
            referencedColumns: ["id", "amount_set_id"]
          },
          {
            foreignKeyName: "fiscal_amount_set_sources_amount_set_source_occurrence_id__fkey"
            columns: [
              "amount_set_source_occurrence_id",
              "amount_set_id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_amount_set_source_occurrences"
            referencedColumns: [
              "id",
              "amount_set_id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
          },
          {
            foreignKeyName: "fiscal_amount_set_sources_edition_observation_id_edition_s_fkey"
            columns: [
              "edition_observation_id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
              "source_version_id",
              "parse_run_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_edition_observations"
            referencedColumns: [
              "id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
              "source_version_id",
              "parse_run_identity_key",
            ]
          },
          {
            foreignKeyName: "fiscal_amount_set_sources_parse_run_id_source_version_id_fkey"
            columns: ["parse_run_id", "source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id", "source_version_id"]
          },
        ]
      }
      fiscal_amount_sets: {
        Row: {
          amount_set_key: string
          created_at: string
          decision_stage: Database["public"]["Enums"]["fiscal_decision_stage_enum"]
          event_kind: Database["public"]["Enums"]["fiscal_event_kind_enum"]
          fiscal_event_id: string
          id: string
        }
        Insert: {
          amount_set_key?: string
          created_at?: string
          decision_stage: Database["public"]["Enums"]["fiscal_decision_stage_enum"]
          event_kind: Database["public"]["Enums"]["fiscal_event_kind_enum"]
          fiscal_event_id: string
          id?: string
        }
        Update: {
          amount_set_key?: string
          created_at?: string
          decision_stage?: Database["public"]["Enums"]["fiscal_decision_stage_enum"]
          event_kind?: Database["public"]["Enums"]["fiscal_event_kind_enum"]
          fiscal_event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_amount_sets_fiscal_event_id_event_kind_fkey"
            columns: ["fiscal_event_id", "event_kind"]
            isOneToOne: false
            referencedRelation: "fiscal_events"
            referencedColumns: ["id", "event_kind"]
          },
        ]
      }
      fiscal_amount_source_occurrences: {
        Row: {
          amount_id: string
          amount_set_id: string
          amount_set_source_occurrence_id: string
          created_at: string
          id: string
          ingestion_source_id: string
          source_amount_key: string
        }
        Insert: {
          amount_id: string
          amount_set_id: string
          amount_set_source_occurrence_id: string
          created_at?: string
          id?: string
          ingestion_source_id: string
          source_amount_key: string
        }
        Update: {
          amount_id?: string
          amount_set_id?: string
          amount_set_source_occurrence_id?: string
          created_at?: string
          id?: string
          ingestion_source_id?: string
          source_amount_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_amount_source_occurren_amount_set_source_occurrence_fkey"
            columns: [
              "amount_set_source_occurrence_id",
              "amount_set_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_amount_set_source_occurrences"
            referencedColumns: ["id", "amount_set_id", "ingestion_source_id"]
          },
          {
            foreignKeyName: "fiscal_amount_source_occurrences_amount_id_amount_set_id_fkey"
            columns: ["amount_id", "amount_set_id"]
            isOneToOne: false
            referencedRelation: "fiscal_amounts"
            referencedColumns: ["id", "amount_set_id"]
          },
        ]
      }
      fiscal_amounts: {
        Row: {
          amount_set_id: string
          classification_id: string | null
          created_at: string
          created_for_amount_set_revision_id: string
          id: string
          measure: Database["public"]["Enums"]["fiscal_measure_enum"]
        }
        Insert: {
          amount_set_id: string
          classification_id?: string | null
          created_at?: string
          created_for_amount_set_revision_id: string
          id?: string
          measure: Database["public"]["Enums"]["fiscal_measure_enum"]
        }
        Update: {
          amount_set_id?: string
          classification_id?: string | null
          created_at?: string
          created_for_amount_set_revision_id?: string
          id?: string
          measure?: Database["public"]["Enums"]["fiscal_measure_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_amounts_amount_set_id_fkey"
            columns: ["amount_set_id"]
            isOneToOne: false
            referencedRelation: "fiscal_amount_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_amounts_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "fiscal_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_amounts_created_for_amount_set_revision_id_amount_s_fkey"
            columns: ["created_for_amount_set_revision_id", "amount_set_id"]
            isOneToOne: false
            referencedRelation: "fiscal_amount_set_revisions"
            referencedColumns: ["id", "amount_set_id"]
          },
        ]
      }
      fiscal_classification_mapping_members: {
        Row: {
          classification_id: string
          created_at: string
          direction: Database["public"]["Enums"]["fiscal_classification_direction_enum"]
          mapping_id: string
          mapping_revision_id: string
          member_order: number
          scheme: string
        }
        Insert: {
          classification_id: string
          created_at?: string
          direction: Database["public"]["Enums"]["fiscal_classification_direction_enum"]
          mapping_id: string
          mapping_revision_id: string
          member_order: number
          scheme: string
        }
        Update: {
          classification_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["fiscal_classification_direction_enum"]
          mapping_id?: string
          mapping_revision_id?: string
          member_order?: number
          scheme?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_classification_mapping_mapping_revision_id_mapping__fkey"
            columns: ["mapping_revision_id", "mapping_id", "scheme"]
            isOneToOne: false
            referencedRelation: "fiscal_classification_mapping_revisions"
            referencedColumns: ["id", "mapping_id", "scheme"]
          },
          {
            foreignKeyName: "fiscal_classification_mapping_mem_classification_id_scheme_fkey"
            columns: ["classification_id", "scheme"]
            isOneToOne: false
            referencedRelation: "fiscal_classifications"
            referencedColumns: ["id", "scheme"]
          },
        ]
      }
      fiscal_classification_mapping_revisions: {
        Row: {
          created_at: string
          effective_fiscal_year: number
          id: string
          mapping_id: string
          note: string | null
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          relation_kind: Database["public"]["Enums"]["fiscal_classification_relation_kind_enum"]
          reviewed_at: string | null
          reviewed_by: string | null
          revision_number: number
          scheme: string
        }
        Insert: {
          created_at?: string
          effective_fiscal_year: number
          id?: string
          mapping_id: string
          note?: string | null
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          relation_kind: Database["public"]["Enums"]["fiscal_classification_relation_kind_enum"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number: number
          scheme: string
        }
        Update: {
          created_at?: string
          effective_fiscal_year?: number
          id?: string
          mapping_id?: string
          note?: string | null
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          relation_kind?: Database["public"]["Enums"]["fiscal_classification_relation_kind_enum"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number?: number
          scheme?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_classification_mapping_revisions_mapping_id_scheme_fkey"
            columns: ["mapping_id", "scheme"]
            isOneToOne: false
            referencedRelation: "fiscal_classification_mappings"
            referencedColumns: ["id", "scheme"]
          },
        ]
      }
      fiscal_classification_mapping_source_occurrences: {
        Row: {
          created_at: string
          edition_id: string
          edition_source_occurrence_id: string
          id: string
          ingestion_source_id: string
          mapping_id: string
          scheme: string
          source_mapping_key: string
        }
        Insert: {
          created_at?: string
          edition_id: string
          edition_source_occurrence_id: string
          id?: string
          ingestion_source_id: string
          mapping_id: string
          scheme: string
          source_mapping_key: string
        }
        Update: {
          created_at?: string
          edition_id?: string
          edition_source_occurrence_id?: string
          id?: string
          ingestion_source_id?: string
          mapping_id?: string
          scheme?: string
          source_mapping_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_classification_mapping_edition_source_occurrence_id_fkey"
            columns: [
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_edition_source_occurrences"
            referencedColumns: ["id", "edition_id", "ingestion_source_id"]
          },
          {
            foreignKeyName: "fiscal_classification_mapping_source_occ_mapping_id_scheme_fkey"
            columns: ["mapping_id", "scheme"]
            isOneToOne: false
            referencedRelation: "fiscal_classification_mappings"
            referencedColumns: ["id", "scheme"]
          },
        ]
      }
      fiscal_classification_mapping_sources: {
        Row: {
          created_at: string
          edition_id: string
          edition_observation_id: string
          edition_source_occurrence_id: string
          evidence_revision: number
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          id: string
          ingestion_source_id: string
          mapping_id: string
          mapping_revision_id: string
          mapping_source_occurrence_id: string
          observed_mapping_text: string
          parse_run_id: string | null
          parse_run_identity_key: string | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          scheme: string
          source_locator: string | null
          source_version_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          edition_id: string
          edition_observation_id: string
          edition_source_occurrence_id: string
          evidence_revision?: number
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          id?: string
          ingestion_source_id: string
          mapping_id: string
          mapping_revision_id: string
          mapping_source_occurrence_id: string
          observed_mapping_text: string
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          scheme: string
          source_locator?: string | null
          source_version_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          edition_id?: string
          edition_observation_id?: string
          edition_source_occurrence_id?: string
          evidence_revision?: number
          extraction_method?: Database["public"]["Enums"]["extraction_method_enum"]
          id?: string
          ingestion_source_id?: string
          mapping_id?: string
          mapping_revision_id?: string
          mapping_source_occurrence_id?: string
          observed_mapping_text?: string
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          scheme?: string
          source_locator?: string | null
          source_version_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_classification_mappin_mapping_revision_id_mapping__fkey1"
            columns: ["mapping_revision_id", "mapping_id", "scheme"]
            isOneToOne: false
            referencedRelation: "fiscal_classification_mapping_revisions"
            referencedColumns: ["id", "mapping_id", "scheme"]
          },
          {
            foreignKeyName: "fiscal_classification_mapping_edition_observation_id_editi_fkey"
            columns: [
              "edition_observation_id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
              "source_version_id",
              "parse_run_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_edition_observations"
            referencedColumns: [
              "id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
              "source_version_id",
              "parse_run_identity_key",
            ]
          },
          {
            foreignKeyName: "fiscal_classification_mapping_mapping_source_occurrence_id_fkey"
            columns: [
              "mapping_source_occurrence_id",
              "mapping_id",
              "scheme",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_classification_mapping_source_occurrences"
            referencedColumns: [
              "id",
              "mapping_id",
              "scheme",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
          },
          {
            foreignKeyName: "fiscal_classification_mapping_parse_run_id_source_version__fkey"
            columns: ["parse_run_id", "source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id", "source_version_id"]
          },
        ]
      }
      fiscal_classification_mappings: {
        Row: {
          created_at: string
          id: string
          mapping_key: string
          scheme: string
        }
        Insert: {
          created_at?: string
          id?: string
          mapping_key: string
          scheme: string
        }
        Update: {
          created_at?: string
          id?: string
          mapping_key?: string
          scheme?: string
        }
        Relationships: []
      }
      fiscal_classification_revisions: {
        Row: {
          classification_id: string
          created_at: string
          display_label: string
          id: string
          parent_classification_id: string | null
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          reviewed_at: string | null
          reviewed_by: string | null
          revision_number: number
          scheme: string
          valid_from_fiscal_year: number
          valid_to_fiscal_year: number | null
        }
        Insert: {
          classification_id: string
          created_at?: string
          display_label: string
          id?: string
          parent_classification_id?: string | null
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number: number
          scheme: string
          valid_from_fiscal_year: number
          valid_to_fiscal_year?: number | null
        }
        Update: {
          classification_id?: string
          created_at?: string
          display_label?: string
          id?: string
          parent_classification_id?: string | null
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number?: number
          scheme?: string
          valid_from_fiscal_year?: number
          valid_to_fiscal_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_classification_revisio_parent_classification_id_sch_fkey"
            columns: ["parent_classification_id", "scheme"]
            isOneToOne: false
            referencedRelation: "fiscal_classifications"
            referencedColumns: ["id", "scheme"]
          },
          {
            foreignKeyName: "fiscal_classification_revisions_classification_id_scheme_fkey"
            columns: ["classification_id", "scheme"]
            isOneToOne: false
            referencedRelation: "fiscal_classifications"
            referencedColumns: ["id", "scheme"]
          },
        ]
      }
      fiscal_classification_source_occurrences: {
        Row: {
          classification_id: string
          created_at: string
          edition_id: string
          edition_source_occurrence_id: string
          id: string
          ingestion_source_id: string
          scheme: string
          source_classification_key: string
        }
        Insert: {
          classification_id: string
          created_at?: string
          edition_id: string
          edition_source_occurrence_id: string
          id?: string
          ingestion_source_id: string
          scheme: string
          source_classification_key: string
        }
        Update: {
          classification_id?: string
          created_at?: string
          edition_id?: string
          edition_source_occurrence_id?: string
          id?: string
          ingestion_source_id?: string
          scheme?: string
          source_classification_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_classification_source__edition_source_occurrence_id_fkey"
            columns: [
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_edition_source_occurrences"
            referencedColumns: ["id", "edition_id", "ingestion_source_id"]
          },
          {
            foreignKeyName: "fiscal_classification_source_occu_classification_id_scheme_fkey"
            columns: ["classification_id", "scheme"]
            isOneToOne: false
            referencedRelation: "fiscal_classifications"
            referencedColumns: ["id", "scheme"]
          },
        ]
      }
      fiscal_classification_sources: {
        Row: {
          classification_id: string
          classification_revision_id: string
          classification_source_occurrence_id: string
          created_at: string
          edition_id: string
          edition_observation_id: string
          edition_source_occurrence_id: string
          evidence_revision: number
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          id: string
          ingestion_source_id: string
          observed_fiscal_year: number
          parse_run_id: string | null
          parse_run_identity_key: string | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          scheme: string
          source_code: string | null
          source_department_name: string | null
          source_label: string
          source_locator: string | null
          source_version_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          classification_id: string
          classification_revision_id: string
          classification_source_occurrence_id: string
          created_at?: string
          edition_id: string
          edition_observation_id: string
          edition_source_occurrence_id: string
          evidence_revision?: number
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          id?: string
          ingestion_source_id: string
          observed_fiscal_year: number
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          scheme: string
          source_code?: string | null
          source_department_name?: string | null
          source_label: string
          source_locator?: string | null
          source_version_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          classification_id?: string
          classification_revision_id?: string
          classification_source_occurrence_id?: string
          created_at?: string
          edition_id?: string
          edition_observation_id?: string
          edition_source_occurrence_id?: string
          evidence_revision?: number
          extraction_method?: Database["public"]["Enums"]["extraction_method_enum"]
          id?: string
          ingestion_source_id?: string
          observed_fiscal_year?: number
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          scheme?: string
          source_code?: string | null
          source_department_name?: string | null
          source_label?: string
          source_locator?: string | null
          source_version_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_classification_sources_classification_revision_id_c_fkey"
            columns: [
              "classification_revision_id",
              "classification_id",
              "scheme",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_classification_revisions"
            referencedColumns: ["id", "classification_id", "scheme"]
          },
          {
            foreignKeyName: "fiscal_classification_sources_classification_source_occurr_fkey"
            columns: [
              "classification_source_occurrence_id",
              "classification_id",
              "scheme",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_classification_source_occurrences"
            referencedColumns: [
              "id",
              "classification_id",
              "scheme",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
          },
          {
            foreignKeyName: "fiscal_classification_sources_edition_observation_id_editi_fkey"
            columns: [
              "edition_observation_id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
              "source_version_id",
              "parse_run_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_edition_observations"
            referencedColumns: [
              "id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
              "source_version_id",
              "parse_run_identity_key",
            ]
          },
          {
            foreignKeyName: "fiscal_classification_sources_parse_run_id_source_version__fkey"
            columns: ["parse_run_id", "source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id", "source_version_id"]
          },
        ]
      }
      fiscal_classifications: {
        Row: {
          canonical_key: string
          created_at: string
          id: string
          scheme: string
        }
        Insert: {
          canonical_key: string
          created_at?: string
          id?: string
          scheme: string
        }
        Update: {
          canonical_key?: string
          created_at?: string
          id?: string
          scheme?: string
        }
        Relationships: []
      }
      fiscal_data_coverage: {
        Row: {
          account_id: string | null
          account_identity_key: string | null
          as_of_date: string | null
          as_of_identity_key: string | null
          created_at: string
          data_kind: Database["public"]["Enums"]["fiscal_data_kind_enum"]
          fiscal_year: number
          id: string
          reporting_scope_id: string
          source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
        }
        Insert: {
          account_id?: string | null
          account_identity_key?: string | null
          as_of_date?: string | null
          as_of_identity_key?: string | null
          created_at?: string
          data_kind: Database["public"]["Enums"]["fiscal_data_kind_enum"]
          fiscal_year: number
          id?: string
          reporting_scope_id: string
          source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
        }
        Update: {
          account_id?: string | null
          account_identity_key?: string | null
          as_of_date?: string | null
          as_of_identity_key?: string | null
          created_at?: string
          data_kind?: Database["public"]["Enums"]["fiscal_data_kind_enum"]
          fiscal_year?: number
          id?: string
          reporting_scope_id?: string
          source_kind?: Database["public"]["Enums"]["fiscal_source_kind_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_data_coverage_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fiscal_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_data_coverage_reporting_scope_id_fkey"
            columns: ["reporting_scope_id"]
            isOneToOne: false
            referencedRelation: "fiscal_reporting_scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_data_coverage_observation_sources: {
        Row: {
          account_id: string | null
          account_identity_key: string | null
          as_of_date: string | null
          as_of_identity_key: string | null
          coverage_id: string
          coverage_source_occurrence_id: string
          created_at: string
          data_kind: Database["public"]["Enums"]["fiscal_data_kind_enum"]
          edition_id: string
          edition_observation_id: string
          edition_source_occurrence_id: string
          evidence_revision: number
          evidence_role: Database["public"]["Enums"]["fiscal_evidence_role_enum"]
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          fiscal_year: number
          id: string
          ingestion_source_id: string
          observation_id: string
          observed_presence: Database["public"]["Enums"]["record_presence_enum"]
          parse_run_id: string | null
          parse_run_identity_key: string | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          reporting_scope_id: string
          source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
          source_locator: string | null
          source_version_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_id?: string | null
          account_identity_key?: string | null
          as_of_date?: string | null
          as_of_identity_key?: string | null
          coverage_id: string
          coverage_source_occurrence_id: string
          created_at?: string
          data_kind: Database["public"]["Enums"]["fiscal_data_kind_enum"]
          edition_id: string
          edition_observation_id: string
          edition_source_occurrence_id: string
          evidence_revision?: number
          evidence_role: Database["public"]["Enums"]["fiscal_evidence_role_enum"]
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          fiscal_year: number
          id?: string
          ingestion_source_id: string
          observation_id: string
          observed_presence: Database["public"]["Enums"]["record_presence_enum"]
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reporting_scope_id: string
          source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
          source_locator?: string | null
          source_version_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_id?: string | null
          account_identity_key?: string | null
          as_of_date?: string | null
          as_of_identity_key?: string | null
          coverage_id?: string
          coverage_source_occurrence_id?: string
          created_at?: string
          data_kind?: Database["public"]["Enums"]["fiscal_data_kind_enum"]
          edition_id?: string
          edition_observation_id?: string
          edition_source_occurrence_id?: string
          evidence_revision?: number
          evidence_role?: Database["public"]["Enums"]["fiscal_evidence_role_enum"]
          extraction_method?: Database["public"]["Enums"]["extraction_method_enum"]
          fiscal_year?: number
          id?: string
          ingestion_source_id?: string
          observation_id?: string
          observed_presence?: Database["public"]["Enums"]["record_presence_enum"]
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reporting_scope_id?: string
          source_kind?: Database["public"]["Enums"]["fiscal_source_kind_enum"]
          source_locator?: string | null
          source_version_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_data_coverage_observat_coverage_source_occurrence_i_fkey"
            columns: [
              "coverage_source_occurrence_id",
              "coverage_id",
              "fiscal_year",
              "reporting_scope_id",
              "account_identity_key",
              "source_kind",
              "data_kind",
              "as_of_identity_key",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_data_coverage_source_occurrences"
            referencedColumns: [
              "id",
              "coverage_id",
              "fiscal_year",
              "reporting_scope_id",
              "account_identity_key",
              "source_kind",
              "data_kind",
              "as_of_identity_key",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
          },
          {
            foreignKeyName: "fiscal_data_coverage_observat_edition_observation_id_editi_fkey"
            columns: [
              "edition_observation_id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
              "source_version_id",
              "parse_run_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_edition_observations"
            referencedColumns: [
              "id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
              "source_version_id",
              "parse_run_identity_key",
            ]
          },
          {
            foreignKeyName: "fiscal_data_coverage_observat_observation_id_coverage_id_f_fkey"
            columns: [
              "observation_id",
              "coverage_id",
              "fiscal_year",
              "reporting_scope_id",
              "account_identity_key",
              "source_kind",
              "data_kind",
              "as_of_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_data_coverage_observations"
            referencedColumns: [
              "id",
              "coverage_id",
              "fiscal_year",
              "reporting_scope_id",
              "account_identity_key",
              "source_kind",
              "data_kind",
              "as_of_identity_key",
            ]
          },
          {
            foreignKeyName: "fiscal_data_coverage_observat_parse_run_id_source_version__fkey"
            columns: ["parse_run_id", "source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id", "source_version_id"]
          },
          {
            foreignKeyName: "fiscal_data_coverage_observation_sources_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fiscal_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_data_coverage_observations: {
        Row: {
          account_id: string | null
          account_identity_key: string | null
          as_of_date: string | null
          as_of_identity_key: string | null
          coverage_id: string
          created_at: string
          data_kind: Database["public"]["Enums"]["fiscal_data_kind_enum"]
          details: Json | null
          expected_count: number | null
          fiscal_year: number
          id: string
          matched_count: number | null
          observation_key: string
          observed_at: string
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          reason_code: string | null
          record_presence: Database["public"]["Enums"]["record_presence_enum"]
          reporting_scope_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
          state: Database["public"]["Enums"]["coverage_state_enum"]
        }
        Insert: {
          account_id?: string | null
          account_identity_key?: string | null
          as_of_date?: string | null
          as_of_identity_key?: string | null
          coverage_id: string
          created_at?: string
          data_kind: Database["public"]["Enums"]["fiscal_data_kind_enum"]
          details?: Json | null
          expected_count?: number | null
          fiscal_year: number
          id?: string
          matched_count?: number | null
          observation_key: string
          observed_at?: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reason_code?: string | null
          record_presence: Database["public"]["Enums"]["record_presence_enum"]
          reporting_scope_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
          state: Database["public"]["Enums"]["coverage_state_enum"]
        }
        Update: {
          account_id?: string | null
          account_identity_key?: string | null
          as_of_date?: string | null
          as_of_identity_key?: string | null
          coverage_id?: string
          created_at?: string
          data_kind?: Database["public"]["Enums"]["fiscal_data_kind_enum"]
          details?: Json | null
          expected_count?: number | null
          fiscal_year?: number
          id?: string
          matched_count?: number | null
          observation_key?: string
          observed_at?: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reason_code?: string | null
          record_presence?: Database["public"]["Enums"]["record_presence_enum"]
          reporting_scope_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_kind?: Database["public"]["Enums"]["fiscal_source_kind_enum"]
          state?: Database["public"]["Enums"]["coverage_state_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_data_coverage_observat_coverage_id_fiscal_year_repo_fkey"
            columns: [
              "coverage_id",
              "fiscal_year",
              "reporting_scope_id",
              "account_identity_key",
              "source_kind",
              "data_kind",
              "as_of_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_data_coverage"
            referencedColumns: [
              "id",
              "fiscal_year",
              "reporting_scope_id",
              "account_identity_key",
              "source_kind",
              "data_kind",
              "as_of_identity_key",
            ]
          },
          {
            foreignKeyName: "fiscal_data_coverage_observations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fiscal_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_data_coverage_source_occurrences: {
        Row: {
          account_id: string | null
          account_identity_key: string | null
          as_of_date: string | null
          as_of_identity_key: string | null
          coverage_id: string
          created_at: string
          data_kind: Database["public"]["Enums"]["fiscal_data_kind_enum"]
          edition_id: string
          edition_source_occurrence_id: string
          fiscal_year: number
          id: string
          ingestion_source_id: string
          reporting_scope_id: string
          source_coverage_key: string
          source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
        }
        Insert: {
          account_id?: string | null
          account_identity_key?: string | null
          as_of_date?: string | null
          as_of_identity_key?: string | null
          coverage_id: string
          created_at?: string
          data_kind: Database["public"]["Enums"]["fiscal_data_kind_enum"]
          edition_id: string
          edition_source_occurrence_id: string
          fiscal_year: number
          id?: string
          ingestion_source_id: string
          reporting_scope_id: string
          source_coverage_key: string
          source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
        }
        Update: {
          account_id?: string | null
          account_identity_key?: string | null
          as_of_date?: string | null
          as_of_identity_key?: string | null
          coverage_id?: string
          created_at?: string
          data_kind?: Database["public"]["Enums"]["fiscal_data_kind_enum"]
          edition_id?: string
          edition_source_occurrence_id?: string
          fiscal_year?: number
          id?: string
          ingestion_source_id?: string
          reporting_scope_id?: string
          source_coverage_key?: string
          source_kind?: Database["public"]["Enums"]["fiscal_source_kind_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_data_coverage_source_o_coverage_id_fiscal_year_repo_fkey"
            columns: [
              "coverage_id",
              "fiscal_year",
              "reporting_scope_id",
              "account_identity_key",
              "source_kind",
              "data_kind",
              "as_of_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_data_coverage"
            referencedColumns: [
              "id",
              "fiscal_year",
              "reporting_scope_id",
              "account_identity_key",
              "source_kind",
              "data_kind",
              "as_of_identity_key",
            ]
          },
          {
            foreignKeyName: "fiscal_data_coverage_source_o_edition_source_occurrence_id_fkey"
            columns: [
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_edition_source_occurrences"
            referencedColumns: ["id", "edition_id", "ingestion_source_id"]
          },
          {
            foreignKeyName: "fiscal_data_coverage_source_occurrences_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fiscal_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_event_bill_link_revisions: {
        Row: {
          bill_id: string
          confidence: number | null
          created_at: string
          evidence_summary: string
          fiscal_event_id: string
          id: string
          link_id: string
          match_method: Database["public"]["Enums"]["fiscal_bill_match_method_enum"]
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          relationship: Database["public"]["Enums"]["fiscal_bill_relationship_enum"]
          revision_number: number
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          bill_id: string
          confidence?: number | null
          created_at?: string
          evidence_summary: string
          fiscal_event_id: string
          id?: string
          link_id: string
          match_method: Database["public"]["Enums"]["fiscal_bill_match_method_enum"]
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          relationship: Database["public"]["Enums"]["fiscal_bill_relationship_enum"]
          revision_number: number
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          bill_id?: string
          confidence?: number | null
          created_at?: string
          evidence_summary?: string
          fiscal_event_id?: string
          id?: string
          link_id?: string
          match_method?: Database["public"]["Enums"]["fiscal_bill_match_method_enum"]
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          relationship?: Database["public"]["Enums"]["fiscal_bill_relationship_enum"]
          revision_number?: number
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_event_bill_link_revisions_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_event_bill_link_revisions_link_id_fiscal_event_id_fkey"
            columns: ["link_id", "fiscal_event_id"]
            isOneToOne: false
            referencedRelation: "fiscal_event_bill_links"
            referencedColumns: ["id", "fiscal_event_id"]
          },
        ]
      }
      fiscal_event_bill_link_source_occurrences: {
        Row: {
          created_at: string
          edition_id: string
          edition_source_occurrence_id: string
          fiscal_event_id: string
          id: string
          ingestion_source_id: string
          link_id: string
          source_relation_key: string
        }
        Insert: {
          created_at?: string
          edition_id: string
          edition_source_occurrence_id: string
          fiscal_event_id: string
          id?: string
          ingestion_source_id: string
          link_id: string
          source_relation_key: string
        }
        Update: {
          created_at?: string
          edition_id?: string
          edition_source_occurrence_id?: string
          fiscal_event_id?: string
          id?: string
          ingestion_source_id?: string
          link_id?: string
          source_relation_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_event_bill_link_source_edition_source_occurrence_id_fkey"
            columns: [
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_edition_source_occurrences"
            referencedColumns: ["id", "edition_id", "ingestion_source_id"]
          },
          {
            foreignKeyName: "fiscal_event_bill_link_source_occu_link_id_fiscal_event_id_fkey"
            columns: ["link_id", "fiscal_event_id"]
            isOneToOne: false
            referencedRelation: "fiscal_event_bill_links"
            referencedColumns: ["id", "fiscal_event_id"]
          },
        ]
      }
      fiscal_event_bill_link_sources: {
        Row: {
          created_at: string
          edition_id: string
          edition_observation_id: string
          edition_source_occurrence_id: string
          evidence_revision: number
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          fiscal_event_id: string
          id: string
          ingestion_source_id: string
          link_id: string
          link_revision_id: string
          link_source_occurrence_id: string
          parse_run_id: string | null
          parse_run_identity_key: string | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          raw_bill_number: string
          raw_relationship: string
          source_locator: string | null
          source_version_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          edition_id: string
          edition_observation_id: string
          edition_source_occurrence_id: string
          evidence_revision?: number
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          fiscal_event_id: string
          id?: string
          ingestion_source_id: string
          link_id: string
          link_revision_id: string
          link_source_occurrence_id: string
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          raw_bill_number: string
          raw_relationship: string
          source_locator?: string | null
          source_version_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          edition_id?: string
          edition_observation_id?: string
          edition_source_occurrence_id?: string
          evidence_revision?: number
          extraction_method?: Database["public"]["Enums"]["extraction_method_enum"]
          fiscal_event_id?: string
          id?: string
          ingestion_source_id?: string
          link_id?: string
          link_revision_id?: string
          link_source_occurrence_id?: string
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          raw_bill_number?: string
          raw_relationship?: string
          source_locator?: string | null
          source_version_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_event_bill_link_source_edition_observation_id_editi_fkey"
            columns: [
              "edition_observation_id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
              "source_version_id",
              "parse_run_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_edition_observations"
            referencedColumns: [
              "id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
              "source_version_id",
              "parse_run_identity_key",
            ]
          },
          {
            foreignKeyName: "fiscal_event_bill_link_source_link_revision_id_link_id_fis_fkey"
            columns: ["link_revision_id", "link_id", "fiscal_event_id"]
            isOneToOne: false
            referencedRelation: "fiscal_event_bill_link_revisions"
            referencedColumns: ["id", "link_id", "fiscal_event_id"]
          },
          {
            foreignKeyName: "fiscal_event_bill_link_source_link_source_occurrence_id_li_fkey"
            columns: [
              "link_source_occurrence_id",
              "link_id",
              "fiscal_event_id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_event_bill_link_source_occurrences"
            referencedColumns: [
              "id",
              "link_id",
              "fiscal_event_id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
          },
          {
            foreignKeyName: "fiscal_event_bill_link_source_parse_run_id_source_version__fkey"
            columns: ["parse_run_id", "source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id", "source_version_id"]
          },
        ]
      }
      fiscal_event_bill_links: {
        Row: {
          created_at: string
          fiscal_event_id: string
          id: string
          link_key: string
        }
        Insert: {
          created_at?: string
          fiscal_event_id: string
          id?: string
          link_key: string
        }
        Update: {
          created_at?: string
          fiscal_event_id?: string
          id?: string
          link_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_event_bill_links_fiscal_event_id_fkey"
            columns: ["fiscal_event_id"]
            isOneToOne: false
            referencedRelation: "fiscal_events"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_events: {
        Row: {
          account_id: string | null
          account_identity_key: string | null
          as_of_date: string | null
          created_at: string
          event_kind: Database["public"]["Enums"]["fiscal_event_kind_enum"]
          fiscal_year: number
          id: string
          reporting_scope_id: string
          scope_membership_id: string | null
          supplement_sequence: number | null
        }
        Insert: {
          account_id?: string | null
          account_identity_key?: string | null
          as_of_date?: string | null
          created_at?: string
          event_kind: Database["public"]["Enums"]["fiscal_event_kind_enum"]
          fiscal_year: number
          id?: string
          reporting_scope_id: string
          scope_membership_id?: string | null
          supplement_sequence?: number | null
        }
        Update: {
          account_id?: string | null
          account_identity_key?: string | null
          as_of_date?: string | null
          created_at?: string
          event_kind?: Database["public"]["Enums"]["fiscal_event_kind_enum"]
          fiscal_year?: number
          id?: string
          reporting_scope_id?: string
          scope_membership_id?: string | null
          supplement_sequence?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fiscal_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_events_reporting_scope_id_fkey"
            columns: ["reporting_scope_id"]
            isOneToOne: false
            referencedRelation: "fiscal_reporting_scopes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_events_scope_membership_id_reporting_scope_id_fisca_fkey"
            columns: [
              "scope_membership_id",
              "reporting_scope_id",
              "fiscal_year",
              "account_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_reporting_scope_memberships"
            referencedColumns: [
              "id",
              "reporting_scope_id",
              "fiscal_year",
              "account_identity_key",
            ]
          },
        ]
      }
      fiscal_import_batches: {
        Row: {
          created_at: string
          discovered_count: number
          finished_at: string | null
          fiscal_year: number | null
          hard_error_count: number
          id: string
          parse_run_id: string
          profile_key: string
          profile_version: string
          source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
          source_version_id: string
          staged_count: number
          status: Database["public"]["Enums"]["fiscal_import_status_enum"]
          validation_summary: Json
          warning_count: number
        }
        Insert: {
          created_at?: string
          discovered_count?: number
          finished_at?: string | null
          fiscal_year?: number | null
          hard_error_count?: number
          id?: string
          parse_run_id: string
          profile_key: string
          profile_version: string
          source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
          source_version_id: string
          staged_count?: number
          status?: Database["public"]["Enums"]["fiscal_import_status_enum"]
          validation_summary?: Json
          warning_count?: number
        }
        Update: {
          created_at?: string
          discovered_count?: number
          finished_at?: string | null
          fiscal_year?: number | null
          hard_error_count?: number
          id?: string
          parse_run_id?: string
          profile_key?: string
          profile_version?: string
          source_kind?: Database["public"]["Enums"]["fiscal_source_kind_enum"]
          source_version_id?: string
          staged_count?: number
          status?: Database["public"]["Enums"]["fiscal_import_status_enum"]
          validation_summary?: Json
          warning_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_import_batches_parse_run_id_fkey"
            columns: ["parse_run_id"]
            isOneToOne: true
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_import_batches_parse_run_id_source_version_id_fkey"
            columns: ["parse_run_id", "source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id", "source_version_id"]
          },
          {
            foreignKeyName: "fiscal_import_batches_source_version_id_fkey"
            columns: ["source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_reporting_scope_membership_observations: {
        Row: {
          account_id: string | null
          account_identity_key: string | null
          created_at: string
          display_name: string
          edition_id: string
          edition_observation_id: string
          edition_source_occurrence_id: string
          evidence_revision: number
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          fiscal_year: number
          id: string
          ingestion_source_id: string
          membership_id: string
          membership_role: Database["public"]["Enums"]["fiscal_membership_role_enum"]
          membership_source_occurrence_id: string
          parse_run_id: string | null
          parse_run_identity_key: string | null
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          reporting_scope_id: string
          source_locator: string | null
          source_member_name: string
          source_version_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          account_id?: string | null
          account_identity_key?: string | null
          created_at?: string
          display_name: string
          edition_id: string
          edition_observation_id: string
          edition_source_occurrence_id: string
          evidence_revision?: number
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          fiscal_year: number
          id?: string
          ingestion_source_id: string
          membership_id: string
          membership_role: Database["public"]["Enums"]["fiscal_membership_role_enum"]
          membership_source_occurrence_id: string
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reporting_scope_id: string
          source_locator?: string | null
          source_member_name: string
          source_version_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          account_id?: string | null
          account_identity_key?: string | null
          created_at?: string
          display_name?: string
          edition_id?: string
          edition_observation_id?: string
          edition_source_occurrence_id?: string
          evidence_revision?: number
          extraction_method?: Database["public"]["Enums"]["extraction_method_enum"]
          fiscal_year?: number
          id?: string
          ingestion_source_id?: string
          membership_id?: string
          membership_role?: Database["public"]["Enums"]["fiscal_membership_role_enum"]
          membership_source_occurrence_id?: string
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reporting_scope_id?: string
          source_locator?: string | null
          source_member_name?: string
          source_version_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_reporting_scope_membe_membership_id_reporting_scop_fkey1"
            columns: [
              "membership_id",
              "reporting_scope_id",
              "fiscal_year",
              "account_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_reporting_scope_memberships"
            referencedColumns: [
              "id",
              "reporting_scope_id",
              "fiscal_year",
              "account_identity_key",
            ]
          },
          {
            foreignKeyName: "fiscal_reporting_scope_member_edition_observation_id_editi_fkey"
            columns: [
              "edition_observation_id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
              "source_version_id",
              "parse_run_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_edition_observations"
            referencedColumns: [
              "id",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
              "source_version_id",
              "parse_run_identity_key",
            ]
          },
          {
            foreignKeyName: "fiscal_reporting_scope_member_membership_source_occurrence_fkey"
            columns: [
              "membership_source_occurrence_id",
              "membership_id",
              "reporting_scope_id",
              "fiscal_year",
              "account_identity_key",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_reporting_scope_membership_source_occurrences"
            referencedColumns: [
              "id",
              "membership_id",
              "reporting_scope_id",
              "fiscal_year",
              "account_identity_key",
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
          },
          {
            foreignKeyName: "fiscal_reporting_scope_member_parse_run_id_source_version__fkey"
            columns: ["parse_run_id", "source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id", "source_version_id"]
          },
          {
            foreignKeyName: "fiscal_reporting_scope_membership_observations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fiscal_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_reporting_scope_membership_source_occurrences: {
        Row: {
          account_id: string | null
          account_identity_key: string | null
          created_at: string
          edition_id: string
          edition_source_occurrence_id: string
          fiscal_year: number
          id: string
          ingestion_source_id: string
          membership_id: string
          reporting_scope_id: string
          source_membership_key: string
        }
        Insert: {
          account_id?: string | null
          account_identity_key?: string | null
          created_at?: string
          edition_id: string
          edition_source_occurrence_id: string
          fiscal_year: number
          id?: string
          ingestion_source_id: string
          membership_id: string
          reporting_scope_id: string
          source_membership_key: string
        }
        Update: {
          account_id?: string | null
          account_identity_key?: string | null
          created_at?: string
          edition_id?: string
          edition_source_occurrence_id?: string
          fiscal_year?: number
          id?: string
          ingestion_source_id?: string
          membership_id?: string
          reporting_scope_id?: string
          source_membership_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_reporting_scope_member_edition_source_occurrence_id_fkey"
            columns: [
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_edition_source_occurrences"
            referencedColumns: ["id", "edition_id", "ingestion_source_id"]
          },
          {
            foreignKeyName: "fiscal_reporting_scope_member_membership_id_reporting_scop_fkey"
            columns: [
              "membership_id",
              "reporting_scope_id",
              "fiscal_year",
              "account_identity_key",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_reporting_scope_memberships"
            referencedColumns: [
              "id",
              "reporting_scope_id",
              "fiscal_year",
              "account_identity_key",
            ]
          },
          {
            foreignKeyName: "fiscal_reporting_scope_membership_source_occurr_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fiscal_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_reporting_scope_memberships: {
        Row: {
          account_id: string | null
          account_identity_key: string | null
          created_at: string
          fiscal_year: number
          id: string
          member_key: string
          reporting_scope_id: string
        }
        Insert: {
          account_id?: string | null
          account_identity_key?: string | null
          created_at?: string
          fiscal_year: number
          id?: string
          member_key: string
          reporting_scope_id: string
        }
        Update: {
          account_id?: string | null
          account_identity_key?: string | null
          created_at?: string
          fiscal_year?: number
          id?: string
          member_key?: string
          reporting_scope_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_reporting_scope_memberships_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fiscal_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_reporting_scope_memberships_reporting_scope_id_fkey"
            columns: ["reporting_scope_id"]
            isOneToOne: false
            referencedRelation: "fiscal_reporting_scopes"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_reporting_scopes: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      fiscal_source_document_edition_observations: {
        Row: {
          as_of_date: string | null
          created_at: string
          edition_id: string
          edition_source_occurrence_id: string
          evidence_revision: number
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          fiscal_source_document_id: string
          fiscal_year: number | null
          id: string
          ingestion_source_id: string
          license_note: string | null
          observation_revision: number
          parse_run_id: string | null
          parse_run_identity_key: string | null
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          published_at: string | null
          publisher: string
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          redistribution_allowed: boolean | null
          source_locator: string | null
          source_version_id: string
          title: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          as_of_date?: string | null
          created_at?: string
          edition_id: string
          edition_source_occurrence_id: string
          evidence_revision?: number
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          fiscal_source_document_id: string
          fiscal_year?: number | null
          id?: string
          ingestion_source_id: string
          license_note?: string | null
          observation_revision: number
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          published_at?: string | null
          publisher: string
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          redistribution_allowed?: boolean | null
          source_locator?: string | null
          source_version_id: string
          title: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          as_of_date?: string | null
          created_at?: string
          edition_id?: string
          edition_source_occurrence_id?: string
          evidence_revision?: number
          extraction_method?: Database["public"]["Enums"]["extraction_method_enum"]
          fiscal_source_document_id?: string
          fiscal_year?: number | null
          id?: string
          ingestion_source_id?: string
          license_note?: string | null
          observation_revision?: number
          parse_run_id?: string | null
          parse_run_identity_key?: string | null
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          published_at?: string | null
          publisher?: string
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          redistribution_allowed?: boolean | null
          source_locator?: string | null
          source_version_id?: string
          title?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_source_document_editi_edition_id_fiscal_source_doc_fkey1"
            columns: ["edition_id", "fiscal_source_document_id"]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_editions"
            referencedColumns: ["id", "fiscal_source_document_id"]
          },
          {
            foreignKeyName: "fiscal_source_document_editio_edition_source_occurrence_id_fkey"
            columns: [
              "edition_source_occurrence_id",
              "edition_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_edition_source_occurrences"
            referencedColumns: ["id", "edition_id", "ingestion_source_id"]
          },
          {
            foreignKeyName: "fiscal_source_document_editio_parse_run_id_source_version__fkey"
            columns: ["parse_run_id", "source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id", "source_version_id"]
          },
          {
            foreignKeyName: "fiscal_source_document_editio_source_version_id_ingestion__fkey"
            columns: ["source_version_id", "ingestion_source_id"]
            isOneToOne: false
            referencedRelation: "ingestion_source_versions"
            referencedColumns: ["id", "ingestion_source_id"]
          },
        ]
      }
      fiscal_source_document_edition_source_occurrences: {
        Row: {
          created_at: string
          edition_id: string
          fiscal_source_document_id: string
          id: string
          ingestion_source_id: string
          source_edition_key: string
        }
        Insert: {
          created_at?: string
          edition_id: string
          fiscal_source_document_id: string
          id?: string
          ingestion_source_id: string
          source_edition_key: string
        }
        Update: {
          created_at?: string
          edition_id?: string
          fiscal_source_document_id?: string
          id?: string
          ingestion_source_id?: string
          source_edition_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_source_document_editio_edition_id_fiscal_source_doc_fkey"
            columns: ["edition_id", "fiscal_source_document_id"]
            isOneToOne: false
            referencedRelation: "fiscal_source_document_editions"
            referencedColumns: ["id", "fiscal_source_document_id"]
          },
          {
            foreignKeyName: "fiscal_source_document_edition_source__ingestion_source_id_fkey"
            columns: ["ingestion_source_id"]
            isOneToOne: false
            referencedRelation: "ingestion_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_source_document_editions: {
        Row: {
          created_at: string
          edition_key: string
          fiscal_source_document_id: string
          id: string
        }
        Insert: {
          created_at?: string
          edition_key: string
          fiscal_source_document_id: string
          id?: string
        }
        Update: {
          created_at?: string
          edition_key?: string
          fiscal_source_document_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_source_document_editions_fiscal_source_document_id_fkey"
            columns: ["fiscal_source_document_id"]
            isOneToOne: false
            referencedRelation: "fiscal_source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_source_documents: {
        Row: {
          created_at: string
          id: string
          series_code: string
          source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
        }
        Insert: {
          created_at?: string
          id?: string
          series_code: string
          source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
        }
        Update: {
          created_at?: string
          id?: string
          series_code?: string
          source_kind?: Database["public"]["Enums"]["fiscal_source_kind_enum"]
        }
        Relationships: []
      }
      fiscal_source_kind_event_rules: {
        Row: {
          created_at: string
          decision_stage: Database["public"]["Enums"]["fiscal_decision_stage_enum"]
          event_kind: Database["public"]["Enums"]["fiscal_event_kind_enum"]
          may_be_primary: boolean
          rationale: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
        }
        Insert: {
          created_at?: string
          decision_stage: Database["public"]["Enums"]["fiscal_decision_stage_enum"]
          event_kind: Database["public"]["Enums"]["fiscal_event_kind_enum"]
          may_be_primary?: boolean
          rationale: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
        }
        Update: {
          created_at?: string
          decision_stage?: Database["public"]["Enums"]["fiscal_decision_stage_enum"]
          event_kind?: Database["public"]["Enums"]["fiscal_event_kind_enum"]
          may_be_primary?: boolean
          rationale?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_kind?: Database["public"]["Enums"]["fiscal_source_kind_enum"]
        }
        Relationships: []
      }
      fiscal_staging_records: {
        Row: {
          batch_id: string
          change_kind: Database["public"]["Enums"]["fiscal_staging_change_kind_enum"]
          content_fingerprint: string
          created_at: string
          id: string
          matched_target_id: string | null
          parsed_payload: Json
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          record_kind: Database["public"]["Enums"]["fiscal_staging_record_kind_enum"]
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_record_key: string
          validation_results: Json
        }
        Insert: {
          batch_id: string
          change_kind: Database["public"]["Enums"]["fiscal_staging_change_kind_enum"]
          content_fingerprint: string
          created_at?: string
          id?: string
          matched_target_id?: string | null
          parsed_payload: Json
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          record_kind: Database["public"]["Enums"]["fiscal_staging_record_kind_enum"]
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_record_key: string
          validation_results?: Json
        }
        Update: {
          batch_id?: string
          change_kind?: Database["public"]["Enums"]["fiscal_staging_change_kind_enum"]
          content_fingerprint?: string
          created_at?: string
          id?: string
          matched_target_id?: string | null
          parsed_payload?: Json
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          record_kind?: Database["public"]["Enums"]["fiscal_staging_record_kind_enum"]
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_record_key?: string
          validation_results?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_staging_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "fiscal_import_batch_qa_counts"
            referencedColumns: ["batch_id"]
          },
          {
            foreignKeyName: "fiscal_staging_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "fiscal_import_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_validation_result_evidence: {
        Row: {
          amount_evidence_id: string
          amount_set_id: string
          amount_set_revision_id: string
          comparison_role: Database["public"]["Enums"]["fiscal_validation_comparison_role_enum"]
          created_at: string
          validation_result_id: string
        }
        Insert: {
          amount_evidence_id: string
          amount_set_id: string
          amount_set_revision_id: string
          comparison_role: Database["public"]["Enums"]["fiscal_validation_comparison_role_enum"]
          created_at?: string
          validation_result_id: string
        }
        Update: {
          amount_evidence_id?: string
          amount_set_id?: string
          amount_set_revision_id?: string
          comparison_role?: Database["public"]["Enums"]["fiscal_validation_comparison_role_enum"]
          created_at?: string
          validation_result_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_validation_result_evid_amount_evidence_id_amount_se_fkey"
            columns: [
              "amount_evidence_id",
              "amount_set_revision_id",
              "amount_set_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_amount_evidence"
            referencedColumns: ["id", "amount_set_revision_id", "amount_set_id"]
          },
          {
            foreignKeyName: "fiscal_validation_result_evid_validation_result_id_amount__fkey"
            columns: [
              "validation_result_id",
              "amount_set_revision_id",
              "amount_set_id",
            ]
            isOneToOne: false
            referencedRelation: "fiscal_validation_results"
            referencedColumns: ["id", "amount_set_revision_id", "amount_set_id"]
          },
        ]
      }
      fiscal_validation_results: {
        Row: {
          actual_value: number | null
          amount_set_id: string | null
          amount_set_revision_id: string | null
          created_at: string
          details: Json | null
          difference: number | null
          expected_value: number | null
          id: string
          parse_run_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rule_code: string
          severity: Database["public"]["Enums"]["fiscal_validation_severity_enum"]
          source_version_id: string | null
          status: Database["public"]["Enums"]["fiscal_validation_status_enum"]
          tolerance: number | null
          validation_scope: Database["public"]["Enums"]["fiscal_validation_scope_enum"]
        }
        Insert: {
          actual_value?: number | null
          amount_set_id?: string | null
          amount_set_revision_id?: string | null
          created_at?: string
          details?: Json | null
          difference?: number | null
          expected_value?: number | null
          id?: string
          parse_run_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rule_code: string
          severity: Database["public"]["Enums"]["fiscal_validation_severity_enum"]
          source_version_id?: string | null
          status?: Database["public"]["Enums"]["fiscal_validation_status_enum"]
          tolerance?: number | null
          validation_scope: Database["public"]["Enums"]["fiscal_validation_scope_enum"]
        }
        Update: {
          actual_value?: number | null
          amount_set_id?: string | null
          amount_set_revision_id?: string | null
          created_at?: string
          details?: Json | null
          difference?: number | null
          expected_value?: number | null
          id?: string
          parse_run_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rule_code?: string
          severity?: Database["public"]["Enums"]["fiscal_validation_severity_enum"]
          source_version_id?: string | null
          status?: Database["public"]["Enums"]["fiscal_validation_status_enum"]
          tolerance?: number | null
          validation_scope?: Database["public"]["Enums"]["fiscal_validation_scope_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_validation_results_amount_set_revision_id_amount_se_fkey"
            columns: ["amount_set_revision_id", "amount_set_id"]
            isOneToOne: false
            referencedRelation: "fiscal_amount_set_revisions"
            referencedColumns: ["id", "amount_set_id"]
          },
          {
            foreignKeyName: "fiscal_validation_results_parse_run_id_source_version_id_fkey"
            columns: ["parse_run_id", "source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id", "source_version_id"]
          },
        ]
      }
      general_question_answerer_revisions: {
        Row: {
          answerer_id: string
          appearance_id: string
          council_member_id: string | null
          created_at: string
          department_key: string | null
          display_order: number | null
          id: string
          person_display_name: string
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          reviewed_at: string | null
          reviewed_by: string | null
          revision_number: number
          role_display_name: string
          role_group: Database["public"]["Enums"]["general_question_role_group_enum"]
        }
        Insert: {
          answerer_id: string
          appearance_id: string
          council_member_id?: string | null
          created_at?: string
          department_key?: string | null
          display_order?: number | null
          id?: string
          person_display_name: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number: number
          role_display_name: string
          role_group?: Database["public"]["Enums"]["general_question_role_group_enum"]
        }
        Update: {
          answerer_id?: string
          appearance_id?: string
          council_member_id?: string | null
          created_at?: string
          department_key?: string | null
          display_order?: number | null
          id?: string
          person_display_name?: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number?: number
          role_display_name?: string
          role_group?: Database["public"]["Enums"]["general_question_role_group_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "general_question_answerer_revisi_answerer_id_appearance_id_fkey"
            columns: ["answerer_id", "appearance_id"]
            isOneToOne: false
            referencedRelation: "general_question_answerers"
            referencedColumns: ["id", "appearance_id"]
          },
          {
            foreignKeyName: "general_question_answerer_revisions_council_member_id_fkey"
            columns: ["council_member_id"]
            isOneToOne: false
            referencedRelation: "council_members"
            referencedColumns: ["id"]
          },
        ]
      }
      general_question_answerer_source_occurrences: {
        Row: {
          answerer_id: string
          appearance_id: string
          appearance_source_occurrence_id: string
          created_at: string
          id: string
          source_answerer_key: string
        }
        Insert: {
          answerer_id: string
          appearance_id: string
          appearance_source_occurrence_id: string
          created_at?: string
          id?: string
          source_answerer_key: string
        }
        Update: {
          answerer_id?: string
          appearance_id?: string
          appearance_source_occurrence_id?: string
          created_at?: string
          id?: string
          source_answerer_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_answerer_sou_appearance_source_occurrence_fkey"
            columns: ["appearance_source_occurrence_id", "appearance_id"]
            isOneToOne: false
            referencedRelation: "general_question_appearance_source_occurrences"
            referencedColumns: ["id", "appearance_id"]
          },
          {
            foreignKeyName: "general_question_answerer_source_answerer_id_appearance_id_fkey"
            columns: ["answerer_id", "appearance_id"]
            isOneToOne: false
            referencedRelation: "general_question_answerers"
            referencedColumns: ["id", "appearance_id"]
          },
        ]
      }
      general_question_answerer_sources: {
        Row: {
          answerer_id: string
          answerer_revision_id: string
          answerer_source_occurrence_id: string
          appearance_id: string
          appearance_source_id: string
          appearance_source_occurrence_id: string
          created_at: string
          evidence_revision: number
          id: string
          observed_department_name: string | null
          observed_person_name: string | null
          observed_role_name: string | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          source_locator: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          answerer_id: string
          answerer_revision_id: string
          answerer_source_occurrence_id: string
          appearance_id: string
          appearance_source_id: string
          appearance_source_occurrence_id: string
          created_at?: string
          evidence_revision?: number
          id?: string
          observed_department_name?: string | null
          observed_person_name?: string | null
          observed_role_name?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          source_locator?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          answerer_id?: string
          answerer_revision_id?: string
          answerer_source_occurrence_id?: string
          appearance_id?: string
          appearance_source_id?: string
          appearance_source_occurrence_id?: string
          created_at?: string
          evidence_revision?: number
          id?: string
          observed_department_name?: string | null
          observed_person_name?: string | null
          observed_role_name?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          source_locator?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "general_question_answerer_sou_answerer_revision_id_answere_fkey"
            columns: ["answerer_revision_id", "answerer_id", "appearance_id"]
            isOneToOne: false
            referencedRelation: "general_question_answerer_revisions"
            referencedColumns: ["id", "answerer_id", "appearance_id"]
          },
          {
            foreignKeyName: "general_question_answerer_sou_answerer_source_occurrence_i_fkey"
            columns: [
              "answerer_source_occurrence_id",
              "answerer_id",
              "appearance_id",
              "appearance_source_occurrence_id",
            ]
            isOneToOne: false
            referencedRelation: "general_question_answerer_source_occurrences"
            referencedColumns: [
              "id",
              "answerer_id",
              "appearance_id",
              "appearance_source_occurrence_id",
            ]
          },
          {
            foreignKeyName: "general_question_answerer_sou_appearance_source_id_appeara_fkey"
            columns: [
              "appearance_source_id",
              "appearance_source_occurrence_id",
              "appearance_id",
            ]
            isOneToOne: false
            referencedRelation: "general_question_appearance_sources"
            referencedColumns: [
              "id",
              "appearance_source_occurrence_id",
              "appearance_id",
            ]
          },
        ]
      }
      general_question_answerers: {
        Row: {
          answerer_key: string
          appearance_id: string
          created_at: string
          id: string
        }
        Insert: {
          answerer_key: string
          appearance_id: string
          created_at?: string
          id?: string
        }
        Update: {
          answerer_key?: string
          appearance_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_answerers_appearance_id_fkey"
            columns: ["appearance_id"]
            isOneToOne: false
            referencedRelation: "general_question_appearances"
            referencedColumns: ["id"]
          },
        ]
      }
      general_question_appearance_revisions: {
        Row: {
          appearance_id: string
          council_member_id: string | null
          created_at: string
          delivery_method: Database["public"]["Enums"]["general_question_delivery_method_enum"]
          id: string
          meeting_id: string
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          published_at: string | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          question_kind: Database["public"]["Enums"]["general_question_kind_enum"]
          question_order: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          revision_number: number
          seat_number: number | null
          speaker_display_name: string
        }
        Insert: {
          appearance_id: string
          council_member_id?: string | null
          created_at?: string
          delivery_method?: Database["public"]["Enums"]["general_question_delivery_method_enum"]
          id?: string
          meeting_id: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          published_at?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          question_kind?: Database["public"]["Enums"]["general_question_kind_enum"]
          question_order?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number: number
          seat_number?: number | null
          speaker_display_name: string
        }
        Update: {
          appearance_id?: string
          council_member_id?: string | null
          created_at?: string
          delivery_method?: Database["public"]["Enums"]["general_question_delivery_method_enum"]
          id?: string
          meeting_id?: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          published_at?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          question_kind?: Database["public"]["Enums"]["general_question_kind_enum"]
          question_order?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number?: number
          seat_number?: number | null
          speaker_display_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_appearance_revis_appearance_id_meeting_id_fkey"
            columns: ["appearance_id", "meeting_id"]
            isOneToOne: false
            referencedRelation: "general_question_appearances"
            referencedColumns: ["id", "meeting_id"]
          },
          {
            foreignKeyName: "general_question_appearance_revisions_council_member_id_fkey"
            columns: ["council_member_id"]
            isOneToOne: false
            referencedRelation: "council_members"
            referencedColumns: ["id"]
          },
        ]
      }
      general_question_appearance_source_occurrences: {
        Row: {
          appearance_id: string
          created_at: string
          id: string
          ingestion_source_id: string
          meeting_id: string
          meeting_source_occurrence_id: string
          source_appearance_key: string
        }
        Insert: {
          appearance_id: string
          created_at?: string
          id?: string
          ingestion_source_id: string
          meeting_id: string
          meeting_source_occurrence_id: string
          source_appearance_key: string
        }
        Update: {
          appearance_id?: string
          created_at?: string
          id?: string
          ingestion_source_id?: string
          meeting_id?: string
          meeting_source_occurrence_id?: string
          source_appearance_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_appearance_s_meeting_source_occurrence_id_fkey"
            columns: [
              "meeting_source_occurrence_id",
              "meeting_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "council_meeting_source_occurrences"
            referencedColumns: ["id", "meeting_id", "ingestion_source_id"]
          },
          {
            foreignKeyName: "general_question_appearance_sourc_appearance_id_meeting_id_fkey"
            columns: ["appearance_id", "meeting_id"]
            isOneToOne: false
            referencedRelation: "general_question_appearances"
            referencedColumns: ["id", "meeting_id"]
          },
        ]
      }
      general_question_appearance_sources: {
        Row: {
          appearance_id: string
          appearance_revision_id: string
          appearance_source_occurrence_id: string
          created_at: string
          evidence_revision: number
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          id: string
          ingestion_source_id: string
          meeting_id: string
          observed_delivery_method:
            | Database["public"]["Enums"]["general_question_delivery_method_enum"]
            | null
          observed_question_kind:
            | Database["public"]["Enums"]["general_question_kind_enum"]
            | null
          observed_question_order: number | null
          observed_seat_number: number | null
          observed_speaker_name: string | null
          parse_run_id: string | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          role: Database["public"]["Enums"]["general_question_evidence_role_enum"]
          source_locator: string | null
          source_version_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          appearance_id: string
          appearance_revision_id: string
          appearance_source_occurrence_id: string
          created_at?: string
          evidence_revision?: number
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          id?: string
          ingestion_source_id: string
          meeting_id: string
          observed_delivery_method?:
            | Database["public"]["Enums"]["general_question_delivery_method_enum"]
            | null
          observed_question_kind?:
            | Database["public"]["Enums"]["general_question_kind_enum"]
            | null
          observed_question_order?: number | null
          observed_seat_number?: number | null
          observed_speaker_name?: string | null
          parse_run_id?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          role?: Database["public"]["Enums"]["general_question_evidence_role_enum"]
          source_locator?: string | null
          source_version_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          appearance_id?: string
          appearance_revision_id?: string
          appearance_source_occurrence_id?: string
          created_at?: string
          evidence_revision?: number
          extraction_method?: Database["public"]["Enums"]["extraction_method_enum"]
          id?: string
          ingestion_source_id?: string
          meeting_id?: string
          observed_delivery_method?:
            | Database["public"]["Enums"]["general_question_delivery_method_enum"]
            | null
          observed_question_kind?:
            | Database["public"]["Enums"]["general_question_kind_enum"]
            | null
          observed_question_order?: number | null
          observed_seat_number?: number | null
          observed_speaker_name?: string | null
          parse_run_id?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          role?: Database["public"]["Enums"]["general_question_evidence_role_enum"]
          source_locator?: string | null
          source_version_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "general_question_appearance_s_appearance_revision_id_appea_fkey"
            columns: ["appearance_revision_id", "appearance_id", "meeting_id"]
            isOneToOne: false
            referencedRelation: "general_question_appearance_revisions"
            referencedColumns: ["id", "appearance_id", "meeting_id"]
          },
          {
            foreignKeyName: "general_question_appearance_s_appearance_source_occurrence_fkey"
            columns: [
              "appearance_source_occurrence_id",
              "appearance_id",
              "meeting_id",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "general_question_appearance_source_occurrences"
            referencedColumns: [
              "id",
              "appearance_id",
              "meeting_id",
              "ingestion_source_id",
            ]
          },
          {
            foreignKeyName: "general_question_appearance_s_parse_run_id_source_version__fkey"
            columns: ["parse_run_id", "source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id", "source_version_id"]
          },
          {
            foreignKeyName: "general_question_appearance_s_source_version_id_ingestion__fkey"
            columns: ["source_version_id", "ingestion_source_id"]
            isOneToOne: false
            referencedRelation: "ingestion_source_versions"
            referencedColumns: ["id", "ingestion_source_id"]
          },
        ]
      }
      general_question_appearances: {
        Row: {
          appearance_key: string
          created_at: string
          id: string
          meeting_id: string
        }
        Insert: {
          appearance_key: string
          created_at?: string
          id?: string
          meeting_id: string
        }
        Update: {
          appearance_key?: string
          created_at?: string
          id?: string
          meeting_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_appearances_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "council_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      general_question_classification_population_members: {
        Row: {
          ordinal: number
          question_item_revision_id: string
          snapshot_id: string
        }
        Insert: {
          ordinal: number
          question_item_revision_id: string
          snapshot_id: string
        }
        Update: {
          ordinal?: number
          question_item_revision_id?: string
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_classification__question_item_revision_id_fkey"
            columns: ["question_item_revision_id"]
            isOneToOne: false
            referencedRelation: "general_question_item_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_question_classification_population_mem_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "topic_classification_population_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      general_question_classification_release_items: {
        Row: {
          classification_set_id: string | null
          coverage_disposition: Database["public"]["Enums"]["classification_coverage_disposition_enum"]
          created_at: string
          exclusion_reason: string | null
          population_snapshot_id: string
          question_item_revision_id: string
          release_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          taxonomy_id: string
        }
        Insert: {
          classification_set_id?: string | null
          coverage_disposition: Database["public"]["Enums"]["classification_coverage_disposition_enum"]
          created_at?: string
          exclusion_reason?: string | null
          population_snapshot_id: string
          question_item_revision_id: string
          release_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          taxonomy_id: string
        }
        Update: {
          classification_set_id?: string | null
          coverage_disposition?: Database["public"]["Enums"]["classification_coverage_disposition_enum"]
          created_at?: string
          exclusion_reason?: string | null
          population_snapshot_id?: string
          question_item_revision_id?: string
          release_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          taxonomy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_classificati_classification_set_id_taxono_fkey"
            columns: ["classification_set_id", "taxonomy_id"]
            isOneToOne: false
            referencedRelation: "general_question_item_classification_sets"
            referencedColumns: ["id", "taxonomy_id"]
          },
          {
            foreignKeyName: "general_question_classificati_population_snapshot_id_quest_fkey"
            columns: ["population_snapshot_id", "question_item_revision_id"]
            isOneToOne: false
            referencedRelation: "general_question_classification_population_members"
            referencedColumns: ["snapshot_id", "question_item_revision_id"]
          },
          {
            foreignKeyName: "general_question_classification_release_items_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "topic_classification_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      general_question_import_batches: {
        Row: {
          council_session_id: string | null
          created_at: string
          discovered_count: number
          error_details: Json | null
          finished_at: string | null
          id: string
          parse_run_id: string
          source_version_id: string
          staged_count: number
          status: Database["public"]["Enums"]["general_question_import_status_enum"]
        }
        Insert: {
          council_session_id?: string | null
          created_at?: string
          discovered_count?: number
          error_details?: Json | null
          finished_at?: string | null
          id?: string
          parse_run_id: string
          source_version_id: string
          staged_count?: number
          status?: Database["public"]["Enums"]["general_question_import_status_enum"]
        }
        Update: {
          council_session_id?: string | null
          created_at?: string
          discovered_count?: number
          error_details?: Json | null
          finished_at?: string | null
          id?: string
          parse_run_id?: string
          source_version_id?: string
          staged_count?: number
          status?: Database["public"]["Enums"]["general_question_import_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "general_question_import_batch_parse_run_id_source_version__fkey"
            columns: ["parse_run_id", "source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id", "source_version_id"]
          },
          {
            foreignKeyName: "general_question_import_batches_council_session_id_fkey"
            columns: ["council_session_id"]
            isOneToOne: false
            referencedRelation: "council_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_question_import_batches_parse_run_id_fkey"
            columns: ["parse_run_id"]
            isOneToOne: true
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_question_import_batches_source_version_id_fkey"
            columns: ["source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      general_question_item_classification_sets: {
        Row: {
          classification_run_id: string
          created_at: string
          id: string
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          question_item_revision_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          taxonomy_id: string
        }
        Insert: {
          classification_run_id: string
          created_at?: string
          id?: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          question_item_revision_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          taxonomy_id: string
        }
        Update: {
          classification_run_id?: string
          created_at?: string
          id?: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          question_item_revision_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          taxonomy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_item_classif_classification_run_id_taxono_fkey"
            columns: ["classification_run_id", "taxonomy_id"]
            isOneToOne: false
            referencedRelation: "topic_classification_runs"
            referencedColumns: ["id", "taxonomy_id"]
          },
          {
            foreignKeyName: "general_question_item_classifica_question_item_revision_id_fkey"
            columns: ["question_item_revision_id"]
            isOneToOne: false
            referencedRelation: "general_question_item_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      general_question_item_revisions: {
        Row: {
          appearance_id: string
          created_at: string
          id: string
          item_order: number | null
          parent_item_id: string | null
          public_summary: string
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          question_item_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          revision_number: number
          summary_generation_model: string
          summary_prompt_version: string
        }
        Insert: {
          appearance_id: string
          created_at?: string
          id?: string
          item_order?: number | null
          parent_item_id?: string | null
          public_summary: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          question_item_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number: number
          summary_generation_model: string
          summary_prompt_version: string
        }
        Update: {
          appearance_id?: string
          created_at?: string
          id?: string
          item_order?: number | null
          parent_item_id?: string | null
          public_summary?: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          question_item_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          revision_number?: number
          summary_generation_model?: string
          summary_prompt_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_item_revisio_parent_item_id_appearance_id_fkey"
            columns: ["parent_item_id", "appearance_id"]
            isOneToOne: false
            referencedRelation: "general_question_items"
            referencedColumns: ["id", "appearance_id"]
          },
          {
            foreignKeyName: "general_question_item_revisio_question_item_id_appearance__fkey"
            columns: ["question_item_id", "appearance_id"]
            isOneToOne: false
            referencedRelation: "general_question_items"
            referencedColumns: ["id", "appearance_id"]
          },
        ]
      }
      general_question_item_source_occurrences: {
        Row: {
          appearance_id: string
          appearance_source_occurrence_id: string
          created_at: string
          id: string
          question_item_id: string
          source_item_key: string
        }
        Insert: {
          appearance_id: string
          appearance_source_occurrence_id: string
          created_at?: string
          id?: string
          question_item_id: string
          source_item_key: string
        }
        Update: {
          appearance_id?: string
          appearance_source_occurrence_id?: string
          created_at?: string
          id?: string
          question_item_id?: string
          source_item_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_item_source__appearance_source_occurrence_fkey"
            columns: ["appearance_source_occurrence_id", "appearance_id"]
            isOneToOne: false
            referencedRelation: "general_question_appearance_source_occurrences"
            referencedColumns: ["id", "appearance_id"]
          },
          {
            foreignKeyName: "general_question_item_source__question_item_id_appearance__fkey"
            columns: ["question_item_id", "appearance_id"]
            isOneToOne: false
            referencedRelation: "general_question_items"
            referencedColumns: ["id", "appearance_id"]
          },
        ]
      }
      general_question_item_sources: {
        Row: {
          appearance_id: string
          appearance_source_id: string
          appearance_source_occurrence_id: string
          created_at: string
          evidence_revision: number
          id: string
          item_source_occurrence_id: string
          observed_label: string | null
          official_label_hash: string | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          question_item_id: string
          question_item_revision_id: string
          source_locator: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          appearance_id: string
          appearance_source_id: string
          appearance_source_occurrence_id: string
          created_at?: string
          evidence_revision?: number
          id?: string
          item_source_occurrence_id: string
          observed_label?: string | null
          official_label_hash?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          question_item_id: string
          question_item_revision_id: string
          source_locator?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          appearance_id?: string
          appearance_source_id?: string
          appearance_source_occurrence_id?: string
          created_at?: string
          evidence_revision?: number
          id?: string
          item_source_occurrence_id?: string
          observed_label?: string | null
          official_label_hash?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          question_item_id?: string
          question_item_revision_id?: string
          source_locator?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "general_question_item_sources_appearance_source_id_appeara_fkey"
            columns: [
              "appearance_source_id",
              "appearance_source_occurrence_id",
              "appearance_id",
            ]
            isOneToOne: false
            referencedRelation: "general_question_appearance_sources"
            referencedColumns: [
              "id",
              "appearance_source_occurrence_id",
              "appearance_id",
            ]
          },
          {
            foreignKeyName: "general_question_item_sources_item_source_occurrence_id_qu_fkey"
            columns: [
              "item_source_occurrence_id",
              "question_item_id",
              "appearance_id",
              "appearance_source_occurrence_id",
            ]
            isOneToOne: false
            referencedRelation: "general_question_item_source_occurrences"
            referencedColumns: [
              "id",
              "question_item_id",
              "appearance_id",
              "appearance_source_occurrence_id",
            ]
          },
          {
            foreignKeyName: "general_question_item_sources_question_item_revision_id_qu_fkey"
            columns: [
              "question_item_revision_id",
              "question_item_id",
              "appearance_id",
            ]
            isOneToOne: false
            referencedRelation: "general_question_item_revisions"
            referencedColumns: ["id", "question_item_id", "appearance_id"]
          },
        ]
      }
      general_question_item_topics: {
        Row: {
          classification_set_id: string
          confidence: number | null
          created_at: string
          policy_topic_id: string
          taxonomy_id: string
        }
        Insert: {
          classification_set_id: string
          confidence?: number | null
          created_at?: string
          policy_topic_id: string
          taxonomy_id: string
        }
        Update: {
          classification_set_id?: string
          confidence?: number | null
          created_at?: string
          policy_topic_id?: string
          taxonomy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_item_topics_classification_set_id_taxonom_fkey"
            columns: ["classification_set_id", "taxonomy_id"]
            isOneToOne: false
            referencedRelation: "general_question_item_classification_sets"
            referencedColumns: ["id", "taxonomy_id"]
          },
          {
            foreignKeyName: "general_question_item_topics_policy_topic_id_taxonomy_id_fkey"
            columns: ["policy_topic_id", "taxonomy_id"]
            isOneToOne: false
            referencedRelation: "policy_topics"
            referencedColumns: ["id", "taxonomy_id"]
          },
        ]
      }
      general_question_items: {
        Row: {
          appearance_id: string
          created_at: string
          id: string
          item_key: string
        }
        Insert: {
          appearance_id: string
          created_at?: string
          id?: string
          item_key: string
        }
        Update: {
          appearance_id?: string
          created_at?: string
          id?: string
          item_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_items_appearance_id_fkey"
            columns: ["appearance_id"]
            isOneToOne: false
            referencedRelation: "general_question_appearances"
            referencedColumns: ["id"]
          },
        ]
      }
      general_question_session_coverage: {
        Row: {
          council_session_id: string
          created_at: string
          id: string
          source_kind: string
        }
        Insert: {
          council_session_id: string
          created_at?: string
          id?: string
          source_kind: string
        }
        Update: {
          council_session_id?: string
          created_at?: string
          id?: string
          source_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_session_coverage_council_session_id_fkey"
            columns: ["council_session_id"]
            isOneToOne: false
            referencedRelation: "council_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      general_question_session_coverage_observation_sources: {
        Row: {
          council_session_id: string
          coverage_id: string
          coverage_source_occurrence_id: string
          created_at: string
          evidence_revision: number
          evidence_role: Database["public"]["Enums"]["general_question_evidence_role_enum"]
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          id: string
          ingestion_source_id: string
          observation_id: string
          parse_run_id: string | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          source_kind: string
          source_locator: string | null
          source_version_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          council_session_id: string
          coverage_id: string
          coverage_source_occurrence_id: string
          created_at?: string
          evidence_revision?: number
          evidence_role?: Database["public"]["Enums"]["general_question_evidence_role_enum"]
          extraction_method: Database["public"]["Enums"]["extraction_method_enum"]
          id?: string
          ingestion_source_id: string
          observation_id: string
          parse_run_id?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          source_kind: string
          source_locator?: string | null
          source_version_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          council_session_id?: string
          coverage_id?: string
          coverage_source_occurrence_id?: string
          created_at?: string
          evidence_revision?: number
          evidence_role?: Database["public"]["Enums"]["general_question_evidence_role_enum"]
          extraction_method?: Database["public"]["Enums"]["extraction_method_enum"]
          id?: string
          ingestion_source_id?: string
          observation_id?: string
          parse_run_id?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          source_kind?: string
          source_locator?: string | null
          source_version_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "general_question_session_cove_coverage_source_occurrence_i_fkey"
            columns: [
              "coverage_source_occurrence_id",
              "coverage_id",
              "council_session_id",
              "source_kind",
              "ingestion_source_id",
            ]
            isOneToOne: false
            referencedRelation: "general_question_session_coverage_source_occurrences"
            referencedColumns: [
              "id",
              "coverage_id",
              "council_session_id",
              "source_kind",
              "ingestion_source_id",
            ]
          },
          {
            foreignKeyName: "general_question_session_cove_observation_id_coverage_id_c_fkey"
            columns: [
              "observation_id",
              "coverage_id",
              "council_session_id",
              "source_kind",
            ]
            isOneToOne: false
            referencedRelation: "general_question_session_coverage_observations"
            referencedColumns: [
              "id",
              "coverage_id",
              "council_session_id",
              "source_kind",
            ]
          },
          {
            foreignKeyName: "general_question_session_cove_parse_run_id_source_version__fkey"
            columns: ["parse_run_id", "source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_parse_runs"
            referencedColumns: ["id", "source_version_id"]
          },
          {
            foreignKeyName: "general_question_session_cove_source_version_id_ingestion__fkey"
            columns: ["source_version_id", "ingestion_source_id"]
            isOneToOne: false
            referencedRelation: "ingestion_source_versions"
            referencedColumns: ["id", "ingestion_source_id"]
          },
        ]
      }
      general_question_session_coverage_observations: {
        Row: {
          checked_at: string
          council_session_id: string
          coverage_id: string
          created_at: string
          expected_count: number | null
          id: string
          matched_count: number | null
          observation_key: string
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          record_presence: Database["public"]["Enums"]["record_presence_enum"]
          reviewed_at: string | null
          reviewed_by: string | null
          session_disposition: Database["public"]["Enums"]["general_question_session_disposition_enum"]
          source_kind: string
          state: Database["public"]["Enums"]["coverage_state_enum"]
        }
        Insert: {
          checked_at: string
          council_session_id: string
          coverage_id: string
          created_at?: string
          expected_count?: number | null
          id?: string
          matched_count?: number | null
          observation_key: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          record_presence: Database["public"]["Enums"]["record_presence_enum"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_disposition: Database["public"]["Enums"]["general_question_session_disposition_enum"]
          source_kind: string
          state: Database["public"]["Enums"]["coverage_state_enum"]
        }
        Update: {
          checked_at?: string
          council_session_id?: string
          coverage_id?: string
          created_at?: string
          expected_count?: number | null
          id?: string
          matched_count?: number | null
          observation_key?: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          record_presence?: Database["public"]["Enums"]["record_presence_enum"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_disposition?: Database["public"]["Enums"]["general_question_session_disposition_enum"]
          source_kind?: string
          state?: Database["public"]["Enums"]["coverage_state_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "general_question_session_cove_coverage_id_council_session__fkey"
            columns: ["coverage_id", "council_session_id", "source_kind"]
            isOneToOne: false
            referencedRelation: "general_question_session_coverage"
            referencedColumns: ["id", "council_session_id", "source_kind"]
          },
        ]
      }
      general_question_session_coverage_source_occurrences: {
        Row: {
          council_session_id: string
          coverage_id: string
          created_at: string
          id: string
          ingestion_source_id: string
          source_coverage_key: string
          source_kind: string
        }
        Insert: {
          council_session_id: string
          coverage_id: string
          created_at?: string
          id?: string
          ingestion_source_id: string
          source_coverage_key: string
          source_kind: string
        }
        Update: {
          council_session_id?: string
          coverage_id?: string
          created_at?: string
          id?: string
          ingestion_source_id?: string
          source_coverage_key?: string
          source_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_session_cov_coverage_id_council_session__fkey1"
            columns: ["coverage_id", "council_session_id", "source_kind"]
            isOneToOne: false
            referencedRelation: "general_question_session_coverage"
            referencedColumns: ["id", "council_session_id", "source_kind"]
          },
          {
            foreignKeyName: "general_question_session_coverage_sour_ingestion_source_id_fkey"
            columns: ["ingestion_source_id"]
            isOneToOne: false
            referencedRelation: "ingestion_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      general_question_staging_appearances: {
        Row: {
          batch_id: string
          change_kind: Database["public"]["Enums"]["general_question_change_kind_enum"]
          content_fingerprint: string
          created_at: string
          generated_public_summaries: Json
          id: string
          matched_appearance_id: string | null
          parsed_payload: Json
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewed_held_on: string | null
          reviewed_match_confirmed: boolean
          reviewed_matched_appearance_id: string | null
          reviewed_public_summaries: Json
          source_appearance_key: string
          summary_generated_at: string | null
          summary_generation_model: string | null
          summary_prompt_version: string | null
        }
        Insert: {
          batch_id: string
          change_kind: Database["public"]["Enums"]["general_question_change_kind_enum"]
          content_fingerprint: string
          created_at?: string
          generated_public_summaries?: Json
          id?: string
          matched_appearance_id?: string | null
          parsed_payload: Json
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_held_on?: string | null
          reviewed_match_confirmed?: boolean
          reviewed_matched_appearance_id?: string | null
          reviewed_public_summaries?: Json
          source_appearance_key: string
          summary_generated_at?: string | null
          summary_generation_model?: string | null
          summary_prompt_version?: string | null
        }
        Update: {
          batch_id?: string
          change_kind?: Database["public"]["Enums"]["general_question_change_kind_enum"]
          content_fingerprint?: string
          created_at?: string
          generated_public_summaries?: Json
          id?: string
          matched_appearance_id?: string | null
          parsed_payload?: Json
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewed_held_on?: string | null
          reviewed_match_confirmed?: boolean
          reviewed_matched_appearance_id?: string | null
          reviewed_public_summaries?: Json
          source_appearance_key?: string
          summary_generated_at?: string | null
          summary_generation_model?: string | null
          summary_prompt_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "general_question_staging_appe_reviewed_matched_appearance__fkey"
            columns: ["reviewed_matched_appearance_id"]
            isOneToOne: false
            referencedRelation: "general_question_appearances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_question_staging_appearances_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "general_question_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_question_staging_appearances_matched_appearance_id_fkey"
            columns: ["matched_appearance_id"]
            isOneToOne: false
            referencedRelation: "general_question_appearances"
            referencedColumns: ["id"]
          },
        ]
      }
      general_question_staging_applications: {
        Row: {
          appearance_id: string
          applied_at: string
          applied_by: string
          id: string
          staging_id: string
        }
        Insert: {
          appearance_id: string
          applied_at?: string
          applied_by: string
          id?: string
          staging_id: string
        }
        Update: {
          appearance_id?: string
          applied_at?: string
          applied_by?: string
          id?: string
          staging_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_question_staging_applications_appearance_id_fkey"
            columns: ["appearance_id"]
            isOneToOne: false
            referencedRelation: "general_question_appearances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "general_question_staging_applications_staging_id_fkey"
            columns: ["staging_id"]
            isOneToOne: true
            referencedRelation: "general_question_staging_appearances"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_parse_runs: {
        Row: {
          configuration_hash: string
          finished_at: string | null
          id: string
          ingestion_run_id: string
          parse_stats: Json | null
          parser_name: string
          parser_version: string
          source_version_id: string
          started_at: string
          status: Database["public"]["Enums"]["ingestion_parse_status_enum"]
        }
        Insert: {
          configuration_hash: string
          finished_at?: string | null
          id?: string
          ingestion_run_id: string
          parse_stats?: Json | null
          parser_name: string
          parser_version: string
          source_version_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["ingestion_parse_status_enum"]
        }
        Update: {
          configuration_hash?: string
          finished_at?: string | null
          id?: string
          ingestion_run_id?: string
          parse_stats?: Json | null
          parser_name?: string
          parser_version?: string
          source_version_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["ingestion_parse_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_parse_runs_ingestion_run_id_fkey"
            columns: ["ingestion_run_id"]
            isOneToOne: false
            referencedRelation: "ingestion_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingestion_parse_runs_source_version_id_fkey"
            columns: ["source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          source: string
          started_at: string
          stats: Json | null
          status: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          source: string
          started_at?: string
          stats?: Json | null
          status?: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          source?: string
          started_at?: string
          stats?: Json | null
          status?: string
        }
        Relationships: []
      }
      ingestion_source_version_retention_transitions: {
        Row: {
          changed_at: string
          changed_by: string
          from_private_object_key: string | null
          from_reparse_available_until: string | null
          from_state: Database["public"]["Enums"]["source_artifact_retention_state_enum"]
          id: string
          reason: string
          source_version_id: string
          to_private_object_key: string | null
          to_reparse_available_until: string | null
          to_state: Database["public"]["Enums"]["source_artifact_retention_state_enum"]
        }
        Insert: {
          changed_at?: string
          changed_by: string
          from_private_object_key?: string | null
          from_reparse_available_until?: string | null
          from_state: Database["public"]["Enums"]["source_artifact_retention_state_enum"]
          id?: string
          reason: string
          source_version_id: string
          to_private_object_key?: string | null
          to_reparse_available_until?: string | null
          to_state: Database["public"]["Enums"]["source_artifact_retention_state_enum"]
        }
        Update: {
          changed_at?: string
          changed_by?: string
          from_private_object_key?: string | null
          from_reparse_available_until?: string | null
          from_state?: Database["public"]["Enums"]["source_artifact_retention_state_enum"]
          id?: string
          reason?: string
          source_version_id?: string
          to_private_object_key?: string | null
          to_reparse_available_until?: string | null
          to_state?: Database["public"]["Enums"]["source_artifact_retention_state_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_source_version_retention_trans_source_version_id_fkey"
            columns: ["source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_source_versions: {
        Row: {
          artifact_retention_state: Database["public"]["Enums"]["source_artifact_retention_state_enum"]
          as_of_date: string | null
          byte_size: number | null
          content_hash: string
          created_at: string
          etag: string | null
          fetched_at: string
          id: string
          ingestion_source_id: string
          last_modified: string | null
          media_type: string | null
          private_object_key: string | null
          published_at: string | null
          reparse_available_until: string | null
          source_title: string | null
        }
        Insert: {
          artifact_retention_state?: Database["public"]["Enums"]["source_artifact_retention_state_enum"]
          as_of_date?: string | null
          byte_size?: number | null
          content_hash: string
          created_at?: string
          etag?: string | null
          fetched_at: string
          id?: string
          ingestion_source_id: string
          last_modified?: string | null
          media_type?: string | null
          private_object_key?: string | null
          published_at?: string | null
          reparse_available_until?: string | null
          source_title?: string | null
        }
        Update: {
          artifact_retention_state?: Database["public"]["Enums"]["source_artifact_retention_state_enum"]
          as_of_date?: string | null
          byte_size?: number | null
          content_hash?: string
          created_at?: string
          etag?: string | null
          fetched_at?: string
          id?: string
          ingestion_source_id?: string
          last_modified?: string | null
          media_type?: string | null
          private_object_key?: string | null
          published_at?: string | null
          reparse_available_until?: string | null
          source_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_source_versions_ingestion_source_id_fkey"
            columns: ["ingestion_source_id"]
            isOneToOne: false
            referencedRelation: "ingestion_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_sources: {
        Row: {
          content_hash: string | null
          created_at: string
          etag: string | null
          id: string
          last_fetched_at: string | null
          last_modified: string | null
          source: string
          updated_at: string
          url: string
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          etag?: string | null
          id?: string
          last_fetched_at?: string | null
          last_modified?: string | null
          source: string
          updated_at?: string
          url: string
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          etag?: string | null
          id?: string
          last_fetched_at?: string | null
          last_modified?: string | null
          source?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      interview_configs: {
        Row: {
          bill_id: string
          chat_model: string | null
          created_at: string
          deleted_at: string | null
          estimated_duration: number | null
          id: string
          mode: Database["public"]["Enums"]["interview_mode_enum"]
          name: string
          prompt_overrides: Json | null
          status: Database["public"]["Enums"]["interview_config_status_enum"]
          themes: string[] | null
          updated_at: string
        }
        Insert: {
          bill_id: string
          chat_model?: string | null
          created_at?: string
          deleted_at?: string | null
          estimated_duration?: number | null
          id?: string
          mode?: Database["public"]["Enums"]["interview_mode_enum"]
          name: string
          prompt_overrides?: Json | null
          status?: Database["public"]["Enums"]["interview_config_status_enum"]
          themes?: string[] | null
          updated_at?: string
        }
        Update: {
          bill_id?: string
          chat_model?: string | null
          created_at?: string
          deleted_at?: string | null
          estimated_duration?: number | null
          id?: string
          mode?: Database["public"]["Enums"]["interview_mode_enum"]
          name?: string
          prompt_overrides?: Json | null
          status?: Database["public"]["Enums"]["interview_config_status_enum"]
          themes?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_configs_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          interview_session_id: string
          role: Database["public"]["Enums"]["interview_role_enum"]
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          interview_session_id: string
          role: Database["public"]["Enums"]["interview_role_enum"]
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          interview_session_id?: string
          role?: Database["public"]["Enums"]["interview_role_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "interview_messages_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_opinion: {
        Row: {
          bill_sentiment: string | null
          concern: string | null
          content: string
          contextual_quote: string | null
          created_at: string
          id: string
          interview_report_id: string
          opinion_index: number
          proposal: string | null
          reasoning_types: string[]
          richness: number | null
          source_message_id: string | null
          tags_extracted_at: string | null
          title: string
          topic_extracted_at: string | null
        }
        Insert: {
          bill_sentiment?: string | null
          concern?: string | null
          content: string
          contextual_quote?: string | null
          created_at?: string
          id?: string
          interview_report_id: string
          opinion_index: number
          proposal?: string | null
          reasoning_types?: string[]
          richness?: number | null
          source_message_id?: string | null
          tags_extracted_at?: string | null
          title: string
          topic_extracted_at?: string | null
        }
        Update: {
          bill_sentiment?: string | null
          concern?: string | null
          content?: string
          contextual_quote?: string | null
          created_at?: string
          id?: string
          interview_report_id?: string
          opinion_index?: number
          proposal?: string | null
          reasoning_types?: string[]
          richness?: number | null
          source_message_id?: string | null
          tags_extracted_at?: string | null
          title?: string
          topic_extracted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_opinion_interview_report_id_fkey"
            columns: ["interview_report_id"]
            isOneToOne: false
            referencedRelation: "interview_report"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          created_at: string
          follow_up_guide: string | null
          id: string
          interview_config_id: string
          question: string
          question_order: number
          quick_replies: string[] | null
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          follow_up_guide?: string | null
          id?: string
          interview_config_id: string
          question: string
          question_order: number
          quick_replies?: string[] | null
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          follow_up_guide?: string | null
          id?: string
          interview_config_id?: string
          question?: string
          question_order?: number
          quick_replies?: string[] | null
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_interview_config_id_fkey"
            columns: ["interview_config_id"]
            isOneToOne: false
            referencedRelation: "interview_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_rating_feedbacks: {
        Row: {
          created_at: string
          id: string
          interview_session_id: string
          tag: Database["public"]["Enums"]["interview_feedback_tag_enum"]
        }
        Insert: {
          created_at?: string
          id?: string
          interview_session_id: string
          tag: Database["public"]["Enums"]["interview_feedback_tag_enum"]
        }
        Update: {
          created_at?: string
          id?: string
          interview_session_id?: string
          tag?: Database["public"]["Enums"]["interview_feedback_tag_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "interview_rating_feedbacks_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: false
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_report: {
        Row: {
          admin_unpublished_at: string | null
          content_richness: Json | null
          created_at: string
          id: string
          interview_session_id: string
          is_data_reuse_consented: boolean
          is_public_by_admin: boolean
          is_public_by_user: boolean
          moderation_reasoning: string | null
          moderation_score: number | null
          moderation_status:
            | Database["public"]["Enums"]["moderation_status_enum"]
            | null
          opinions: Json | null
          opinions_reextracted_at: string | null
          role: Database["public"]["Enums"]["interview_report_role_enum"] | null
          role_description: string | null
          role_title: string | null
          stance: Database["public"]["Enums"]["stance_type_enum"] | null
          summary: string | null
          total_content_richness: number | null
          updated_at: string
        }
        Insert: {
          admin_unpublished_at?: string | null
          content_richness?: Json | null
          created_at?: string
          id?: string
          interview_session_id: string
          is_data_reuse_consented?: boolean
          is_public_by_admin?: boolean
          is_public_by_user?: boolean
          moderation_reasoning?: string | null
          moderation_score?: number | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status_enum"]
            | null
          opinions?: Json | null
          opinions_reextracted_at?: string | null
          role?:
            | Database["public"]["Enums"]["interview_report_role_enum"]
            | null
          role_description?: string | null
          role_title?: string | null
          stance?: Database["public"]["Enums"]["stance_type_enum"] | null
          summary?: string | null
          total_content_richness?: number | null
          updated_at?: string
        }
        Update: {
          admin_unpublished_at?: string | null
          content_richness?: Json | null
          created_at?: string
          id?: string
          interview_session_id?: string
          is_data_reuse_consented?: boolean
          is_public_by_admin?: boolean
          is_public_by_user?: boolean
          moderation_reasoning?: string | null
          moderation_score?: number | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status_enum"]
            | null
          opinions?: Json | null
          opinions_reextracted_at?: string | null
          role?:
            | Database["public"]["Enums"]["interview_report_role_enum"]
            | null
          role_description?: string | null
          role_title?: string | null
          stance?: Database["public"]["Enums"]["stance_type_enum"] | null
          summary?: string | null
          total_content_richness?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_report_interview_session_id_fkey"
            columns: ["interview_session_id"]
            isOneToOne: true
            referencedRelation: "interview_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_sessions: {
        Row: {
          archived_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          interview_config_id: string
          langfuse_session_id: string | null
          rating: number | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          interview_config_id: string
          langfuse_session_id?: string | null
          rating?: number | null
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          interview_config_id?: string
          langfuse_session_id?: string | null
          rating?: number | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interview_sessions_interview_config_id_fkey"
            columns: ["interview_config_id"]
            isOneToOne: false
            referencedRelation: "interview_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      mirai_stances: {
        Row: {
          bill_id: string
          comment: string | null
          created_at: string
          id: string
          type: Database["public"]["Enums"]["stance_type_enum"]
          updated_at: string
        }
        Insert: {
          bill_id: string
          comment?: string | null
          created_at?: string
          id?: string
          type: Database["public"]["Enums"]["stance_type_enum"]
          updated_at?: string
        }
        Update: {
          bill_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          type?: Database["public"]["Enums"]["stance_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mirai_stances_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: true
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_taxonomies: {
        Row: {
          content_hash: string | null
          created_at: string
          id: string
          label: string
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          published_at: string | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          reviewed_at: string | null
          reviewed_by: string | null
          version: string
        }
        Insert: {
          content_hash?: string | null
          created_at?: string
          id?: string
          label: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          published_at?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          version: string
        }
        Update: {
          content_hash?: string | null
          created_at?: string
          id?: string
          label?: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          published_at?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          version?: string
        }
        Relationships: []
      }
      policy_topics: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          is_active: boolean
          label: string
          slug: string
          taxonomy_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label: string
          slug: string
          taxonomy_id: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          taxonomy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_topics_taxonomy_id_fkey"
            columns: ["taxonomy_id"]
            isOneToOne: false
            referencedRelation: "policy_taxonomies"
            referencedColumns: ["id"]
          },
        ]
      }
      preview_tokens: {
        Row: {
          bill_id: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          bill_id: string
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          bill_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "preview_tokens_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      published_source_version_references: {
        Row: {
          activated_at: string
          consumer_id: string
          consumer_type: string
          evidence_id: string
          evidence_table: string
          id: string
          released_at: string | null
          source_version_id: string
        }
        Insert: {
          activated_at?: string
          consumer_id: string
          consumer_type: string
          evidence_id: string
          evidence_table: string
          id?: string
          released_at?: string | null
          source_version_id: string
        }
        Update: {
          activated_at?: string
          consumer_id?: string
          consumer_type?: string
          evidence_id?: string
          evidence_table?: string
          id?: string
          released_at?: string | null
          source_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "published_source_version_references_consumer_type_fkey"
            columns: ["consumer_type"]
            isOneToOne: false
            referencedRelation: "source_artifact_consumer_types"
            referencedColumns: ["consumer_type"]
          },
          {
            foreignKeyName: "published_source_version_references_source_version_id_fkey"
            columns: ["source_version_id"]
            isOneToOne: false
            referencedRelation: "ingestion_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      report_reactions: {
        Row: {
          created_at: string
          id: string
          interview_report_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interview_report_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interview_report_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_reactions_interview_report_id_fkey"
            columns: ["interview_report_id"]
            isOneToOne: false
            referencedRelation: "interview_report"
            referencedColumns: ["id"]
          },
        ]
      }
      source_artifact_consumer_types: {
        Row: {
          consumer_type: string
          created_at: string
          description: string
          registered_by_migration: string
        }
        Insert: {
          consumer_type: string
          created_at?: string
          description: string
          registered_by_migration: string
        }
        Update: {
          consumer_type?: string
          created_at?: string
          description?: string
          registered_by_migration?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          description: string | null
          featured_priority: number | null
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          featured_priority?: number | null
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          featured_priority?: number | null
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      topic: {
        Row: {
          created_at: string
          description: string
          id: string
          parent_topic_id: string | null
          sort_order: number
          title: string
          version_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          parent_topic_id?: string | null
          sort_order?: number
          title: string
          version_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          parent_topic_id?: string | null
          sort_order?: number
          title?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_parent_same_version_fkey"
            columns: ["version_id", "parent_topic_id"]
            isOneToOne: false
            referencedRelation: "topic"
            referencedColumns: ["version_id", "id"]
          },
          {
            foreignKeyName: "topic_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "topic_analysis_version"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_analysis_classifications: {
        Row: {
          id: string
          interview_report_id: string
          opinion_index: number
          topic_id: string
          version_id: string
        }
        Insert: {
          id?: string
          interview_report_id: string
          opinion_index: number
          topic_id: string
          version_id: string
        }
        Update: {
          id?: string
          interview_report_id?: string
          opinion_index?: number
          topic_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_analysis_classifications_interview_report_id_fkey"
            columns: ["interview_report_id"]
            isOneToOne: false
            referencedRelation: "interview_report"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_analysis_classifications_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topic_analysis_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_analysis_classifications_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "topic_analysis_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_analysis_topics: {
        Row: {
          created_at: string
          description_md: string
          id: string
          name: string
          representative_opinions: Json
          sort_order: number
          version_id: string
        }
        Insert: {
          created_at?: string
          description_md: string
          id?: string
          name: string
          representative_opinions?: Json
          sort_order?: number
          version_id: string
        }
        Update: {
          created_at?: string
          description_md?: string
          id?: string
          name?: string
          representative_opinions?: Json
          sort_order?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_analysis_topics_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "topic_analysis_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_analysis_version: {
        Row: {
          bill_id: string
          completed_at: string | null
          created_at: string
          current_step: string | null
          error_message: string | null
          id: string
          is_published: boolean
          model: string | null
          progress: Json | null
          prompt_version: string | null
          source_opinion_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["topic_analysis_status"]
          trigger: string
          version: number
        }
        Insert: {
          bill_id: string
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          error_message?: string | null
          id?: string
          is_published?: boolean
          model?: string | null
          progress?: Json | null
          prompt_version?: string | null
          source_opinion_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["topic_analysis_status"]
          trigger: string
          version: number
        }
        Update: {
          bill_id?: string
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          error_message?: string | null
          id?: string
          is_published?: boolean
          model?: string | null
          progress?: Json | null
          prompt_version?: string | null
          source_opinion_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["topic_analysis_status"]
          trigger?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "topic_analysis_version_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_analysis_versions: {
        Row: {
          bill_id: string
          completed_at: string | null
          created_at: string
          current_step: string | null
          error_message: string | null
          id: string
          intermediate_results: Json | null
          phase_data: Json | null
          started_at: string | null
          status: string
          summary_md: string | null
          updated_at: string
          version: number
        }
        Insert: {
          bill_id: string
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          error_message?: string | null
          id?: string
          intermediate_results?: Json | null
          phase_data?: Json | null
          started_at?: string | null
          status?: string
          summary_md?: string | null
          updated_at?: string
          version: number
        }
        Update: {
          bill_id?: string
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          error_message?: string | null
          id?: string
          intermediate_results?: Json | null
          phase_data?: Json | null
          started_at?: string | null
          status?: string
          summary_md?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "topic_analysis_versions_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_classification_population_snapshots: {
        Row: {
          consumer_type: string
          council_session_id: string | null
          created_at: string
          cutoff_at: string
          fiscal_year: number | null
          id: string
          ordered_subject_ids_hash: string
          period_end: string | null
          period_start: string | null
          scope_kind: Database["public"]["Enums"]["classification_scope_kind_enum"]
          selection_rule_version: string
          snapshot_key: string
          subject_count: number
        }
        Insert: {
          consumer_type: string
          council_session_id?: string | null
          created_at?: string
          cutoff_at: string
          fiscal_year?: number | null
          id?: string
          ordered_subject_ids_hash: string
          period_end?: string | null
          period_start?: string | null
          scope_kind: Database["public"]["Enums"]["classification_scope_kind_enum"]
          selection_rule_version: string
          snapshot_key: string
          subject_count: number
        }
        Update: {
          consumer_type?: string
          council_session_id?: string | null
          created_at?: string
          cutoff_at?: string
          fiscal_year?: number | null
          id?: string
          ordered_subject_ids_hash?: string
          period_end?: string | null
          period_start?: string | null
          scope_kind?: Database["public"]["Enums"]["classification_scope_kind_enum"]
          selection_rule_version?: string
          snapshot_key?: string
          subject_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "topic_classification_population_snapsho_council_session_id_fkey"
            columns: ["council_session_id"]
            isOneToOne: false
            referencedRelation: "council_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_classification_releases: {
        Row: {
          consumer_type: string
          created_at: string
          id: string
          population_snapshot_id: string
          publication_state: Database["public"]["Enums"]["publication_state_enum"]
          published_at: string | null
          qa_status: Database["public"]["Enums"]["qa_status_enum"]
          release_key: string
          reviewed_at: string | null
          reviewed_by: string | null
          taxonomy_id: string
        }
        Insert: {
          consumer_type: string
          created_at?: string
          id?: string
          population_snapshot_id: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          published_at?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          release_key: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          taxonomy_id: string
        }
        Update: {
          consumer_type?: string
          created_at?: string
          id?: string
          population_snapshot_id?: string
          publication_state?: Database["public"]["Enums"]["publication_state_enum"]
          published_at?: string | null
          qa_status?: Database["public"]["Enums"]["qa_status_enum"]
          release_key?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          taxonomy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_classification_releases_population_snapshot_id_fkey"
            columns: ["population_snapshot_id"]
            isOneToOne: false
            referencedRelation: "topic_classification_population_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_classification_releases_taxonomy_id_fkey"
            columns: ["taxonomy_id"]
            isOneToOne: false
            referencedRelation: "policy_taxonomies"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_classification_runs: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          method: Database["public"]["Enums"]["topic_classification_method_enum"]
          model_name: string | null
          prompt_version: string | null
          started_at: string
          status: Database["public"]["Enums"]["topic_classification_status_enum"]
          taxonomy_id: string
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          method: Database["public"]["Enums"]["topic_classification_method_enum"]
          model_name?: string | null
          prompt_version?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["topic_classification_status_enum"]
          taxonomy_id: string
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          method?: Database["public"]["Enums"]["topic_classification_method_enum"]
          model_name?: string | null
          prompt_version?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["topic_classification_status_enum"]
          taxonomy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_classification_runs_taxonomy_id_fkey"
            columns: ["taxonomy_id"]
            isOneToOne: false
            referencedRelation: "policy_taxonomies"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_opinion: {
        Row: {
          opinion_id: string
          topic_id: string
          version_id: string
        }
        Insert: {
          opinion_id: string
          topic_id: string
          version_id: string
        }
        Update: {
          opinion_id?: string
          topic_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_opinion_opinion_id_fkey"
            columns: ["opinion_id"]
            isOneToOne: false
            referencedRelation: "interview_opinion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_opinion_topic_fk"
            columns: ["version_id", "topic_id"]
            isOneToOne: false
            referencedRelation: "topic"
            referencedColumns: ["version_id", "id"]
          },
          {
            foreignKeyName: "topic_opinion_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "topic_analysis_version"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      fiscal_expected_source_version_references: {
        Row: {
          consumer_id: string | null
          consumer_type: string | null
          evidence_id: string | null
          evidence_table: string | null
          source_version_id: string | null
        }
        Relationships: []
      }
      fiscal_import_batch_qa_counts: {
        Row: {
          batch_id: string | null
          pending_count: number | null
          validation_messages: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_verified_general_question_staging: {
        Args: { p_reviewed_by: string; p_staging_id: string }
        Returns: string
      }
      bill_status_group: {
        Args: { p_status: Database["public"]["Enums"]["bill_status_enum"] }
        Returns: string
      }
      bills_list_rows: {
        Args: {
          p_difficulty: Database["public"]["Enums"]["difficulty_level_enum"]
          p_interview_only?: boolean
          p_query?: string
        }
        Returns: {
          bill_number: string
          content_summary: string
          content_title: string
          council_session_id: string
          has_public_interview: boolean
          id: string
          is_review_completed: boolean
          name: string
          status: Database["public"]["Enums"]["bill_status_enum"]
          status_note: string
          status_order: number
          submitted_date: string
          thumbnail_key: string
          thumbnail_url: string
          updated_at: string
        }[]
      }
      bulk_publish_reports: {
        Args: {
          p_config_id: string
          p_max_moderation_score: number
          p_min_content_richness: number
        }
        Returns: number
      }
      classify_general_question_item_manually: {
        Args: {
          p_policy_topic_ids: string[]
          p_question_item_revision_id: string
          p_reviewed_by: string
        }
        Returns: string
      }
      count_bills_for_list_facets: {
        Args: {
          p_difficulty: Database["public"]["Enums"]["difficulty_level_enum"]
          p_interview_only?: boolean
          p_query?: string
          p_session_id?: string
          p_status_group?: string
          p_tag_id?: string
        }
        Returns: {
          count: number
          key: string
          kind: string
        }[]
      }
      count_bulk_publish_targets: {
        Args: {
          p_config_id: string
          p_max_moderation_score: number
          p_min_content_richness: number
        }
        Returns: number
      }
      count_public_reports_by_bill_ids: {
        Args: { p_bill_ids: string[] }
        Returns: {
          bill_id: string
          report_count: number
        }[]
      }
      count_public_reports_by_stance: {
        Args: { p_bill_id: string }
        Returns: {
          count: number
          stance: string
        }[]
      }
      count_reactions_by_report_ids: {
        Args: { report_ids: string[] }
        Returns: {
          cnt: number
          interview_report_id: string
          reaction_type: string
        }[]
      }
      count_sessions_by_config_ids: {
        Args: { p_config_ids: string[] }
        Returns: {
          interview_config_id: string
          session_count: number
        }[]
      }
      create_topic_classification_population_snapshot: {
        Args: {
          p_consumer_type: string
          p_council_session_id?: string
          p_fiscal_year?: number
          p_period_end?: string
          p_period_start?: string
          p_scope_kind: Database["public"]["Enums"]["classification_scope_kind_enum"]
          p_selection_rule_version: string
          p_snapshot_key: string
        }
        Returns: string
      }
      extract_assistant_question_id: {
        Args: { content: string }
        Returns: string
      }
      finalize_ingestion_parse_run: {
        Args: {
          p_finished_at?: string
          p_parse_run_id: string
          p_parse_stats: Json
          p_status: Database["public"]["Enums"]["ingestion_parse_status_enum"]
        }
        Returns: undefined
      }
      find_open_data_interview_reports: {
        Args: {
          p_cursor_created_at?: string
          p_cursor_id?: string
          p_limit: number
          p_min_public_reports: number
        }
        Returns: {
          bill_id: string
          bill_name: string
          created_at: string
          interview_session_id: string
          opinions: Json
          report_id: string
          role: string
          role_description: string
          role_title: string
          stance: string
          summary: string
        }[]
      }
      find_public_reports_by_bill_id_ordered_by_reactions: {
        Args: {
          p_bill_id: string
          p_limit?: number
          p_offset?: number
          p_sort_order?: string
          p_stance?: string
        }
        Returns: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["interview_report_role_enum"]
          role_title: string
          stance: Database["public"]["Enums"]["stance_type_enum"]
          summary: string
          total_content_richness: number
        }[]
      }
      find_sessions_ordered_by_helpful_count: {
        Args: {
          p_ascending?: boolean
          p_config_id: string
          p_limit?: number
          p_offset?: number
          p_role?: string
          p_stance?: string
          p_status?: string
          p_visibility?: string
        }
        Returns: {
          session_id: string
        }[]
      }
      find_sessions_ordered_by_message_count: {
        Args: {
          p_ascending?: boolean
          p_config_id: string
          p_limit?: number
          p_offset?: number
          p_role?: string
          p_stance?: string
          p_status?: string
          p_visibility?: string
        }
        Returns: {
          session_id: string
        }[]
      }
      find_sessions_ordered_by_moderation_score: {
        Args: {
          p_ascending?: boolean
          p_config_id: string
          p_limit?: number
          p_offset?: number
          p_role?: string
          p_stance?: string
          p_status?: string
          p_visibility?: string
        }
        Returns: {
          session_id: string
        }[]
      }
      find_sessions_ordered_by_total_content_richness: {
        Args: {
          p_ascending?: boolean
          p_config_id: string
          p_limit?: number
          p_offset?: number
          p_role?: string
          p_stance?: string
          p_status?: string
          p_visibility?: string
        }
        Returns: {
          session_id: string
        }[]
      }
      get_admin_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          last_sign_in_at: string
        }[]
      }
      get_chat_usage_metrics: {
        Args: { p_bill_id?: string; p_from?: string; p_to?: string }
        Returns: {
          event_count: number
          prompt_name: string
          total_cost_usd: number
          total_tokens: number
          unique_session_count: number
          unique_user_count: number
        }[]
      }
      get_interview_message_counts: {
        Args: { session_ids: string[] }
        Returns: {
          interview_session_id: string
          message_count: number
        }[]
      }
      get_interview_metrics_by_bill: {
        Args: { p_bill_id?: string }
        Returns: {
          bill_id: string
          bill_name: string
          completed_count: number
          completion_rate: number
          conducted_count: number
          total_duration_seconds: number
        }[]
      }
      get_interview_statistics: {
        Args: { p_config_id: string }
        Returns: {
          avg_cost_usd: number
          avg_message_count: number
          avg_rating: number
          avg_total_content_richness: number
          completed_sessions: number
          feedback_irrelevant_questions: number
          feedback_misunderstood: number
          feedback_not_aligned: number
          feedback_other: number
          feedback_too_many_questions: number
          median_duration_seconds: number
          public_by_user_count: number
          role_daily_life_affected_count: number
          role_general_citizen_count: number
          role_subject_expert_count: number
          role_work_related_count: number
          stance_against_count: number
          stance_for_count: number
          stance_neutral_count: number
          total_cost_usd: number
          total_duration_seconds: number
          total_sessions: number
        }[]
      }
      get_question_answer_counts: {
        Args: { p_config_id: string }
        Returns: {
          answered_session_count: number
          asked_session_count: number
          question: string
          question_id: string
          question_order: number
        }[]
      }
      increment_api_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_start: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      list_published_general_question_appearances: {
        Args: {
          p_cursor_at?: string
          p_cursor_id?: string
          p_limit?: number
          p_question_kind?: string
          p_role_group?: string
          p_session_slug?: string
          p_topic_slug?: string
          p_year?: number
        }
        Returns: {
          appearance_id: string
          cursor_at: string
        }[]
      }
      mark_opinions_extracted: {
        Args: { p_extracted_at: string; p_ids: string[] }
        Returns: undefined
      }
      normalize_search_text: { Args: { value: string }; Returns: string }
      publish_general_question_classification_release: {
        Args: { p_release_key: string; p_reviewed_by: string }
        Returns: string
      }
      publish_topic_analysis_version: {
        Args: { p_version_id: string }
        Returns: undefined
      }
      refresh_general_question_batch_publication: {
        Args: { p_reviewed_by: string; p_staging_id: string }
        Returns: undefined
      }
      replace_bill_tags: {
        Args: {
          p_bill_id: string
          p_managed_tag_ids: string[]
          p_next_tag_ids: string[]
        }
        Returns: undefined
      }
      save_fiscal_staging: {
        Args: {
          p_discovered_count: number
          p_finished_at?: string
          p_fiscal_year: number
          p_parse_run_id: string
          p_parse_status?: Database["public"]["Enums"]["ingestion_parse_status_enum"]
          p_profile_key: string
          p_profile_version: string
          p_rows: Json
          p_source_kind: Database["public"]["Enums"]["fiscal_source_kind_enum"]
          p_source_version_id: string
          p_validation_summary?: Json
        }
        Returns: string
      }
      save_general_question_staging: {
        Args: {
          p_council_session_id?: string
          p_discovered_count: number
          p_finished_at?: string
          p_parse_run_id: string
          p_parse_status?: Database["public"]["Enums"]["ingestion_parse_status_enum"]
          p_rows: Json
          p_source_version_id: string
          p_validation_errors?: Json
        }
        Returns: string
      }
      search_bills_for_list: {
        Args: {
          p_difficulty: Database["public"]["Enums"]["difficulty_level_enum"]
          p_interview_only?: boolean
          p_limit?: number
          p_offset?: number
          p_query?: string
          p_session_id?: string
          p_sort?: string
          p_status_group?: string
          p_tag_id?: string
        }
        Returns: {
          bill_number: string
          content_summary: string
          content_title: string
          has_public_interview: boolean
          id: string
          is_review_completed: boolean
          name: string
          public_report_count: number
          status: Database["public"]["Enums"]["bill_status_enum"]
          status_note: string
          submitted_date: string
          tags: Json
          thumbnail_key: string
          thumbnail_url: string
          total_count: number
          updated_at: string
        }[]
      }
      set_active_council_session: {
        Args: { target_session_id: string }
        Returns: undefined
      }
      sum_chat_usage_cost: {
        Args: { from_iso: string; to_iso: string }
        Returns: number
      }
      transition_ingestion_source_version_retention: {
        Args: {
          p_changed_by: string
          p_private_object_key?: string
          p_reason: string
          p_reparse_available_until?: string
          p_source_version_id: string
          p_to_state: Database["public"]["Enums"]["source_artifact_retention_state_enum"]
        }
        Returns: undefined
      }
      unpublish_reports_by_config_id: {
        Args: { p_config_id: string }
        Returns: undefined
      }
      upsert_ingested_bill: {
        Args: {
          p_bill_number: string
          p_category: Database["public"]["Enums"]["bill_category_enum"]
          p_committee_id?: string
          p_committee_result?: string
          p_council_session_id: string
          p_decided_on?: string
          p_document_url?: string
          p_legal_basis?: string
          p_name: string
          p_number_kind: Database["public"]["Enums"]["bill_number_kind_enum"]
          p_number_value: number
          p_source_record_key?: string
          p_source_url: string
          p_status: Database["public"]["Enums"]["bill_status_enum"]
          p_status_note?: string
          p_submitted_on?: string
          p_submitter?: Database["public"]["Enums"]["bill_submitter_enum"]
        }
        Returns: string
      }
    }
    Enums: {
      bill_category_enum:
        | "ordinance"
        | "budget"
        | "settlement"
        | "contract"
        | "provisional_approval"
        | "report"
        | "personnel"
        | "opinion_paper"
        | "petition"
        | "other"
      bill_number_kind_enum:
        | "gi"
        | "hou"
        | "nin"
        | "hatsugi"
        | "seigan"
        | "chinjo"
      bill_publish_status: "draft" | "published" | "coming_soon"
      bill_status_enum:
        | "preparing"
        | "submitted"
        | "in_committee"
        | "passed"
        | "rejected"
        | "consented"
        | "approved"
        | "certified"
        | "adopted"
        | "not_adopted"
        | "continued"
        | "withdrawn"
        | "reported"
      bill_submitter_enum: "mayor" | "member" | "committee" | "citizen"
      chat_role_enum: "user" | "system" | "assistant"
      classification_coverage_disposition_enum:
        | "classified"
        | "not_applicable"
        | "excluded"
      classification_scope_kind_enum:
        | "council_session"
        | "date_range"
        | "fiscal_year"
      committee_kind_enum: "standing" | "steering" | "special"
      council_meeting_evidence_role_enum:
        | "schedule"
        | "record"
        | "video"
        | "other"
      council_meeting_kind_enum:
        | "plenary"
        | "committee"
        | "steering"
        | "all_members"
        | "other"
      council_meeting_status_enum:
        | "scheduled"
        | "held"
        | "cancelled"
        | "unknown"
      council_session_kind_enum: "regular" | "extraordinary"
      coverage_state_enum:
        | "uncollected"
        | "source_not_published"
        | "source_unavailable"
        | "not_applicable"
        | "partial"
        | "collected"
        | "error"
      debate_stance_enum: "for" | "against"
      difficulty_level_enum: "normal" | "hard"
      extraction_method_enum: "parser" | "manual"
      faction_vote_enum: "for" | "against" | "split" | "excluded"
      fiscal_account_type_enum: "general" | "special" | "public_enterprise"
      fiscal_bill_match_method_enum:
        | "exact_fields"
        | "manual"
        | "imported"
        | "candidate"
      fiscal_bill_relationship_enum:
        | "proposes"
        | "passes"
        | "amends"
        | "recognizes"
        | "related_resolution"
      fiscal_classification_direction_enum: "from" | "to"
      fiscal_classification_relation_kind_enum:
        | "rename"
        | "split"
        | "merge"
        | "equivalent"
      fiscal_data_kind_enum:
        | "document_edition"
        | "scope_membership"
        | "amount_set"
        | "classification"
        | "classification_mapping"
        | "indicator"
        | "bill_link"
      fiscal_decision_stage_enum: "proposed" | "passed" | "not_applicable"
      fiscal_event_kind_enum:
        | "initial_budget"
        | "supplementary_budget"
        | "current_snapshot"
        | "available_budget_snapshot"
        | "settlement"
      fiscal_evidence_role_enum:
        | "primary"
        | "corroborating"
        | "calculation_input"
      fiscal_import_status_enum:
        | "running"
        | "awaiting_review"
        | "approved"
        | "applied"
        | "failed"
      fiscal_measure_enum:
        | "revenue_budget"
        | "expenditure_budget"
        | "revenue_budget_delta"
        | "expenditure_budget_delta"
        | "revenue_budget_after"
        | "expenditure_budget_after"
        | "revenue_actual"
        | "expenditure_actual"
        | "income"
        | "expense"
        | "asset"
        | "liability"
      fiscal_membership_role_enum: "included" | "eliminated" | "reference_only"
      fiscal_null_reason_enum:
        | "not_published"
        | "not_applicable"
        | "unreadable"
        | "suppressed"
        | "unknown_dash"
      fiscal_source_kind_enum:
        | "budget_overview"
        | "execution_report"
        | "settlement_report"
        | "major_measures"
        | "fiscal_comparison"
        | "public_accounting"
      fiscal_source_unit_enum:
        | "yen"
        | "thousand_yen"
        | "ten_thousand_yen"
        | "million_yen"
        | "hundred_million_yen"
      fiscal_staging_change_kind_enum:
        | "new"
        | "changed"
        | "unchanged"
        | "missing"
        | "ambiguous"
      fiscal_staging_record_kind_enum:
        | "document_metadata"
        | "scope_membership"
        | "coverage"
        | "classification"
        | "classification_mapping"
        | "amount"
        | "bill_link"
      fiscal_validation_comparison_role_enum:
        | "baseline"
        | "compared"
        | "calculation_input"
        | "output"
      fiscal_validation_scope_enum:
        | "source_parse"
        | "amount_set"
        | "cross_source"
      fiscal_validation_severity_enum: "info" | "warning" | "hard_error"
      fiscal_validation_status_enum:
        | "pending"
        | "passed"
        | "reviewed"
        | "failed"
      general_question_change_kind_enum:
        | "new"
        | "changed"
        | "unchanged"
        | "missing"
        | "ambiguous"
      general_question_delivery_method_enum:
        | "all_at_once"
        | "one_by_one"
        | "combined"
        | "other"
        | "unknown"
      general_question_evidence_role_enum: "primary" | "supplementary"
      general_question_import_status_enum:
        | "running"
        | "awaiting_review"
        | "approved"
        | "applied"
        | "failed"
      general_question_kind_enum:
        | "representative"
        | "personal"
        | "other"
        | "unknown"
      general_question_role_group_enum:
        | "mayor"
        | "deputy_mayor"
        | "superintendent"
        | "department_head"
        | "division_head"
        | "administration_other"
        | "unknown"
      general_question_session_disposition_enum:
        | "held"
        | "not_held"
        | "not_applicable"
        | "unknown"
      ingestion_parse_status_enum:
        | "running"
        | "completed"
        | "failed"
        | "rejected"
      interview_config_status_enum: "public" | "closed"
      interview_feedback_tag_enum:
        | "irrelevant_questions"
        | "not_aligned"
        | "misunderstood"
        | "too_many_questions"
        | "other"
      interview_mode_enum: "loop" | "bulk" | "targeted"
      interview_report_role_enum:
        | "subject_expert"
        | "work_related"
        | "daily_life_affected"
        | "general_citizen"
      interview_role_enum: "assistant" | "user"
      moderation_status_enum: "ok" | "warning" | "ng"
      publication_state_enum: "draft" | "reviewed" | "published" | "superseded"
      qa_status_enum: "pending" | "verified" | "rejected"
      record_presence_enum: "present" | "absent" | "unknown"
      source_artifact_retention_state_enum:
        | "pending"
        | "retained"
        | "expired"
        | "not_permitted"
      source_availability_enum: "available" | "not_published" | "unavailable"
      source_support_status_enum:
        | "official_supported"
        | "empirical_verified"
        | "partial"
        | "unknown"
      stance_type_enum:
        | "for"
        | "against"
        | "neutral"
        | "conditional_for"
        | "conditional_against"
        | "considering"
        | "continued_deliberation"
        | "free_vote"
      topic_analysis_status: "pending" | "running" | "completed" | "failed"
      topic_classification_method_enum: "ai" | "rule" | "manual"
      topic_classification_status_enum:
        | "running"
        | "completed"
        | "failed"
        | "rejected"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      bill_category_enum: [
        "ordinance",
        "budget",
        "settlement",
        "contract",
        "provisional_approval",
        "report",
        "personnel",
        "opinion_paper",
        "petition",
        "other",
      ],
      bill_number_kind_enum: [
        "gi",
        "hou",
        "nin",
        "hatsugi",
        "seigan",
        "chinjo",
      ],
      bill_publish_status: ["draft", "published", "coming_soon"],
      bill_status_enum: [
        "preparing",
        "submitted",
        "in_committee",
        "passed",
        "rejected",
        "consented",
        "approved",
        "certified",
        "adopted",
        "not_adopted",
        "continued",
        "withdrawn",
        "reported",
      ],
      bill_submitter_enum: ["mayor", "member", "committee", "citizen"],
      chat_role_enum: ["user", "system", "assistant"],
      classification_coverage_disposition_enum: [
        "classified",
        "not_applicable",
        "excluded",
      ],
      classification_scope_kind_enum: [
        "council_session",
        "date_range",
        "fiscal_year",
      ],
      committee_kind_enum: ["standing", "steering", "special"],
      council_meeting_evidence_role_enum: [
        "schedule",
        "record",
        "video",
        "other",
      ],
      council_meeting_kind_enum: [
        "plenary",
        "committee",
        "steering",
        "all_members",
        "other",
      ],
      council_meeting_status_enum: [
        "scheduled",
        "held",
        "cancelled",
        "unknown",
      ],
      council_session_kind_enum: ["regular", "extraordinary"],
      coverage_state_enum: [
        "uncollected",
        "source_not_published",
        "source_unavailable",
        "not_applicable",
        "partial",
        "collected",
        "error",
      ],
      debate_stance_enum: ["for", "against"],
      difficulty_level_enum: ["normal", "hard"],
      extraction_method_enum: ["parser", "manual"],
      faction_vote_enum: ["for", "against", "split", "excluded"],
      fiscal_account_type_enum: ["general", "special", "public_enterprise"],
      fiscal_bill_match_method_enum: [
        "exact_fields",
        "manual",
        "imported",
        "candidate",
      ],
      fiscal_bill_relationship_enum: [
        "proposes",
        "passes",
        "amends",
        "recognizes",
        "related_resolution",
      ],
      fiscal_classification_direction_enum: ["from", "to"],
      fiscal_classification_relation_kind_enum: [
        "rename",
        "split",
        "merge",
        "equivalent",
      ],
      fiscal_data_kind_enum: [
        "document_edition",
        "scope_membership",
        "amount_set",
        "classification",
        "classification_mapping",
        "indicator",
        "bill_link",
      ],
      fiscal_decision_stage_enum: ["proposed", "passed", "not_applicable"],
      fiscal_event_kind_enum: [
        "initial_budget",
        "supplementary_budget",
        "current_snapshot",
        "available_budget_snapshot",
        "settlement",
      ],
      fiscal_evidence_role_enum: [
        "primary",
        "corroborating",
        "calculation_input",
      ],
      fiscal_import_status_enum: [
        "running",
        "awaiting_review",
        "approved",
        "applied",
        "failed",
      ],
      fiscal_measure_enum: [
        "revenue_budget",
        "expenditure_budget",
        "revenue_budget_delta",
        "expenditure_budget_delta",
        "revenue_budget_after",
        "expenditure_budget_after",
        "revenue_actual",
        "expenditure_actual",
        "income",
        "expense",
        "asset",
        "liability",
      ],
      fiscal_membership_role_enum: ["included", "eliminated", "reference_only"],
      fiscal_null_reason_enum: [
        "not_published",
        "not_applicable",
        "unreadable",
        "suppressed",
        "unknown_dash",
      ],
      fiscal_source_kind_enum: [
        "budget_overview",
        "execution_report",
        "settlement_report",
        "major_measures",
        "fiscal_comparison",
        "public_accounting",
      ],
      fiscal_source_unit_enum: [
        "yen",
        "thousand_yen",
        "ten_thousand_yen",
        "million_yen",
        "hundred_million_yen",
      ],
      fiscal_staging_change_kind_enum: [
        "new",
        "changed",
        "unchanged",
        "missing",
        "ambiguous",
      ],
      fiscal_staging_record_kind_enum: [
        "document_metadata",
        "scope_membership",
        "coverage",
        "classification",
        "classification_mapping",
        "amount",
        "bill_link",
      ],
      fiscal_validation_comparison_role_enum: [
        "baseline",
        "compared",
        "calculation_input",
        "output",
      ],
      fiscal_validation_scope_enum: [
        "source_parse",
        "amount_set",
        "cross_source",
      ],
      fiscal_validation_severity_enum: ["info", "warning", "hard_error"],
      fiscal_validation_status_enum: [
        "pending",
        "passed",
        "reviewed",
        "failed",
      ],
      general_question_change_kind_enum: [
        "new",
        "changed",
        "unchanged",
        "missing",
        "ambiguous",
      ],
      general_question_delivery_method_enum: [
        "all_at_once",
        "one_by_one",
        "combined",
        "other",
        "unknown",
      ],
      general_question_evidence_role_enum: ["primary", "supplementary"],
      general_question_import_status_enum: [
        "running",
        "awaiting_review",
        "approved",
        "applied",
        "failed",
      ],
      general_question_kind_enum: [
        "representative",
        "personal",
        "other",
        "unknown",
      ],
      general_question_role_group_enum: [
        "mayor",
        "deputy_mayor",
        "superintendent",
        "department_head",
        "division_head",
        "administration_other",
        "unknown",
      ],
      general_question_session_disposition_enum: [
        "held",
        "not_held",
        "not_applicable",
        "unknown",
      ],
      ingestion_parse_status_enum: [
        "running",
        "completed",
        "failed",
        "rejected",
      ],
      interview_config_status_enum: ["public", "closed"],
      interview_feedback_tag_enum: [
        "irrelevant_questions",
        "not_aligned",
        "misunderstood",
        "too_many_questions",
        "other",
      ],
      interview_mode_enum: ["loop", "bulk", "targeted"],
      interview_report_role_enum: [
        "subject_expert",
        "work_related",
        "daily_life_affected",
        "general_citizen",
      ],
      interview_role_enum: ["assistant", "user"],
      moderation_status_enum: ["ok", "warning", "ng"],
      publication_state_enum: ["draft", "reviewed", "published", "superseded"],
      qa_status_enum: ["pending", "verified", "rejected"],
      record_presence_enum: ["present", "absent", "unknown"],
      source_artifact_retention_state_enum: [
        "pending",
        "retained",
        "expired",
        "not_permitted",
      ],
      source_availability_enum: ["available", "not_published", "unavailable"],
      source_support_status_enum: [
        "official_supported",
        "empirical_verified",
        "partial",
        "unknown",
      ],
      stance_type_enum: [
        "for",
        "against",
        "neutral",
        "conditional_for",
        "conditional_against",
        "considering",
        "continued_deliberation",
        "free_vote",
      ],
      topic_analysis_status: ["pending", "running", "completed", "failed"],
      topic_classification_method_enum: ["ai", "rule", "manual"],
      topic_classification_status_enum: [
        "running",
        "completed",
        "failed",
        "rejected",
      ],
    },
  },
} as const
