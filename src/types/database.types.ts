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
      profiles: {
        Row: {
          id: string
          full_name: string
          role: 'student' | 'cr' | 'acr' | 'teacher' | 'super_admin'
          student_id: string | null
          department: string | null
          semester: string | null
          section: string | null
          whatsapp_number: string | null
          address: string | null
          status: 'pending' | 'approved' | 'rejected' | 'banned'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          role?: 'student' | 'cr' | 'acr' | 'teacher' | 'super_admin'
          student_id?: string | null
          department?: string | null
          semester?: string | null
          section?: string | null
          whatsapp_number?: string | null
          address?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'banned'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          role?: 'student' | 'cr' | 'acr' | 'teacher' | 'super_admin'
          student_id?: string | null
          department?: string | null
          semester?: string | null
          section?: string | null
          whatsapp_number?: string | null
          address?: string | null
          status?: 'pending' | 'approved' | 'rejected' | 'banned'
          created_at?: string
          updated_at?: string
        }
      }
      notices: {
        Row: {
          id: string
          title: string
          content: string
          is_global: boolean
          target_department: string | null
          target_semester: string | null
          target_section: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          is_global?: boolean
          target_department?: string | null
          target_semester?: string | null
          target_section?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          is_global?: boolean
          target_department?: string | null
          target_semester?: string | null
          target_section?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
    }
  }
}
