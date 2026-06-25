import json
import random
import string
from tqdm import tqdm # barra de progresso

def gerar_key():
    """Gera JULSON + 8 chars aleatórios A-Z0-9"""
    chars = string.ascii_uppercase + string.digits
    codigo = ''.join(random.choices(chars, k=8))
    return f"JULSON{codigo}"

def gerar_keys(quantidade=100000, min_valor=50, max_valor=10000, arquivo="key.json"):
    print(f"🚀 Gerando {quantidade:,} keys...")
    print(f"💰 Valores entre {min_valor} e {max_valor}")

    keys = {}
    usados = set() # pra não repetir key

    # tqdm mostra barra de progresso
    for _ in tqdm(range(quantidade)):
        # Garante que não duplica
        while True:
            key = gerar_key()
            if key not in usados:
                usados.add(key)
                break

        valor = random.randint(min_valor, max_valor)
        keys[key] = str(valor) # valor como string igual teu exemplo

    # Salva em JSON bonito
    print(f"\n💾 Salvando em {arquivo}...")
    with open(arquivo, 'w', encoding='utf-8') as f:
        json.dump(keys, f, indent=2, ensure_ascii=False)

    print(f"✅ Pronto! {len(keys):,} keys geradas em {arquivo}")

if __name__ == "__main__":
    # CONFIGURA AQUI:
    QTD = 100000 # Quantidade de keys. 1000 pra teste, 1000000 pra 1 milhão
    MIN_VALOR = 50 # Valor mínimo
    MAX_VALOR = 10000 # Valor máximo
    ARQUIVO = "key.json" # Nome do arquivo

    gerar_keys(quantidade=QTD, min_valor=MIN_VALOR, max_valor=MAX_VALOR, arquivo=ARQUIVO)