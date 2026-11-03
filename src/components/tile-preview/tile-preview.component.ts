
import { Component, input, ChangeDetectionStrategy, computed, inject, effect, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal, HostListener } from '@angular/core';
import { Tile } from '../../models/game.model';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { OptionsService } from '../../services/options.service';
import { ColorblindIconService } from '../../services/colorblind-icon.service';

@Component({
  selector: 'app-tile-preview',
  templateUrl: './tile-preview.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.display]': "(maxCell() || cellRatio()) ? 'block' : null",
    '[style.width]': "(maxCell() || cellRatio()) ? '100%' : null",
    '[style.height]': "(maxCell() || cellRatio()) ? '100%' : null",
  },
})
export class TilePreviewComponent implements AfterViewInit, OnDestroy {
  tile = input.required<Tile>();
  fill = input<boolean>(false);
  /** Si défini: la pièce remplit son conteneur, avec des cases de maxCell px au plus. */
  maxCell = input<number | null>(null);
  /** Taille max d'une case = hauteur du conteneur × ratio (s'adapte à l'échelle de l'écran). */
  cellRatio = input<number | null>(null);
  /** Taille exacte d'une case et de l'espace entre cases (fantôme de drag = taille de la grille). */
  cellPx = input<number | null>(null);
  gapPx = input<number | null>(null);
  /** Hauteur de case et écart vertical, pour reproduire des cases non carrées (fantôme de drag). */
  cellHPx = input<number | null>(null);
  rowGapPx = input<number | null>(null);
  private hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private hostSize = signal<{ w: number; h: number }>({ w: 0, h: 0 });
  private optionsService = inject(OptionsService);
  private colorblindIconService = inject(ColorblindIconService);
  private sanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLElement>;
  private resizeObserver: ResizeObserver | null = null;
  private containerSizePx = signal<number>(0);
  
  private readonly DEFAULT_COLOR = { bg: 'bg-gray-400', shadow: 'rgba(107, 114, 128, 0.5)' };
  
  colorPalette = this.optionsService.colorPalette;
  shapeMode = this.optionsService.shapeMode;
  
  getShapeForColor(color: string): 'square' | 'circle' | 'triangle' | 'cross' | 'star' | null {
    return this.optionsService.getShapeForColor(color);
  }
  
  getShapeColorClass(color: string): string {
    const palette = this.optionsService.getColorPaletteClasses(this.colorPalette());
    const colorDef = palette[color] || this.DEFAULT_COLOR;
    // Retourner une version plus sombre de la couleur selon la palette
    const darkerMap: { [key: string]: string } = {
      // Couleurs
      'bg-cyan-400': 'bg-cyan-600',
      'bg-red-500': 'bg-red-700',
      'bg-green-500': 'bg-green-700',
      'bg-amber-400': 'bg-amber-600',
      'bg-violet-500': 'bg-violet-700',
    };
    return darkerMap[colorDef.bg] || 'bg-slate-600';
  }

  getColorblindIconSvg(color: string | null | undefined, filled: boolean = false): SafeHtml | null {
    const shape = this.optionsService.getColorblindShape(color);
    if (!shape) return null;
    
    // Pour les previews, toujours utiliser la version non remplie
    const svgString = this.colorblindIconService.getShapeSvg(shape, false, 16);
    return this.sanitizer.bypassSecurityTrustHtml(svgString);
  }

  constructor() {
    // Forcer la mise à jour quand les options changent
    effect(() => {
      this.colorPalette();
      this.shapeMode();
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    // Mesurer la taille disponible pour adapter l'aperçu à son conteneur
    // (important pour les layouts mobile avec carrés plus grands)
    try {
      this.resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        const rect = entry?.contentRect;
        if (!rect) return;
        const size = Math.max(0, Math.floor(Math.min(rect.width, rect.height)));
        this.containerSizePx.set(size);
        this.hostSize.set({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
        this.cdr.markForCheck();
      });
      this.resizeObserver.observe(this.hostRef.nativeElement);
    } catch {
      // ResizeObserver non supporté: on gardera les valeurs par défaut
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  backgroundColorClass = computed(() => {
    const color = this.tile().color;
    const palette = this.optionsService.getColorPaletteClasses(this.colorPalette());
    return (palette[color] || this.DEFAULT_COLOR).bg;
  });

  shadowStyle = computed(() => {
    const color = this.tile().color;
    const palette = this.optionsService.getColorPaletteClasses(this.colorPalette());
    const shadowColor = (palette[color] || this.DEFAULT_COLOR).shadow || 'rgba(107, 114, 128, 0.5)';
    return {
      'box-shadow': `inset 0 2px 0 0 rgba(255,255,255,0.4), inset 0 -4px 0 0 ${shadowColor}, 0 2px 3px rgba(0,0,0,0.25)`
    };
  });

  /** Espace entre cases = même proportion que sur la grille de jeu (≈ 9 % d'une case). */
  private readonly GAP_RATIO = 0.09;

  cellGap = computed(() => {
    const fixedGap = this.gapPx();
    if (fixedGap !== null) return fixedGap;
    if (!this.cellRatio() && !this.maxCell()) return 2;
    return Math.max(1, Math.round(this.cellSize() * this.GAP_RATIO));
  });

  gridStyles = computed(() => {
    const tile = this.tile();
    const rowGap = this.rowGapPx() ?? this.cellGap();
    return {
      'grid-template-columns': `repeat(${tile.width}, minmax(0, 1fr))`,
      'column-gap': `${this.cellGap()}px`,
      'row-gap': `${rowGap}px`,
    };
  });

  /** Hauteur d'une case: égale à la largeur sauf si cellHPx est fourni (cases non carrées). */
  cellHeight = computed(() => this.cellHPx() ?? this.cellSize());

  cellSize = computed(() => {
    const fixed = this.cellPx();
    if (fixed) return fixed;
    const ratio = this.cellRatio();
    const max = ratio ? Math.floor(this.hostSize().h * ratio) : this.maxCell();
    if (max) {
      const { w, h } = this.hostSize();
      if (!w || !h) return max;
      const tile = this.tile();
      const g = this.GAP_RATIO;
      // n cases + (n-1) espaces de g×case doivent tenir dans la largeur et la hauteur
      const byW = Math.floor(w / (tile.width + g * (tile.width - 1)));
      const byH = Math.floor(h / (tile.height + g * (tile.height - 1)));
      return Math.max(6, Math.min(max, byW, byH));
    }
    // Taille de cellule fixe pour toutes les tuiles (indépendante de la taille de la tuile)
    // Cela garantit que toutes les cases ont la même taille, que ce soit un 1x1 ou un 4x4
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    // Taille fixe: 12px sur mobile, 20px sur desktop
    return isMobile ? 12 : 20;
  });
}
