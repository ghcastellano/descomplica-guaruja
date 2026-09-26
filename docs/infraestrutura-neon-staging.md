# Banco de homologação — Descomplica Guarujá

Provisionado em 26/09/2026 na organização indicada pelo Gustavo, após autenticação pelo Neon CLI.

## Recursos criados

| Recurso | Configuração |
|---|---|
| Organização | Creatività · `org-cold-resonance-77608974` |
| Plano verificado | Free, sem alteração de assinatura |
| Projeto | `descomplica-guaruja` · `summer-truth-88078562` |
| Região | AWS São Paulo · `aws-sa-east-1` |
| PostgreSQL | 17, mesma versão principal do desenvolvimento local |
| Branch | `staging` · `br-solitary-dawn-b67mbwt1` |
| Banco | `descomplica_staging` |
| Compute | 0,25 CU, mínimo e máximo |
| Suspensão | Padrão do plano; API retorna `suspend_timeout_seconds: 0` |

O valor zero usa o padrão de cinco minutos de inatividade. A tentativa de definir explicitamente 300 segundos foi rejeitada pelo plano; a criação foi concluída omitindo essa personalização. Não houve mudança de plano. [Referência oficial da configuração](https://github.com/neondatabase/ai-rules/blob/main/neon-api-projects.mdc).

Console: https://console.neon.tech/app/projects/summer-truth-88078562

## Credenciais e permissões

- `descomplica_owner`: proprietário usado para migrações, conexão direta.
- `descomplica_app`: usuário de execução, conexão com pool e TLS validado. Sem criação de tabelas, gestão de usuários ou permissão de alteração da auditoria.
- A execução pode consultar e inserir registros; atualizar somente as tabelas mutáveis necessárias ao fluxo atual. Sem DELETE, TRUNCATE ou escrita no registro de migrações.
- As credenciais estão em `app/.env.staging.local`, com permissão de arquivo 0600, ignorado pelo Git. O arquivo contém `DATABASE_URL` e `DATABASE_MIGRATION_URL`, não uma configuração completa de publicação.
- Resposta privada do provisionamento e scripts de verificação em `app/.local/`, também ignorados pelo Git. Não publicar esses arquivos nem copiar credenciais para documentação.
- Novas migrações precisam revisar os privilégios explícitos do usuário de execução. Novas tabelas não ficam automaticamente acessíveis.

## Validação realizada

Aplicadas as migrações 001 a 005 do repositório, em ordem e com transações, após verificar que o schema público estava vazio. Validada a conexão do usuário de execução, inserção de atendimento e auditoria e rollback completo. Validados também o bloqueio de reservas sobrepostas e a recusa a mudanças de auditoria, estrutura e registro de migrações.

As verificações não deixam atendimentos ou reservas persistidos. Nenhum banco dos outros projetos foi modificado. Os dados de demonstração do banco local não foram copiados.

## Ainda necessário para publicar o app

O banco está provisionado. **O app ainda usa a configuração local** e ainda não está publicado com esse banco.

1. Configurar autenticação individual, restrita aos e-mails autorizados de Gustavo e Sophia; substituir a identificação fixa da sessão local na auditoria.
2. Adicionar modo de homologação com origem HTTPS explícita, banco autorizado e proteção de mutações, mantendo os testes locais isolados.
3. Criar projeto Vercel separado do site institucional, com execução próxima ao banco em São Paulo. Configurar somente a conexão de execução como segredo do runtime; migrações usam a conexão administrativa separadamente.
4. Configurar Stripe exclusivamente em teste e um webhook HTTPS dedicado ao app. Confirmar a vinculação do sandbox temporário antes de depender dele de forma permanente.
5. Validar o fluxo completo na URL publicada antes de integrar o questionário público ou liberar mensagens externas.

Os e-mails dos dois acessos ainda precisam ser informados. A integração oficial do WhatsApp permanece uma etapa posterior; as notificações atuais continuam simuladas.
