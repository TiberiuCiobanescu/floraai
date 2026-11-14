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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      clienti: {
        Row: {
          adresa: string | null
          nume: string
          telefon: string
          tip: string
        }
        Insert: {
          adresa?: string | null
          nume: string
          telefon: string
          tip: string
        }
        Update: {
          adresa?: string | null
          nume?: string
          telefon?: string
          tip?: string
        }
        Relationships: []
      }
      comenzi: {
        Row: {
          adresa: string | null
          avertisment: string | null
          bilet: string | null
          campuri_lipsa: string[] | null
          data_livrare: string | null
          destinatar: string | null
          id: string
          interval: string | null
          intrebare_client: string | null
          status: string
          telefon: string
          termen_modificare: string | null
          tip_comanda: string | null
          versiune: number
        }
        Insert: {
          adresa?: string | null
          avertisment?: string | null
          bilet?: string | null
          campuri_lipsa?: string[] | null
          data_livrare?: string | null
          destinatar?: string | null
          id?: string
          interval?: string | null
          intrebare_client?: string | null
          status?: string
          telefon: string
          termen_modificare?: string | null
          tip_comanda?: string | null
          versiune?: number
        }
        Update: {
          adresa?: string | null
          avertisment?: string | null
          bilet?: string | null
          campuri_lipsa?: string[] | null
          data_livrare?: string | null
          destinatar?: string | null
          id?: string
          interval?: string | null
          intrebare_client?: string | null
          status?: string
          telefon?: string
          termen_modificare?: string | null
          tip_comanda?: string | null
          versiune?: number
        }
        Relationships: [
          {
            foreignKeyName: "comenzi_tip_comanda_fkey"
            columns: ["tip_comanda"]
            isOneToOne: false
            referencedRelation: "termene"
            referencedColumns: ["tip_comanda"]
          },
        ]
      }
      linii_comanda: {
        Row: {
          auxiliare: string | null
          cantitate: number
          comanda_id: string
          id: number
          produs_id: string
        }
        Insert: {
          auxiliare?: string | null
          cantitate: number
          comanda_id: string
          id?: never
          produs_id: string
        }
        Update: {
          auxiliare?: string | null
          cantitate?: number
          comanda_id?: string
          id?: never
          produs_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linii_comanda_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comenzi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linii_comanda_produs_id_fkey"
            columns: ["produs_id"]
            isOneToOne: false
            referencedRelation: "produse"
            referencedColumns: ["id"]
          },
        ]
      }
      livrari_furnizor: {
        Row: {
          cantitate_fire: number
          data: string
          floare: string
          furnizor: string
          id: number
          receptionat: string
        }
        Insert: {
          cantitate_fire: number
          data: string
          floare: string
          furnizor: string
          id?: never
          receptionat?: string
        }
        Update: {
          cantitate_fire?: number
          data?: string
          floare?: string
          furnizor?: string
          id?: never
          receptionat?: string
        }
        Relationships: [
          {
            foreignKeyName: "livrari_furnizor_floare_fkey"
            columns: ["floare"]
            isOneToOne: false
            referencedRelation: "stoc"
            referencedColumns: ["floare"]
          },
        ]
      }
      mesaje: {
        Row: {
          canal: string | null
          comanda_id: string | null
          directie: string
          id: string
          intrebare_client: string | null
          ora: string
          status: string
          telefon: string
          text: string
          tip_mesaj: string | null
        }
        Insert: {
          canal?: string | null
          comanda_id?: string | null
          directie?: string
          id?: string
          intrebare_client?: string | null
          ora: string
          status?: string
          telefon: string
          text: string
          tip_mesaj?: string | null
        }
        Update: {
          canal?: string | null
          comanda_id?: string | null
          directie?: string
          id?: string
          intrebare_client?: string | null
          ora?: string
          status?: string
          telefon?: string
          text?: string
          tip_mesaj?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mesaje_comanda_id_fkey"
            columns: ["comanda_id"]
            isOneToOne: false
            referencedRelation: "comenzi"
            referencedColumns: ["id"]
          },
        ]
      }
      produse: {
        Row: {
          compozitie: string
          id: string
          nume: string
          pret_lei: number
          sinonime: string | null
          tip: string
        }
        Insert: {
          compozitie: string
          id: string
          nume: string
          pret_lei: number
          sinonime?: string | null
          tip: string
        }
        Update: {
          compozitie?: string
          id?: string
          nume?: string
          pret_lei?: number
          sinonime?: string | null
          tip?: string
        }
        Relationships: []
      }
      stoc: {
        Row: {
          cantitate_fire: number
          floare: string
          populara: string
          prag_alerta: number
        }
        Insert: {
          cantitate_fire?: number
          floare: string
          populara?: string
          prag_alerta: number
        }
        Update: {
          cantitate_fire?: number
          floare?: string
          populara?: string
          prag_alerta?: number
        }
        Relationships: []
      }
      termene: {
        Row: {
          ore_inainte_de_livrare: number
          tip_comanda: string
        }
        Insert: {
          ore_inainte_de_livrare: number
          tip_comanda: string
        }
        Update: {
          ore_inainte_de_livrare?: number
          tip_comanda?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aplica_extragere_comanda: {
        Args: {
          p_comanda: string
          p_mesaje: string[]
          p_rezultat: Json
          p_versiune: number
        }
        Returns: string
      }
      executa_comanda: {
        Args: { p_comanda: string; p_versiune: number }
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
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
