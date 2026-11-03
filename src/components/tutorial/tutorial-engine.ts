/**
 * Mini moteur du tutoriel interactif.
 * Reprend les règles du vrai jeu (GameService) sur une grille indépendante,
 * pour que le joueur s'entraîne sans toucher à sa partie en cours.
 */

export interface TutCell {
  color: string | null;
  validated?: boolean;
  clearing?: boolean;
  shrinking?: boolean;
  /** Case posée au dernier coup (animation de pose) */
  fresh?: boolean;
  /** Case cible conseillée pour l'étape */
  target?: boolean;
}

export interface TutPiece {
  shape: number[][];
  color: string;
}

export type TutGrid = TutCell[][];

/** Légende des grilles écrites en texte: une lettre = une couleur, `.` = vide, `*` = case cible */
const COLOR_CODES: Record<string, string> = {
  b: 'blue',
  r: 'red',
  g: 'green',
  y: 'yellow',
  p: 'purple',
};

export function parseGrid(rows: string[]): TutGrid {
  return rows.map(row =>
    row.split('').map(ch => ({
      color: COLOR_CODES[ch] ?? null,
      target: ch === '*',
    }))
  );
}

export function cloneGrid(grid: TutGrid): TutGrid {
  return grid.map(row => row.map(cell => ({ ...cell })));
}

export function piece(shape: number[][], color: string): TutPiece {
  return { shape: shape.map(r => [...r]), color };
}

export function rotatePiece(p: TutPiece): TutPiece {
  const h = p.shape.length;
  const w = p.shape[0].length;
  const shape = Array.from({ length: w }, () => Array(h).fill(0));
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) shape[c][h - 1 - r] = p.shape[r][c];
  }
  return { ...p, shape };
}

export function mirrorPiece(p: TutPiece): TutPiece {
  return { ...p, shape: p.shape.map(row => [...row].reverse()) };
}

export function isSymmetric(p: TutPiece): boolean {
  return p.shape.every(row => row.join() === [...row].reverse().join());
}

/** Point d'ancrage de la pièce (même règle que le jeu) */
export function anchor(p: TutPiece): { r: number; c: number } {
  return { r: Math.floor(p.shape.length / 2), c: Math.floor(p.shape[0].length / 2) };
}

export function pieceCells(p: TutPiece, startRow: number, startCol: number): { r: number; c: number }[] {
  const cells: { r: number; c: number }[] = [];
  p.shape.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v === 1) cells.push({ r: startRow + r, c: startCol + c });
    })
  );
  return cells;
}

export function canPlace(grid: TutGrid, p: TutPiece, startRow: number, startCol: number): boolean {
  const size = grid.length;
  return pieceCells(p, startRow, startCol).every(
    ({ r, c }) => r >= 0 && c >= 0 && r < size && c < size && grid[r][c].color === null
  );
}

export function canPlaceAnywhere(grid: TutGrid, p: TutPiece): boolean {
  let cur = p;
  for (let i = 0; i < 4; i++) {
    for (let r = -3; r < grid.length; r++) {
      for (let c = -3; c < grid.length; c++) {
        if (canPlace(grid, cur, r, c)) return true;
      }
    }
    cur = rotatePiece(cur);
  }
  return false;
}

export function withPiece(grid: TutGrid, p: TutPiece, startRow: number, startCol: number): TutGrid {
  const next = grid.map(row => row.map(cell => ({ ...cell, fresh: false })));
  for (const { r, c } of pieceCells(p, startRow, startCol)) {
    next[r][c] = { color: p.color, fresh: true };
  }
  return next;
}

/** Cases des lignes/colonnes entièrement remplies d'une seule couleur */
export function completedLines(grid: TutGrid): { cells: Set<string>; lines: number } {
  const size = grid.length;
  const cells = new Set<string>();
  let lines = 0;
  for (let i = 0; i < size; i++) {
    const rowColor = grid[i][0].color;
    if (rowColor && grid[i].every(cell => cell.color === rowColor)) {
      lines++;
      for (let c = 0; c < size; c++) cells.add(`${i},${c}`);
    }
    const colColor = grid[0][i].color;
    if (colColor && grid.every(row => row[i].color === colColor)) {
      lines++;
      for (let r = 0; r < size; r++) cells.add(`${r},${i}`);
    }
  }
  return { cells, lines };
}

/** Taille minimale d'un groupe validé, selon la taille de grille (comme dans le jeu) */
export function minGroupSize(size: number): number {
  if (size === 6) return 6;
  if (size === 7) return 8;
  if (size === 8) return 10;
  if (size >= 9) return 12;
  return size + 2;
}

/** Marque les groupes de même couleur assez grands comme "validés" */
export function markValidated(grid: TutGrid, minSize = minGroupSize(grid.length)): { grid: TutGrid; groups: number } {
  const size = grid.length;
  const next = grid.map(row => row.map(cell => ({ ...cell, validated: false })));
  const seen = new Set<string>();
  let groups = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const color = next[r][c].color;
      if (!color || seen.has(`${r},${c}`)) continue;
      const group: [number, number][] = [];
      const queue: [number, number][] = [[r, c]];
      seen.add(`${r},${c}`);
      while (queue.length) {
        const [cr, cc] = queue.shift()!;
        group.push([cr, cc]);
        for (const [nr, nc] of [[cr - 1, cc], [cr + 1, cc], [cr, cc - 1], [cr, cc + 1]]) {
          const key = `${nr},${nc}`;
          if (nr < 0 || nc < 0 || nr >= size || nc >= size || seen.has(key)) continue;
          if (next[nr][nc].color !== color) continue;
          seen.add(key);
          queue.push([nr, nc]);
        }
      }
      if (group.length >= minSize) {
        groups++;
        group.forEach(([gr, gc]) => (next[gr][gc].validated = true));
      }
    }
  }
  return { grid: next, groups };
}

/** Agrandit la grille d'une ligne et d'une colonne vides, en bas à droite */
export function growGrid(grid: TutGrid): TutGrid {
  const size = grid.length + 1;
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) =>
      r < grid.length && c < grid.length ? { ...grid[r][c], fresh: false } : { color: null }
    )
  );
}

/** Rétrécit la grille: la dernière ligne et la dernière colonne disparaissent */
export function shrinkGrid(grid: TutGrid): TutGrid {
  const size = grid.length - 1;
  return grid.slice(0, size).map(row => row.slice(0, size).map(cell => ({ ...cell })));
}

export function isOnShrinkEdge(size: number, r: number, c: number): boolean {
  return r === size - 1 || c === size - 1;
}
