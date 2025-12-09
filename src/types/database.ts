export interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  observacoes: string | null;
  created_at: string;
}

export interface ModuloEscopo {
  id: string;
  titulo: string;
  descricao: string | null;
  valor_padrao: number;
  clausula_ia: string | null;
  created_at: string;
}

export interface Contrato {
  id: string;
  cliente_id: string;
  titulo: string;
  modulos_json: ModuloContratoItem[];
  valor_total: number;
  texto_contrato: string | null;
  created_at: string;
}

export interface ModuloContratoItem {
  id: string;
  titulo: string;
  valor: number;
  clausula: string | null;
}

export interface ContratoComCliente extends Contrato {
  clientes: Cliente;
}