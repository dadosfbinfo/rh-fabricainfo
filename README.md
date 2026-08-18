# People Hub

Sistema de Gestão de Dados de Gente & Gestão (RH/DP)

Crie um sistema web (aplicação full-stack) para substituir o uso de Google Planilhas pelo setor de RH/DP de uma empresa, com o objetivo de padronizar o cadastro de dados, eliminar erros manuais de digitação e permitir a extração dos dados via API para consumo em um dashboard externo no Power BI.

STACK SUGERIDA

Frontend: React + TypeScript + Tailwind (interface limpa, tipo painel administrativo/ERP)

Backend/Banco de dados: Supabase (Postgres) — para ter autenticação de usuários, controle de permissões (roles) e API REST/endpoints nativos gerados automaticamente

Autenticação: login com e-mail/senha, com campo de "função" (ADMINISTRADOR / EDITOR / VISUALIZADOR)

ESTRUTURA GERAL DO SISTEMA

O sistema deve ter um menu lateral fixo com as seguintes seções (cada uma corresponde a uma tabela no banco de dados):

FUNCIONÁRIOS (tabela principal/mestre)

CADASTROS AUXILIARES (Empresas, Cargos, Projetos, Gestores)

INFO SCHOOL

AVALIAÇÃO DE DESEMPENHO

ATESTADO

ABSENTEÍSMO

API (acesso restrito a administradores)

1. ABA "FUNCIONÁRIOS" (tabela mestre — todas as outras abas puxam dados dela)

Campos do cadastro:

Campo Tipo Regra EMPRESA Select (dropdown) Populado pela tabela auxiliar "Empresas" FUNCIONARIO Texto Obrigatório DATA DE ADMISSÃO Date picker Formato fixo dd/mm/aaaa, não aceita texto livre ANOS DE CASA Calculado automaticamente = (Data de Desligamento OU Data Atual, se ATIVO) − Data de Admissão, em anos. Recalcular sempre que o registro for exibido/atualizado, não gravar como texto fixo CARGO Select (dropdown) Populado pela tabela auxiliar "Cargos" PROJETO Select (dropdown) Populado pela tabela auxiliar "Projetos" GESTOR Select (dropdown) Populado pela tabela auxiliar "Gestores" TIPO COLABORADOR Select (dropdown) Opções fixas: OPERAÇÃO, ADM, CLIENTE, CLIENTE VIP STATUS Select (dropdown) Opções fixas: ATIVO, DESLIGADO, FÉRIAS, LICENÇA DATA DE DESLIGAMENTO Date picker Formato fixo dd/mm/aaaa. Só habilita/faz sentido preencher quando STATUS = DESLIGADO. Se STATUS ≠ DESLIGADO, o campo fica vazio/bloqueado

Funcionalidades:

Listagem em tabela com busca, filtro por Empresa/Status/Cargo/Projeto/Gestor e paginação

Botão "Novo Funcionário" (formulário)

Edição e exclusão (soft delete, se possível, para não perder histórico)

Botão "Importar Excel" (ver regras gerais de importação no item 8)

Exportar listagem filtrada em Excel/CSV

2. ABA "CADASTROS AUXILIARES"

Sub-telas simples (CRUD básico: adicionar, editar, remover) para alimentar os dropdowns da aba Funcionários:

Empresas (lista de nomes de empresas, ex: NC COMÉRCIO)

Cargos (lista de cargos)

Projetos (lista de projetos)

Gestores (lista de nomes de gestores)

Essas listas devem refletir automaticamente nos selects da tela de Funcionários (sem precisar redeploy).

3. ABA "INFO SCHOOL"

Campos:

MÊS (Date/mês-ano)

EMPRESA → puxado automaticamente do cadastro do funcionário selecionado (campo select busca o funcionário e autopreenche Empresa, Admissão, Cargo, Projeto, Gestor, Status)

FUNCIONARIO → select (busca da tabela Funcionários)

ADMISSÃO → autopreenchido (somente leitura)

CARGO → autopreenchido (somente leitura)

PROJETO → autopreenchido (somente leitura)

STATUS → autopreenchido (somente leitura)

GESTOR → autopreenchido (somente leitura)

STATUS COLABORADOR → autopreenchido (somente leitura, = Status do funcionário)

ANO → calculado automaticamente a partir do campo MÊS

STATUS INFOSCHOOL → Select manual (ex: FEZ, NÃO FEZ, EM ANDAMENTO — pode deixar como texto livre/dropdown editável)

4. ABA "AVALIAÇÃO DE DESEMPENHO"

Campos:

FUNCIONARIO → select (busca da tabela Funcionários)

EMPRESA, ADMISSÃO, ANOS DE CASA, CARGO, PROJETO, GESTOR, STATUS, DATA DE DESLIGAMENTO → todos autopreenchidos (somente leitura) a partir do funcionário selecionado

HARD SKILL → número (nota, ex: 0 a 5, aceitar casas decimais)

SOFT SKILL → número (nota, mesma regra)

NOTA FINAL → calculado automaticamente = média entre Hard Skill e Soft Skill (confirmar essa regra visualmente comigo depois, mas usar média simples como padrão)

ANO → calculado automaticamente a partir da data de referência da avaliação (adicionar campo "Data da Avaliação" caso não exista, para servir de base do cálculo do ANO)

5. ABA "ATESTADO"

Campos:

COLABORADOR → select (busca da tabela Funcionários)

PROJETO → autopreenchido (somente leitura) a partir do funcionário

CID → texto livre (campo manual)

DATA → date picker

