export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      basket_items: {
        Row: {
          amount: number | null
          basket_id: string | null
          category: string | null
          checked: boolean | null
          created_at: string
          id: string
          name: string
          recipe_ids: string[] | null
          unit: string | null
        }
        Insert: {
          amount?: number | null
          basket_id?: string | null
          category?: string | null
          checked?: boolean | null
          created_at?: string
          id?: string
          name: string
          recipe_ids?: string[] | null
          unit?: string | null
        }
        Update: {
          amount?: number | null
          basket_id?: string | null
          category?: string | null
          checked?: boolean | null
          created_at?: string
          id?: string
          name?: string
          recipe_ids?: string[] | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "basket_items_basket_id_fkey"
            columns: ["basket_id"]
            isOneToOne: false
            referencedRelation: "grocery_baskets"
            referencedColumns: ["id"]
          },
        ]
      }
      basket_recipes: {
        Row: {
          basket_id: string | null
          created_at: string
          id: string
          original_servings: number
          recipe_id: string | null
          servings: number
        }
        Insert: {
          basket_id?: string | null
          created_at?: string
          id?: string
          original_servings: number
          recipe_id?: string | null
          servings: number
        }
        Update: {
          basket_id?: string | null
          created_at?: string
          id?: string
          original_servings?: number
          recipe_id?: string | null
          servings?: number
        }
        Relationships: [
          {
            foreignKeyName: "basket_recipes_basket_id_fkey"
            columns: ["basket_id"]
            isOneToOne: false
            referencedRelation: "grocery_baskets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "basket_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      grocery_baskets: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          cook_time: number | null
          created_at: string
          description: string
          id: string
          image_url: string
          ingredients: Json
          nutrition: Json | null
          prep_time: number | null
          servings: number
          source_url: string
          steps: string[]
          tags: string[] | null
          title: string
          translated_description: string | null
          translated_ingredients: Json | null
          translated_steps: string[] | null
          translated_title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cook_time?: number | null
          created_at?: string
          description: string
          id?: string
          image_url: string
          ingredients: Json
          nutrition?: Json | null
          prep_time?: number | null
          servings: number
          source_url: string
          steps: string[]
          tags?: string[] | null
          title: string
          translated_description?: string | null
          translated_ingredients?: Json | null
          translated_steps?: string[] | null
          translated_title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cook_time?: number | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          ingredients?: Json
          nutrition?: Json | null
          prep_time?: number | null
          servings?: number
          source_url?: string
          steps?: string[]
          tags?: string[] | null
          title?: string
          translated_description?: string | null
          translated_ingredients?: Json | null
          translated_steps?: string[] | null
          translated_title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          recipe_count: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          recipe_count?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          recipe_count?: number
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
