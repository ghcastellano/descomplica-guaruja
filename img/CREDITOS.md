# Créditos das imagens

Fotos do Unsplash, usadas sob a [Unsplash License](https://unsplash.com/license),
que permite uso comercial e hospedagem própria. Baixadas e convertidas para AVIF
e WebP em 23/09/2026 para tirar o carregamento de um domínio de terceiros do
caminho crítico da página.

Estas são imagens de referência da primeira temporada. Devem ser substituídas por
fotos reais dos eventos assim que houver acervo próprio. Ao trocar, manter os
mesmos nomes de arquivo e proporções para não mexer no HTML.

| arquivo | foto de origem |
|---|---|
| hero-experiencia-por-do-sol | unsplash.com/photos/1707296819777-f96b799efb41 |
| casal-por-do-sol | unsplash.com/photos/1744221127502-727af70bc6e7 |
| experiencia-flores | unsplash.com/photos/1772724317675-5a1afcefea9a |
| experiencia-boho-praia | unsplash.com/photos/1707296825230-3f106b3ac450 |
| pedido-casamento-praia | unsplash.com/photos/1741318103098-767700b2b0aa |
| tabua-de-frios | unsplash.com/photos/1695606452817-e28a67339e57 |

Proporções por uso: `hero` original, `col` 16/10, `gal` 3/4, `card` original
recortada em 16/9 pelo CSS. Larguras: hero 480/800/1400, col 480/800/1200,
gal 400/800, card 800.

> 24/09/2026: as variantes AVIF deixaram de ser referenciadas no HTML. O WebKit do
> iPhone/iPad falhava ao decodificar e mostrava a foto quebrada em vez de cair para o
> WebP. Os arquivos .avif continuam na pasta, mas as páginas usam só WebP + JPG.
