# Apuntes Rápidos Markdown: Guía de sintaxis extendida

Además de la sintaxis común de Markdown, para facilitar el apunte en diversas formas, apuntes rápidos también admite las siguientes sintaxis de Markdown: 

## Subrayar

```markdown
Aquel biógrafo se zampó un extraño sándwich de vodka y ajo.
```

Aquel biógrafo se zampó un extraño sándwich de vodka y ajo.

## Superíndice y subíndice

Aplicable en el editor de correos

```markdown
Acorde a la Teoría de Procrastinación^[1]^, cuando más tarde empiezes~（un trabajo）~, mayor es tu eficiencia.
```

Acorde a la Teoría de Procrastinación^[1]^, cuando más tarde empiezes~（un trabajo）~, mayor es tu eficiencia.

## Lista de comprobación

```markdown
- [ ] Algo por hacer
- [ ] Otra cosa sin hacer
- [x] Esto está hecho
```

- [ ] Algo por hacer
- [ ] Otra cosa sin hacer
- [x] Esto está hecho

## Tipo de mensajes

Aplicable en el editor de correos

Hay cuatro formas de mensaje: `success`, `info`, `warning` y `error`.

```markdown
::: success
Este es un mensaje de algo correctamente
:::

::: info
Este es un mensaje informativo. Obviemos los otros dos tipos.
:::
```

::: success
Este es un mensaje de algo correctamente
:::

::: info
Este es un mensaje informativo. Obviemos los otros dos tipos.
:::

## Etiquetas de estilo

Aparte de `oculto` y `difuminado`，las otras etiquetas son aplicables en el editor de correos.

```markdown
[Contenido]{Estilo}
```

| Estilo a elegir |  Resultado |
| :-----| :---- |
| `Esto está en [rojo]{red}` | Esto está en [rojo]{red} |
| `Esto está en [naranja]{orange}` | Esto está en [naranja]{orange} |
| `Esto está en [amarillo]{yellow}` | Esto está en [amarillo]{yellow} |
| `Esto está en [verde]{green}` | Esto está en [verde]{green} |
| `Esto está en [turquesa]{teal}` | Esto está en [turquesa]{teal} |
| `Esto está en [azul]{blue}` | Esto está en [azul]{blue} |
| `Esto está en [violeta]{purple}` | Esto está en [violeta]{purple} |
| `Esto está en [gris]{grey}` | Esto está en [gris]{grey} |
| `Fondo [rojo]{bg-red}` | Fondo [rojo]{bg-red} |
| `Fondo [naranja]{bg-orange}` | Fondo [naranja]{bg-orange} |
| `Fondo [amarillo]{bg-yellow}` | Fondo [amarillo]{bg-yellow} |
| `Fondo [verde]{bg-green}` | Fondo [verde]{bg-green} |
| `Fondo [turquesa]{bg-teal}` | Fondo [turquesa]{bg-teal} |
| `Fondo [azul]{bg-blue}` | Fondo [azul]{bg-blue} |
| `Fondo [violeta]{bg-purple}` | Fondo [violeta]{bg-purple} |
| `Fondo [gris]{bg-grey}` | Fondo [gris]{bg-grey} |
| `Una palabra [agrandada]{big}` | Una palabra [agrandada]{big} |
| `Una palabra [empequeñecida]{small}` | Una palabra [empequeñecida]{small} |
| `Está [oculto]{mask}` | Está [oculto]{mask} |
| `Contenido [difuminado]{blur}` | Contenido [difuminado]{blur} |

Además, también puedes escribir algunos estilos CSS en línea a través de la propiedad `style`:

```markdown
Esta línea usa [estilo CSS personalizado]{style="display: inline-block; padding: 2px 5px; margin: 0 2px; border-radius: 3px; background: grey; color: white"}.
```

Esta línea usa [estilo CSS personalizado]{style="display: inline-block; padding: 2px 5px; margin: 0 2px; border-radius: 3px; background: grey; color: white"}.

## Tabla mejorada

Aplicable en el editor de correos

```markdown
|            | Encabezado multicolumna            ||
| Encabezados        | Separados     | Tambíen    |
| ---------- | :------: | -------- |
| Celda multifila   | Celda multicolumna         ||
| ^^         | N/A      | N/A      |
| Elementos multifilas   | - Elemento 1 | - Elemento 1 | \
|            | - Elemento 2 | - Elemento 2 |
[Título de tabla]
```

|            | Encabezado multicolumna            ||
| Encabezados        | Separados     | Tambíen    |
| ---------- | :------: | -------- |
| Celda multifila   | Celda multicolumna         ||
| ^^         | N/A      | N/A      |
| Elementos multifilas   | - Elemento 1 | - Elemento 1 | \
|            | - Elemento 2 | - Elemento 2 |
[Título de tabla]

Para más sintaxis consulte [Tabla de MultiMarkdown](https://github.com/redbug312/markdown-it-multimd-table/blob/master/README.md).
