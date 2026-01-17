export const RULES_MARKDOWN_BY_LANGUAGE: Record<string, string> = {
  fr: `# Regles detaillees de Tileburst

Ce document decrit toutes les regles et mecanismes observes dans le jeu.

## Objectif
- Placer des tuiles pour marquer le maximum de points.
- Viser le meilleur score avant la fin de partie.

## Grille
- Taille initiale: 6x6.
- Taille minimale: 4x4.
- Taille maximale: 10x10.
- La grille peut s'agrandir apres des lignes/colonnes completes.
- La grille peut retrecir si aucune tuile ne peut etre placee.

## Tuiles et couleurs
- Couleurs possibles: bleu, rouge, vert, jaune, violet (5 couleurs).
- Une tuile est un ensemble de blocs pleins (1) dans une matrice.
- Familles de formes:
  - 1x1, 1x2, 1x3
  - L-3
  - O-4, I-4, T-4, L-4, S-4
  - Pentominos (taille 5) a partir d'une grille >= 8
  - Hexominos (taille 6) a partir d'une grille >= 9
- Les tuiles asymetriques peuvent etre miroir horizontalement a la creation.

## Deroulement d'un tour
- Une tuile courante est jouee sur la grille.
- La tuile suivante est visible et peut etre echangee.
- Apres le placement, on verifie:
  1. Les lignes/colonnes completes.
  2. La validation des groupes de couleur.
  3. La possibilite de placement des prochaines tuiles.

## Placement des tuiles
- Vous pouvez faire glisser la tuile courante ou cliquer la grille.
- Une case est occupable si elle est dans la grille et vide.
- Une tuile est placable si tous ses blocs tombent sur des cases vides.
- Le placement hors de la grille ou en collision est interdit.

## Actions disponibles
- Rotation: tourne la tuile de 90 degres.
- Miroir: renverse horizontalement la tuile (si asymetrique).
- Echange: permute tuile courante et suivante.

## Lignes et colonnes completes
- Une ligne ou colonne complete doit etre remplie d'une SEULE couleur.
- Les lignes/colonnes completes sont effacees.
- Chaque effacement agrandit la grille de 1 (si pas deja au max).

## Validation des groupes
- Les groupes sont des blocs adjacents orthogonalement (pas de diagonale).
- Un groupe est "valide" si sa taille atteint le seuil minimal.
- Seuil minimal selon la taille de la grille:
  - 6x6 -> 6 blocs
  - 7x7 -> 8 blocs
  - 8x8 -> 10 blocs
  - 9x9 -> 12 blocs
  - 10x10 -> 12 blocs
  - Tailles < 6: taille de grille + 2
- La validation n'ajoute pas de points immediats, mais protege les blocs.

## Score et multiplicateur
- Le multiplicateur depend de la taille actuelle:
  - multiplicateur = taille_grille - 3
  - Exemple: 6x6 -> x3, 10x10 -> x7

### Points pour lignes/colonnes
- points = lignes_effacees * taille_grille * 25 * multiplicateur
- Exemple: grille 6x6, 2 lignes effacees:
  2 * 6 * 25 * 3 = 900 points

### Points pour blocs valides (lors du recul)
- points = nb_blocs_valides_effaces * 15 * multiplicateur

## Agrandissement de la grille
- L'agrandissement se produit apres effacement de lignes/colonnes.
- La grille s'agrandit d'une case de largeur/hauteur.
- L'ancien contenu est conserve et "pousse" vers un coin.
- La direction d'agrandissement tourne dans l'ordre:
  - 0: coin haut-gauche conserve (expansion vers bas/droite)
  - 1: coin haut-droite conserve (expansion vers bas/gauche)
  - 2: coin bas-droite conserve (expansion vers haut/gauche)
  - 3: coin bas-gauche conserve (expansion vers haut/droite)

## Recul de la grille
- Si aucune des deux tuiles (courante ou suivante) ne peut etre placee,
  la grille entre en phase de recul.
- Les blocs valides sont effaces en premier et donnent des points.
- Ensuite, une bordure est marquee comme "a detruire".
- Apres un court avertissement, la grille retrecit d'une case.
- Les blocs sur la bordure marquee sont perdus.
- La direction de recul suit la meme rotation que l'agrandissement.

## Fin de partie
- La partie se termine si:
  - la grille est au minimum (4x4) ET
  - aucune des deux tuiles ne peut etre placee.

## Notes utiles
- La tuile suivante est toujours connue, ce qui permet de planifier.
- Le jeu conserve le meilleur score localement.
`,
  en: `# Detailed Tileburst Rules

This document describes all rules and main mechanics of the game.

## Goal
- Place tiles on the grid to score as many points as possible.
- Aim for the best score before the game ends.

## Grid
- Starting size: 6x6.
- Minimum size: 4x4.
- Maximum size: 10x10.
- The grid can expand after completed lines/columns.
- The grid can shrink if no tile can be placed.

## Tiles and colors
- Possible colors: blue, red, green, yellow, purple (5 colors).
- A tile is a set of filled blocks (1) in a matrix.
- Shape families:
  - 1x1, 1x2, 1x3
  - L-3
  - O-4, I-4, T-4, L-4, S-4
  - Pentominoes (size 5) from grid >= 8
  - Hexominoes (size 6) from grid >= 9
- Asymmetric tiles may be mirrored horizontally on creation.

## Turn flow
- A current tile is played on the grid.
- The next tile is visible and can be swapped.
- After placement, we check:
  1. Completed rows/columns.
  2. Validation of color groups.
  3. Whether the next tiles can be placed.

## Tile placement
- Drag the current tile or click the grid to place it.
- A cell is usable if it is inside the grid and empty.
- A tile is placeable if all its blocks land on empty cells.
- Out-of-grid or colliding placement is not allowed.

## Available actions
- Rotate: rotate the tile by 90 degrees.
- Mirror: flip the tile horizontally (if asymmetric).
- Swap: swap current and next tile.

## Completed rows and columns
- A full row/column must be filled with a SINGLE color.
- Completed rows/columns are cleared.
- Each clear expands the grid by 1 (if not already at max).

## Group validation
- Groups are orthogonally adjacent blocks (no diagonals).
- A group is "validated" if it reaches the minimum size.
- Minimum size by grid size:
  - 6x6 -> 6 blocks
  - 7x7 -> 8 blocks
  - 8x8 -> 10 blocks
  - 9x9 -> 12 blocks
  - 10x10 -> 12 blocks
  - Sizes < 6: grid size + 2
- Validation gives no immediate points, but protects blocks.

## Score and multiplier
- Multiplier depends on the current size:
  - multiplier = grid_size - 3
  - Example: 6x6 -> x3, 10x10 -> x7

### Points for rows/columns
- points = lines_cleared * grid_size * 25 * multiplier
- Example: 6x6 grid, 2 lines cleared:
  2 * 6 * 25 * 3 = 900 points

### Points for validated blocks (during shrink)
- points = validated_blocks_cleared * 15 * multiplier

## Grid expansion
- Expansion happens after clearing rows/columns.
- The grid grows by one row and one column.
- Existing content is preserved and shifted to a corner.
- Expansion direction rotates in order:
  - 0: keep top-left corner (expand down/right)
  - 1: keep top-right corner (expand down/left)
  - 2: keep bottom-right corner (expand up/left)
  - 3: keep bottom-left corner (expand up/right)

## Grid shrink
- If neither current nor next tile can be placed,
  the grid enters the shrink phase.
- Validated blocks are cleared first and give points.
- Then a border is marked as "to be destroyed".
- After a short warning, the grid shrinks by one.
- Blocks on the marked border are lost.
- Shrink direction follows the same rotation as expansion.

## Game over
- The game ends if:
  - the grid is at minimum size (4x4) AND
  - neither of the two tiles can be placed.

## Useful notes
- The next tile is always known, so you can plan ahead.
- The game stores the best score locally.
`,
  es: `# Reglas detalladas de Tileburst

Este documento describe todas las reglas y mecanismos del juego.

## Objetivo
- Colocar fichas en la cuadrícula para obtener la mayor puntuacion posible.
- Buscar el mejor puntaje antes de que termine la partida.

## Cuadricula
- Tamano inicial: 6x6.
- Tamano minimo: 4x4.
- Tamano maximo: 10x10.
- La cuadricula puede expandirse despues de lineas/columnas completas.
- La cuadricula puede reducirse si no se puede colocar ninguna ficha.

## Fichas y colores
- Colores posibles: azul, rojo, verde, amarillo, morado (5 colores).
- Una ficha es un conjunto de bloques llenos (1) en una matriz.
- Familias de formas:
  - 1x1, 1x2, 1x3
  - L-3
  - O-4, I-4, T-4, L-4, S-4
  - Pentominos (tamano 5) a partir de cuadricula >= 8
  - Hexominos (tamano 6) a partir de cuadricula >= 9
- Las fichas asimetricas pueden espejarse horizontalmente al crearse.

## Flujo de un turno
- Se juega una ficha actual en la cuadricula.
- La siguiente ficha es visible y puede intercambiarse.
- Despues de colocar, se verifica:
  1. Lineas/columnas completas.
  2. Validacion de grupos de color.
  3. Posibilidad de colocar las proximas fichas.

## Colocacion de fichas
- Arrastra la ficha actual o haz clic en la cuadricula para colocarla.
- Una casilla es usable si esta dentro de la cuadricula y vacia.
- Una ficha es colocable si todos sus bloques caen en casillas vacias.
- No se permite colocar fuera de la cuadricula ni con colision.

## Acciones disponibles
- Rotar: gira la ficha 90 grados.
- Espejo: voltea la ficha horizontalmente (si es asimetrica).
- Intercambiar: cambia la ficha actual y la siguiente.

## Lineas y columnas completas
- Una linea/columna completa debe tener un SOLO color.
- Las lineas/columnas completas se eliminan.
- Cada eliminacion expande la cuadricula en 1 (si no esta al maximo).

## Validacion de grupos
- Los grupos son bloques adyacentes ortogonalmente (sin diagonales).
- Un grupo es "validado" si alcanza el tamano minimo.
- Tamano minimo segun la cuadricula:
  - 6x6 -> 6 bloques
  - 7x7 -> 8 bloques
  - 8x8 -> 10 bloques
  - 9x9 -> 12 bloques
  - 10x10 -> 12 bloques
  - Tamaños < 6: tamano de la cuadricula + 2
- La validacion no da puntos inmediatos, pero protege los bloques.

## Puntuacion y multiplicador
- El multiplicador depende del tamano actual:
  - multiplicador = tamano_cuadricula - 3
  - Ejemplo: 6x6 -> x3, 10x10 -> x7

### Puntos por lineas/columnas
- puntos = lineas_eliminadas * tamano_cuadricula * 25 * multiplicador
- Ejemplo: cuadricula 6x6, 2 lineas eliminadas:
  2 * 6 * 25 * 3 = 900 puntos

### Puntos por bloques validados (durante el retroceso)
- puntos = bloques_validados_eliminados * 15 * multiplicador

## Expansion de la cuadricula
- La expansion ocurre despues de eliminar lineas/columnas.
- La cuadricula crece una fila y una columna.
- El contenido existente se conserva y se mueve a una esquina.
- La direccion de expansion rota en orden:
  - 0: conservar esquina superior izquierda (expande abajo/derecha)
  - 1: conservar esquina superior derecha (expande abajo/izquierda)
  - 2: conservar esquina inferior derecha (expande arriba/izquierda)
  - 3: conservar esquina inferior izquierda (expande arriba/derecha)

## Retroceso de la cuadricula
- Si ni la ficha actual ni la siguiente pueden colocarse,
  la cuadricula entra en fase de retroceso.
- Los bloques validados se eliminan primero y dan puntos.
- Luego se marca un borde como "a destruir".
- Tras una breve advertencia, la cuadricula se reduce en 1.
- Los bloques en el borde marcado se pierden.
- La direccion del retroceso sigue la misma rotacion que la expansion.

## Fin de la partida
- La partida termina si:
  - la cuadricula esta en el minimo (4x4) Y
  - ninguna de las dos fichas puede colocarse.

## Notas utiles
- La siguiente ficha siempre es conocida, lo que permite planificar.
- El juego guarda el mejor puntaje localmente.
`,
  de: `# Ausfuehrliche Tileburst-Regeln

Dieses Dokument beschreibt alle Regeln und Mechaniken des Spiels.

## Ziel
- Platziere Teile auf dem Raster, um moeglichst viele Punkte zu erzielen.
- Versuche den besten Punktestand zu erreichen, bevor das Spiel endet.

## Raster
- Startgroesse: 6x6.
- Mindestgroesse: 4x4.
- Maximalgroesse: 10x10.
- Das Raster kann nach vollstaendigen Reihen/Spalten wachsen.
- Das Raster kann schrumpfen, wenn kein Teil platziert werden kann.

## Teile und Farben
- Moegliche Farben: blau, rot, gruen, gelb, violett (5 Farben).
- Ein Teil ist eine Menge gefuellter Bloecke (1) in einer Matrix.
- Formfamilien:
  - 1x1, 1x2, 1x3
  - L-3
  - O-4, I-4, T-4, L-4, S-4
  - Pentominos (Groesse 5) ab Raster >= 8
  - Hexominos (Groesse 6) ab Raster >= 9
- Asymmetrische Teile koennen bei der Erzeugung horizontal gespiegelt werden.

## Ablauf eines Zuges
- Ein aktuelles Teil wird auf das Raster gespielt.
- Das naechste Teil ist sichtbar und kann getauscht werden.
- Nach dem Platzieren pruefen wir:
  1. Vollstaendige Reihen/Spalten.
  2. Validierung von Farbgruppen.
  3. Ob die naechsten Teile platzierbar sind.

## Platzierung der Teile
- Ziehe das aktuelle Teil oder klicke auf das Raster, um es zu platzieren.
- Ein Feld ist nutzbar, wenn es im Raster liegt und frei ist.
- Ein Teil ist platzierbar, wenn alle Bloecke auf leeren Feldern landen.
- Platzierung ausserhalb des Rasters oder mit Kollision ist nicht erlaubt.

## Verfuegbare Aktionen
- Drehen: dreht das Teil um 90 Grad.
- Spiegeln: spiegelt das Teil horizontal (falls asymmetrisch).
- Tauschen: vertauscht aktuelles und naechstes Teil.

## Vollstaendige Reihen und Spalten
- Eine volle Reihe/Spalte muss eine EINZIGE Farbe haben.
- Vollstaendige Reihen/Spalten werden entfernt.
- Jede Entfernung vergroessert das Raster um 1 (falls nicht am Maximum).

## Validierung von Gruppen
- Gruppen sind orthogonal benachbarte Bloecke (keine Diagonalen).
- Eine Gruppe ist "validiert", wenn sie die Mindestgroesse erreicht.
- Mindestgroesse je Raster:
  - 6x6 -> 6 Bloecke
  - 7x7 -> 8 Bloecke
  - 8x8 -> 10 Bloecke
  - 9x9 -> 12 Bloecke
  - 10x10 -> 12 Bloecke
  - Groessen < 6: Rastergroesse + 2
- Validierung bringt keine sofortigen Punkte, schuetzt aber Bloecke.

## Punkte und Multiplikator
- Der Multiplikator haengt von der aktuellen Groesse ab:
  - Multiplikator = Rastergroesse - 3
  - Beispiel: 6x6 -> x3, 10x10 -> x7

### Punkte fuer Reihen/Spalten
- Punkte = entfernte_Linien * Rastergroesse * 25 * Multiplikator
- Beispiel: Raster 6x6, 2 Linien entfernt:
  2 * 6 * 25 * 3 = 900 Punkte

### Punkte fuer validierte Bloecke (beim Schrumpfen)
- Punkte = entfernte_validierte_Bloecke * 15 * Multiplikator

## Raster-Erweiterung
- Erweiterung passiert nach dem Entfernen von Reihen/Spalten.
- Das Raster waechst um eine Zeile und eine Spalte.
- Der vorhandene Inhalt bleibt und wird in eine Ecke verschoben.
- Die Erweiterungsrichtung rotiert in Reihenfolge:
  - 0: Ecke oben links behalten (Expand nach unten/rechts)
  - 1: Ecke oben rechts behalten (Expand nach unten/links)
  - 2: Ecke unten rechts behalten (Expand nach oben/links)
  - 3: Ecke unten links behalten (Expand nach oben/rechts)

## Raster-Schrumpfen
- Wenn weder aktuelles noch naechstes Teil platzierbar ist,
  startet die Schrumpfphase.
- Validierte Bloecke werden zuerst entfernt und geben Punkte.
- Danach wird ein Rand als "zu zerstoeren" markiert.
- Nach kurzer Warnung schrumpft das Raster um 1.
- Bloecke auf dem markierten Rand gehen verloren.
- Die Schrumpfrichtung folgt derselben Rotation wie die Erweiterung.

## Spielende
- Das Spiel endet, wenn:
  - das Raster die Mindestgroesse (4x4) erreicht UND
  - keine der beiden Kacheln platziert werden kann.

## Nuetzliche Hinweise
- Das naechste Teil ist immer bekannt, so kann man planen.
- Das Spiel speichert den besten Punktestand lokal.
`,
  it: `# Regole dettagliate di Tileburst

Questo documento descrive tutte le regole e i meccanismi del gioco.

## Obiettivo
- Posizionare le tessere sulla griglia per ottenere il massimo punteggio.
- Puntare al miglior punteggio prima della fine partita.

## Griglia
- Dimensione iniziale: 6x6.
- Dimensione minima: 4x4.
- Dimensione massima: 10x10.
- La griglia puo espandersi dopo righe/colonne complete.
- La griglia puo restringersi se nessuna tessera puo essere posizionata.

## Tessere e colori
- Colori possibili: blu, rosso, verde, giallo, viola (5 colori).
- Una tessera e un insieme di blocchi pieni (1) in una matrice.
- Famiglie di forme:
  - 1x1, 1x2, 1x3
  - L-3
  - O-4, I-4, T-4, L-4, S-4
  - Pentomini (dimensione 5) da griglia >= 8
  - Esomini (dimensione 6) da griglia >= 9
- Le tessere asimmetriche possono essere specchiate orizzontalmente alla creazione.

## Svolgimento di un turno
- Si gioca una tessera corrente sulla griglia.
- La tessera successiva e visibile e puo essere scambiata.
- Dopo il posizionamento si verifica:
  1. Righe/colonne complete.
  2. Validazione dei gruppi di colore.
  3. Possibilita di posizionare le prossime tessere.

## Posizionamento delle tessere
- Trascina la tessera corrente o clicca sulla griglia per posizionarla.
- Una cella e utilizzabile se e nella griglia ed e vuota.
- Una tessera e posizionabile se tutti i blocchi cadono su celle vuote.
- Il posizionamento fuori griglia o in collisione non e consentito.

## Azioni disponibili
- Rotazione: ruota la tessera di 90 gradi.
- Specchio: ribalta la tessera orizzontalmente (se asimmetrica).
- Scambio: scambia tessera corrente e successiva.

## Righe e colonne complete
- Una riga/colonna completa deve essere di un SOLO colore.
- Le righe/colonne complete vengono eliminate.
- Ogni eliminazione espande la griglia di 1 (se non al massimo).

## Validazione dei gruppi
- I gruppi sono blocchi adiacenti ortogonalmente (no diagonali).
- Un gruppo e "validato" se raggiunge la dimensione minima.
- Dimensione minima per griglia:
  - 6x6 -> 6 blocchi
  - 7x7 -> 8 blocchi
  - 8x8 -> 10 blocchi
  - 9x9 -> 12 blocchi
  - 10x10 -> 12 blocchi
  - Dimensioni < 6: dimensione griglia + 2
- La validazione non da punti immediati, ma protegge i blocchi.

## Punteggio e moltiplicatore
- Il moltiplicatore dipende dalla dimensione attuale:
  - moltiplicatore = dimensione_griglia - 3
  - Esempio: 6x6 -> x3, 10x10 -> x7

### Punti per righe/colonne
- punti = linee_eliminate * dimensione_griglia * 25 * moltiplicatore
- Esempio: griglia 6x6, 2 linee eliminate:
  2 * 6 * 25 * 3 = 900 punti

### Punti per blocchi validati (durante la riduzione)
- punti = blocchi_validati_eliminati * 15 * moltiplicatore

## Espansione della griglia
- L'espansione avviene dopo l'eliminazione di righe/colonne.
- La griglia cresce di una riga e una colonna.
- Il contenuto esistente viene conservato e spinto verso un angolo.
- La direzione di espansione ruota in ordine:
  - 0: mantiene l'angolo in alto a sinistra (espande giu/destra)
  - 1: mantiene l'angolo in alto a destra (espande giu/sinistra)
  - 2: mantiene l'angolo in basso a destra (espande su/sinistra)
  - 3: mantiene l'angolo in basso a sinistra (espande su/destra)

## Riduzione della griglia
- Se ne la tessera corrente ne la successiva possono essere posizionate,
  la griglia entra in fase di riduzione.
- I blocchi validati vengono eliminati per primi e danno punti.
- Poi un bordo viene segnato come "da distruggere".
- Dopo un breve avviso, la griglia si riduce di 1.
- I blocchi sul bordo segnato vengono persi.
- La direzione della riduzione segue la stessa rotazione dell'espansione.

## Fine della partita
- La partita termina se:
  - la griglia e al minimo (4x4) E
  - nessuna delle due tessere puo essere posizionata.

## Note utili
- La tessera successiva e sempre nota, quindi puoi pianificare.
- Il gioco salva il miglior punteggio localmente.
`,
  pt: `# Regras detalhadas do Tileburst

Este documento descreve todas as regras e mecanicas do jogo.

## Objetivo
- Colocar pecas na grade para obter o maximo de pontos.
- Buscar a melhor pontuacao antes do fim do jogo.

## Grade
- Tamanho inicial: 6x6.
- Tamanho minimo: 4x4.
- Tamanho maximo: 10x10.
- A grade pode expandir apos linhas/colunas completas.
- A grade pode encolher se nenhuma peca puder ser colocada.

## Pecas e cores
- Cores possiveis: azul, vermelho, verde, amarelo, roxo (5 cores).
- Uma peca e um conjunto de blocos preenchidos (1) em uma matriz.
- Familias de formas:
  - 1x1, 1x2, 1x3
  - L-3
  - O-4, I-4, T-4, L-4, S-4
  - Pentominos (tamanho 5) a partir de grade >= 8
  - Hexominos (tamanho 6) a partir de grade >= 9
- Pecas assimetricas podem ser espelhadas horizontalmente na criacao.

## Fluxo de um turno
- Uma peca atual e jogada na grade.
- A proxima peca fica visivel e pode ser trocada.
- Apos o posicionamento, verificamos:
  1. Linhas/colunas completas.
  2. Validacao de grupos de cor.
  3. Possibilidade de colocar as proximas pecas.

## Posicionamento das pecas
- Arraste a peca atual ou clique na grade para posicionar.
- Uma celula e utilizavel se estiver na grade e vazia.
- Uma peca e posicionavel se todos os blocos cairem em celulas vazias.
- Posicionamento fora da grade ou com colisao nao e permitido.

## Acoes disponiveis
- Rotacao: gira a peca em 90 graus.
- Espelho: inverte a peca horizontalmente (se assimetrica).
- Troca: troca a peca atual com a proxima.

## Linhas e colunas completas
- Uma linha/coluna completa deve ter uma UNICA cor.
- Linhas/colunas completas sao removidas.
- Cada remocao expande a grade em 1 (se nao estiver no maximo).

## Validacao de grupos
- Grupos sao blocos adjacentes ortogonalmente (sem diagonais).
- Um grupo e "validado" se atingir o tamanho minimo.
- Tamanho minimo por grade:
  - 6x6 -> 6 blocos
  - 7x7 -> 8 blocos
  - 8x8 -> 10 blocos
  - 9x9 -> 12 blocos
  - 10x10 -> 12 blocos
  - Tamanhos < 6: tamanho da grade + 2
- A validacao nao da pontos imediatos, mas protege os blocos.

## Pontuacao e multiplicador
- O multiplicador depende do tamanho atual:
  - multiplicador = tamanho_grade - 3
  - Exemplo: 6x6 -> x3, 10x10 -> x7

### Pontos por linhas/colunas
- pontos = linhas_removidas * tamanho_grade * 25 * multiplicador
- Exemplo: grade 6x6, 2 linhas removidas:
  2 * 6 * 25 * 3 = 900 pontos

### Pontos por blocos validados (durante o encolhimento)
- pontos = blocos_validados_removidos * 15 * multiplicador

## Expansao da grade
- A expansao ocorre apos limpar linhas/colunas.
- A grade cresce uma linha e uma coluna.
- O conteudo existente e preservado e movido para um canto.
- A direcao da expansao gira na ordem:
  - 0: manter canto superior esquerdo (expande para baixo/direita)
  - 1: manter canto superior direito (expande para baixo/esquerda)
  - 2: manter canto inferior direito (expande para cima/esquerda)
  - 3: manter canto inferior esquerdo (expande para cima/direita)

## Encolhimento da grade
- Se nem a peca atual nem a proxima podem ser colocadas,
  a grade entra na fase de encolhimento.
- Blocos validados sao removidos primeiro e rendem pontos.
- Depois, uma borda e marcada como "a destruir".
- Apos um aviso curto, a grade encolhe em 1.
- Blocos na borda marcada sao perdidos.
- A direcao do encolhimento segue a mesma rotacao da expansao.

## Fim de jogo
- O jogo termina se:
  - a grade esta no minimo (4x4) E
  - nenhuma das duas pecas pode ser colocada.

## Notas uteis
- A proxima peca e sempre conhecida, permitindo planejar.
- O jogo salva o melhor resultado localmente.
`,
  ru: `# Podrobnye pravila Tileburst

V etom dokumente opisany vse pravila i mehaniki igry.

## Tsel
- Razmeshchat plitki na setke, chtoby nabrat maksimum ochkov.
- Stremitsya k luchshemu rezultatu do kontsa igry.

## Setka
- Startovyi razmer: 6x6.
- Minimalnyi razmer: 4x4.
- Maksimalnyi razmer: 10x10.
- Setka mojet raschiryatsya posle polnyh strok/stolbcov.
- Setka mojet suzhatsya, esli nelzya razmestit plitku.

## Plitki i cveta
- Vozmojnye cveta: sinii, krasnyi, zelenyi, jeltyi, fioletovyi (5 cvetov).
- Plitka — eto nabor zapolnennyh blokov (1) v matritse.
- Semeistva form:
  - 1x1, 1x2, 1x3
  - L-3
  - O-4, I-4, T-4, L-4, S-4
  - Pentomino (razmer 5) s setki >= 8
  - Geksomino (razmer 6) s setki >= 9
- Asimmetrichnye plitki mogut byt zerkalno otrazheny po gorizontali pri sozdanii.

## Hod igry
- Tekushchaya plitka stavitsya na setku.
- Sleduyushchaya plitka vidna i mojet byt pomenyana mestami.
- Posle ustanovki proveriayutsya:
  1. Polnye stroki/stolbcy.
  2. Validaciya grupp cveta.
  3. Vozmozhnost postavit sleduyushchie plitki.

## Razmeshchenie plitok
- Peretashchite tekushchuyu plitku ili kliknite po setke.
- Kletka ispolzuema, esli ona v setke i pustaya.
- Plitka razmeshchaema, esli vse ee bloki popadayut na pustye kletki.
- Nelzya razmeshchat za predelami setki ili s peresecheniem.

## Dostupnye deistviya
- Povorot: povorachivaet plitku na 90 gradusov.
- Zerkalo: otrazhaet plitku po gorizontali (esli asimmetrichna).
- Obmen: menyayet tekushchuyu i sleduyushchuyu plitku mestami.

## Polnye stroki i stolbcy
- Polnaya stroka/stolbec doljna byt odnogo cveta.
- Polnye stroki/stolbcy ochishchayutsya.
- Kazhdaya ochistka rasshiryayet setku na 1 (esli ne na maksimume).

## Validaciya grupp
- Gruppy — ortogonalno sosednie bloki (bez diagonaley).
- Gruppu "validiruyut", esli ona dostigaet minimalnogo razmera.
- Minimalnyi razmer po razmeru setki:
  - 6x6 -> 6 blokov
  - 7x7 -> 8 blokov
  - 8x8 -> 10 blokov
  - 9x9 -> 12 blokov
  - 10x10 -> 12 blokov
  - Razmery < 6: razmer setki + 2
- Validaciya ne daet ochki srazu, no zashchishchaet bloki.

## Ochki i mnozhitel
- Mnozhitel zavisit ot tekushchego razmera:
  - mnozhitel = razmer_setki - 3
  - Primer: 6x6 -> x3, 10x10 -> x7

### Ochki za stroki/stolbcy
- ochki = ochishchennye_linii * razmer_setki * 25 * mnozhitel
- Primer: setka 6x6, ochishcheno 2 linii:
  2 * 6 * 25 * 3 = 900 ochkov

### Ochki za validirovannye bloki (pri sjatii)
- ochki = ochishchennye_valid_bloki * 15 * mnozhitel

## Rasshirenie setki
- Rasshirenie proishodit posle ochistki strok/stolbcov.
- Setka uvelichivaetsya na odnu stroku i odin stolbec.
- Sushchestvuyushchiy kontent sohranyaetsya i smeshchaetsya v ugol.
- Napravlenie rasshireniya vrashchaetsya v poryadke:
  - 0: sohranit verhniy levyi ugol (rasshirenie vniz/vpravo)
  - 1: sohranit verhniy praviy ugol (rasshirenie vniz/vlevo)
  - 2: sohranit nijniy praviy ugol (rasshirenie vverh/vlevo)
  - 3: sohranit nijniy levyi ugol (rasshirenie vverh/vpravo)

## Sjatie setki
- Esli ni tekushchaya, ni sleduyushchaya plitka ne mogut byt postavleny,
  setka vkhodit v fazu sjatiya.
- Snachala ochishchayutsya validirovannye bloki i dayut ochki.
- Zatem otmechaetsya granitsa "na udaleniye".
- Posle korotkogo preduprejdeniya setka umenshaetsya na 1.
- Bloki na otmechennoy granitse ischezayut.
- Napravlenie sjatiya sleduet toj zhe rotacii, chto i rasshirenie.

## Konec igry
- Igra zakanchivaetsya, esli:
  - setka v minimalnom razmere (4x4) I
  - ni odna iz dvuh plitok ne mozhet byt postavlena.

## Poleznye zametki
- Sleduyushchaya plitka vsegda izvestna, mozhno planirovat.
- Igra sohranyaet luchshiy rezultat lokalno.
`,
  ja: `# Tileburstの詳細ルール

このドキュメントはゲームのすべてのルールと仕組みを説明します。

## 目的
- グリッドにタイルを置いて最大得点を目指します。
- ゲーム終了までにベストスコアを狙います。

## グリッド
- 初期サイズ: 6x6
- 最小サイズ: 4x4
- 最大サイズ: 10x10
- 行/列が完成すると拡張します。
- 置けるタイルがない場合は縮小します。

## タイルと色
- 色: 青、赤、緑、黄、紫（5色）
- タイルは行列内のブロック(1)で構成されます。
- 形の種類:
  - 1x1, 1x2, 1x3
  - L-3
  - O-4, I-4, T-4, L-4, S-4
  - ペントミノ(サイズ5)はグリッド >= 8から
  - ヘキソミノ(サイズ6)はグリッド >= 9から
- 非対称タイルは生成時に水平反転されることがあります。

## ターンの流れ
- 現在タイルをグリッドに配置します。
- 次のタイルは表示され、交換できます。
- 配置後に確認する内容:
  1. 行/列の完成
  2. 色グループの検証
  3. 次のタイルが置けるかどうか

## タイルの配置
- 現在タイルをドラッグ、またはグリッドをクリックして配置します。
- セルはグリッド内かつ空であれば使用可能です。
- タイルの全ブロックが空セルに入れば配置可能です。
- グリッド外や衝突する配置は不可です。

## 操作
- 回転: タイルを90度回転します。
- ミラー: タイルを水平反転します（非対称のみ）。
- 交換: 現在タイルと次タイルを入れ替えます。

## 行/列の完成
- 行/列は単一の色で埋める必要があります。
- 完成した行/列は消去されます。
- 消去のたびにグリッドが1拡張します（最大でなければ）。

## グループ検証
- グループは上下左右の隣接のみ（斜めは不可）。
- 最小サイズに達すると「検証済み」になります。
- グリッドサイズ別の最小数:
  - 6x6 -> 6
  - 7x7 -> 8
  - 8x8 -> 10
  - 9x9 -> 12
  - 10x10 -> 12
  - 6未満: グリッドサイズ + 2
- 検証は即時得点はありませんが、ブロックを保護します。

## スコアと倍率
- 倍率は現在のサイズに依存:
  - 倍率 = グリッドサイズ - 3
  - 例: 6x6 -> x3, 10x10 -> x7

### 行/列の得点
- 得点 = 消去行数 * グリッドサイズ * 25 * 倍率
- 例: 6x6で2行消去:
  2 * 6 * 25 * 3 = 900

### 縮小時の検証ブロック得点
- 得点 = 消去検証ブロック数 * 15 * 倍率

## グリッド拡張
- 行/列消去後に拡張します。
- 行と列が1つずつ増えます。
- 既存の内容は保持され、特定の角に寄せられます。
- 拡張方向は順番に回転します:
  - 0: 左上固定（下/右に拡張）
  - 1: 右上固定（下/左に拡張）
  - 2: 右下固定（上/左に拡張）
  - 3: 左下固定（上/右に拡張）

## グリッド縮小
- 現在/次のどちらのタイルも置けない場合に開始。
- 検証済みブロックが先に消去され、得点になります。
- その後、破壊される境界がマークされます。
- 短い警告の後、グリッドが1縮小します。
- マークされた境界のブロックは失われます。
- 縮小方向は拡張と同じローテーションです。

## ゲームオーバー
- 以下の両方で終了:
  - グリッドが最小(4x4)
  - 2つのタイルがどちらも置けない

## 補足
- 次のタイルが見えるため、計画的に進められます。
- ベストスコアはローカルに保存されます。
`,
  zh: `# Tileburst 详细规则

本文档说明游戏的全部规则与机制。

## 目标
- 在网格上放置方块以获得尽可能高的分数。
- 在游戏结束前争取最佳成绩。

## 网格
- 初始大小: 6x6
- 最小大小: 4x4
- 最大大小: 10x10
- 完成行/列后网格会扩展。
- 无法放置任何方块时网格会收缩。

## 方块与颜色
- 颜色: 蓝、红、绿、黄、紫（5种）
- 方块由矩阵中的实心格(1)组成。
- 形状类型:
  - 1x1, 1x2, 1x3
  - L-3
  - O-4, I-4, T-4, L-4, S-4
  - 五连块(尺寸5)在网格 >= 8 时出现
  - 六连块(尺寸6)在网格 >= 9 时出现
- 非对称方块在生成时可能会水平镜像。

## 回合流程
- 当前方块放置到网格。
- 下一块可见，并可交换。
- 放置后检查:
  1. 完成的行/列
  2. 颜色群组的验证
  3. 下一块是否还能放置

## 方块放置
- 拖动当前方块或点击网格放置。
- 单元格在网格内且为空时可用。
- 方块所有格落在空格上才可放置。
- 不允许越界或碰撞放置。

## 可用操作
- 旋转: 方块旋转90度。
- 镜像: 水平翻转方块（非对称时）。
- 交换: 交换当前与下一方块。

## 完成行/列
- 行/列必须为同一种颜色。
- 完成的行/列会被清除。
- 每次清除使网格扩展1（未达最大时）。

## 群组验证
- 群组为上下左右相邻（不含对角）。
- 达到最小数量即为“验证”。
- 最小数量按网格大小:
  - 6x6 -> 6
  - 7x7 -> 8
  - 8x8 -> 10
  - 9x9 -> 12
  - 10x10 -> 12
  - 小于6: 网格大小 + 2
- 验证不会立即得分，但会保护方块。

## 分数与倍率
- 倍率取决于当前网格大小:
  - 倍率 = 网格大小 - 3
  - 例: 6x6 -> x3, 10x10 -> x7

### 行/列得分
- 得分 = 清除行数 * 网格大小 * 25 * 倍率
- 例: 6x6 清除2行:
  2 * 6 * 25 * 3 = 900

### 收缩时验证方块得分
- 得分 = 清除验证方块数 * 15 * 倍率

## 网格扩展
- 在清除行/列后扩展。
- 网格增加一行一列。
- 原有内容保留并被推向一个角。
- 扩展方向按顺序轮换:
  - 0: 保留左上角（向下/右扩展）
  - 1: 保留右上角（向下/左扩展）
  - 2: 保留右下角（向上/左扩展）
  - 3: 保留左下角（向上/右扩展）

## 网格收缩
- 当前和下一块都无法放置时进入收缩阶段。
- 先清除验证方块并得分。
- 然后标记将被销毁的边界。
- 短暂提示后网格缩小1。
- 被标记边界上的方块会丢失。
- 收缩方向与扩展方向相同的轮换。

## 游戏结束
- 同时满足以下条件时结束:
  - 网格达到最小(4x4)
  - 两块方块都无法放置

## 说明
- 下一块可见，便于规划。
- 最佳分数会保存在本地。
`,
  ko: `# Tileburst 상세 규칙

이 문서는 게임의 모든 규칙과 메커니즘을 설명합니다.

## 목표
- 그리드에 타일을 놓아 최대한 높은 점수를 얻습니다.
- 게임 종료 전 최고 점수를 목표로 합니다.

## 그리드
- 시작 크기: 6x6
- 최소 크기: 4x4
- 최대 크기: 10x10
- 행/열 완성 시 그리드가 확장됩니다.
- 놓을 타일이 없으면 그리드가 축소됩니다.

## 타일과 색상
- 색상: 파랑, 빨강, 초록, 노랑, 보라 (5색)
- 타일은 행렬의 채워진 블록(1)으로 구성됩니다.
- 형태:
  - 1x1, 1x2, 1x3
  - L-3
  - O-4, I-4, T-4, L-4, S-4
  - 펜토미노(크기 5) - 그리드 >= 8부터
  - 헥소미노(크기 6) - 그리드 >= 9부터
- 비대칭 타일은 생성 시 수평 미러가 적용될 수 있습니다.

## 턴 진행
- 현재 타일을 그리드에 배치합니다.
- 다음 타일이 보이며 교환할 수 있습니다.
- 배치 후 확인:
  1. 완성된 행/열
  2. 색상 그룹 검증
  3. 다음 타일 배치 가능 여부

## 타일 배치
- 현재 타일을 드래그하거나 그리드를 클릭해 배치합니다.
- 셀은 그리드 내이면서 비어 있어야 합니다.
- 모든 블록이 빈 셀에 놓일 때만 배치 가능합니다.
- 그리드 밖이나 충돌 배치는 불가합니다.

## 사용 가능한 동작
- 회전: 타일을 90도 회전합니다.
- 미러: 타일을 수평으로 뒤집습니다(비대칭일 때).
- 교환: 현재/다음 타일을 교환합니다.

## 행/열 완성
- 행/열은 반드시 단일 색상이어야 합니다.
- 완성된 행/열은 제거됩니다.
- 제거될 때마다 그리드가 1 확장됩니다(최대가 아니면).

## 그룹 검증
- 그룹은 상하좌우 인접 블록(대각선 제외)입니다.
- 최소 크기에 도달하면 "검증"됩니다.
- 그리드 크기별 최소 수:
  - 6x6 -> 6
  - 7x7 -> 8
  - 8x8 -> 10
  - 9x9 -> 12
  - 10x10 -> 12
  - 6 미만: 그리드 크기 + 2
- 검증은 즉시 점수를 주지 않지만 블록을 보호합니다.

## 점수와 배수
- 배수는 현재 그리드 크기에 따라 결정:
  - 배수 = 그리드 크기 - 3
  - 예: 6x6 -> x3, 10x10 -> x7

### 행/열 점수
- 점수 = 제거한 행 수 * 그리드 크기 * 25 * 배수
- 예: 6x6에서 2줄 제거:
  2 * 6 * 25 * 3 = 900

### 축소 시 검증 블록 점수
- 점수 = 제거된 검증 블록 수 * 15 * 배수

## 그리드 확장
- 행/열 제거 후 확장됩니다.
- 한 줄과 한 칸이 추가됩니다.
- 기존 내용은 유지되고 한 모서리로 이동합니다.
- 확장 방향은 순서대로 회전합니다:
  - 0: 좌상단 유지(아래/오른쪽 확장)
  - 1: 우상단 유지(아래/왼쪽 확장)
  - 2: 우하단 유지(위/왼쪽 확장)
  - 3: 좌하단 유지(위/오른쪽 확장)

## 그리드 축소
- 현재/다음 타일 모두 배치 불가하면 축소 단계로 진입합니다.
- 검증 블록이 먼저 제거되어 점수를 줍니다.
- 이후 파괴될 테두리가 표시됩니다.
- 짧은 경고 후 그리드가 1 축소됩니다.
- 표시된 테두리의 블록은 사라집니다.
- 축소 방향은 확장과 같은 회전 규칙을 따릅니다.

## 게임 종료
- 다음 조건을 모두 만족하면 종료:
  - 그리드가 최소(4x4)
  - 두 타일 모두 배치 불가

## 참고
- 다음 타일이 보여 계획을 세울 수 있습니다.
- 최고 점수는 로컬에 저장됩니다.
`,
  nl: `# Gedetailleerde Tileburst-regels

Dit document beschrijft alle regels en spelmechanieken.

## Doel
- Plaats tegels op het rooster om zoveel mogelijk punten te scoren.
- Ga voor de hoogste score voor het einde van het spel.

## Rooster
- Startgrootte: 6x6.
- Minimumgrootte: 4x4.
- Maximumgrootte: 10x10.
- Het rooster kan uitbreiden na volledige rijen/kolommen.
- Het rooster kan krimpen als er geen tegel geplaatst kan worden.

## Tegels en kleuren
- Kleuren: blauw, rood, groen, geel, paars (5 kleuren).
- Een tegel is een set gevulde blokken (1) in een matrix.
- Vormfamilies:
  - 1x1, 1x2, 1x3
  - L-3
  - O-4, I-4, T-4, L-4, S-4
  - Pentomino's (grootte 5) vanaf rooster >= 8
  - Hexomino's (grootte 6) vanaf rooster >= 9
- Asymmetrische tegels kunnen bij het genereren horizontaal gespiegeld worden.

## Verloop van een beurt
- De huidige tegel wordt op het rooster gespeeld.
- De volgende tegel is zichtbaar en kan worden gewisseld.
- Na het plaatsen controleren we:
  1. Volledige rijen/kolommen.
  2. Validatie van kleurgroepen.
  3. Of de volgende tegels geplaatst kunnen worden.

## Plaatsen van tegels
- Sleep de huidige tegel of klik op het rooster om te plaatsen.
- Een vakje is bruikbaar als het in het rooster ligt en leeg is.
- Een tegel is plaatsbaar als alle blokken op lege vakjes terechtkomen.
- Plaatsen buiten het rooster of met overlap is niet toegestaan.

## Beschikbare acties
- Roteren: draai de tegel 90 graden.
- Spiegel: spiegel de tegel horizontaal (bij asymmetrie).
- Wisselen: wissel huidige en volgende tegel.

## Volledige rijen en kolommen
- Een volle rij/kolom moet uit EEN kleur bestaan.
- Volledige rijen/kolommen worden verwijderd.
- Elke verwijdering vergroot het rooster met 1 (als niet op max).

## Groepen valideren
- Groepen zijn orthogonaal aangrenzende blokken (geen diagonalen).
- Een groep is "gevalideerd" als hij de minimumgrootte bereikt.
- Minimumgrootte per rooster:
  - 6x6 -> 6 blokken
  - 7x7 -> 8 blokken
  - 8x8 -> 10 blokken
  - 9x9 -> 12 blokken
  - 10x10 -> 12 blokken
  - Groottes < 6: roostergrootte + 2
- Validatie geeft geen directe punten, maar beschermt blokken.

## Score en vermenigvuldiger
- De vermenigvuldiger hangt af van de huidige grootte:
  - vermenigvuldiger = roostergrootte - 3
  - Voorbeeld: 6x6 -> x3, 10x10 -> x7

### Punten voor rijen/kolommen
- punten = verwijderde_lijnen * roostergrootte * 25 * vermenigvuldiger
- Voorbeeld: rooster 6x6, 2 lijnen verwijderd:
  2 * 6 * 25 * 3 = 900 punten

### Punten voor gevalideerde blokken (bij krimp)
- punten = verwijderde_gevalideerde_blokken * 15 * vermenigvuldiger

## Roosteruitbreiding
- Uitbreiding gebeurt na het verwijderen van rijen/kolommen.
- Het rooster groeit met een rij en een kolom.
- Bestaande inhoud blijft en schuift naar een hoek.
- De uitbreidingsrichting roteert in volgorde:
  - 0: behoud linkerbovenhoek (uitbreiden naar beneden/rechts)
  - 1: behoud rechterbovenhoek (uitbreiden naar beneden/links)
  - 2: behoud rechteronderhoek (uitbreiden naar boven/links)
  - 3: behoud linkeronderhoek (uitbreiden naar boven/rechts)

## Roosterkrimp
- Als zowel de huidige als de volgende tegel niet geplaatst kunnen worden,
  start de krimpfase.
- Gevalideerde blokken worden eerst verwijderd en geven punten.
- Daarna wordt een rand gemarkeerd als "te vernietigen".
- Na een korte waarschuwing krimpt het rooster met 1.
- Blokken op de gemarkeerde rand gaan verloren.
- De krimprichting volgt dezelfde rotatie als de uitbreiding.

## Einde van het spel
- Het spel eindigt als:
  - het rooster op minimumgrootte is (4x4) EN
  - geen van beide tegels geplaatst kan worden.

## Handige notities
- De volgende tegel is altijd bekend, dus je kunt plannen.
- Het spel slaat de beste score lokaal op.
`,
  pl: `# Szczegolowe zasady Tileburst

Ten dokument opisuje wszystkie zasady i mechaniki gry.

## Cel
- Umieszczaj plytki na siatce, aby zdobywac jak najwiecej punktow.
- Celuj w najlepszy wynik przed koncem gry.

## Siatka
- Rozmiar startowy: 6x6.
- Rozmiar minimalny: 4x4.
- Rozmiar maksymalny: 10x10.
- Siatka moze sie powiekszac po pelnych wierszach/kolumnach.
- Siatka moze sie zmniejszac, gdy nie da sie polozyc plytki.

## Plytki i kolory
- Kolory: niebieski, czerwony, zielony, zolty, fioletowy (5 kolorow).
- Plytka to zestaw wypelnionych blokow (1) w macierzy.
- Rodziny ksztaltow:
  - 1x1, 1x2, 1x3
  - L-3
  - O-4, I-4, T-4, L-4, S-4
  - Pentomino (rozmiar 5) od siatki >= 8
  - Heksomino (rozmiar 6) od siatki >= 9
- Asymetryczne plytki moga byc poziomo odbite podczas tworzenia.

## Przebieg tury
- Biezaca plytka jest umieszczana na siatce.
- Nastepna plytka jest widoczna i mozna ja zamienic.
- Po polozeniu sprawdzamy:
  1. Pelne wiersze/kolumny.
  2. Walidacje grup koloru.
  3. Czy mozna polozyc nastepne plytki.

## Umieszczanie plytek
- Przeciagnij biezaca plytke lub kliknij siatke, aby ja polozyc.
- Pole jest uzywalne, gdy jest w siatce i puste.
- Plytka jest polozenia, gdy wszystkie bloki trafiaja na puste pola.
- Umieszczenie poza siatka lub z kolizja jest zabronione.

## Dostepne akcje
- Obracanie: obraca plytke o 90 stopni.
- Lustro: odbija plytke poziomo (jesli asymetryczna).
- Zamiana: zamienia plytke biezaca z nastepna.

## Pelne wiersze i kolumny
- Pelny wiersz/kolumna musi byc jednego koloru.
- Pelne wiersze/kolumny sa usuwane.
- Kazde usuniecie powieksza siatke o 1 (jesli nie jest maksymalna).

## Walidacja grup
- Grupy to bloki sasiednie ortogonalnie (bez przekatnych).
- Grupa jest "zwalidowana", gdy osiaga minimalny rozmiar.
- Minimalny rozmiar wg siatki:
  - 6x6 -> 6 blokow
  - 7x7 -> 8 blokow
  - 8x8 -> 10 blokow
  - 9x9 -> 12 blokow
  - 10x10 -> 12 blokow
  - Rozmiary < 6: rozmiar siatki + 2
- Walidacja nie daje natychmiastowych punktow, ale chroni bloki.

## Wynik i mnoznik
- Mnoznik zalezy od aktualnego rozmiaru:
  - mnoznik = rozmiar_siatki - 3
  - Przyklad: 6x6 -> x3, 10x10 -> x7

### Punkty za wiersze/kolumny
- punkty = usuniete_linie * rozmiar_siatki * 25 * mnoznik
- Przyklad: siatka 6x6, 2 linie usuniete:
  2 * 6 * 25 * 3 = 900 punktow

### Punkty za zwalidowane bloki (podczas kurczenia)
- punkty = usuniete_zwalidowane_bloki * 15 * mnoznik

## Powiekszanie siatki
- Powiekszenie nastepuje po usunieciu wierszy/kolumn.
- Siatka rosnie o jeden wiersz i jedna kolumne.
- Istniejaca zawartosc jest zachowana i przesuwana do rogu.
- Kierunek powiekszania rotuje w kolejnosci:
  - 0: zachowaj lewy gorny rog (rozszerzenie w dol/prawo)
  - 1: zachowaj prawy gorny rog (rozszerzenie w dol/lewo)
  - 2: zachowaj prawy dolny rog (rozszerzenie w gore/lewo)
  - 3: zachowaj lewy dolny rog (rozszerzenie w gore/prawo)

## Kurczenie siatki
- Gdy nie mozna polozyc ani biezacej, ani nastepnej plytki,
  rozpoczyna sie faza kurczenia.
- Najpierw usuwane sa zwalidowane bloki i daja punkty.
- Nastepnie oznaczana jest krawedz do zniszczenia.
- Po krotkim ostrzezeniu siatka zmniejsza sie o 1.
- Bloki na oznaczonej krawedzi przepadaja.
- Kierunek kurczenia jest taki sam jak rotacja powiekszania.

## Koniec gry
- Gra konczy sie, gdy:
  - siatka ma minimalny rozmiar (4x4) ORAZ
  - nie mozna polozyc zadnej z dwoch plytek.

## Przydatne uwagi
- Nastepna plytka jest zawsze znana, co pozwala planowac.
- Gra zapisuje najlepszy wynik lokalnie.
`,
  tr: `# Tileburst Ayrintili Kurallar

Bu belge oyunun tum kurallarini ve mekaniklerini aciklar.

## Amac
- En yuksek puani almak icin karolari izgara uzerine yerlestirin.
- Oyun bitmeden once en iyi skoru hedefleyin.

## Izgara
- Baslangic boyutu: 6x6.
- Minimum boyut: 4x4.
- Maksimum boyut: 10x10.
- Tam satir/sutunlardan sonra izgara genisleyebilir.
- Hicbir karo yerlestirilemiyorsa izgara kuculebilir.

## Karolar ve renkler
- Renkler: mavi, kirmizi, yesil, sari, mor (5 renk).
- Karo, bir matristeki dolu bloklardan (1) olusur.
- Sekil aileleri:
  - 1x1, 1x2, 1x3
  - L-3
  - O-4, I-4, T-4, L-4, S-4
  - Pentomino (boyut 5) icin izgara >= 8
  - Heksomino (boyut 6) icin izgara >= 9
- Asimetrik karolar olusurken yatay ayna uygulanabilir.

## Tur akisi
- Guncel karo izgara uzerine oynanir.
- Sonraki karo gorunur ve degistirilebilir.
- Yerlestirdikten sonra kontrol edilir:
  1. Tam satir/sutunlar.
  2. Renk grubu dogrulamalari.
  3. Sonraki karolarin yerlestirilebilirligi.

## Karo yerlestirme
- Guncel karoyu surukleyin veya izgara uzerine tiklayin.
- Hucre, izgara icinde ve bos ise kullanilabilir.
- Tum bloklar bos hucrelere geliyorsa karo yerlestirilebilir.
- Izgara disina veya cakismali yerlestirme yasaktir.

## Mevcut aksiyonlar
- Dondurme: karoyu 90 derece dondurur.
- Ayna: karoyu yatay cevirir (asimetri ise).
- Degistir: guncel ve sonraki karoyu degistirir.

## Tam satirlar ve sutunlar
- Tam satir/sutun TEK renkte olmalidir.
- Tam satir/sutunlar temizlenir.
- Her temizleme izgarayi 1 genisletir (maksimumda degilse).

## Grup dogrulama
- Gruplar ortogonal komsuluk (capraz yok) ile olusur.
- Bir grup minimum boyuta ulasinca "dogrulanir".
- Izgaraya gore minimum boyut:
  - 6x6 -> 6 blok
  - 7x7 -> 8 blok
  - 8x8 -> 10 blok
  - 9x9 -> 12 blok
  - 10x10 -> 12 blok
  - 6'dan kucuk: izgara boyutu + 2
- Dogrulama aninda puan vermez, ancak bloklari korur.

## Puan ve carpani
- Carpan mevcut boyuta baglidir:
  - carpan = izgara_boyutu - 3
  - Ornek: 6x6 -> x3, 10x10 -> x7

### Satir/sutun puanlari
- puan = temizlenen_cizgiler * izgara_boyutu * 25 * carpan
- Ornek: 6x6 izgara, 2 cizgi temizlendi:
  2 * 6 * 25 * 3 = 900 puan

### Dogrulanmis blok puanlari (kuculmede)
- puan = temizlenen_dogrulanmis_bloklar * 15 * carpan

## Izgara genisleme
- Genisleme satir/sutun temizliginden sonra olur.
- Izgara bir satir ve bir sutun buyur.
- Mevcut icerik korunur ve bir kosede toplanir.
- Genisleme yonu sirayla doner:
  - 0: sol ust koseyi koru (asagi/saga genisler)
  - 1: sag ust koseyi koru (asagi/sola genisler)
  - 2: sag alt koseyi koru (yukari/sola genisler)
  - 3: sol alt koseyi koru (yukari/saga genisler)

## Izgara kuculme
- Ne mevcut ne sonraki karo yerlestirilemiyorsa,
  kuculme fazi baslar.
- Dogrulanmis bloklar once temizlenir ve puan verir.
- Ardindan "yok edilecek" bir kenar isaretlenir.
- Kisa uyaridan sonra izgara 1 kuculur.
- Isaretli kenardaki bloklar kaybolur.
- Kuculme yonu, genisleme rotasyonunu takip eder.

## Oyun sonu
- Oyun su durumda biter:
  - izgara minimum boyutta (4x4) VE
  - iki karodan hicbiri yerlestirilemezse.

## Faydalı notlar
- Sonraki karo her zaman gorunur, plan yapabilirsiniz.
- Oyun en iyi skoru yerel olarak saklar.
`,
  ar: `# قواعد Tileburst التفصيلية

هذا المستند يشرح جميع قواعد اللعبة والاليات.

## الهدف
- ضع القطع على الشبكة للحصول على اكبر عدد ممكن من النقاط.
- حاول تحقيق افضل نتيجة قبل نهاية اللعبة.

## الشبكة
- الحجم الابتدائي: 6x6.
- الحد الادنى: 4x4.
- الحد الاقصى: 10x10.
- يمكن توسيع الشبكة بعد اكتمال صفوف/اعمدة.
- يمكن تقليص الشبكة اذا تعذر وضع اي قطعة.

## القطع والالوان
- الالوان: ازرق، احمر، اخضر، اصفر، بنفسجي (5 الوان).
- القطعة هي مجموعة من الخلايا المملوءة (1) في مصفوفة.
- عائلات الاشكال:
  - 1x1, 1x2, 1x3
  - L-3
  - O-4, I-4, T-4, L-4, S-4
  - بنتومينو (حجم 5) عند شبكة >= 8
  - هيكسومينو (حجم 6) عند شبكة >= 9
- يمكن قلب القطع غير المتماثلة افقيا عند الانشاء.

## مجرى الدور
- توضع القطعة الحالية على الشبكة.
- القطعة التالية مرئية ويمكن تبديلها.
- بعد الوضع يتم التحقق من:
  1. الصفوف/الاعمدة المكتملة.
  2. توثيق مجموعات اللون.
  3. امكانية وضع القطع التالية.

## وضع القطع
- اسحب القطعة الحالية او انقر على الشبكة لوضعها.
- الخلية صالحة اذا كانت داخل الشبكة وفارغة.
- القطعة قابلة للوضع اذا وقعت كل كتلها على خلايا فارغة.
- لا يسمح بالوضع خارج الشبكة او مع تصادم.

## العمليات المتاحة
- تدوير: يدور القطعة 90 درجة.
- مرآة: يقلب القطعة افقيا (اذا كانت غير متماثلة).
- تبديل: يبدل القطعة الحالية مع التالية.

## الصفوف والاعمدة المكتملة
- يجب ان يكون الصف/العمود المكتمل بلون واحد فقط.
- يتم مسح الصفوف/الاعمدة المكتملة.
- كل عملية مسح توسع الشبكة بمقدار 1 (اذا لم تكن في الحد الاقصى).

## توثيق المجموعات
- المجموعات هي خلايا متجاورة عموديا/افقيا فقط (بدون قطر).
- تصبح المجموعة "موثقة" اذا وصلت للحجم الادنى.
- الحد الادنى حسب حجم الشبكة:
  - 6x6 -> 6 خلايا
  - 7x7 -> 8 خلايا
  - 8x8 -> 10 خلايا
  - 9x9 -> 12 خلية
  - 10x10 -> 12 خلية
  - احجام < 6: حجم الشبكة + 2
- التوثيق لا يعطي نقاطا مباشرة لكنه يحمي الخلايا.

## النقاط والمضاعف
- المضاعف يعتمد على الحجم الحالي:
  - المضاعف = حجم_الشبكة - 3
  - مثال: 6x6 -> x3، 10x10 -> x7

### نقاط الصفوف/الاعمدة
- النقاط = الصفوف_الممسوحة * حجم_الشبكة * 25 * المضاعف
- مثال: شبكة 6x6، مسح صفين:
  2 * 6 * 25 * 3 = 900 نقطة

### نقاط الخلايا الموثقة (اثناء الانكماش)
- النقاط = الخلايا_الموثقة_الممسوحة * 15 * المضاعف

## توسيع الشبكة
- يحدث التوسيع بعد مسح الصفوف/الاعمدة.
- تكبر الشبكة بصف وعمود.
- يتم الحفاظ على المحتوى ودفعه نحو زاوية.
- اتجاه التوسيع يدور بالترتيب:
  - 0: تثبيت الزاوية العلوية اليسرى (توسيع للاسفل/اليمين)
  - 1: تثبيت الزاوية العلوية اليمنى (توسيع للاسفل/اليسار)
  - 2: تثبيت الزاوية السفلية اليمنى (توسيع للاعلى/اليسار)
  - 3: تثبيت الزاوية السفلية اليسرى (توسيع للاعلى/اليمين)

## انكماش الشبكة
- اذا تعذر وضع القطعة الحالية او التالية،
  تدخل الشبكة في مرحلة الانكماش.
- تزال الخلايا الموثقة اولا وتمنح نقاطا.
- ثم يتم تعليم حافة "للتدمير".
- بعد تحذير قصير تنكمش الشبكة بمقدار 1.
- الخلايا على الحافة المعلمة تضيع.
- اتجاه الانكماش يتبع نفس تدوير التوسيع.

## نهاية اللعبة
- تنتهي اللعبة اذا:
  - كانت الشبكة في الحد الادنى (4x4) و
  - لم يمكن وضع اي من القطعتين.

## ملاحظات مفيدة
- القطعة التالية معروفة دائما، مما يساعد على التخطيط.
- يتم حفظ افضل نتيجة محليا.
`,
};
