
# Plano: Criacao das Tabelas do Banco de Dados

## Resumo

Vou criar toda a estrutura de banco de dados necessaria para o sistema de desmontes automotivos, incluindo:
- Sistema de autenticacao com 3 niveis de acesso (admin, operador, vendedor)
- Tabelas para veiculos, pecas, estoque e compatibilidades
- Integracao com marketplaces e perguntas
- Politicas de seguranca (RLS) para proteger os dados

---

## Estrutura das Tabelas

### 1. Tabelas de Usuarios e Permissoes

**profiles** - Perfis de usuarios vinculados a autenticacao
- id, user_id, full_name, avatar_url, created_at, updated_at

**user_roles** - Papeis dos usuarios (separado para seguranca)
- id, user_id, role (admin/operador/vendedor)

### 2. Tabelas Principais do Negocio

**vehicles** - Cadastro de veiculos
- id, placa, chassi, marca, modelo, ano, motorizacao, combustivel, cor, data_entrada, status, observacoes, user_id, created_at, updated_at

**categories** - Categorias de pecas
- id, name, description, created_at

**parts** - Cadastro de pecas
- id, nome, codigo_interno, codigo_oem, categoria_id, condicao, vehicle_id, quantidade, quantidade_minima, localizacao, preco_custo, preco_venda, observacoes, status, user_id, created_at, updated_at

**part_compatibilities** - Compatibilidades entre pecas e veiculos
- id, part_id, marca, modelo, ano_inicio, ano_fim, observacoes

### 3. Tabelas de Integracao

**marketplace_accounts** - Contas de marketplaces
- id, marketplace, nome_conta, access_token, refresh_token, status, user_id, created_at, updated_at

**marketplace_listings** - Anuncios publicados
- id, part_id, marketplace_account_id, external_id, titulo, preco, status, last_sync, created_at, updated_at

**marketplace_questions** - Perguntas recebidas
- id, listing_id, customer_name, question, answer, status, external_id, received_at, answered_at

### 4. Tabelas de Vendas e Movimentacao

**sales** - Registro de vendas
- id, part_id, marketplace_account_id, quantidade, preco_venda, customer_name, order_external_id, status, sold_at, created_at

**stock_movements** - Movimentacoes de estoque
- id, part_id, tipo (entrada/saida/ajuste), quantidade, motivo, user_id, created_at

---

## Seguranca (RLS)

Todas as tabelas terao Row Level Security ativado com as seguintes regras:

1. **Funcao has_role** - Funcao segura para verificar papeis sem recursao
2. **Admins** - Acesso completo a todos os dados
3. **Operadores** - Podem criar, editar e visualizar dados
4. **Vendedores** - Podem visualizar e responder perguntas

---

## Diagrama de Relacionamentos

```text
+------------------+       +------------------+
|     profiles     |       |   user_roles     |
+------------------+       +------------------+
| id (PK)          |       | id (PK)          |
| user_id (FK)     |<----->| user_id (FK)     |
| full_name        |       | role             |
| avatar_url       |       +------------------+
+------------------+
        |
        v
+------------------+       +------------------+
|    vehicles      |       |   categories     |
+------------------+       +------------------+
| id (PK)          |       | id (PK)          |
| placa            |       | name             |
| chassi           |       | description      |
| marca            |       +------------------+
| modelo           |               |
| ano              |               |
| user_id (FK)     |               |
+------------------+               |
        |                          |
        v                          v
+------------------+       +------------------+
|     parts        |<------| categoria_id(FK) |
+------------------+       +------------------+
| id (PK)          |
| nome             |
| codigo_interno   |
| vehicle_id (FK)  |------>|  vehicles.id     |
| quantidade       |
| preco_venda      |
+------------------+
        |
        |----------------+
        v                v
+------------------+  +----------------------+
| part_compat.     |  | marketplace_listings |
+------------------+  +----------------------+
| part_id (FK)     |  | part_id (FK)         |
| marca/modelo/ano |  | marketplace_acct(FK) |
+------------------+  | external_id          |
                      +----------------------+
                              |
                              v
                      +----------------------+
                      | marketplace_questions|
                      +----------------------+
                      | listing_id (FK)      |
                      | question/answer      |
                      +----------------------+
```

---

## Detalhes Tecnicos

### Enums a serem criados:
- `vehicle_status`: ativo, desmontando, desmontado, finalizado
- `part_condition`: nova, usada, recondicionada
- `part_status`: ativa, vendida, pausada
- `marketplace_type`: mercadolivre, shopee, olx
- `app_role`: admin, operador, vendedor
- `movement_type`: entrada, saida, ajuste
- `question_status`: pending, answered

### Funcoes de seguranca:
- `has_role(user_id, role)` - Verifica se usuario tem determinado papel
- `handle_new_user()` - Cria perfil automaticamente ao registrar

### Triggers:
- Criar perfil automaticamente ao novo usuario se registrar
- Atualizar `updated_at` automaticamente nas tabelas

### Indices para performance:
- Indice em `vehicles.placa`
- Indice em `parts.codigo_interno` e `parts.codigo_oem`
- Indice em `marketplace_listings.external_id`

---

## Proximos Passos Apos Aprovacao

1. Executar migrations para criar todas as tabelas
2. Criar funcoes e triggers de seguranca
3. Aplicar politicas RLS em todas as tabelas
4. Inserir categorias padrao de pecas
5. Atualizar codigo React para usar dados reais do banco
