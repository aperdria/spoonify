
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      recipes: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string
          source_url: string
          tags: string[]
          ingredients: Json
          steps: string[]
          prep_time: number | null
          cook_time: number | null
          servings: number
          translated_title: string | null
          translated_description: string | null
          translated_ingredients: Json | null
          translated_steps: string[] | null
          nutrition: Json | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          image_url: string
          source_url: string
          tags: string[]
          ingredients: Json
          steps: string[]
          prep_time?: number | null
          cook_time?: number | null
          servings: number
          translated_title?: string | null
          translated_description?: string | null
          translated_ingredients?: Json | null
          translated_steps?: string[] | null
          nutrition?: Json | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image_url?: string
          source_url?: string
          tags?: string[]
          ingredients?: Json
          steps?: string[]
          prep_time?: number | null
          cook_time?: number | null
          servings?: number
          translated_title?: string | null
          translated_description?: string | null
          translated_ingredients?: Json | null
          translated_steps?: string[] | null
          nutrition?: Json | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          recipe_count: number
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          recipe_count?: number
          user_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          recipe_count?: number
          user_id?: string
          created_at?: string
        }
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
  }
}
