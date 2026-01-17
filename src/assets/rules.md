# Regles detaillees de Tileburst

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
