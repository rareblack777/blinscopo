import os
from supabase import create_client, Client

SUPABASE_URL: str = "https://brlmkaqrmqwhapehairf.supabase.co"
SUPABASE_KEY: str = "sb_secret_B05O1fRrtCXBOdWdMbCVkQ_5gfiNgOP"

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Conexão BLINSCOPO com o Supabase estabelecida.")
except Exception as e:
    print(f"ERRO CRÍTICO na Conexão: {e}")
    exit()

def registrar_auditoria(nome_modulo, resultado_status, log_detalhado):
    print(f"\nTentando registrar auditoria de: {nome_modulo}")
    
    dados_auditoria = {
        "nome_auditor": nome_modulo,
        "status": resultado_status,
        "detalhes": log_detalhado
    }
    
    try:
        response = supabase.table("auditoria_registros").insert(dados_auditoria).execute()
        
        registro_id = response.data[0]['id']
        print(f"✅ REGISTRO SALVO COM SUCESSO! ID {registro_id} | Status: {resultado_status}")
        return True
    
    except Exception as e:
        print(f"❌ FALHA ao salvar auditoria. ERRO: {e}")
        return False


print("\n--- INICIANDO TESTE DE REGISTRO DE AUDITORIA ---")

nome_modulo_teste = "Módulo de Verificação de Arquivos"
status_teste = "FALHA"
detalhes_teste = "O arquivo de configuração 'config.json' está faltando permissão de leitura."

registrar_auditoria(nome_modulo_teste, status_teste, detalhes_teste)