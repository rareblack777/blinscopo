import os
import json
import requests
from supabase import create_client, Client

SUPABASE_URL: str = "https://brlmkaqrmqwhapehairf.supabase.co"
SUPABASE_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJybG1rYXFybXF3aGFwZWhhaXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDc1NDQsImV4cCI6MjA4MTQyMzU0NH0.ndF-9aLt9CQqZQbXH4NpVD_Qzojjfe3SHIywPYrOt1k" 

try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Conexão BLINSCOPO estabelecida.")
except Exception as e:
    print(f"❌ ERRO CRÍTICO na Conexão: {e}")
    exit()

def registrar_auditoria(nome_modulo, resultado_status, log_detalhado):
    print(f"\n[DB] Salvando registro de: {nome_modulo}...")
    
    dados_auditoria = {
        "nome_auditor": nome_modulo,
        "status": resultado_status,
        "detalhes": log_detalhado
    }
    
    try:
        response = supabase.table("auditoria_registros").insert(dados_auditoria).execute()
        try:
            registro_id = response.data[0]['id']
        except:
            registro_id = "ID_DESCONHECIDO"
            
        print(f"✅ [DB] REGISTRO SALVO! ID: {registro_id}")
        return True
    except Exception as e:
        print(f"❌ [DB] FALHA ao salvar: {e}")
        return False

def acionar_auditor_ia(texto_para_auditar):
    print(f"\n[IA] Conectando com AuditorIA (Aguardando até 30s)...")
    
    url_funcao = f"{SUPABASE_URL}/functions/v1/AuditorIA"
    
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {"dados_a_auditar": texto_para_auditar}

    try:
        response = requests.post(url_funcao, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            dados_resposta = response.json()
            
            try:
                texto_final = dados_resposta['choices'][0]['message']['content']
                print(f"🤖 [IA] RESPOSTA RECEBIDA:\n\n{texto_final}\n")
            except:
                print(f"🤖 [IA] RESPOSTA (Bruta): {dados_resposta}")
                
            return dados_resposta
        else:
            print(f"⚠️ [IA] Erro na resposta (Código {response.status_code}): {response.text}")

    except requests.exceptions.Timeout:
        print(f"❌ [IA] TIMEOUT: A IA demorou mais de 30s e o Python cansou de esperar.")
    except Exception as e:
        print(f"❌ [IA] FALHA TÉCNICA: {e}")

print("\n--- 🚀 INICIANDO PROTOCOLO DE AUDITORIA COMPLETO ---")

modulo = "Módulo de Arquivos"
erro = "FALHA: config.json sem permissão de leitura."

registrar_auditoria(modulo, "ERRO_DETECTADO", erro)

acionar_auditor_ia(erro)