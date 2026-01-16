import { Injectable, signal, computed } from '@angular/core';

export type Language = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'zh' | 'ko' | 'nl' | 'pl' | 'tr' | 'ar';

export interface Translations {
  // Common
  score: string;
  bestScore: string;
  loading: string;
  
  // Buttons
  howToPlay: string;
  newGame: string;
  restart: string;
  rotate: string;
  swap: string;
  share: string;
  playAgain: string;
  previous: string;
  next: string;
  play: string;
  yes: string;
  no: string;
  close: string;
  
  // Game
  currentTile: string;
  nextTile: string;
  strategicTip: string;
  strategicTipText: string;
  gameOver: string;
  finalScore: string;
  gridShrinking: string;
  
  // Modals
  restartConfirm: string;
  restartConfirmText: string;
  
  // Share
  shareScoreText: string;
  shareScoreTitle: string;
  shareScoreCopied: string;
  shareScoreCopyError: string;
  
  // Tutorial
  tutorial: {
    welcome: {
      title: string;
      content: string;
      dragTile: string;
      ontoGrid: string;
    };
    clearing: {
      title: string;
      content: string;
      fillLine: string;
      toClear: string;
    };
    validated: {
      title: string;
      content: string;
      connectGroup: string;
    };
    shrinking: {
      title: string;
      content: string;
      ifStuck: string;
      toSmaller: string;
    };
    goal: {
      title: string;
      content: string;
      aimFor: string;
      combineStrategy: string;
    };
    step: string;
    of: string;
  };
  
  // Accessibility
  toggleSound: string;
  toggleDarkMode: string;
  newGameButton: string;
  howToPlayButton: string;
  swapTilesButton: string;
  rotateButton: string;
  closeTutorial: string;
  
  // Options
  options: string;
  colorPalette: string;
  shapeMode: string;
  sound: string;
  soundOn: string;
  soundOff: string;
  language: string;
  darkMode: string;
  lightMode: string;
  currentBestScore: string;
  reset: string;
  resetBestScoreConfirm: string;
}

