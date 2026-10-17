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
      arena_chat_messages: {
        Row: { id: string; group_id: string; user_id: string; text: string; created_at: string }
        Insert: { id?: string; group_id: string; user_id: string; text: string; created_at?: string }
        Update: { id?: string; group_id?: string; user_id?: string; text?: string; created_at?: string }
        Relationships: []
      }
      arena_teams: {
        Row: { id: string; group_id: string; name: string; created_at: string }
        Insert: { id?: string; group_id: string; name: string; created_at?: string }
        Update: { id?: string; group_id?: string; name?: string; created_at?: string }
        Relationships: []
      }
      arena_daily_scores: {
        Row: {
          created_at: string
          current_streak: number | null
          date: string
          group_id: string
          hydration_score: number | null
          id: string
          nutrition_score: number | null
          photo_url: string | null
          total_score: number | null
          updated_at: string
          user_id: string
          workout_score: number | null
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          date?: string
          group_id: string
          hydration_score?: number | null
          id?: string
          nutrition_score?: number | null
          photo_url?: string | null
          total_score?: number | null
          updated_at?: string
          user_id: string
          workout_score?: number | null
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          date?: string
          group_id?: string
          hydration_score?: number | null
          id?: string
          nutrition_score?: number | null
          photo_url?: string | null
          total_score?: number | null
          updated_at?: string
          user_id?: string
          workout_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "arena_daily_scores_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "arena_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_feed_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          text?: string
          created_at?: string
        }
        Relationships: []
      }
      arena_feed_posts: {
        Row: {
          content: string | null
          created_at: string
          group_id: string
          hydration_score: number | null
          id: string
          nutrition_score: number | null
          photo_url: string | null
          post_type: string
          total_score: number | null
          user_id: string
          workout_score: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          group_id: string
          hydration_score?: number | null
          id?: string
          nutrition_score?: number | null
          photo_url?: string | null
          post_type?: string
          total_score?: number | null
          user_id: string
          workout_score?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string
          group_id?: string
          hydration_score?: number | null
          id?: string
          nutrition_score?: number | null
          photo_url?: string | null
          post_type?: string
          total_score?: number | null
          user_id?: string
          workout_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "arena_feed_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "arena_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_feed_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_feed_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "arena_feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      arena_groups: {
        Row: {
          avatar_url: string | null
          calendar_members_only: boolean
          calendar_show_daily_score: boolean
          calendar_show_photos: boolean
          created_at: string
          creator_id: string
          deadline_hour: string | null
          description: string | null
          end_date: string | null
          group_type: string
          id: string
          intensity: string
          name: string
          photo_required: boolean
          pillar_hydration: boolean
          pillar_nutrition: boolean
          pillar_workout: boolean
          ranking_balance: boolean
          ranking_evolution: boolean
          ranking_resets_weekly: boolean
          ranking_streak: boolean
          ranking_total_score: boolean
          start_date: string
          status: string
          streak_breaks_on_fail: boolean
          transparency_level: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          calendar_members_only?: boolean
          calendar_show_daily_score?: boolean
          calendar_show_photos?: boolean
          created_at?: string
          creator_id: string
          deadline_hour?: string | null
          description?: string | null
          end_date?: string | null
          group_type?: string
          id?: string
          intensity?: string
          name: string
          photo_required?: boolean
          pillar_hydration?: boolean
          pillar_nutrition?: boolean
          pillar_workout?: boolean
          ranking_balance?: boolean
          ranking_evolution?: boolean
          ranking_resets_weekly?: boolean
          ranking_streak?: boolean
          ranking_total_score?: boolean
          start_date?: string
          status?: string
          streak_breaks_on_fail?: boolean
          transparency_level?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          calendar_members_only?: boolean
          calendar_show_daily_score?: boolean
          calendar_show_photos?: boolean
          created_at?: string
          creator_id?: string
          deadline_hour?: string | null
          description?: string | null
          end_date?: string | null
          group_type?: string
          id?: string
          intensity?: string
          name?: string
          photo_required?: boolean
          pillar_hydration?: boolean
          pillar_nutrition?: boolean
          pillar_workout?: boolean
          ranking_balance?: boolean
          ranking_evolution?: boolean
          ranking_resets_weekly?: boolean
          ranking_streak?: boolean
          ranking_total_score?: boolean
          start_date?: string
          status?: string
          streak_breaks_on_fail?: boolean
          transparency_level?: string
          updated_at?: string
        }
        Relationships: []
      }
      arena_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          joined_at: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          joined_at?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          joined_at?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arena_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "arena_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      astral_profiles: {
        Row: {
          ascendant_sign: string | null
          birth_city: string | null
          birth_date: string
          birth_lat: number | null
          birth_lon: number | null
          birth_time: string | null
          created_at: string
          id: string
          life_path_number: number | null
          moon_sign: string | null
          sun_sign: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ascendant_sign?: string | null
          birth_city?: string | null
          birth_date: string
          birth_lat?: number | null
          birth_lon?: number | null
          birth_time?: string | null
          created_at?: string
          id?: string
          life_path_number?: number | null
          moon_sign?: string | null
          sun_sign?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ascendant_sign?: string | null
          birth_city?: string | null
          birth_date?: string
          birth_lat?: number | null
          birth_lon?: number | null
          birth_time?: string | null
          created_at?: string
          id?: string
          life_path_number?: number | null
          moon_sign?: string | null
          sun_sign?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      astrological_houses: {
        Row: {
          created_at: string
          house_number: number
          id: string
          sign_on_cusp: string
          user_id: string
        }
        Insert: {
          created_at?: string
          house_number: number
          id?: string
          sign_on_cusp: string
          user_id: string
        }
        Update: {
          created_at?: string
          house_number?: number
          id?: string
          sign_on_cusp?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_balances: {
        Row: {
          bank_name: string
          created_at: string
          id: string
          initial_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_name: string
          created_at?: string
          id?: string
          initial_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_name?: string
          created_at?: string
          id?: string
          initial_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contraceptive_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          method_id: string
          notes: string | null
          skip_reason: string | null
          skipped: boolean
          taken: boolean
          taken_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          method_id: string
          notes?: string | null
          skip_reason?: string | null
          skipped?: boolean
          taken?: boolean
          taken_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          method_id?: string
          notes?: string | null
          skip_reason?: string | null
          skipped?: boolean
          taken?: boolean
          taken_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contraceptive_logs_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "contraceptive_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      contraceptive_methods: {
        Row: {
          active: boolean
          created_at: string
          end_date: string | null
          id: string
          injection_interval_days: number | null
          method_type: string
          name: string
          notes: string | null
          pill_break_days: number
          pill_cycle_days: number
          pill_time: string | null
          renewal_reminder_days: number
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          injection_interval_days?: number | null
          method_type: string
          name: string
          notes?: string | null
          pill_break_days?: number
          pill_cycle_days?: number
          pill_time?: string | null
          renewal_reminder_days?: number
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          injection_interval_days?: number | null
          method_type?: string
          name?: string
          notes?: string | null
          pill_break_days?: number
          pill_cycle_days?: number
          pill_time?: string | null
          renewal_reminder_days?: number
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cosmic_journal: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          mood: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cost_centers: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      couple_dates: {
        Row: {
          id: string
          user_id: string
          title: string
          category: string
          status: string
          location: string | null
          how_to: string | null
          notes: string | null
          items: Json
          schedule: Json
          costs: Json
          cost_estimate: number | null
          distance_km: number | null
          planned_date: string | null
          done_date: string | null
          rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category?: string
          status?: string
          location?: string | null
          how_to?: string | null
          notes?: string | null
          items?: Json
          schedule?: Json
          costs?: Json
          cost_estimate?: number | null
          planned_date?: string | null
          done_date?: string | null
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          category?: string
          status?: string
          location?: string | null
          how_to?: string | null
          notes?: string | null
          items?: Json
          schedule?: Json
          costs?: Json
          cost_estimate?: number | null
          distance_km?: number | null
          planned_date?: string | null
          done_date?: string | null
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          id: string
          user_id: string
          scope: string
          name: string
          category: string
          status: string
          address: string | null
          instagram: string | null
          maps_url: string | null
          price: number | null
          notes: string | null
          rating: number | null
          lat: number | null
          lng: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          scope?: string
          name: string
          category?: string
          status?: string
          address?: string | null
          instagram?: string | null
          maps_url?: string | null
          price?: number | null
          notes?: string | null
          rating?: number | null
          lat?: number | null
          lng?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          scope?: string
          name?: string
          category?: string
          status?: string
          address?: string | null
          instagram?: string | null
          maps_url?: string | null
          price?: number | null
          notes?: string | null
          rating?: number | null
          lat?: number | null
          lng?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      crypto_daily_moves: {
        Row: {
          coin: string
          created_at: string
          date: string
          exchange: string
          id: string
          long_current_price: number | null
          long_entry_price: number | null
          long_initial_margin: number | null
          long_leverage: number | null
          long_maintenance_margin: number | null
          long_pnl_pct: number | null
          long_pnl_usd: number | null
          long_qty: number | null
          long_status: string | null
          methodology: string | null
          short_current_price: number | null
          short_entry_price: number | null
          short_initial_margin: number | null
          short_leverage: number | null
          short_maintenance_margin: number | null
          short_pnl_pct: number | null
          short_pnl_usd: number | null
          short_qty: number | null
          short_status: string | null
          time: string | null
          total_pnl_coin_usdt: number | null
          total_value_coin_usdt: number | null
          updated_at: string
          usd_brl_rate: number | null
          user_id: string
        }
        Insert: {
          coin: string
          created_at?: string
          date?: string
          exchange?: string
          id?: string
          long_current_price?: number | null
          long_entry_price?: number | null
          long_initial_margin?: number | null
          long_leverage?: number | null
          long_maintenance_margin?: number | null
          long_pnl_pct?: number | null
          long_pnl_usd?: number | null
          long_qty?: number | null
          long_status?: string | null
          methodology?: string | null
          short_current_price?: number | null
          short_entry_price?: number | null
          short_initial_margin?: number | null
          short_leverage?: number | null
          short_maintenance_margin?: number | null
          short_pnl_pct?: number | null
          short_pnl_usd?: number | null
          short_qty?: number | null
          short_status?: string | null
          time?: string | null
          total_pnl_coin_usdt?: number | null
          total_value_coin_usdt?: number | null
          updated_at?: string
          usd_brl_rate?: number | null
          user_id: string
        }
        Update: {
          coin?: string
          created_at?: string
          date?: string
          exchange?: string
          id?: string
          long_current_price?: number | null
          long_entry_price?: number | null
          long_initial_margin?: number | null
          long_leverage?: number | null
          long_maintenance_margin?: number | null
          long_pnl_pct?: number | null
          long_pnl_usd?: number | null
          long_qty?: number | null
          long_status?: string | null
          methodology?: string | null
          short_current_price?: number | null
          short_entry_price?: number | null
          short_initial_margin?: number | null
          short_leverage?: number | null
          short_maintenance_margin?: number | null
          short_pnl_pct?: number | null
          short_pnl_usd?: number | null
          short_qty?: number | null
          short_status?: string | null
          time?: string | null
          total_pnl_coin_usdt?: number | null
          total_value_coin_usdt?: number | null
          updated_at?: string
          usd_brl_rate?: number | null
          user_id?: string
        }
        Relationships: []
      }
      crypto_deposits: {
        Row: {
          added_brl: number | null
          added_ia: number | null
          added_usd: number | null
          created_at: string
          date: string
          exchange: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          added_brl?: number | null
          added_ia?: number | null
          added_usd?: number | null
          created_at?: string
          date?: string
          exchange?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          added_brl?: number | null
          added_ia?: number | null
          added_usd?: number | null
          created_at?: string
          date?: string
          exchange?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crypto_snapshots: {
        Row: {
          account_type: string
          available_balance_usd: number | null
          created_at: string
          date: string
          equity_usd: number | null
          exchange: string
          id: string
          include_in_patrimony: boolean | null
          margin_mode: string | null
          margin_used_usd: number | null
          positions_value_usd: number | null
          time: string | null
          total_pnl_pct: number | null
          total_pnl_usd: number | null
          total_positions: number | null
          unrealized_pnl_usd: number | null
          updated_at: string
          usd_brl_rate: number | null
          user_id: string
          wallet_balance_usd: number | null
        }
        Insert: {
          account_type?: string
          available_balance_usd?: number | null
          created_at?: string
          date?: string
          equity_usd?: number | null
          exchange: string
          id?: string
          include_in_patrimony?: boolean | null
          margin_mode?: string | null
          margin_used_usd?: number | null
          positions_value_usd?: number | null
          time?: string | null
          total_pnl_pct?: number | null
          total_pnl_usd?: number | null
          total_positions?: number | null
          unrealized_pnl_usd?: number | null
          updated_at?: string
          usd_brl_rate?: number | null
          user_id: string
          wallet_balance_usd?: number | null
        }
        Update: {
          account_type?: string
          available_balance_usd?: number | null
          created_at?: string
          date?: string
          equity_usd?: number | null
          exchange?: string
          id?: string
          include_in_patrimony?: boolean | null
          margin_mode?: string | null
          margin_used_usd?: number | null
          positions_value_usd?: number | null
          time?: string | null
          total_pnl_pct?: number | null
          total_pnl_usd?: number | null
          total_positions?: number | null
          unrealized_pnl_usd?: number | null
          updated_at?: string
          usd_brl_rate?: number | null
          user_id?: string
          wallet_balance_usd?: number | null
        }
        Relationships: []
      }
      crypto_strategies: {
        Row: {
          access_code: string | null
          coin: string
          created_at: string
          created_date: string | null
          exchange: string
          id: string
          leverage: number | null
          long_1st_order_size: number | null
          long_double_1st_order: boolean | null
          long_next_order_ratios: number[] | null
          long_next_order_trailing: string | null
          long_order_layers: number | null
          long_tp_ratio: number | null
          long_trailing_tp_ratio: number | null
          position_type: string | null
          short_1st_order_size: number | null
          short_double_1st_order: boolean | null
          short_next_order_ratios: number[] | null
          short_next_order_trailing: string | null
          short_order_layers: number | null
          short_tp_ratio: number | null
          short_trailing_tp_ratio: number | null
          stop_loss_per_coin: string | null
          strategy_name: string
          take_profit_setting: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_code?: string | null
          coin: string
          created_at?: string
          created_date?: string | null
          exchange?: string
          id?: string
          leverage?: number | null
          long_1st_order_size?: number | null
          long_double_1st_order?: boolean | null
          long_next_order_ratios?: number[] | null
          long_next_order_trailing?: string | null
          long_order_layers?: number | null
          long_tp_ratio?: number | null
          long_trailing_tp_ratio?: number | null
          position_type?: string | null
          short_1st_order_size?: number | null
          short_double_1st_order?: boolean | null
          short_next_order_ratios?: number[] | null
          short_next_order_trailing?: string | null
          short_order_layers?: number | null
          short_tp_ratio?: number | null
          short_trailing_tp_ratio?: number | null
          stop_loss_per_coin?: string | null
          strategy_name: string
          take_profit_setting?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_code?: string | null
          coin?: string
          created_at?: string
          created_date?: string | null
          exchange?: string
          id?: string
          leverage?: number | null
          long_1st_order_size?: number | null
          long_double_1st_order?: boolean | null
          long_next_order_ratios?: number[] | null
          long_next_order_trailing?: string | null
          long_order_layers?: number | null
          long_tp_ratio?: number | null
          long_trailing_tp_ratio?: number | null
          position_type?: string | null
          short_1st_order_size?: number | null
          short_double_1st_order?: boolean | null
          short_next_order_ratios?: number[] | null
          short_next_order_trailing?: string | null
          short_order_layers?: number | null
          short_tp_ratio?: number | null
          short_trailing_tp_ratio?: number | null
          stop_loss_per_coin?: string | null
          strategy_name?: string
          take_profit_setting?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_activities: {
        Row: {
          completed: boolean | null
          created_at: string
          date: string
          id: string
          repeat_daily: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          date: string
          id?: string
          repeat_daily?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          date?: string
          id?: string
          repeat_daily?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_energy: {
        Row: {
          created_at: string
          date: string
          energy_level: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          energy_level: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          energy_level?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_horoscopes: {
        Row: {
          affirmation: string | null
          career_insight: string | null
          created_at: string
          creativity_insight: string | null
          date: string
          focus_areas: Json | null
          horoscope_text: string | null
          id: string
          love_insight: string | null
          moon_phase: string | null
          sun_sign: string
          user_id: string
          wellness_insight: string | null
        }
        Insert: {
          affirmation?: string | null
          career_insight?: string | null
          created_at?: string
          creativity_insight?: string | null
          date?: string
          focus_areas?: Json | null
          horoscope_text?: string | null
          id?: string
          love_insight?: string | null
          moon_phase?: string | null
          sun_sign: string
          user_id: string
          wellness_insight?: string | null
        }
        Update: {
          affirmation?: string | null
          career_insight?: string | null
          created_at?: string
          creativity_insight?: string | null
          date?: string
          focus_areas?: Json | null
          horoscope_text?: string | null
          id?: string
          love_insight?: string | null
          moon_phase?: string | null
          sun_sign?: string
          user_id?: string
          wellness_insight?: string | null
        }
        Relationships: []
      }
      daily_tracking: {
        Row: {
          afternoon_snack_completed: boolean | null
          breakfast_completed: boolean | null
          created_at: string
          date: string
          dinner_completed: boolean | null
          hydration_schedule_completed: Json | null
          id: string
          lunch_completed: boolean | null
          medication_afternoon_completed: boolean | null
          medication_morning_completed: boolean | null
          morning_snack_completed: boolean | null
          night_snack_completed: boolean | null
          updated_at: string
          user_id: string
          water_ml: number | null
          workout_completed: boolean | null
          workout_notes: string | null
          workout_type: string | null
        }
        Insert: {
          afternoon_snack_completed?: boolean | null
          breakfast_completed?: boolean | null
          created_at?: string
          date: string
          dinner_completed?: boolean | null
          hydration_schedule_completed?: Json | null
          id?: string
          lunch_completed?: boolean | null
          medication_afternoon_completed?: boolean | null
          medication_morning_completed?: boolean | null
          morning_snack_completed?: boolean | null
          night_snack_completed?: boolean | null
          updated_at?: string
          user_id: string
          water_ml?: number | null
          workout_completed?: boolean | null
          workout_notes?: string | null
          workout_type?: string | null
        }
        Update: {
          afternoon_snack_completed?: boolean | null
          breakfast_completed?: boolean | null
          created_at?: string
          date?: string
          dinner_completed?: boolean | null
          hydration_schedule_completed?: Json | null
          id?: string
          lunch_completed?: boolean | null
          medication_afternoon_completed?: boolean | null
          medication_morning_completed?: boolean | null
          morning_snack_completed?: boolean | null
          night_snack_completed?: boolean | null
          updated_at?: string
          user_id?: string
          water_ml?: number | null
          workout_completed?: boolean | null
          workout_notes?: string | null
          workout_type?: string | null
        }
        Relationships: []
      }
      exam_results: {
        Row: {
          biomarker_category: string
          biomarker_name: string
          created_at: string
          exam_date: string
          exam_upload_id: string | null
          id: string
          reference_max: number | null
          reference_min: number | null
          status: string | null
          unit: string | null
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          biomarker_category: string
          biomarker_name: string
          created_at?: string
          exam_date: string
          exam_upload_id?: string | null
          id?: string
          reference_max?: number | null
          reference_min?: number | null
          status?: string | null
          unit?: string | null
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          biomarker_category?: string
          biomarker_name?: string
          created_at?: string
          exam_date?: string
          exam_upload_id?: string | null
          id?: string
          reference_max?: number | null
          reference_min?: number | null
          status?: string | null
          unit?: string | null
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_upload_id_fkey"
            columns: ["exam_upload_id"]
            isOneToOne: false
            referencedRelation: "exam_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_uploads: {
        Row: {
          created_at: string
          exam_date: string
          exam_type: string | null
          file_name: string
          file_path: string
          id: string
          image_description: string | null
          processed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_date: string
          exam_type?: string | null
          file_name: string
          file_path: string
          id?: string
          image_description?: string | null
          processed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_date?: string
          exam_type?: string | null
          file_name?: string
          file_path?: string
          id?: string
          image_description?: string | null
          processed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          annual_rate: number
          completed: boolean
          created_at: string
          current_amount: number
          deadline: string | null
          id: string
          investment_id: string | null
          linked_to_portfolio: boolean
          monthly_contribution: number
          target_amount: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_rate?: number
          completed?: boolean
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          investment_id?: string | null
          linked_to_portfolio?: boolean
          monthly_contribution?: number
          target_amount: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_rate?: number
          completed?: boolean
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          investment_id?: string | null
          linked_to_portfolio?: boolean
          monthly_contribution?: number
          target_amount?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_goals_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_safety: {
        Row: {
          id: string
          reserve_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          reserve_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          reserve_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          card_bank: string | null
          cost_center_id: string | null
          created_at: string
          date: string
          description: string
          id: string
          is_recurring: boolean
          notes: string | null
          paid: boolean
          parent_transaction_id: string | null
          payment_method: string | null
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_mode: string | null
          recurrence_type: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          card_bank?: string | null
          cost_center_id?: string | null
          created_at?: string
          date?: string
          description: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          paid?: boolean
          parent_transaction_id?: string | null
          payment_method?: string | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_mode?: string | null
          recurrence_type?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          card_bank?: string | null
          cost_center_id?: string | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          paid?: boolean
          parent_transaction_id?: string | null
          payment_method?: string | null
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_mode?: string | null
          recurrence_type?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gathering_adjustments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          event_id: string
          from_participant_id: string
          id: string
          to_participant_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          event_id: string
          from_participant_id: string
          id?: string
          to_participant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          event_id?: string
          from_participant_id?: string
          id?: string
          to_participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gathering_adjustments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gathering_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gathering_adjustments_from_participant_id_fkey"
            columns: ["from_participant_id"]
            isOneToOne: false
            referencedRelation: "gathering_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gathering_adjustments_to_participant_id_fkey"
            columns: ["to_participant_id"]
            isOneToOne: false
            referencedRelation: "gathering_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      gathering_events: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          event_date: string | null
          event_type: string
          fixed_amount_per_person: number | null
          id: string
          location: string | null
          split_mode: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          event_date?: string | null
          event_type?: string
          fixed_amount_per_person?: number | null
          id?: string
          location?: string | null
          split_mode?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          event_date?: string | null
          event_type?: string
          fixed_amount_per_person?: number | null
          id?: string
          location?: string | null
          split_mode?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gathering_expense_splits: {
        Row: {
          created_at: string
          expense_id: string
          id: string
          participant_id: string
        }
        Insert: {
          created_at?: string
          expense_id: string
          id?: string
          participant_id: string
        }
        Update: {
          created_at?: string
          expense_id?: string
          id?: string
          participant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gathering_expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "gathering_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gathering_expense_splits_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "gathering_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      gathering_expenses: {
        Row: {
          added_by_user_id: string
          category: string | null
          created_at: string
          description: string
          event_id: string
          expense_type: string
          file_url: string | null
          id: string
          include_in_split: boolean
          is_group: boolean
          location: string | null
          notes: string | null
          paid_by_participant_id: string | null
          parent_expense_id: string | null
          quantity: number
          total_amount: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          added_by_user_id: string
          category?: string | null
          created_at?: string
          description: string
          event_id: string
          expense_type?: string
          file_url?: string | null
          id?: string
          include_in_split?: boolean
          is_group?: boolean
          location?: string | null
          notes?: string | null
          paid_by_participant_id?: string | null
          parent_expense_id?: string | null
          quantity?: number
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          added_by_user_id?: string
          category?: string | null
          created_at?: string
          description?: string
          event_id?: string
          expense_type?: string
          file_url?: string | null
          id?: string
          include_in_split?: boolean
          is_group?: boolean
          location?: string | null
          notes?: string | null
          paid_by_participant_id?: string | null
          parent_expense_id?: string | null
          quantity?: number
          total_amount?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gathering_expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gathering_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gathering_expenses_paid_by_participant_id_fkey"
            columns: ["paid_by_participant_id"]
            isOneToOne: false
            referencedRelation: "gathering_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gathering_expenses_parent_expense_id_fkey"
            columns: ["parent_expense_id"]
            isOneToOne: false
            referencedRelation: "gathering_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      gathering_participants: {
        Row: {
          created_at: string
          email: string | null
          event_id: string
          id: string
          is_external: boolean
          name: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_id: string
          id?: string
          is_external?: boolean
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_id?: string
          id?: string
          is_external?: boolean
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gathering_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gathering_events"
            referencedColumns: ["id"]
          },
        ]
      }
      gathering_timeline: {
        Row: {
          action: string
          actor_name: string
          created_at: string
          details: string | null
          event_id: string
          id: string
        }
        Insert: {
          action: string
          actor_name: string
          created_at?: string
          details?: string | null
          event_id: string
          id?: string
        }
        Update: {
          action?: string
          actor_name?: string
          created_at?: string
          details?: string | null
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gathering_timeline_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "gathering_events"
            referencedColumns: ["id"]
          },
        ]
      }
      house_routines: {
        Row: {
          category: string
          created_at: string
          frequency: string
          id: string
          last_done_at: string | null
          shared_with: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          frequency?: string
          id?: string
          last_done_at?: string | null
          shared_with?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          frequency?: string
          id?: string
          last_done_at?: string | null
          shared_with?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      intimacy_logs: {
        Row: {
          activity_type: string[] | null
          contraception_used: string | null
          created_at: string
          desire_before: number | null
          discomfort: string | null
          duration_minutes: number | null
          energy_level: string | null
          id: string
          location: string | null
          log_date: string
          log_time: string | null
          mood: string | null
          notes: string | null
          orgasm: string | null
          partner_label: string | null
          pleasure: number | null
          protection_used: boolean | null
          satisfaction: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type?: string[] | null
          contraception_used?: string | null
          created_at?: string
          desire_before?: number | null
          discomfort?: string | null
          duration_minutes?: number | null
          energy_level?: string | null
          id?: string
          location?: string | null
          log_date?: string
          log_time?: string | null
          mood?: string | null
          notes?: string | null
          orgasm?: string | null
          partner_label?: string | null
          pleasure?: number | null
          protection_used?: boolean | null
          satisfaction?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string[] | null
          contraception_used?: string | null
          created_at?: string
          desire_before?: number | null
          discomfort?: string | null
          duration_minutes?: number | null
          energy_level?: string | null
          id?: string
          location?: string | null
          log_date?: string
          log_time?: string | null
          mood?: string | null
          notes?: string | null
          orgasm?: string | null
          partner_label?: string | null
          pleasure?: number | null
          protection_used?: boolean | null
          satisfaction?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      investment_history: {
        Row: {
          created_at: string
          date: string
          id: string
          investment_id: string
          type: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          investment_id: string
          type?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          investment_id?: string
          type?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "investment_history_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          category_id: string | null
          created_at: string
          currency: string
          current_value: number
          exchange_rate: number | null
          foreign_amount: number | null
          id: string
          investment_type: string | null
          is_recurring_contribution: boolean
          is_simulated: boolean
          name: string
          notes: string | null
          objective: string | null
          operating_capital: number
          priority: number
          recurrence_type: string | null
          recurring_amount: number | null
          recurring_tx_id: string | null
          start_date: string | null
          target_mode: string
          target_value: number
          tracking_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency?: string
          current_value?: number
          exchange_rate?: number | null
          foreign_amount?: number | null
          id?: string
          investment_type?: string | null
          is_recurring_contribution?: boolean
          is_simulated?: boolean
          name: string
          notes?: string | null
          objective?: string | null
          operating_capital?: number
          priority?: number
          recurrence_type?: string | null
          recurring_amount?: number | null
          recurring_tx_id?: string | null
          start_date?: string | null
          target_mode?: string
          target_value?: number
          tracking_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: string
          current_value?: number
          exchange_rate?: number | null
          foreign_amount?: number | null
          id?: string
          investment_type?: string | null
          is_recurring_contribution?: boolean
          is_simulated?: boolean
          name?: string
          notes?: string | null
          objective?: string | null
          operating_capital?: number
          priority?: number
          recurrence_type?: string | null
          recurring_amount?: number | null
          recurring_tx_id?: string | null
          start_date?: string | null
          target_mode?: string
          target_value?: number
          tracking_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "investment_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      liberation_challenges: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          intention_level: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          intention_level?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          intention_level?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      liberation_cravings: {
        Row: {
          challenge_id: string
          craving_duration_seconds: number | null
          created_at: string
          id: string
          intensity: string | null
          notes: string | null
          outcome: string
          outcome_helpful: boolean | null
          substitution_used: string | null
          trigger_emotions: string[] | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          craving_duration_seconds?: number | null
          created_at?: string
          id?: string
          intensity?: string | null
          notes?: string | null
          outcome: string
          outcome_helpful?: boolean | null
          substitution_used?: string | null
          trigger_emotions?: string[] | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          craving_duration_seconds?: number | null
          created_at?: string
          id?: string
          intensity?: string | null
          notes?: string | null
          outcome?: string
          outcome_helpful?: boolean | null
          substitution_used?: string | null
          trigger_emotions?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liberation_cravings_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "liberation_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      liberation_substitutions: {
        Row: {
          challenge_id: string
          created_at: string
          icon: string | null
          id: string
          label: string
          times_effective: number | null
          times_used: number | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          icon?: string | null
          id?: string
          label: string
          times_effective?: number | null
          times_used?: number | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          icon?: string | null
          id?: string
          label?: string
          times_effective?: number | null
          times_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liberation_substitutions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "liberation_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      liberation_triggers: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          trigger_type: string
          trigger_value: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          trigger_type: string
          trigger_value: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          trigger_type?: string
          trigger_value?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liberation_triggers_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "liberation_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      life_balance_logs: {
        Row: {
          area: string
          created_at: string
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string
          id?: string
          log_date?: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: []
      }
      life_brain_dumps: {
        Row: {
          content: string
          created_at: string
          id: string
          resolution: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          resolution?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          resolution?: string | null
          user_id?: string
        }
        Relationships: []
      }
      life_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          emotional_state: string
          had_me_time: boolean | null
          home_organized: boolean | null
          id: string
          overloaded_mode: boolean | null
          talked_to_someone: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          emotional_state?: string
          had_me_time?: boolean | null
          home_organized?: boolean | null
          id?: string
          overloaded_mode?: boolean | null
          talked_to_someone?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          emotional_state?: string
          had_me_time?: boolean | null
          home_organized?: boolean | null
          id?: string
          overloaded_mode?: boolean | null
          talked_to_someone?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      life_checklist_completions: {
        Row: {
          completed_date: string
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          completed_date?: string
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          completed_date?: string
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_checklist_completions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "life_checklist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      life_checklist_items: {
        Row: {
          active: boolean
          created_at: string
          id: string
          recurrence: string
          start_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          recurrence?: string
          start_date?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          recurrence?: string
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      life_diary: {
        Row: {
          best_moment: string | null
          bothered_by: string | null
          carry_forward: string | null
          created_at: string
          diary_date: string
          gratitude: string | null
          id: string
          kind_to_self: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_moment?: string | null
          bothered_by?: string | null
          carry_forward?: string | null
          created_at?: string
          diary_date?: string
          gratitude?: string | null
          id?: string
          kind_to_self?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_moment?: string | null
          bothered_by?: string | null
          carry_forward?: string | null
          created_at?: string
          diary_date?: string
          gratitude?: string | null
          id?: string
          kind_to_self?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      life_experiences: {
        Row: {
          created_at: string
          description: string | null
          experience_date: string | null
          id: string
          photo_url: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          experience_date?: string | null
          id?: string
          photo_url?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          experience_date?: string | null
          id?: string
          photo_url?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      life_goals: {
        Row: {
          category: string
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          priority: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      life_relationships: {
        Row: {
          created_at: string
          id: string
          importance: number
          important_dates: Json | null
          last_quality_time: string | null
          likes: string | null
          name: string
          notes: string | null
          relation: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          importance?: number
          important_dates?: Json | null
          last_quality_time?: string | null
          likes?: string | null
          name: string
          notes?: string | null
          relation?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          importance?: number
          important_dates?: Json | null
          last_quality_time?: string | null
          likes?: string | null
          name?: string
          notes?: string | null
          relation?: string | null
          user_id?: string
        }
        Relationships: []
      }
      life_weekly_rituals: {
        Row: {
          avoid_repeating: string | null
          created_at: string
          id: string
          more_present_with: string | null
          user_id: string
          want_to_live: string | null
          week_start: string
        }
        Insert: {
          avoid_repeating?: string | null
          created_at?: string
          id?: string
          more_present_with?: string | null
          user_id: string
          want_to_live?: string | null
          week_start: string
        }
        Update: {
          avoid_repeating?: string | null
          created_at?: string
          id?: string
          more_present_with?: string | null
          user_id?: string
          want_to_live?: string | null
          week_start?: string
        }
        Relationships: []
      }
      lifetime_premium_users: {
        Row: {
          added_by: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_photos: {
        Row: {
          created_at: string
          date: string
          id: string
          meal_key: string
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          meal_key: string
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          meal_key?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: []
      }
      medication_intake_log: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          intake_date: string
          medication_id: string
          schedule_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          intake_date?: string
          medication_id: string
          schedule_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          intake_date?: string
          medication_id?: string
          schedule_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_intake_log_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "user_medications"
            referencedColumns: ["id"]
          },
        ]
      }
      menstrual_cycles: {
        Row: {
          created_at: string
          cycle_length: number | null
          end_date: string | null
          id: string
          is_atypical: boolean
          notes: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_length?: number | null
          end_date?: string | null
          id?: string
          is_atypical?: boolean
          notes?: string | null
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_length?: number | null
          end_date?: string | null
          id?: string
          is_atypical?: boolean
          notes?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      menstrual_daily_logs: {
        Row: {
          created_at: string
          cycle_id: string | null
          date: string
          flow_intensity: string | null
          id: string
          mood: string | null
          notes: string | null
          symptoms: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_id?: string | null
          date: string
          flow_intensity?: string | null
          id?: string
          mood?: string | null
          notes?: string | null
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_id?: string | null
          date?: string
          flow_intensity?: string | null
          id?: string
          mood?: string | null
          notes?: string | null
          symptoms?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menstrual_daily_logs_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "menstrual_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      menstrual_settings: {
        Row: {
          average_cycle_length: number
          average_period_length: number
          contraceptive_type: string | null
          created_at: string
          id: string
          notifications_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          average_cycle_length?: number
          average_period_length?: number
          contraceptive_type?: string | null
          created_at?: string
          id?: string
          notifications_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          average_cycle_length?: number
          average_period_length?: number
          contraceptive_type?: string | null
          created_at?: string
          id?: string
          notifications_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      module_trials: {
        Row: {
          created_at: string
          id: string
          module_key: string
          trial_end: string
          trial_start: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_key: string
          trial_end?: string
          trial_start?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_key?: string
          trial_end?: string
          trial_start?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          module: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          module: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          module?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planet_placements: {
        Row: {
          created_at: string
          degrees: number | null
          house: number | null
          id: string
          planet: string
          sign: string
          user_id: string
        }
        Insert: {
          created_at?: string
          degrees?: number | null
          house?: number | null
          id?: string
          planet: string
          sign: string
          user_id: string
        }
        Update: {
          created_at?: string
          degrees?: number | null
          house?: number | null
          id?: string
          planet?: string
          sign?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      professional_daily_records: {
        Row: {
          created_at: string | null
          focus_hours: number | null
          id: string
          important_deliveries: number | null
          notes: string | null
          record_date: string
          relevant_meetings: number | null
          score: number | null
          strategic_tasks_done: number | null
          study_done: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          focus_hours?: number | null
          id?: string
          important_deliveries?: number | null
          notes?: string | null
          record_date?: string
          relevant_meetings?: number | null
          score?: number | null
          strategic_tasks_done?: number | null
          study_done?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          focus_hours?: number | null
          id?: string
          important_deliveries?: number | null
          notes?: string | null
          record_date?: string
          relevant_meetings?: number | null
          score?: number | null
          strategic_tasks_done?: number | null
          study_done?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      professional_income_history: {
        Row: {
          created_at: string | null
          id: string
          income: number
          month: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          income?: number
          month: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          income?: number
          month?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      professional_learning_logs: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          log_date: string
          notes: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      professional_opportunities: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          opportunity_date: string
          result: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          opportunity_date?: string
          result?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          opportunity_date?: string
          result?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      professional_profiles: {
        Row: {
          career_track: string | null
          created_at: string | null
          current_income: number | null
          id: string
          job_role: string | null
          level: number | null
          level_xp: number | null
          next_goal: string | null
          target_income: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          career_track?: string | null
          created_at?: string | null
          current_income?: number | null
          id?: string
          job_role?: string | null
          level?: number | null
          level_xp?: number | null
          next_goal?: string | null
          target_income?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          career_track?: string | null
          created_at?: string | null
          current_income?: number | null
          id?: string
          job_role?: string | null
          level?: number | null
          level_xp?: number | null
          next_goal?: string | null
          target_income?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      professional_skills: {
        Row: {
          category: string
          created_at: string | null
          id: string
          last_reviewed_at: string | null
          rating: number
          skill_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          last_reviewed_at?: string | null
          rating?: number
          skill_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          last_reviewed_at?: string | null
          rating?: number
          skill_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string
          friend_code: string | null
          id: string
          name: string
          onboarding_completed: boolean | null
          target_weight: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          friend_code?: string | null
          id?: string
          name: string
          onboarding_completed?: boolean | null
          target_weight?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          friend_code?: string | null
          id?: string
          name?: string
          onboarding_completed?: boolean | null
          target_weight?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          date: string
          id: string
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          device_label: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          device_label?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          device_label?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shopping_places: {
        Row: {
          active: boolean | null
          address: string | null
          created_at: string
          id: string
          name: string
          place_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          created_at?: string
          id?: string
          name: string
          place_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          place_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shopping_price_history: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          observation: string | null
          place_id: string
          price_type: string
          product_id: string
          purchase_date: string
          unit_price: number
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          observation?: string | null
          place_id: string
          price_type?: string
          product_id: string
          purchase_date?: string
          unit_price?: number
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          observation?: string | null
          place_id?: string
          price_type?: string
          product_id?: string
          purchase_date?: string
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_price_history_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "shopping_places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shopping_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_products: {
        Row: {
          active: boolean | null
          created_at: string
          default_unit: string
          id: string
          name_caps: string
          segment: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          default_unit?: string
          id?: string
          name_caps: string
          segment?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          default_unit?: string
          id?: string
          name_caps?: string
          segment?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shopping_session_items: {
        Row: {
          brand: string | null
          created_at: string
          id: string
          in_cart: boolean | null
          observation: string | null
          order_index: number | null
          price: number
          price_type: string
          product_id: string
          quantity: number
          session_id: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          id?: string
          in_cart?: boolean | null
          observation?: string | null
          order_index?: number | null
          price?: number
          price_type?: string
          product_id: string
          quantity?: number
          session_id: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          id?: string
          in_cart?: boolean | null
          observation?: string | null
          order_index?: number | null
          price?: number
          price_type?: string
          product_id?: string
          quantity?: number
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_session_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shopping_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_session_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "shopping_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_sessions: {
        Row: {
          created_at: string
          id: string
          place_id: string | null
          shared_with: string[] | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          place_id?: string | null
          shared_with?: string[] | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          place_id?: string | null
          shared_with?: string[] | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_sessions_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "shopping_places"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_template_items: {
        Row: {
          created_at: string
          id: string
          order_index: number | null
          product_id: string
          suggested_quantity: number | null
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number | null
          product_id: string
          suggested_quantity?: number | null
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number | null
          product_id?: string
          suggested_quantity?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_template_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shopping_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "shopping_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      study_plan_sessions: {
        Row: {
          activity_type: string | null
          actual_duration_minutes: number | null
          completed: boolean | null
          created_at: string | null
          duration_minutes: number
          id: string
          notes: string | null
          plan_id: string
          planned_date: string
          topic: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_type?: string | null
          actual_duration_minutes?: number | null
          completed?: boolean | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          plan_id: string
          planned_date: string
          topic: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string | null
          actual_duration_minutes?: number | null
          completed?: boolean | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          plan_id?: string
          planned_date?: string
          topic?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_plan_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          created_at: string | null
          deadline: string | null
          id: string
          plan_type: string | null
          status: string | null
          title: string
          total_hours_done: number | null
          updated_at: string | null
          user_id: string
          weekly_hours_goal: number | null
        }
        Insert: {
          created_at?: string | null
          deadline?: string | null
          id?: string
          plan_type?: string | null
          status?: string | null
          title: string
          total_hours_done?: number | null
          updated_at?: string | null
          user_id: string
          weekly_hours_goal?: number | null
        }
        Update: {
          created_at?: string | null
          deadline?: string | null
          id?: string
          plan_type?: string | null
          status?: string | null
          title?: string
          total_hours_done?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_hours_goal?: number | null
        }
        Relationships: []
      }
      synastry_reports: {
        Row: {
          challenge_aspects: Json | null
          friend_name: string | null
          friend_user_id: string
          generated_at: string
          harmony_aspects: Json | null
          id: string
          overall_score: number | null
          summary_text: string | null
          user_id: string
        }
        Insert: {
          challenge_aspects?: Json | null
          friend_name?: string | null
          friend_user_id: string
          generated_at?: string
          harmony_aspects?: Json | null
          id?: string
          overall_score?: number | null
          summary_text?: string | null
          user_id: string
        }
        Update: {
          challenge_aspects?: Json | null
          friend_name?: string | null
          friend_user_id?: string
          generated_at?: string
          harmony_aspects?: Json | null
          id?: string
          overall_score?: number | null
          summary_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tarot_readings: {
        Row: {
          arcana: string
          card_name: string
          card_number: number | null
          created_at: string
          id: string
          interpretation_text: string | null
          is_reversed: boolean
          reading_type: string
          user_id: string
          user_question: string | null
        }
        Insert: {
          arcana?: string
          card_name: string
          card_number?: number | null
          created_at?: string
          id?: string
          interpretation_text?: string | null
          is_reversed?: boolean
          reading_type?: string
          user_id: string
          user_question?: string | null
        }
        Update: {
          arcana?: string
          card_name?: string
          card_number?: number | null
          created_at?: string
          id?: string
          interpretation_text?: string | null
          is_reversed?: boolean
          reading_type?: string
          user_id?: string
          user_question?: string | null
        }
        Relationships: []
      }
      task_feedback: {
        Row: {
          actual_duration: number | null
          completed_date: string
          created_at: string
          difficulty: string | null
          id: string
          task_id: string
          user_id: string
          want_repeat: boolean | null
          worth_it: boolean | null
        }
        Insert: {
          actual_duration?: number | null
          completed_date?: string
          created_at?: string
          difficulty?: string | null
          id?: string
          task_id: string
          user_id: string
          want_repeat?: boolean | null
          worth_it?: boolean | null
        }
        Update: {
          actual_duration?: number | null
          completed_date?: string
          created_at?: string
          difficulty?: string | null
          id?: string
          task_id?: string
          user_id?: string
          want_repeat?: boolean | null
          worth_it?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "task_feedback_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          can_skip: boolean
          category: string | null
          completed_at: string | null
          created_at: string
          end_date: string | null
          end_time: string | null
          energy_required: string
          estimated_duration: number | null
          flexibility: string
          id: string
          life_area: string
          link: string | null
          location: string | null
          notes: string | null
          parent_task_id: string | null
          postpone_count: number
          recurrence: string | null
          recurrence_days: number[] | null
          start_date: string | null
          start_time: string | null
          status: string
          sub_area: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_skip?: boolean
          category?: string | null
          completed_at?: string | null
          created_at?: string
          end_date?: string | null
          end_time?: string | null
          energy_required?: string
          estimated_duration?: number | null
          flexibility?: string
          id?: string
          life_area?: string
          link?: string | null
          location?: string | null
          notes?: string | null
          parent_task_id?: string | null
          postpone_count?: number
          recurrence?: string | null
          recurrence_days?: number[] | null
          start_date?: string | null
          start_time?: string | null
          status?: string
          sub_area?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_skip?: boolean
          category?: string | null
          completed_at?: string | null
          created_at?: string
          end_date?: string | null
          end_time?: string | null
          energy_required?: string
          estimated_duration?: number | null
          flexibility?: string
          id?: string
          life_area?: string
          link?: string | null
          location?: string | null
          notes?: string | null
          parent_task_id?: string | null
          postpone_count?: number
          recurrence?: string | null
          recurrence_days?: number[] | null
          start_date?: string | null
          start_time?: string | null
          status?: string
          sub_area?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_sessions: {
        Row: {
          allocated_capital: number | null
          allowed_hours: string | null
          allowed_setups: string | null
          bank_name: string | null
          biggest_gain: number | null
          biggest_loss: number | null
          broken_rules: string | null
          created_at: string
          date: string
          emotional_state: string | null
          energy_level: string | null
          expected_scenario: string | null
          financial_result: number | null
          id: string
          market: string | null
          max_daily_risk: number | null
          num_operations: number | null
          observations: string | null
          percentage_result: number | null
          platform: string | null
          prohibited_hours: string | null
          respected_daily_risk: boolean | null
          respected_plan: string | null
          risk_per_operation: number | null
          sleep_quality: string | null
          start_time: string | null
          status: string
          updated_at: string
          user_id: string
          win_rate: number | null
        }
        Insert: {
          allocated_capital?: number | null
          allowed_hours?: string | null
          allowed_setups?: string | null
          bank_name?: string | null
          biggest_gain?: number | null
          biggest_loss?: number | null
          broken_rules?: string | null
          created_at?: string
          date?: string
          emotional_state?: string | null
          energy_level?: string | null
          expected_scenario?: string | null
          financial_result?: number | null
          id?: string
          market?: string | null
          max_daily_risk?: number | null
          num_operations?: number | null
          observations?: string | null
          percentage_result?: number | null
          platform?: string | null
          prohibited_hours?: string | null
          respected_daily_risk?: boolean | null
          respected_plan?: string | null
          risk_per_operation?: number | null
          sleep_quality?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
          user_id: string
          win_rate?: number | null
        }
        Update: {
          allocated_capital?: number | null
          allowed_hours?: string | null
          allowed_setups?: string | null
          bank_name?: string | null
          biggest_gain?: number | null
          biggest_loss?: number | null
          broken_rules?: string | null
          created_at?: string
          date?: string
          emotional_state?: string | null
          energy_level?: string | null
          expected_scenario?: string | null
          financial_result?: number | null
          id?: string
          market?: string | null
          max_daily_risk?: number | null
          num_operations?: number | null
          observations?: string | null
          percentage_result?: number | null
          platform?: string | null
          prohibited_hours?: string | null
          respected_daily_risk?: boolean | null
          respected_plan?: string | null
          risk_per_operation?: number | null
          sleep_quality?: string | null
          start_time?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      transaction_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          transaction_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_attachments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      trio_selections: {
        Row: {
          created_at: string
          id: string
          module_1: string
          module_2: string
          module_3: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_1: string
          module_2: string
          module_3: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_1?: string
          module_2?: string
          module_3?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_accommodations: {
        Row: {
          address: string | null
          booking_code: string | null
          checkin_date: string | null
          checkout_date: string | null
          contact: string | null
          cost: number | null
          cost_mode: string
          created_at: string
          currency: string | null
          email: string | null
          id: string
          link: string | null
          map_link: string | null
          name: string
          notes: string | null
          order_index: number | null
          paid: boolean | null
          paid_by_external_id: string | null
          paid_by_user_id: string | null
          policy: string | null
          quantity: number
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          booking_code?: string | null
          checkin_date?: string | null
          checkout_date?: string | null
          contact?: string | null
          cost?: number | null
          cost_mode?: string
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          link?: string | null
          map_link?: string | null
          name: string
          notes?: string | null
          order_index?: number | null
          paid?: boolean | null
          paid_by_external_id?: string | null
          paid_by_user_id?: string | null
          policy?: string | null
          quantity?: number
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          booking_code?: string | null
          checkin_date?: string | null
          checkout_date?: string | null
          contact?: string | null
          cost?: number | null
          cost_mode?: string
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          link?: string | null
          map_link?: string | null
          name?: string
          notes?: string | null
          order_index?: number | null
          paid?: boolean | null
          paid_by_external_id?: string | null
          paid_by_user_id?: string | null
          policy?: string | null
          quantity?: number
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_accommodations_paid_by_external_id_fkey"
            columns: ["paid_by_external_id"]
            isOneToOne: false
            referencedRelation: "trip_split_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_accommodations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          parent_id: string
          parent_type: string
          tags: string[] | null
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          parent_id: string
          parent_type: string
          tags?: string[] | null
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          parent_id?: string
          parent_type?: string
          tags?: string[] | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_attachments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_checklist_items: {
        Row: {
          category: string
          created_at: string
          id: string
          item_name: string
          order_index: number | null
          packed: boolean
          quantity: number
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          item_name: string
          order_index?: number | null
          packed?: boolean
          quantity?: number
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          item_name?: string
          order_index?: number | null
          packed?: boolean
          quantity?: number
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_checklist_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_checklist_template_items: {
        Row: {
          category: string
          id: string
          item_name: string
          order_index: number | null
          quantity: number
          template_id: string
        }
        Insert: {
          category?: string
          id?: string
          item_name: string
          order_index?: number | null
          quantity?: number
          template_id: string
        }
        Update: {
          category?: string
          id?: string
          item_name?: string
          order_index?: number | null
          quantity?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_checklist_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "trip_checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_checklist_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_destinations: {
        Row: {
          contact: string | null
          created_at: string
          email: string | null
          end_date: string | null
          id: string
          link: string | null
          location: string
          notes: string | null
          order_index: number | null
          start_date: string | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          email?: string | null
          end_date?: string | null
          id?: string
          link?: string | null
          location: string
          notes?: string | null
          order_index?: number | null
          start_date?: string | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          email?: string | null
          end_date?: string | null
          id?: string
          link?: string | null
          location?: string
          notes?: string | null
          order_index?: number | null
          start_date?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_destinations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_documents: {
        Row: {
          contact: string | null
          created_at: string
          doc_type: string
          email: string | null
          expiry_date: string | null
          file_url: string | null
          id: string
          link: string | null
          notes: string | null
          order_index: number | null
          required_for: string | null
          status: string | null
          title: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          doc_type?: string
          email?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          link?: string | null
          notes?: string | null
          order_index?: number | null
          required_for?: string | null
          status?: string | null
          title: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          doc_type?: string
          email?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          link?: string | null
          notes?: string | null
          order_index?: number | null
          required_for?: string | null
          status?: string | null
          title?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_events: {
        Row: {
          booking_code: string | null
          contact: string | null
          cost: number | null
          cost_mode: string
          created_at: string
          currency: string | null
          email: string | null
          event_date: string | null
          id: string
          link: string | null
          location: string | null
          location_link: string | null
          notes: string | null
          order_index: number | null
          paid: boolean | null
          paid_by_external_id: string | null
          paid_by_user_id: string | null
          priority: string | null
          quantity: number
          title: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_code?: string | null
          contact?: string | null
          cost?: number | null
          cost_mode?: string
          created_at?: string
          currency?: string | null
          email?: string | null
          event_date?: string | null
          id?: string
          link?: string | null
          location?: string | null
          location_link?: string | null
          notes?: string | null
          order_index?: number | null
          paid?: boolean | null
          paid_by_external_id?: string | null
          paid_by_user_id?: string | null
          priority?: string | null
          quantity?: number
          title: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_code?: string | null
          contact?: string | null
          cost?: number | null
          cost_mode?: string
          created_at?: string
          currency?: string | null
          email?: string | null
          event_date?: string | null
          id?: string
          link?: string | null
          location?: string | null
          location_link?: string | null
          notes?: string | null
          order_index?: number | null
          paid?: boolean | null
          paid_by_external_id?: string | null
          paid_by_user_id?: string | null
          priority?: string | null
          quantity?: number
          title?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_events_paid_by_external_id_fkey"
            columns: ["paid_by_external_id"]
            isOneToOne: false
            referencedRelation: "trip_split_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expense_splits: {
        Row: {
          created_at: string | null
          expense_id: string
          id: string
          paid_amount: number
          participant_external_id: string | null
          participant_type: string
          participant_user_id: string | null
          share_amount: number
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expense_id: string
          id?: string
          paid_amount?: number
          participant_external_id?: string | null
          participant_type?: string
          participant_user_id?: string | null
          share_amount?: number
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expense_id?: string
          id?: string
          paid_amount?: number
          participant_external_id?: string | null
          participant_type?: string
          participant_user_id?: string | null
          share_amount?: number
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "trip_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expense_splits_participant_external_id_fkey"
            columns: ["participant_external_id"]
            isOneToOne: false
            referencedRelation: "trip_split_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expense_splits_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_expenses: {
        Row: {
          amount: number
          category: string
          cost_mode: string
          created_at: string
          currency: string | null
          expense_date: string | null
          file_url: string | null
          id: string
          item: string
          link: string | null
          notes: string | null
          order_index: number | null
          paid: boolean | null
          paid_by_external_id: string | null
          paid_by_user_id: string | null
          quantity: number
          related_id: string | null
          related_type: string | null
          split_enabled: boolean | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          cost_mode?: string
          created_at?: string
          currency?: string | null
          expense_date?: string | null
          file_url?: string | null
          id?: string
          item: string
          link?: string | null
          notes?: string | null
          order_index?: number | null
          paid?: boolean | null
          paid_by_external_id?: string | null
          paid_by_user_id?: string | null
          quantity?: number
          related_id?: string | null
          related_type?: string | null
          split_enabled?: boolean | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          cost_mode?: string
          created_at?: string
          currency?: string | null
          expense_date?: string | null
          file_url?: string | null
          id?: string
          item?: string
          link?: string | null
          notes?: string | null
          order_index?: number | null
          paid?: boolean | null
          paid_by_external_id?: string | null
          paid_by_user_id?: string | null
          quantity?: number
          related_id?: string | null
          related_type?: string | null
          split_enabled?: boolean | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_expenses_paid_by_external_id_fkey"
            columns: ["paid_by_external_id"]
            isOneToOne: false
            referencedRelation: "trip_split_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_flights: {
        Row: {
          airline: string | null
          arrival_date: string | null
          baggage: string | null
          booking_code: string | null
          contact: string | null
          cost: number | null
          cost_mode: string
          created_at: string
          currency: string | null
          departure_date: string | null
          destination: string | null
          direction: string | null
          email: string | null
          flight_code: string | null
          gate: string | null
          id: string
          link: string | null
          notes: string | null
          order_index: number | null
          origin: string | null
          paid: boolean | null
          paid_by_external_id: string | null
          paid_by_user_id: string | null
          quantity: number
          status: string | null
          terminal: string | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          airline?: string | null
          arrival_date?: string | null
          baggage?: string | null
          booking_code?: string | null
          contact?: string | null
          cost?: number | null
          cost_mode?: string
          created_at?: string
          currency?: string | null
          departure_date?: string | null
          destination?: string | null
          direction?: string | null
          email?: string | null
          flight_code?: string | null
          gate?: string | null
          id?: string
          link?: string | null
          notes?: string | null
          order_index?: number | null
          origin?: string | null
          paid?: boolean | null
          paid_by_external_id?: string | null
          paid_by_user_id?: string | null
          quantity?: number
          status?: string | null
          terminal?: string | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          airline?: string | null
          arrival_date?: string | null
          baggage?: string | null
          booking_code?: string | null
          contact?: string | null
          cost?: number | null
          cost_mode?: string
          created_at?: string
          currency?: string | null
          departure_date?: string | null
          destination?: string | null
          direction?: string | null
          email?: string | null
          flight_code?: string | null
          gate?: string | null
          id?: string
          link?: string | null
          notes?: string | null
          order_index?: number | null
          origin?: string | null
          paid?: boolean | null
          paid_by_external_id?: string | null
          paid_by_user_id?: string | null
          quantity?: number
          status?: string | null
          terminal?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_flights_paid_by_external_id_fkey"
            columns: ["paid_by_external_id"]
            isOneToOne: false
            referencedRelation: "trip_split_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_flights_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_meals: {
        Row: {
          contact: string | null
          cost: number | null
          cost_mode: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          email: string | null
          id: string
          link: string | null
          meal_date: string | null
          notes: string | null
          order_index: number | null
          paid: boolean | null
          paid_by_external_id: string | null
          paid_by_user_id: string | null
          quantity: number | null
          title: string
          trip_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contact?: string | null
          cost?: number | null
          cost_mode?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          email?: string | null
          id?: string
          link?: string | null
          meal_date?: string | null
          notes?: string | null
          order_index?: number | null
          paid?: boolean | null
          paid_by_external_id?: string | null
          paid_by_user_id?: string | null
          quantity?: number | null
          title: string
          trip_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contact?: string | null
          cost?: number | null
          cost_mode?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          email?: string | null
          id?: string
          link?: string | null
          meal_date?: string | null
          notes?: string | null
          order_index?: number | null
          paid?: boolean | null
          paid_by_external_id?: string | null
          paid_by_user_id?: string | null
          quantity?: number | null
          title?: string
          trip_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_meals_paid_by_external_id_fkey"
            columns: ["paid_by_external_id"]
            isOneToOne: false
            referencedRelation: "trip_split_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_meals_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          role: string
          status: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          role?: string
          status?: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          role?: string
          status?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_recommendations: {
        Row: {
          created_at: string
          data: Json
          destination: string
          id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          destination: string
          id?: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          destination?: string
          id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      trip_split_participants: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_split_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_transport: {
        Row: {
          booking_code: string | null
          contact: string | null
          cost: number | null
          cost_mode: string
          created_at: string
          currency: string | null
          dropoff_location: string | null
          email: string | null
          end_date: string | null
          id: string
          link: string | null
          notes: string | null
          order_index: number | null
          paid: boolean | null
          paid_by_external_id: string | null
          paid_by_user_id: string | null
          pickup_location: string | null
          quantity: number
          start_date: string | null
          transport_type: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_code?: string | null
          contact?: string | null
          cost?: number | null
          cost_mode?: string
          created_at?: string
          currency?: string | null
          dropoff_location?: string | null
          email?: string | null
          end_date?: string | null
          id?: string
          link?: string | null
          notes?: string | null
          order_index?: number | null
          paid?: boolean | null
          paid_by_external_id?: string | null
          paid_by_user_id?: string | null
          pickup_location?: string | null
          quantity?: number
          start_date?: string | null
          transport_type?: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_code?: string | null
          contact?: string | null
          cost?: number | null
          cost_mode?: string
          created_at?: string
          currency?: string | null
          dropoff_location?: string | null
          email?: string | null
          end_date?: string | null
          id?: string
          link?: string | null
          notes?: string | null
          order_index?: number | null
          paid?: boolean | null
          paid_by_external_id?: string | null
          paid_by_user_id?: string | null
          pickup_location?: string | null
          quantity?: number
          start_date?: string | null
          transport_type?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_transport_paid_by_external_id_fkey"
            columns: ["paid_by_external_id"]
            isOneToOne: false
            referencedRelation: "trip_split_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_transport_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          budget: number | null
          cover_image: string | null
          created_at: string
          currency: string | null
          end_date: string | null
          id: string
          main_destination: string | null
          name: string
          notes: string | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          end_date?: string | null
          id?: string
          main_destination?: string | null
          name: string
          notes?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number | null
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          end_date?: string | null
          id?: string
          main_destination?: string | null
          name?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_food_preferences: {
        Row: {
          created_at: string
          food_category: string
          food_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          food_category: string
          food_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          food_category?: string
          food_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_hydration_schedule: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          label: string
          order_index: number
          schedule_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_ml?: number
          created_at?: string
          id?: string
          label: string
          order_index?: number
          schedule_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          label?: string
          order_index?: number
          schedule_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_meal_plans: {
        Row: {
          alt_description: string | null
          alt_ingredients: Json | null
          alt_macros: Json | null
          created_at: string
          id: string
          main_description: string | null
          main_ingredients: Json | null
          main_macros: Json | null
          meal_key: string
          meal_name: string
          meal_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alt_description?: string | null
          alt_ingredients?: Json | null
          alt_macros?: Json | null
          created_at?: string
          id?: string
          main_description?: string | null
          main_ingredients?: Json | null
          main_macros?: Json | null
          meal_key: string
          meal_name: string
          meal_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alt_description?: string | null
          alt_ingredients?: Json | null
          alt_macros?: Json | null
          created_at?: string
          id?: string
          main_description?: string | null
          main_ingredients?: Json | null
          main_macros?: Json | null
          meal_key?: string
          meal_name?: string
          meal_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_medications: {
        Row: {
          active: boolean | null
          composition: string | null
          created_at: string
          dosage: string | null
          id: string
          name: string
          notes: string | null
          schedule_times: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          composition?: string | null
          created_at?: string
          dosage?: string | null
          id?: string
          name: string
          notes?: string | null
          schedule_times?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          composition?: string | null
          created_at?: string
          dosage?: string | null
          id?: string
          name?: string
          notes?: string | null
          schedule_times?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          module_key: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          module_key: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          module_key?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_workout_plans: {
        Row: {
          created_at: string
          day_of_week: number
          description: string | null
          details: Json | null
          duration: string | null
          id: string
          order_index: number | null
          updated_at: string
          user_id: string
          weekly_frequency: number | null
          workout_name: string
          workout_type: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          description?: string | null
          details?: Json | null
          duration?: string | null
          id?: string
          order_index?: number | null
          updated_at?: string
          user_id: string
          weekly_frequency?: number | null
          workout_name: string
          workout_type: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          description?: string | null
          details?: Json | null
          duration?: string | null
          id?: string
          order_index?: number | null
          updated_at?: string
          user_id?: string
          weekly_frequency?: number | null
          workout_name?: string
          workout_type?: string
        }
        Relationships: []
      }
      weekly_missions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          mission_type: string
          title: string
          user_id: string
          week_start: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_type: string
          title: string
          user_id: string
          week_start: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_type?: string
          title?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      weight_history: {
        Row: {
          created_at: string
          date: string
          id: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      workout_photos: {
        Row: {
          created_at: string
          date: string
          id: string
          photo_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          photo_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_routes: {
        Row: {
          coordinates: Json
          created_at: string
          date: string
          distance_km: number
          duration_seconds: number
          finished_at: string | null
          id: string
          started_at: string | null
          updated_at: string
          user_id: string
          workout_type: string
        }
        Insert: {
          coordinates?: Json
          created_at?: string
          date?: string
          distance_km?: number
          duration_seconds?: number
          finished_at?: string | null
          id?: string
          started_at?: string | null
          updated_at?: string
          user_id: string
          workout_type: string
        }
        Update: {
          coordinates?: Json
          created_at?: string
          date?: string
          distance_km?: number
          duration_seconds?: number
          finished_at?: string | null
          id?: string
          started_at?: string | null
          updated_at?: string
          user_id?: string
          workout_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_lifetime_premium: { Args: { _user_id: string }; Returns: boolean }
      has_trip_access: { Args: { p_trip_id: string }; Returns: boolean }
      is_arena_creator: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_arena_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_gathering_member: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      is_trip_owner: { Args: { p_trip_id: string }; Returns: boolean }
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
