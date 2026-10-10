export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      membros: {
        Row: {
          id: string;
          nome: string;
          endereco: string;
          bairro: string;
          cidade: string;
          telefone: string;
          data_nascimento: string | null;
          batizado: boolean;
          status: string;
          observacoes: string | null;
          criado_em: string;
        };
        Insert: Omit<Database['public']['Tables']['membros']['Row'], 'id' | 'criado_em'> & {
          id?: string;
          criado_em?: string;
        };
        Update: Partial<Database['public']['Tables']['membros']['Insert']>;
      };
      lideranca: {
        Row: {
          id: string;
          nome: string;
          cargo: string;
          ministerio: string;
          telefone: string;
          endereco: string;
          desde: string;
          criado_em: string;
        };
        Insert: Omit<Database['public']['Tables']['lideranca']['Row'], 'id' | 'criado_em'> & {
          id?: string;
          criado_em?: string;
        };
        Update: Partial<Database['public']['Tables']['lideranca']['Insert']>;
      };
      visitantes: {
        Row: {
          id: string;
          nome: string;
          telefone: string;
          endereco: string | null;
          data_visita: string;
          culto: string;
          convidado_por: string | null;
          pedido_oracao: string | null;
          status_acompanhamento: string;
          criado_em: string;
        };
        Insert: Omit<Database['public']['Tables']['visitantes']['Row'], 'id' | 'criado_em'> & {
          id?: string;
          criado_em?: string;
        };
        Update: Partial<Database['public']['Tables']['visitantes']['Insert']>;
      };
      cultos_frequencia: {
        Row: {
          id: string;
          data_culto: string;
          nome_culto: string;
          total_presentes: number;
          membros_presentes: number;
          visitantes_presentes: number;
          decisoes_conversoes: number;
          pregador: string | null;
          observacoes: string | null;
          criado_em: string;
        };
        Insert: Omit<Database['public']['Tables']['cultos_frequencia']['Row'], 'id' | 'criado_em'> & {
          id?: string;
          criado_em?: string;
        };
        Update: Partial<Database['public']['Tables']['cultos_frequencia']['Insert']>;
      };
      agenda: {
        Row: {
          id: string;
          titulo: string;
          descricao: string;
          data_evento: string;
          horario: string;
          local_evento: string;
          categoria: string;
          destaque: boolean;
          criado_em: string;
        };
        Insert: Omit<Database['public']['Tables']['agenda']['Row'], 'id' | 'criado_em'> & {
          id?: string;
          criado_em?: string;
        };
        Update: Partial<Database['public']['Tables']['agenda']['Insert']>;
      };
      louvores: {
        Row: {
          id: string;
          titulo: string;
          artista: string;
          tom_original: string;
          bpm: number;
          categoria: string;
          letra_cifrada: string;
          criado_em: string;
        };
        Insert: Omit<Database['public']['Tables']['louvores']['Row'], 'id' | 'criado_em'> & {
          id?: string;
          criado_em?: string;
        };
        Update: Partial<Database['public']['Tables']['louvores']['Insert']>;
      };
      igreja_store: {
        Row: {
          id: string;
          payload: Json;
          atualizado_em: string;
        };
        Insert: {
          id?: string;
          payload: Json;
          atualizado_em?: string;
        };
        Update: {
          id?: string;
          payload?: Json;
          atualizado_em?: string;
        };
      };
    };
  };
}