const TRANSLATIONS: Record<Language, Translations> = {
  fr: {
    score: 'Score',
    bestScore: 'Meilleur score',
    loading: 'Chargement...',
    howToPlay: 'Comment Jouer',
    newGame: 'Nouvelle Partie',
    restart: 'Recommencer ?',
    rotate: 'Rotation (R)',
    swap: 'Échanger',
    share: 'Partager',
    playAgain: 'Rejouer',
    previous: 'Précédent',
    next: 'Suivant',
    play: 'Jouer !',
    yes: 'Oui',
    no: 'Non',
    close: 'Fermer',
    currentTile: 'Tuile Actuelle',
    nextTile: 'Prochaine Tuile',
    strategicTip: 'Conseil Stratégique',
    strategicTipText: 'Liez {0} blocs de même couleur pour les "valider". Ils vous sauveront quand la grille rétrécira !',
    gameOver: 'Fin de Partie',
    finalScore: 'Votre score final est :',
    gridShrinking: 'La grille rétrécit !',
    restartConfirm: 'Recommencer ?',
    restartConfirmText: 'Êtes-vous sûr de vouloir commencer une nouvelle partie ? Votre score actuel sera perdu.',
    shareScoreText: "J'ai fait {0} points sur Tileburst ! Tu penses que tu peux me battre ? 🎮",
    shareScoreTitle: "J'ai fait {0} points sur Tileburst !",
    shareScoreCopied: 'Score copié dans le presse-papiers ! Vous pouvez maintenant le partager.',
    shareScoreCopyError: 'Copiez ce texte pour partager votre score :',
    tutorial: {
      welcome: {
        title: 'Bienvenue dans Tileburst !',
        content: 'Le but est simple : placez les tuiles qui apparaissent dans la grille. Faites glisser la "Tuile Actuelle" ou cliquez sur la grille pour la positionner.',
        dragTile: 'Faites glisser une tuile comme celle-ci...',
        ontoGrid: '...sur la grille de jeu.',
      },
      clearing: {
        title: 'Dégager des lignes',
        content: "Remplissez une ligne ou une colonne complète avec des blocs de la MÊME couleur pour l'effacer. Cela vous rapporte des points et agrandit la grille !",
        fillLine: 'Remplissez une ligne avec la même couleur...',
        toClear: "...pour l'effacer !",
      },
      validated: {
        title: 'Blocs Validés : Votre assurance-vie',
        content: 'Connectez un grand groupe de blocs de même couleur pour les "valider" (le nombre requis est indiqué dans le conseil stratégique). Ils obtiennent une coche et deviennent votre filet de sécurité.',
        connectGroup: 'Connectez un grand groupe de la même couleur.',
      },
      shrinking: {
        title: 'La grille se défend !',
        content: "Si vous ne pouvez plus placer de tuile, la grille rétrécit ! Les blocs validés sont alors effacés (vous donnant des points et de l'espace), mais les blocs non validés sur les bords sont détruits.",
        ifStuck: "Si vous êtes bloqué, la grille rétrécit...",
        toSmaller: '...à une taille plus petite.',
      },
      goal: {
        title: 'Score et Fin de Partie',
        content: 'Le jeu se termine si la grille rétrécit à sa taille minimale et que vous êtes toujours bloqué. Essayez de faire le meilleur score possible ! Bonne chance !',
        aimFor: 'Visez le meilleur score !',
        combineStrategy: 'Combinez stratégie et un peu de chance.',
      },
      step: 'Étape',
      of: 'sur',
    },
    toggleSound: 'Activer/Désactiver le son',
    toggleDarkMode: 'Activer/Désactiver le mode sombre',
    newGameButton: 'Nouvelle Partie',
    howToPlayButton: 'Comment Jouer',
    swapTilesButton: 'Échanger les tuiles',
    rotateButton: 'Rotation',
    closeTutorial: 'Fermer le tutoriel',
    options: 'Options',
    colorPalette: 'Palette de couleurs',
    shapeMode: 'Formes distinctes',
    sound: 'Son',
    soundOn: 'Activé',
    soundOff: 'Désactivé',
    language: 'Langue',
    darkMode: 'Sombre',
    lightMode: 'Clair',
    currentBestScore: 'Score actuel',
    reset: 'Réinitialiser',
    resetBestScoreConfirm: 'Êtes-vous sûr de vouloir réinitialiser le meilleur score ?',
  },
  en: {
    score: 'Score',
    bestScore: 'Best score',
    loading: 'Loading...',
    howToPlay: 'How to Play',
    newGame: 'New Game',
    restart: 'Restart?',
    rotate: 'Rotate (R)',
    swap: 'Swap',
    share: 'Share',
    playAgain: 'Play Again',
    previous: 'Previous',
    next: 'Next',
    play: 'Play!',
    yes: 'Yes',
    no: 'No',
    close: 'Close',
    currentTile: 'Current Tile',
    nextTile: 'Next Tile',
    strategicTip: 'Strategic Tip',
    strategicTipText: 'Link {0} blocks of the same color to "validate" them. They will save you when the grid shrinks!',
    gameOver: 'Game Over',
    finalScore: 'Your final score is:',
    gridShrinking: 'Grid is shrinking!',
    restartConfirm: 'Restart?',
    restartConfirmText: 'Are you sure you want to start a new game? Your current score will be lost.',
    shareScoreText: "I scored {0} points on Tileburst! Think you can beat me? 🎮",
    shareScoreTitle: "I scored {0} points on Tileburst!",
    shareScoreCopied: 'Score copied to clipboard! You can now share it.',
    shareScoreCopyError: 'Copy this text to share your score:',
    tutorial: {
      welcome: {
        title: 'Welcome to Tileburst!',
        content: 'The goal is simple: place the tiles that appear on the grid. Drag the "Current Tile" or click on the grid to position it.',
        dragTile: 'Drag a tile like this...',
        ontoGrid: '...onto the game grid.',
      },
      clearing: {
        title: 'Clearing Lines',
        content: 'Fill a complete row or column with blocks of the SAME color to clear it. This earns you points and expands the grid!',
        fillLine: 'Fill a line with the same color...',
        toClear: '...to clear it!',
      },
      validated: {
        title: 'Validated Blocks: Your Safety Net',
        content: 'Connect a large group of blocks of the same color to "validate" them (the required number is shown in the strategic tip). They get a checkmark and become your safety net.',
        connectGroup: 'Connect a large group of the same color.',
      },
      shrinking: {
        title: 'The Grid Fights Back!',
        content: "If you can't place any more tiles, the grid shrinks! Validated blocks are then cleared (giving you points and space), but unvalidated blocks on the edges are destroyed.",
        ifStuck: 'If you are stuck, the grid shrinks...',
        toSmaller: '...to a smaller size.',
      },
      goal: {
        title: 'Score and Game Over',
        content: 'The game ends if the grid shrinks to its minimum size and you are still stuck. Try to achieve the best score possible! Good luck!',
        aimFor: 'Aim for the best score!',
        combineStrategy: 'Combine strategy and a bit of luck.',
      },
      step: 'Step',
      of: 'of',
    },
    toggleSound: 'Toggle sound',
    toggleDarkMode: 'Toggle dark mode',
    newGameButton: 'New Game',
    howToPlayButton: 'How to Play',
    swapTilesButton: 'Swap tiles',
    rotateButton: 'Rotate',
    closeTutorial: 'Close tutorial',
    options: 'Options',
    colorPalette: 'Color Palette',
    shapeMode: 'Distinct Shapes',
    sound: 'Sound',
    soundOn: 'On',
    soundOff: 'Off',
    language: 'Language',
    darkMode: 'Dark',
    lightMode: 'Light',
    currentBestScore: 'Current best score',
    reset: 'Reset',
    resetBestScoreConfirm: 'Are you sure you want to reset the best score?',
  },
  es: {
    score: 'Puntuación',
    bestScore: 'Mejor puntuación',
    loading: 'Cargando...',
    howToPlay: 'Cómo Jugar',
    newGame: 'Nueva Partida',
    restart: '¿Reiniciar?',
    rotate: 'Rotar (R)',
    swap: 'Intercambiar',
    share: 'Compartir',
    playAgain: 'Jugar de Nuevo',
    previous: 'Anterior',
    next: 'Siguiente',
    play: '¡Jugar!',
    yes: 'Sí',
    no: 'No',
    close: 'Cerrar',
    currentTile: 'Ficha Actual',
    nextTile: 'Próxima Ficha',
    strategicTip: 'Consejo Estratégico',
    strategicTipText: '¡Conecta {0} bloques del mismo color para "validarlos". Te salvarán cuando la cuadrícula se reduzca!',
    gameOver: 'Fin del Juego',
    finalScore: 'Tu puntuación final es:',
    gridShrinking: '¡La cuadrícula se está reduciendo!',
    restartConfirm: '¿Reiniciar?',
    restartConfirmText: '¿Estás seguro de que quieres comenzar una nueva partida? Tu puntuación actual se perderá.',
    shareScoreText: '¡Hice {0} puntos en Tileburst! ¿Crees que puedes vencerme? 🎮',
    shareScoreTitle: '¡Hice {0} puntos en Tileburst!',
    shareScoreCopied: '¡Puntuación copiada al portapapeles! Ahora puedes compartirla.',
    shareScoreCopyError: 'Copia este texto para compartir tu puntuación:',
    tutorial: {
      welcome: {
        title: '¡Bienvenido a Tileburst!',
        content: 'El objetivo es simple: coloca las fichas que aparecen en la cuadrícula. Arrastra la "Ficha Actual" o haz clic en la cuadrícula para posicionarla.',
        dragTile: 'Arrastra una ficha como esta...',
        ontoGrid: '...sobre la cuadrícula de juego.',
      },
      clearing: {
        title: 'Limpiar Líneas',
        content: '¡Llena una fila o columna completa con bloques del MISMO color para limpiarla. Esto te da puntos y expande la cuadrícula!',
        fillLine: 'Llena una línea con el mismo color...',
        toClear: '...¡para limpiarla!',
      },
      validated: {
        title: 'Bloques Validados: Tu Red de Seguridad',
        content: 'Conecta un gran grupo de bloques del mismo color para "validarlos" (el número requerido se muestra en el consejo estratégico). Obtienen una marca de verificación y se convierten en tu red de seguridad.',
        connectGroup: 'Conecta un gran grupo del mismo color.',
      },
      shrinking: {
        title: '¡La Cuadrícula Contraataca!',
        content: '¡Si no puedes colocar más fichas, la cuadrícula se reduce! Los bloques validados se limpian (dándote puntos y espacio), pero los bloques no validados en los bordes se destruyen.',
        ifStuck: 'Si estás atascado, la cuadrícula se reduce...',
        toSmaller: '...a un tamaño más pequeño.',
      },
      goal: {
        title: 'Puntuación y Fin del Juego',
        content: 'El juego termina si la cuadrícula se reduce a su tamaño mínimo y aún estás atascado. ¡Intenta lograr la mejor puntuación posible! ¡Buena suerte!',
        aimFor: '¡Apunta a la mejor puntuación!',
        combineStrategy: 'Combina estrategia y un poco de suerte.',
      },
      step: 'Paso',
      of: 'de',
    },
    toggleSound: 'Activar/Desactivar sonido',
    toggleDarkMode: 'Activar/Desactivar modo oscuro',
    newGameButton: 'Nueva Partida',
    howToPlayButton: 'Cómo Jugar',
    swapTilesButton: 'Intercambiar fichas',
    rotateButton: 'Rotar',
    closeTutorial: 'Cerrar tutorial',
    options: 'Opciones',
    colorPalette: 'Paleta de colores',
    shapeMode: 'Formas distintas',
    sound: 'Sonido',
    soundOn: 'Activado',
    soundOff: 'Desactivado',
    language: 'Idioma',
    darkMode: 'Oscuro',
    lightMode: 'Claro',
    currentBestScore: 'Mejor puntuación actual',
    reset: 'Restablecer',
    resetBestScoreConfirm: '¿Estás seguro de que quieres restablecer la mejor puntuación?',
  },
  de: {
    score: 'Punkte',
    bestScore: 'Bester Punktestand',
    loading: 'Lädt...',
    howToPlay: 'Spielanleitung',
    newGame: 'Neues Spiel',
    restart: 'Neustart?',
    rotate: 'Drehen (R)',
    swap: 'Tauschen',
    share: 'Teilen',
    playAgain: 'Nochmal Spielen',
    previous: 'Zurück',
    next: 'Weiter',
    play: 'Spielen!',
    yes: 'Ja',
    no: 'Nein',
    close: 'Schließen',
    currentTile: 'Aktuelles Teil',
    nextTile: 'Nächstes Teil',
    strategicTip: 'Strategischer Tipp',
    strategicTipText: 'Verbinde {0} Blöcke derselben Farbe, um sie zu "validieren". Sie werden dich retten, wenn das Raster schrumpft!',
    gameOver: 'Spiel Beendet',
    finalScore: 'Deine Endpunktzahl ist:',
    gridShrinking: 'Das Raster schrumpft!',
    restartConfirm: 'Neustart?',
    restartConfirmText: 'Bist du sicher, dass du ein neues Spiel starten möchtest? Deine aktuelle Punktzahl geht verloren.',
    shareScoreText: 'Ich habe {0} Punkte bei Tileburst erreicht! Denkst du, du kannst mich schlagen? 🎮',
    shareScoreTitle: 'Ich habe {0} Punkte bei Tileburst erreicht!',
    shareScoreCopied: 'Punktzahl in die Zwischenablage kopiert! Du kannst sie jetzt teilen.',
    shareScoreCopyError: 'Kopiere diesen Text, um deine Punktzahl zu teilen:',
    tutorial: {
      welcome: {
        title: 'Willkommen bei Tileburst!',
        content: 'Das Ziel ist einfach: Platziere die Teile, die auf dem Raster erscheinen. Ziehe das "Aktuelle Teil" oder klicke auf das Raster, um es zu positionieren.',
        dragTile: 'Ziehe ein Teil wie dieses...',
        ontoGrid: '...auf das Spielfeld.',
      },
      clearing: {
        title: 'Linien Räumen',
        content: 'Fülle eine vollständige Zeile oder Spalte mit Blöcken der GLEICHEN Farbe, um sie zu räumen. Das bringt dir Punkte und erweitert das Raster!',
        fillLine: 'Fülle eine Linie mit derselben Farbe...',
        toClear: '...um sie zu räumen!',
      },
      validated: {
        title: 'Validierte Blöcke: Dein Sicherheitsnetz',
        content: 'Verbinde eine große Gruppe von Blöcken derselben Farbe, um sie zu "validieren" (die erforderliche Anzahl wird im strategischen Tipp angezeigt). Sie erhalten ein Häkchen und werden zu deinem Sicherheitsnetz.',
        connectGroup: 'Verbinde eine große Gruppe derselben Farbe.',
      },
      shrinking: {
        title: 'Das Raster Wehrt Sich!',
        content: 'Wenn du keine Teile mehr platzieren kannst, schrumpft das Raster! Validierte Blöcke werden dann geräumt (was dir Punkte und Platz gibt), aber nicht validierte Blöcke an den Rändern werden zerstört.',
        ifStuck: 'Wenn du feststeckst, schrumpft das Raster...',
        toSmaller: '...auf eine kleinere Größe.',
      },
      goal: {
        title: 'Punkte und Spiel Beendet',
        content: 'Das Spiel endet, wenn das Raster auf seine Mindestgröße schrumpft und du immer noch feststeckst. Versuche die beste Punktzahl zu erreichen! Viel Glück!',
        aimFor: 'Ziele auf die beste Punktzahl!',
        combineStrategy: 'Kombiniere Strategie und ein bisschen Glück.',
      },
      step: 'Schritt',
      of: 'von',
    },
    toggleSound: 'Ton ein/aus',
    toggleDarkMode: 'Dunkelmodus ein/aus',
    newGameButton: 'Neues Spiel',
    howToPlayButton: 'Spielanleitung',
    swapTilesButton: 'Teile tauschen',
    rotateButton: 'Drehen',
    closeTutorial: 'Tutorial schließen',
    options: 'Optionen',
    colorPalette: 'Farbpalette',
    shapeMode: 'Unterschiedliche Formen',
    sound: 'Ton',
    soundOn: 'Ein',
    soundOff: 'Aus',
    language: 'Sprache',
    darkMode: 'Dunkel',
    lightMode: 'Hell',
    currentBestScore: 'Aktueller Bestwert',
    reset: 'Zurücksetzen',
    resetBestScoreConfirm: 'Sind Sie sicher, dass Sie den Bestwert zurücksetzen möchten?',
  },
  it: {
    score: 'Punteggio',
    bestScore: 'Miglior punteggio',
    loading: 'Caricamento...',
    howToPlay: 'Come Giocare',
    newGame: 'Nuova Partita',
    restart: 'Ricomincia?',
    rotate: 'Ruota (R)',
    swap: 'Scambia',
    share: 'Condividi',
    playAgain: 'Gioca Ancora',
    previous: 'Precedente',
    next: 'Successivo',
    play: 'Gioca!',
    yes: 'Sì',
    no: 'No',
    close: 'Chiudi',
    currentTile: 'Tessera Corrente',
    nextTile: 'Prossima Tessera',
    strategicTip: 'Consiglio Strategico',
    strategicTipText: 'Collega {0} blocchi dello stesso colore per "validarli". Ti salveranno quando la griglia si restringerà!',
    gameOver: 'Fine Partita',
    finalScore: 'Il tuo punteggio finale è:',
    gridShrinking: 'La griglia si sta restringendo!',
    restartConfirm: 'Ricomincia?',
    restartConfirmText: 'Sei sicuro di voler iniziare una nuova partita? Il tuo punteggio attuale verrà perso.',
    shareScoreText: 'Ho fatto {0} punti su Tileburst! Pensi di poter battermi? 🎮',
    shareScoreTitle: 'Ho fatto {0} punti su Tileburst!',
    shareScoreCopied: 'Punteggio copiato negli appunti! Ora puoi condividerlo.',
    shareScoreCopyError: 'Copia questo testo per condividere il tuo punteggio:',
    tutorial: {
      welcome: {
        title: 'Benvenuto in Tileburst!',
        content: "L'obiettivo è semplice: posiziona le tessere che appaiono sulla griglia. Trascina la \"Tessera Corrente\" o clicca sulla griglia per posizionarla.",
        dragTile: 'Trascina una tessera come questa...',
        ontoGrid: '...sulla griglia di gioco.',
      },
      clearing: {
        title: 'Svuotare le Righe',
        content: 'Riempi una riga o colonna completa con blocchi dello STESSO colore per svuotarla. Questo ti dà punti e espande la griglia!',
        fillLine: 'Riempi una riga con lo stesso colore...',
        toClear: '...per svuotarla!',
      },
      validated: {
        title: 'Blocchi Validati: La Tua Rete di Sicurezza',
        content: 'Collega un grande gruppo di blocchi dello stesso colore per "validarli" (il numero richiesto è indicato nel consiglio strategico). Ottengono un segno di spunta e diventano la tua rete di sicurezza.',
        connectGroup: 'Collega un grande gruppo dello stesso colore.',
      },
      shrinking: {
        title: 'La Griglia Contrattacca!',
        content: "Se non puoi più posizionare tessere, la griglia si restringe! I blocchi validati vengono quindi svuotati (dandoti punti e spazio), ma i blocchi non validati sui bordi vengono distrutti.",
        ifStuck: 'Se sei bloccato, la griglia si restringe...',
        toSmaller: '...a una dimensione più piccola.',
      },
      goal: {
        title: 'Punteggio e Fine Partita',
        content: 'Il gioco termina se la griglia si restringe alla sua dimensione minima e sei ancora bloccato. Prova a ottenere il miglior punteggio possibile! Buona fortuna!',
        aimFor: 'Mira al miglior punteggio!',
        combineStrategy: 'Combina strategia e un po\' di fortuna.',
      },
      step: 'Passo',
      of: 'di',
    },
    toggleSound: 'Attiva/Disattiva suono',
    toggleDarkMode: 'Attiva/Disattiva modalità scura',
    newGameButton: 'Nuova Partita',
    howToPlayButton: 'Come Giocare',
    swapTilesButton: 'Scambia tessere',
    rotateButton: 'Ruota',
    closeTutorial: 'Chiudi tutorial',
    options: 'Opzioni',
    colorPalette: 'Palette di colori',
    shapeMode: 'Forme distinte',
    sound: 'Suono',
    soundOn: 'Attivato',
    soundOff: 'Disattivato',
    language: 'Lingua',
    darkMode: 'Scuro',
    lightMode: 'Chiaro',
    currentBestScore: 'Miglior punteggio attuale',
    reset: 'Reimposta',
    resetBestScoreConfirm: 'Sei sicuro di voler reimpostare il miglior punteggio?',
  },
  pt: {
    score: 'Pontuação',
    bestScore: 'Melhor pontuação',
    loading: 'Carregando...',
    howToPlay: 'Como Jogar',
    newGame: 'Novo Jogo',
    restart: 'Reiniciar?',
    rotate: 'Girar (R)',
    swap: 'Trocar',
    share: 'Compartilhar',
    playAgain: 'Jogar Novamente',
    previous: 'Anterior',
    next: 'Próximo',
    play: 'Jogar!',
    yes: 'Sim',
    no: 'Não',
    close: 'Fechar',
    currentTile: 'Peça Atual',
    nextTile: 'Próxima Peça',
    strategicTip: 'Dica Estratégica',
    strategicTipText: 'Conecte {0} blocos da mesma cor para "validá-los". Eles vão te salvar quando a grade encolher!',
    gameOver: 'Fim de Jogo',
    finalScore: 'Sua pontuação final é:',
    gridShrinking: 'A grade está encolhendo!',
    restartConfirm: 'Reiniciar?',
    restartConfirmText: 'Tem certeza de que deseja iniciar um novo jogo? Sua pontuação atual será perdida.',
    shareScoreText: 'Fiz {0} pontos no Tileburst! Acha que consegue me vencer? 🎮',
    shareScoreTitle: 'Fiz {0} pontos no Tileburst!',
    shareScoreCopied: 'Pontuação copiada para a área de transferência! Agora você pode compartilhar.',
    shareScoreCopyError: 'Copie este texto para compartilhar sua pontuação:',
    tutorial: {
      welcome: {
        title: 'Bem-vindo ao Tileburst!',
        content: 'O objetivo é simples: coloque as peças que aparecem na grade. Arraste a "Peça Atual" ou clique na grade para posicioná-la.',
        dragTile: 'Arraste uma peça como esta...',
        ontoGrid: '...na grade do jogo.',
      },
      clearing: {
        title: 'Limpando Linhas',
        content: 'Preencha uma linha ou coluna completa com blocos da MESMA cor para limpá-la. Isso te dá pontos e expande a grade!',
        fillLine: 'Preencha uma linha com a mesma cor...',
        toClear: '...para limpá-la!',
      },
      validated: {
        title: 'Blocos Validados: Sua Rede de Segurança',
        content: 'Conecte um grande grupo de blocos da mesma cor para "validá-los" (o número necessário é mostrado na dica estratégica). Eles recebem uma marca de verificação e se tornam sua rede de segurança.',
        connectGroup: 'Conecte um grande grupo da mesma cor.',
      },
      shrinking: {
        title: 'A Grade Contra-ataca!',
        content: 'Se você não conseguir colocar mais peças, a grade encolhe! Os blocos validados são então limpos (dando pontos e espaço), mas os blocos não validados nas bordas são destruídos.',
        ifStuck: 'Se você estiver preso, a grade encolhe...',
        toSmaller: '...para um tamanho menor.',
      },
      goal: {
        title: 'Pontuação e Fim de Jogo',
        content: 'O jogo termina se a grade encolher ao tamanho mínimo e você ainda estiver preso. Tente alcançar a melhor pontuação possível! Boa sorte!',
        aimFor: 'Aponte para a melhor pontuação!',
        combineStrategy: 'Combine estratégia e um pouco de sorte.',
      },
      step: 'Passo',
      of: 'de',
    },
    toggleSound: 'Ativar/Desativar som',
    toggleDarkMode: 'Ativar/Desativar modo escuro',
    newGameButton: 'Novo Jogo',
    howToPlayButton: 'Como Jogar',
    swapTilesButton: 'Trocar peças',
    rotateButton: 'Girar',
    closeTutorial: 'Fechar tutorial',
    options: 'Opções',
    colorPalette: 'Paleta de cores',
    shapeMode: 'Formas distintas',
    sound: 'Som',
    soundOn: 'Ativado',
    soundOff: 'Desativado',
    language: 'Idioma',
    darkMode: 'Escuro',
    lightMode: 'Claro',
    currentBestScore: 'Melhor pontuação atual',
    reset: 'Redefinir',
    resetBestScoreConfirm: 'Tem certeza de que deseja redefinir a melhor pontuação?',
  },
  ru: {
    score: 'Счёт',
    bestScore: 'Лучший счёт',
    loading: 'Загрузка...',
    howToPlay: 'Как Играть',
    newGame: 'Новая Игра',
    restart: 'Перезапустить?',
    rotate: 'Повернуть (R)',
    swap: 'Поменять',
    share: 'Поделиться',
    playAgain: 'Играть Снова',
    previous: 'Назад',
    next: 'Далее',
    play: 'Играть!',
    yes: 'Да',
    no: 'Нет',
    close: 'Закрыть',
    currentTile: 'Текущая Плитка',
    nextTile: 'Следующая Плитка',
    strategicTip: 'Стратегический Совет',
    strategicTipText: 'Соедините {0} блоков одного цвета, чтобы "валидировать" их. Они спасут вас, когда сетка сожмётся!',
    gameOver: 'Конец Игры',
    finalScore: 'Ваш итоговый счёт:',
    gridShrinking: 'Сетка сжимается!',
    restartConfirm: 'Перезапустить?',
    restartConfirmText: 'Вы уверены, что хотите начать новую игру? Ваш текущий счёт будет потерян.',
    shareScoreText: 'Я набрал {0} очков в Tileburst! Думаешь, сможешь меня победить? 🎮',
    shareScoreTitle: 'Я набрал {0} очков в Tileburst!',
    shareScoreCopied: 'Счёт скопирован в буфер обмена! Теперь вы можете поделиться им.',
    shareScoreCopyError: 'Скопируйте этот текст, чтобы поделиться своим счётом:',
    tutorial: {
      welcome: {
        title: 'Добро пожаловать в Tileburst!',
        content: 'Цель проста: разместите плитки, которые появляются на сетке. Перетащите "Текущую Плитку" или щёлкните по сетке, чтобы разместить её.',
        dragTile: 'Перетащите плитку, как эту...',
        ontoGrid: '...на игровую сетку.',
      },
      clearing: {
        title: 'Очистка Линий',
        content: 'Заполните полную строку или столбец блоками ОДНОГО цвета, чтобы очистить их. Это принесёт вам очки и расширит сетку!',
        fillLine: 'Заполните линию одним цветом...',
        toClear: '...чтобы очистить её!',
      },
      validated: {
        title: 'Валидированные Блоки: Ваша Страховка',
        content: 'Соедините большую группу блоков одного цвета, чтобы "валидировать" их (требуемое количество указано в стратегическом совете). Они получают галочку и становятся вашей страховкой.',
        connectGroup: 'Соедините большую группу одного цвета.',
      },
      shrinking: {
        title: 'Сетка Контратакует!',
        content: 'Если вы не можете разместить больше плиток, сетка сжимается! Валидированные блоки затем очищаются (давая вам очки и пространство), но невалидированные блоки на краях уничтожаются.',
        ifStuck: 'Если вы застряли, сетка сжимается...',
        toSmaller: '...до меньшего размера.',
      },
      goal: {
        title: 'Счёт и Конец Игры',
        content: 'Игра заканчивается, если сетка сжимается до минимального размера и вы всё ещё застряли. Попробуйте набрать лучший счёт! Удачи!',
        aimFor: 'Стремитесь к лучшему счёту!',
        combineStrategy: 'Сочетайте стратегию и немного удачи.',
      },
      step: 'Шаг',
      of: 'из',
    },
    toggleSound: 'Включить/Выключить звук',
    toggleDarkMode: 'Включить/Выключить тёмный режим',
    newGameButton: 'Новая Игра',
    howToPlayButton: 'Как Играть',
    swapTilesButton: 'Поменять плитки',
    rotateButton: 'Повернуть',
    closeTutorial: 'Закрыть обучение',
    options: 'Настройки',
    colorPalette: 'Палитра цветов',
    shapeMode: 'Отличительные формы',
    sound: 'Звук',
    soundOn: 'Включен',
    soundOff: 'Выключен',
    language: 'Язык',
    darkMode: 'Тёмный',
    lightMode: 'Светлый',
    currentBestScore: 'Текущий лучший счёт',
    reset: 'Сбросить',
    resetBestScoreConfirm: 'Вы уверены, что хотите сбросить лучший счёт?',
  },
  ja: {
    score: 'スコア',
    bestScore: 'ベストスコア',
    loading: '読み込み中...',
    howToPlay: '遊び方',
    newGame: '新しいゲーム',
    restart: '再開しますか？',
    rotate: '回転 (R)',
    swap: '交換',
    share: '共有',
    playAgain: 'もう一度プレイ',
    previous: '前へ',
    next: '次へ',
    play: 'プレイ！',
    yes: 'はい',
    no: 'いいえ',
    close: '閉じる',
    currentTile: '現在のタイル',
    nextTile: '次のタイル',
    strategicTip: '戦略のヒント',
    strategicTipText: '同じ色のブロックを{0}個つなげて「検証」します。グリッドが縮小するときにあなたを救います！',
    gameOver: 'ゲームオーバー',
    finalScore: '最終スコアは：',
    gridShrinking: 'グリッドが縮小しています！',
    restartConfirm: '再開しますか？',
    restartConfirmText: '新しいゲームを開始してもよろしいですか？現在のスコアは失われます。',
    shareScoreText: 'Tileburstで{0}ポイント獲得しました！勝てると思いますか？🎮',
    shareScoreTitle: 'Tileburstで{0}ポイント獲得しました！',
    shareScoreCopied: 'スコアをクリップボードにコピーしました！今すぐ共有できます。',
    shareScoreCopyError: 'スコアを共有するには、このテキストをコピーしてください：',
    tutorial: {
      welcome: {
        title: 'Tileburstへようこそ！',
        content: '目標は簡単です：グリッドに表示されるタイルを配置します。「現在のタイル」をドラッグするか、グリッドをクリックして配置します。',
        dragTile: 'このようなタイルをドラッグ...',
        ontoGrid: '...ゲームグリッドに。',
      },
      clearing: {
        title: 'ラインをクリア',
        content: '同じ色のブロックで完全な行または列を埋めてクリアします。これによりポイントが獲得でき、グリッドが拡大します！',
        fillLine: '同じ色でラインを埋める...',
        toClear: '...クリアします！',
      },
      validated: {
        title: '検証済みブロック：あなたの安全網',
        content: '同じ色のブロックの大きなグループをつなげて「検証」します（必要な数は戦略のヒントに表示されます）。チェックマークが付き、あなたの安全網になります。',
        connectGroup: '同じ色の大きなグループをつなげます。',
      },
      shrinking: {
        title: 'グリッドが反撃！',
        content: 'これ以上タイルを配置できない場合、グリッドが縮小します！検証済みブロックはクリアされ（ポイントとスペースを提供）、エッジの未検証ブロックは破壊されます。',
        ifStuck: '行き詰まった場合、グリッドが縮小...',
        toSmaller: '...より小さなサイズに。',
      },
      goal: {
        title: 'スコアとゲームオーバー',
        content: 'グリッドが最小サイズに縮小し、まだ行き詰まっている場合、ゲームは終了します。可能な限り最高のスコアを目指してください！頑張ってください！',
        aimFor: '最高のスコアを目指しましょう！',
        combineStrategy: '戦略と少しの運を組み合わせます。',
      },
      step: 'ステップ',
      of: '/',
    },
    toggleSound: '音声のオン/オフ',
    toggleDarkMode: 'ダークモードのオン/オフ',
    newGameButton: '新しいゲーム',
    howToPlayButton: '遊び方',
    swapTilesButton: 'タイルを交換',
    rotateButton: '回転',
    closeTutorial: 'チュートリアルを閉じる',
    options: 'オプション',
    colorPalette: 'カラーパレット',
    shapeMode: '異なる形状',
    sound: '音声',
    soundOn: 'オン',
    soundOff: 'オフ',
    language: '言語',
    darkMode: 'ダーク',
    lightMode: 'ライト',
    currentBestScore: '現在の最高スコア',
    reset: 'リセット',
    resetBestScoreConfirm: '最高スコアをリセットしてもよろしいですか？',
  },
  zh: {
    score: '分数',
    bestScore: '最佳分数',
    loading: '加载中...',
    howToPlay: '如何游戏',
    newGame: '新游戏',
    restart: '重新开始？',
    rotate: '旋转 (R)',
    swap: '交换',
    share: '分享',
    playAgain: '再玩一次',
    previous: '上一步',
    next: '下一步',
    play: '开始游戏！',
    yes: '是',
    no: '否',
    close: '关闭',
    currentTile: '当前方块',
    nextTile: '下一个方块',
    strategicTip: '策略提示',
    strategicTipText: '连接{0}个相同颜色的方块来"验证"它们。当网格缩小时，它们会拯救你！',
    gameOver: '游戏结束',
    finalScore: '您的最终分数是：',
    gridShrinking: '网格正在缩小！',
    restartConfirm: '重新开始？',
    restartConfirmText: '您确定要开始新游戏吗？您当前的分数将丢失。',
    shareScoreText: '我在Tileburst中获得了{0}分！你觉得你能打败我吗？🎮',
    shareScoreTitle: '我在Tileburst中获得了{0}分！',
    shareScoreCopied: '分数已复制到剪贴板！您现在可以分享了。',
    shareScoreCopyError: '复制此文本以分享您的分数：',
    tutorial: {
      welcome: {
        title: '欢迎来到Tileburst！',
        content: '目标很简单：将出现在网格上的方块放置好。拖动"当前方块"或点击网格来定位它。',
        dragTile: '拖动一个像这样的方块...',
        ontoGrid: '...到游戏网格上。',
      },
      clearing: {
        title: '清除行',
        content: '用相同颜色的方块填满一整行或一整列来清除它。这会给你分数并扩大网格！',
        fillLine: '用相同颜色填满一行...',
        toClear: '...来清除它！',
      },
      validated: {
        title: '已验证方块：您的安全网',
        content: '连接一大组相同颜色的方块来"验证"它们（所需数量显示在策略提示中）。它们会得到一个勾选标记，成为您的安全网。',
        connectGroup: '连接一大组相同颜色的方块。',
      },
      shrinking: {
        title: '网格反击！',
        content: '如果您无法再放置方块，网格会缩小！已验证的方块会被清除（给您分数和空间），但边缘未验证的方块会被销毁。',
        ifStuck: '如果您被困住了，网格会缩小...',
        toSmaller: '...到更小的尺寸。',
      },
      goal: {
        title: '分数和游戏结束',
        content: '如果网格缩小到最小尺寸而您仍然被困，游戏就会结束。尝试获得尽可能高的分数！祝您好运！',
        aimFor: '争取最高分！',
        combineStrategy: '结合策略和一点运气。',
      },
      step: '步骤',
      of: '/',
    },
    toggleSound: '切换声音',
    toggleDarkMode: '切换深色模式',
    newGameButton: '新游戏',
    howToPlayButton: '如何游戏',
    swapTilesButton: '交换方块',
    rotateButton: '旋转',
    closeTutorial: '关闭教程',
    options: '选项',
    colorPalette: '调色板',
    shapeMode: '不同形状',
    sound: '声音',
    soundOn: '开启',
    soundOff: '关闭',
    language: '语言',
    darkMode: '深色',
    lightMode: '浅色',
    currentBestScore: '当前最佳分数',
    reset: '重置',
    resetBestScoreConfirm: '您确定要重置最佳分数吗？',
  },
  ko: {
    score: '점수',
    bestScore: '최고 점수',
    loading: '로딩 중...',
    howToPlay: '게임 방법',
    newGame: '새 게임',
    restart: '다시 시작?',
    rotate: '회전 (R)',
    swap: '교환',
    share: '공유',
    playAgain: '다시 플레이',
    previous: '이전',
    next: '다음',
    play: '플레이!',
    yes: '예',
    no: '아니오',
    close: '닫기',
    currentTile: '현재 타일',
    nextTile: '다음 타일',
    strategicTip: '전략 팁',
    strategicTipText: '같은 색상의 블록 {0}개를 연결하여 "검증"하세요. 그리드가 줄어들 때 당신을 구할 것입니다!',
    gameOver: '게임 오버',
    finalScore: '최종 점수는:',
    gridShrinking: '그리드가 줄어들고 있습니다!',
    restartConfirm: '다시 시작?',
    restartConfirmText: '새 게임을 시작하시겠습니까? 현재 점수가 손실됩니다.',
    shareScoreText: 'Tileburst에서 {0}점을 얻었습니다! 저를 이길 수 있다고 생각하시나요? 🎮',
    shareScoreTitle: 'Tileburst에서 {0}점을 얻었습니다!',
    shareScoreCopied: '점수가 클립보드에 복사되었습니다! 이제 공유할 수 있습니다.',
    shareScoreCopyError: '점수를 공유하려면 이 텍스트를 복사하세요:',
    tutorial: {
      welcome: {
        title: 'Tileburst에 오신 것을 환영합니다!',
        content: '목표는 간단합니다: 그리드에 나타나는 타일을 배치하세요. "현재 타일"을 드래그하거나 그리드를 클릭하여 배치합니다.',
        dragTile: '이런 타일을 드래그...',
        ontoGrid: '...게임 그리드에.',
      },
      clearing: {
        title: '줄 지우기',
        content: '같은 색상의 블록으로 완전한 행이나 열을 채워 지웁니다. 이것은 점수를 주고 그리드를 확장합니다!',
        fillLine: '같은 색상으로 줄을 채우세요...',
        toClear: '...지우기 위해!',
      },
      validated: {
        title: '검증된 블록: 안전망',
        content: '같은 색상의 블록의 큰 그룹을 연결하여 "검증"하세요 (필요한 수는 전략 팁에 표시됩니다). 체크 표시를 받고 안전망이 됩니다.',
        connectGroup: '같은 색상의 큰 그룹을 연결하세요.',
      },
      shrinking: {
        title: '그리드가 반격합니다!',
        content: '더 이상 타일을 배치할 수 없으면 그리드가 줄어듭니다! 검증된 블록은 지워지고 (점수와 공간을 제공), 가장자리의 미검증 블록은 파괴됩니다.',
        ifStuck: '막혔다면 그리드가 줄어듭니다...',
        toSmaller: '...더 작은 크기로.',
      },
      goal: {
        title: '점수와 게임 오버',
        content: '그리드가 최소 크기로 줄어들고 여전히 막혀 있으면 게임이 끝납니다. 최고 점수를 달성해보세요! 행운을 빕니다!',
        aimFor: '최고 점수를 목표로 하세요!',
        combineStrategy: '전략과 약간의 운을 결합하세요.',
      },
      step: '단계',
      of: '/',
    },
    toggleSound: '소리 켜기/끄기',
    toggleDarkMode: '다크 모드 켜기/끄기',
    newGameButton: '새 게임',
    howToPlayButton: '게임 방법',
    swapTilesButton: '타일 교환',
    rotateButton: '회전',
    closeTutorial: '튜토리얼 닫기',
    options: '옵션',
    colorPalette: '색상 팔레트',
    shapeMode: '구별되는 모양',
    sound: '소리',
    soundOn: '켜짐',
    soundOff: '꺼짐',
    language: '언어',
    darkMode: '다크',
    lightMode: '라이트',
    currentBestScore: '현재 최고 점수',
    reset: '재설정',
    resetBestScoreConfirm: '최고 점수를 재설정하시겠습니까?',
  },
  nl: {
    score: 'Score',
    bestScore: 'Beste score',
    loading: 'Laden...',
    howToPlay: 'Hoe te Spelen',
    newGame: 'Nieuw Spel',
    restart: 'Opnieuw Starten?',
    rotate: 'Draaien (R)',
    swap: 'Wisselen',
    share: 'Delen',
    playAgain: 'Opnieuw Spelen',
    previous: 'Vorige',
    next: 'Volgende',
    play: 'Spelen!',
    yes: 'Ja',
    no: 'Nee',
    close: 'Sluiten',
    currentTile: 'Huidige Tegel',
    nextTile: 'Volgende Tegel',
    strategicTip: 'Strategische Tip',
    strategicTipText: 'Verbind {0} blokken van dezelfde kleur om ze te "valideren". Ze zullen je redden wanneer het raster krimpt!',
    gameOver: 'Spel Voorbij',
    finalScore: 'Je eindscore is:',
    gridShrinking: 'Het raster krimpt!',
    restartConfirm: 'Opnieuw Starten?',
    restartConfirmText: 'Weet je zeker dat je een nieuw spel wilt starten? Je huidige score gaat verloren.',
    shareScoreText: 'Ik heb {0} punten gescoord op Tileburst! Denk je dat je me kunt verslaan? 🎮',
    shareScoreTitle: 'Ik heb {0} punten gescoord op Tileburst!',
    shareScoreCopied: 'Score gekopieerd naar klembord! Je kunt het nu delen.',
    shareScoreCopyError: 'Kopieer deze tekst om je score te delen:',
    tutorial: {
      welcome: {
        title: 'Welkom bij Tileburst!',
        content: 'Het doel is eenvoudig: plaats de tegels die op het raster verschijnen. Sleep de "Huidige Tegel" of klik op het raster om deze te positioneren.',
        dragTile: 'Sleep een tegel zoals deze...',
        ontoGrid: '...op het spelraster.',
      },
      clearing: {
        title: 'Lijnen Wissen',
        content: 'Vul een volledige rij of kolom met blokken van dezelfde kleur om deze te wissen. Dit levert je punten op en breidt het raster uit!',
        fillLine: 'Vul een lijn met dezelfde kleur...',
        toClear: '...om deze te wissen!',
      },
      validated: {
        title: 'Gevalideerde Blokken: Je Vangnet',
        content: 'Verbind een grote groep blokken van dezelfde kleur om ze te "valideren" (het vereiste aantal wordt getoond in de strategische tip). Ze krijgen een vinkje en worden je vangnet.',
        connectGroup: 'Verbind een grote groep van dezelfde kleur.',
      },
      shrinking: {
        title: 'Het Raster Slaat Terug!',
        content: 'Als je geen tegels meer kunt plaatsen, krimpt het raster! Gevalideerde blokken worden dan gewist (wat je punten en ruimte geeft), maar niet-gevalideerde blokken aan de randen worden vernietigd.',
        ifStuck: 'Als je vastzit, krimpt het raster...',
        toSmaller: '...naar een kleinere grootte.',
      },
      goal: {
        title: 'Score en Spel Voorbij',
        content: 'Het spel eindigt als het raster krimpt tot zijn minimale grootte en je nog steeds vastzit. Probeer de beste score te behalen! Veel succes!',
        aimFor: 'Mik op de beste score!',
        combineStrategy: 'Combineer strategie en een beetje geluk.',
      },
      step: 'Stap',
      of: 'van',
    },
    toggleSound: 'Geluid aan/uit',
    toggleDarkMode: 'Donkere modus aan/uit',
    newGameButton: 'Nieuw Spel',
    howToPlayButton: 'Hoe te Spelen',
    swapTilesButton: 'Tegels wisselen',
    rotateButton: 'Draaien',
    closeTutorial: 'Tutorial sluiten',
    options: 'Opties',
    colorPalette: 'Kleurenpalet',
    shapeMode: 'Onderscheidende vormen',
    sound: 'Geluid',
    soundOn: 'Aan',
    soundOff: 'Uit',
    language: 'Taal',
    darkMode: 'Donker',
    lightMode: 'Licht',
    currentBestScore: 'Huidige beste score',
    reset: 'Resetten',
    resetBestScoreConfirm: 'Weet u zeker dat u de beste score wilt resetten?',
  },
  pl: {
    score: 'Wynik',
    bestScore: 'Najlepszy wynik',
    loading: 'Ładowanie...',
    howToPlay: 'Jak Grać',
    newGame: 'Nowa Gra',
    restart: 'Zrestartować?',
    rotate: 'Obróć (R)',
    swap: 'Zamień',
    share: 'Udostępnij',
    playAgain: 'Zagraj Ponownie',
    previous: 'Poprzedni',
    next: 'Następny',
    play: 'Graj!',
    yes: 'Tak',
    no: 'Nie',
    close: 'Zamknij',
    currentTile: 'Bieżąca Płytka',
    nextTile: 'Następna Płytka',
    strategicTip: 'Wskazówka Strategiczna',
    strategicTipText: 'Połącz {0} bloków tego samego koloru, aby je "zweryfikować". Uratują cię, gdy siatka się zmniejszy!',
    gameOver: 'Koniec Gry',
    finalScore: 'Twój końcowy wynik to:',
    gridShrinking: 'Siatka się zmniejsza!',
    restartConfirm: 'Zrestartować?',
    restartConfirmText: 'Czy na pewno chcesz rozpocząć nową grę? Twój obecny wynik zostanie utracony.',
    shareScoreText: 'Zdobyłem {0} punktów w Tileburst! Myślisz, że możesz mnie pokonać? 🎮',
    shareScoreTitle: 'Zdobyłem {0} punktów w Tileburst!',
    shareScoreCopied: 'Wynik skopiowany do schowka! Możesz go teraz udostępnić.',
    shareScoreCopyError: 'Skopiuj ten tekst, aby udostępnić swój wynik:',
    tutorial: {
      welcome: {
        title: 'Witaj w Tileburst!',
        content: 'Cel jest prosty: umieść płytki, które pojawiają się na siatce. Przeciągnij "Bieżącą Płytkę" lub kliknij na siatkę, aby ją umieścić.',
        dragTile: 'Przeciągnij płytkę taką jak ta...',
        ontoGrid: '...na siatkę gry.',
      },
      clearing: {
        title: 'Czyszczenie Linii',
        content: 'Wypełnij pełny wiersz lub kolumnę blokami tego SAMEGO koloru, aby je wyczyścić. To daje ci punkty i rozszerza siatkę!',
        fillLine: 'Wypełnij linię tym samym kolorem...',
        toClear: '...aby ją wyczyścić!',
      },
      validated: {
        title: 'Zweryfikowane Bloki: Twoja Sieć Bezpieczeństwa',
        content: 'Połącz dużą grupę bloków tego samego koloru, aby je "zweryfikować" (wymagana liczba jest pokazana we wskazówce strategicznej). Otrzymują znacznik i stają się twoją siecią bezpieczeństwa.',
        connectGroup: 'Połącz dużą grupę tego samego koloru.',
      },
      shrinking: {
        title: 'Siatka Kontratakuje!',
        content: 'Jeśli nie możesz już umieścić więcej płytek, siatka się zmniejsza! Zweryfikowane bloki są wtedy czyszczone (dając ci punkty i przestrzeń), ale niezweryfikowane bloki na krawędziach są niszczone.',
        ifStuck: 'Jeśli utknąłeś, siatka się zmniejsza...',
        toSmaller: '...do mniejszego rozmiaru.',
      },
      goal: {
        title: 'Wynik i Koniec Gry',
        content: 'Gra kończy się, jeśli siatka zmniejszy się do minimalnego rozmiaru i nadal jesteś zablokowany. Spróbuj osiągnąć najlepszy wynik! Powodzenia!',
        aimFor: 'Celuj w najlepszy wynik!',
        combineStrategy: 'Połącz strategię i trochę szczęścia.',
      },
      step: 'Krok',
      of: 'z',
    },
    toggleSound: 'Włącz/Wyłącz dźwięk',
    toggleDarkMode: 'Włącz/Wyłącz tryb ciemny',
    newGameButton: 'Nowa Gra',
    howToPlayButton: 'Jak Grać',
    swapTilesButton: 'Zamień płytki',
    rotateButton: 'Obróć',
    closeTutorial: 'Zamknij samouczek',
    options: 'Opcje',
    colorPalette: 'Paleta kolorów',
    shapeMode: 'Różne kształty',
    sound: 'Dźwięk',
    soundOn: 'Włączony',
    soundOff: 'Wyłączony',
    language: 'Język',
    darkMode: 'Ciemny',
    lightMode: 'Jasny',
    currentBestScore: 'Aktualny najlepszy wynik',
    reset: 'Resetuj',
    resetBestScoreConfirm: 'Czy na pewno chcesz zresetować najlepszy wynik?',
  },
  tr: {
    score: 'Skor',
    bestScore: 'En iyi skor',
    loading: 'Yükleniyor...',
    howToPlay: 'Nasıl Oynanır',
    newGame: 'Yeni Oyun',
    restart: 'Yeniden Başlat?',
    rotate: 'Döndür (R)',
    swap: 'Değiştir',
    share: 'Paylaş',
    playAgain: 'Tekrar Oyna',
    previous: 'Önceki',
    next: 'Sonraki',
    play: 'Oyna!',
    yes: 'Evet',
    no: 'Hayır',
    close: 'Kapat',
    currentTile: 'Mevcut Karo',
    nextTile: 'Sonraki Karo',
    strategicTip: 'Stratejik İpucu',
    strategicTipText: 'Aynı renkteki {0} bloğu "doğrulamak" için bağlayın. Izgara küçüldüğünde sizi kurtaracaklar!',
    gameOver: 'Oyun Bitti',
    finalScore: 'Final skorunuz:',
    gridShrinking: 'Izgara küçülüyor!',
    restartConfirm: 'Yeniden Başlat?',
    restartConfirmText: 'Yeni bir oyun başlatmak istediğinizden emin misiniz? Mevcut skorunuz kaybolacak.',
    shareScoreText: 'Tileburst\'ta {0} puan aldım! Beni yenebileceğini düşünüyor musun? 🎮',
    shareScoreTitle: 'Tileburst\'ta {0} puan aldım!',
    shareScoreCopied: 'Skor panoya kopyalandı! Artık paylaşabilirsiniz.',
    shareScoreCopyError: 'Skorunuzu paylaşmak için bu metni kopyalayın:',
    tutorial: {
      welcome: {
        title: 'Tileburst\'a Hoş Geldiniz!',
        content: 'Hedef basit: Izgarada görünen karoları yerleştirin. "Mevcut Karo"yu sürükleyin veya yerleştirmek için ızgaraya tıklayın.',
        dragTile: 'Böyle bir karoyu sürükleyin...',
        ontoGrid: '...oyun ızgarasına.',
      },
      clearing: {
        title: 'Satırları Temizleme',
        content: 'Temizlemek için tam bir satır veya sütunu AYNI renkteki bloklarla doldurun. Bu size puan kazandırır ve ızgarayı genişletir!',
        fillLine: 'Aynı renkle bir satır doldurun...',
        toClear: '...temizlemek için!',
      },
      validated: {
        title: 'Doğrulanmış Bloklar: Güvenlik Ağınız',
        content: 'Aynı renkteki büyük bir blok grubunu "doğrulamak" için bağlayın (gerekli sayı stratejik ipucunda gösterilir). Bir onay işareti alırlar ve güvenlik ağınız olurlar.',
        connectGroup: 'Aynı renkteki büyük bir grubu bağlayın.',
      },
      shrinking: {
        title: 'Izgara Karşı Saldırıyor!',
        content: 'Artık karo yerleştiremezseniz, ızgara küçülür! Doğrulanmış bloklar temizlenir (size puan ve alan verir), ancak kenarlardaki doğrulanmamış bloklar yok edilir.',
        ifStuck: 'Takılırsanız, ızgara küçülür...',
        toSmaller: '...daha küçük bir boyuta.',
      },
      goal: {
        title: 'Skor ve Oyun Bitti',
        content: 'Izgara minimum boyutuna küçülür ve hala takılıysanız oyun biter. Mümkün olan en iyi skoru elde etmeye çalışın! İyi şanslar!',
        aimFor: 'En iyi skoru hedefleyin!',
        combineStrategy: 'Stratejiyi ve biraz şansı birleştirin.',
      },
      step: 'Adım',
      of: ' / ',
    },
    toggleSound: 'Sesi Aç/Kapat',
    toggleDarkMode: 'Karanlık Modu Aç/Kapat',
    newGameButton: 'Yeni Oyun',
    howToPlayButton: 'Nasıl Oynanır',
    swapTilesButton: 'Karoları değiştir',
    rotateButton: 'Döndür',
    closeTutorial: 'Öğreticiyi kapat',
    options: 'Seçenekler',
    colorPalette: 'Renk Paleti',
    shapeMode: 'Farklı Şekiller',
    sound: 'Ses',
    soundOn: 'Açık',
    soundOff: 'Kapalı',
    language: 'Dil',
    darkMode: 'Karanlık',
    lightMode: 'Aydınlık',
    currentBestScore: 'Mevcut en iyi skor',
    reset: 'Sıfırla',
    resetBestScoreConfirm: 'En iyi skoru sıfırlamak istediğinizden emin misiniz?',
  },
  ar: {
    score: 'النقاط',
    bestScore: 'أفضل النقاط',
    loading: 'جاري التحميل...',
    howToPlay: 'كيفية اللعب',
    newGame: 'لعبة جديدة',
    restart: 'إعادة التشغيل؟',
    rotate: 'تدوير (R)',
    swap: 'تبديل',
    share: 'مشاركة',
    playAgain: 'العب مرة أخرى',
    previous: 'السابق',
    next: 'التالي',
    play: 'العب!',
    yes: 'نعم',
    no: 'لا',
    close: 'إغلاق',
    currentTile: 'البلاطة الحالية',
    nextTile: 'البلاطة التالية',
    strategicTip: 'نصيحة استراتيجية',
    strategicTipText: 'اربط {0} كتل من نفس اللون "للتحقق" منها. ستنقذك عندما يتقلص الشبكة!',
    gameOver: 'انتهت اللعبة',
    finalScore: 'نقاطك النهائية هي:',
    gridShrinking: 'الشبكة تتقلص!',
    restartConfirm: 'إعادة التشغيل؟',
    restartConfirmText: 'هل أنت متأكد أنك تريد بدء لعبة جديدة؟ ستضيع نقاطك الحالية.',
    shareScoreText: 'حصلت على {0} نقطة في Tileburst! هل تعتقد أنك تستطيع هزيمتي؟ 🎮',
    shareScoreTitle: 'حصلت على {0} نقطة في Tileburst!',
    shareScoreCopied: 'تم نسخ النقاط إلى الحافظة! يمكنك الآن مشاركتها.',
    shareScoreCopyError: 'انسخ هذا النص لمشاركة نقاطك:',
    tutorial: {
      welcome: {
        title: 'مرحباً بك في Tileburst!',
        content: 'الهدف بسيط: ضع البلاطات التي تظهر على الشبكة. اسحب "البلاطة الحالية" أو انقر على الشبكة لوضعها.',
        dragTile: 'اسحب بلاطة مثل هذه...',
        ontoGrid: '...على شبكة اللعبة.',
      },
      clearing: {
        title: 'مسح الخطوط',
        content: 'املأ صفاً أو عموداً كاملاً بكتل من نفس اللون لمسحه. هذا يمنحك نقاطاً ويوسع الشبكة!',
        fillLine: 'املأ خطاً بنفس اللون...',
        toClear: '...لمسحه!',
      },
      validated: {
        title: 'الكتل المتحقق منها: شبكة الأمان الخاصة بك',
        content: 'اربط مجموعة كبيرة من الكتل من نفس اللون "للتحقق" منها (العدد المطلوب موضح في النصيحة الاستراتيجية). تحصل على علامة صح وتصبح شبكة الأمان الخاصة بك.',
        connectGroup: 'اربط مجموعة كبيرة من نفس اللون.',
      },
      shrinking: {
        title: 'الشبكة ترد!',
        content: 'إذا لم تتمكن من وضع المزيد من البلاطات، تتقلص الشبكة! ثم يتم مسح الكتل المتحقق منها (مما يمنحك نقاطاً ومساحة)، لكن الكتل غير المتحقق منها على الحواف تُدمر.',
        ifStuck: 'إذا علقت، تتقلص الشبكة...',
        toSmaller: '...إلى حجم أصغر.',
      },
      goal: {
        title: 'النقاط ونهاية اللعبة',
        content: 'تنتهي اللعبة إذا تقلصت الشبكة إلى حجمها الأدنى وما زلت عالقاً. حاول تحقيق أفضل نتيجة ممكنة! حظاً سعيداً!',
        aimFor: 'استهدف أفضل نتيجة!',
        combineStrategy: 'اجمع بين الاستراتيجية وقليل من الحظ.',
      },
      step: 'الخطوة',
      of: 'من',
    },
    toggleSound: 'تشغيل/إيقاف الصوت',
    toggleDarkMode: 'تشغيل/إيقاف الوضع الداكن',
    newGameButton: 'لعبة جديدة',
    howToPlayButton: 'كيفية اللعب',
    swapTilesButton: 'تبديل البلاطات',
    rotateButton: 'تدوير',
    closeTutorial: 'إغلاق البرنامج التعليمي',
    options: 'خيارات',
    colorPalette: 'لوحة الألوان',
    shapeMode: 'أشكال مميزة',
    sound: 'الصوت',
    soundOn: 'مفعل',
    soundOff: 'معطل',
    language: 'اللغة',
    darkMode: 'داكن',
    lightMode: 'فاتح',
    currentBestScore: 'أفضل نتيجة حالية',
    reset: 'إعادة تعيين',
    resetBestScoreConfirm: 'هل أنت متأكد أنك تريد إعادة تعيين أفضل نتيجة؟',
  },
};

