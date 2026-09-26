# Links UTM — Descomplica Guarujá

> Use SEMPRE estes links (nunca o link "limpo") ao postar no Instagram.
> É assim que a planilha e o GA4 sabem de onde cada lead veio.
>
> **Regra de ordem**: o `?utm...` vem SEMPRE antes do `#quiz`.
> O `?utm...` é a etiqueta de origem (gravada na planilha); o `#quiz` rola a página direto até o quiz.

## Links CURTOS (recomendado para a bio — bonitos e rastreados)

Estes redirecionam para o quiz já com UTM. Use na bio porque ficam limpos na tela do Instagram:

| Onde | Link curto | Rastreia como |
|---|---|---|
| **Bio** | `descomplicaguaruja.com.br/montar` | instagram / bio |
| Stories | `descomplicaguaruja.com.br/stories` | instagram / stories |
| Direct | `descomplicaguaruja.com.br/insta` | instagram / direct |

`/bio` também funciona como alias de `/montar`. Definidos em `vercel.json` (bloco `redirects`).

> Por que usar o curto na bio: o Instagram não mostra título de link único — só a URL. Com `/montar`, a URL exibida fica limpa e com cara de marca, em vez do `?utm_source=...` comprido.

---

## Links COMPLETOS (para Reels com campanha específica, ou onde o curto não cobre)

### Bio do Instagram (link fixo do perfil) — leva direto ao quiz
```
https://descomplicaguaruja.com.br/?utm_source=instagram&utm_medium=bio#quiz
```

### Stories (figurinha de link) — leva direto ao quiz
```
https://descomplicaguaruja.com.br/?utm_source=instagram&utm_medium=stories#quiz
```

### Reels — um link por tema (troque o utm_campaign)
```
https://descomplicaguaruja.com.br/?utm_source=instagram&utm_medium=reels&utm_campaign=adois#quiz
https://descomplicaguaruja.com.br/?utm_source=instagram&utm_medium=reels&utm_campaign=celebrar#quiz
https://descomplicaguaruja.com.br/?utm_source=instagram&utm_medium=reels&utm_campaign=amigas#quiz
https://descomplicaguaruja.com.br/?utm_source=instagram&utm_medium=reels&utm_campaign=pedido#quiz
```

### Direct (quando mandar o link em conversa) — leva direto ao quiz
```
https://descomplicaguaruja.com.br/?utm_source=instagram&utm_medium=direct#quiz
```

### WhatsApp (status ou grupos)
```
https://descomplicaguaruja.com.br/?utm_source=whatsapp&utm_medium=status#quiz
```

> Dica: se quiser levar para o TOPO do site (hero) em vez do quiz, é só tirar o `#quiz` do final.

## Como configurar no Instagram — passo a passo

### 1. Link da bio
1. Perfil → **Editar perfil**
2. Campo **Links** → **Adicionar link externo**
3. URL: cola o link da bio (acima)
4. Título: `Planeje sua experiência ✨` (emoji aqui pode — é só texto do Instagram, não vai pra URL)
5. Salvar

### 2. Stories com link
1. Cria o Story normalmente
2. Toca no ícone de **figurinhas** (carinha quadrada) → **LINK**
3. URL: cola o link de stories (acima)
4. Em "Personalizar texto da figurinha": escreve `fazer meu quiz` (fica mais clicável que a URL crua)
5. Posiciona no terço inferior da tela (mais fácil do dedo alcançar)

### 3. Reels
O Instagram NÃO permite link clicável na legenda do Reel. O fluxo que funciona:
1. No final do Reel (vídeo e legenda), chama para ação: **"link na bio"** ou **"comenta QUERO que eu te mando o link"**
2. Se a pessoa comentar, responde pelo Direct com o link de `utm_medium=direct`
3. Quem foi pela bio entra como `bio` — tudo bem, o Reel é o gerador; o que importa é medir o todo

> 💡 Alternativa avançada (futuro): ManyChat ou similar responde os comentários "QUERO"
> automaticamente pelo Direct com o link etiquetado do Reel específico.

### 4. Regras de ouro
- **Nunca encurte** com bit.ly etc. — encurtador esconde a UTM em alguns apps
- **Sempre minúsculas** nos valores de UTM (`adois`, não `ADois`) — maiúscula/minúscula viram linhas diferentes no relatório
- Novo Reel importante = novo `utm_campaign` (ex.: `pedido-reel02`) para comparar performance
- Teste o link antes de postar: abre no navegador e confere se carrega com `?utm_...` na barra

## Onde ver os resultados
- **Planilha de leads** → aba "Leads Quiz", colunas `utm_source/medium/campaign` (lead a lead)
- **Planilha de leads** → aba "Resumo", bloco "POR ORIGEM" (contagem automática)
- **GA4** → Relatórios → Aquisição → Aquisição de tráfego