DIA DA SEMANA → calculado automaticamente a partir da DATA (não editável)

TOTAL DE DIAS → número (manual)

6. ABA "ABSENTEÍSMO" (atenção especial aqui)

Campos:

MÊS → date/mês-ano

FUNCIONARIO → select (busca da tabela Funcionários)

SETOR → texto ou select (pode puxar do campo Projeto do funcionário, ou manter manual — usar select do Projeto por padrão)

HORAS DE AUSÊNCIAS → campo de horas no formato HH:MM:SS

HORAS PREVISTAS → campo de horas no formato HH:MM:SS (pode passar de 24h, ex: 7 dias e Xh — tratar como duração, não como horário do relógio)

Colunas calculadas automaticamente (não editáveis pelo usuário):

HORAS DE AUSÊNCIAS (NÚMERO) → converter a duração HH:MM:SS em número decimal de dias, usando a fórmula: total_de_segundos / 86400. Exemplo: 02:43:00 deve resultar em aproximadamente 0,11

HORAS PREVISTAS (NÚMERO) → mesma lógica de conversão de duração para número decimal

% ABSENTEÍSMO → HORAS DE AUSÊNCIAS (NÚMERO) / HORAS PREVISTAS (NÚMERO), exibido também em formato percentual (ex: 11%)

Importante: gravar os dois campos numéricos convertidos como colunas reais no banco (não apenas exibição), para que a API já entregue esse número pronto para o Power BI.

7. ABA "API" (acesso restrito)

Visível e acessível somente para usuários com função (role) = ADMINISTRADOR

Se um usuário sem essa permissão tentar acessar a URL diretamente, deve ser redirecionado com mensagem de acesso negado

Tela deve listar, para cada uma das tabelas/abas (Funcionários, Info School, Avaliação de Desempenho, Atestado, Absenteísmo), um endpoint de API (REST) único, exibido com:

URL do endpoint

Botão de copiar

Chave/token de autenticação (API Key) necessária para chamar o endpoint (pode ser a própria API Key do Supabase com permissão restrita de leitura — "anon key" com RLS liberando SELECT apenas nessas tabelas)

Um exemplo de chamada (curl) para facilitar o uso no Power BI (Web.Contents / autenticação via header)

Cada endpoint deve retornar os dados já tratados (ex: Absenteísmo já vem com as colunas numéricas calculadas)

Opcional, mas recomendado: botão "Gerar nova chave" caso a atual seja comprometida

8. IMPORTAÇÃO DE EXCEL (regra geral para TODAS as abas)

Em cada tela (Funcionários, Info School, Avaliação de Desempenho, Atestado, Absenteísmo) deve existir um botão "Importar Excel" que:

Permite o upload de um arquivo .xlsx

Antes de gravar, faz uma etapa de validação e pré-visualização:

Verifica se todas as colunas obrigatórias daquela aba estão presentes no arquivo (comparando pelo nome do cabeçalho)

Verifica se os dados de cada coluna estão no formato esperado (datas são datas válidas, números são números válidos, campos de select — como Empresa/Cargo/Projeto/Gestor/Status — batem com algum valor já cadastrado nas tabelas auxiliares ou no cadastro de Funcionários)

Se encontrar erro, exibe uma lista clara: linha X, coluna Y, motivo do erro (ex: "Linha 15, coluna STATUS: valor 'Ativo ' contém espaço extra e não corresponde a nenhuma opção válida")

Tenta corrigir automaticamente erros simples e comuns: espaços duplos, espaços no início/fim (trim), diferenças de maiúsculas/minúsculas na comparação com os selects

Mostra uma tabela de pré-visualização com o que será importado, destacando em vermelho as linhas com erro (que não serão importadas) e em verde as linhas OK

Só permite confirmar a importação depois da validação, com um resumo tipo "X linhas prontas para importar, Y linhas com erro (serão ignoradas)"

Depois de importar, mostra um log/histórico de importações (quem importou, quando, quantas linhas)

9. REGRAS GERAIS DE UX/UI

Interface limpa, estilo painel administrativo (sidebar + conteúdo), responsiva

Todos os campos de data devem usar seletor de calendário (nunca digitação livre de data), evitando formatos inconsistentes

Todos os campos que hoje são preenchidos manualmente com risco de erro de digitação (Empresa, Cargo, Projeto, Gestor, Status, Tipo Colaborador) devem ser obrigatoriamente dropdown, nunca texto livre

Ao selecionar um Funcionário em qualquer aba secundária, os campos vindos do cadastro mestre devem ser preenchidos automaticamente e ficarem bloqueados para edição (evitando divergência de dados entre abas)

Dashboard inicial simples (home) com indicadores rápidos: total de funcionários ativos, desligados, em férias/licença, e atalhos para as abas

10. ESTRUTURA DE PERMISSÕES (roles)

ADMINISTRADOR: acesso total, incluindo aba API e cadastros auxiliares

EDITOR (equipe de RH/DP): pode cadastrar, editar e importar dados em todas as abas, exceto API

VISUALIZADOR: apenas leitura

Construa o sistema seguindo essa especificação. Comece pela estrutura de banco de dados (tabelas: funcionarios, empresas, cargos, projetos, gestores, info_school, avaliacao_desempenho, atestado, absenteismo, usuarios/roles), depois a tela de Funcionários com CRUD completo e dropdowns dinâmicos, e em seguida as demais abas seguindo o mesmo padrão de autopreenchimento a partir do cadastro mestre.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rh-fabricainfo.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8f1640e4-114a-4a7d-a4fc-2f933fd68ee0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