const LANGUAGE_NAMES: Record<Language, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  ja: '日本語',
  zh: '中文',
  ko: '한국어',
  nl: 'Nederlands',
  pl: 'Polski',
  tr: 'Türkçe',
  ar: 'العربية',
};

const STORAGE_KEY = 'tileburst_language';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private currentLanguage = signal<Language>('fr');

  readonly translations = computed(() => TRANSLATIONS[this.currentLanguage()]);
  readonly availableLanguages = Object.keys(TRANSLATIONS) as Language[];
  readonly languageNames = LANGUAGE_NAMES;

  constructor() {
    // Détecter la langue du navigateur ou charger depuis localStorage
    const savedLanguage = this.getSavedLanguage();
    const browserLanguage = this.detectBrowserLanguage();
    this.currentLanguage.set(savedLanguage || browserLanguage || 'fr');
  }

  private detectBrowserLanguage(): Language | null {
    if (typeof window === 'undefined' || !navigator.language) {
      return null;
    }
    
    const browserLang = navigator.language.split('-')[0].toLowerCase();
    const supportedLanguages: Language[] = ['fr', 'en', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ko', 'nl', 'pl', 'tr', 'ar'];
    
    if (supportedLanguages.includes(browserLang as Language)) {
      return browserLang as Language;
    }
    
    return null;
  }

  private getSavedLanguage(): Language | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved in TRANSLATIONS) {
      return saved as Language;
    }
    return null;
  }

  setLanguage(language: Language): void {
    this.currentLanguage.set(language);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY, language);
    }
  }

  getLanguage(): Language {
    return this.currentLanguage();
  }

  translate(key: Exclude<keyof Translations, 'tutorial'>): string {
    const value = this.translations()[key];
    return typeof value === 'string' ? value : String(key);
  }

  translateWithParams(key: Exclude<keyof Translations, 'tutorial'>, ...params: string[]): string {
    let translation = this.translate(key);
    params.forEach((param, index) => {
      translation = translation.replace(`{${index}}`, param);
    });
    return translation;
  }

  // Helper pour accéder facilement aux traductions
  t = this.translations;
}
