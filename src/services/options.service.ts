import { Injectable, signal } from '@angular/core';

export type ColorPalette = 'couleurs' | 'daltonien';

export type ShapeMode = 'none' | 'enabled';

const STORAGE_KEY_COLOR_PALETTE = 'pavat_color_palette';
const STORAGE_KEY_SHAPE_MODE = 'pavat_shape_mode';

@Injectable({
  providedIn: 'root',
})
export class OptionsService {
  // Palette de couleurs
  public readonly colorPalette = signal<ColorPalette>(this.loadColorPalette());
  
  // Mode de formes distinctes
  public readonly shapeMode = signal<ShapeMode>(this.loadShapeMode());

  private loadColorPalette(): ColorPalette {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COLOR_PALETTE);
      if (saved && ['couleurs', 'daltonien'].includes(saved)) {
        return saved as ColorPalette;
      }
      // Migration : convertir 'highContrast' vers 'daltonien' si présent
      if (saved === 'highContrast') {
        localStorage.setItem(STORAGE_KEY_COLOR_PALETTE, 'daltonien');
        return 'daltonien';
      }
      // Migration : convertir 'colorblind' vers 'couleurs' si présent
      if (saved === 'colorblind') {
        localStorage.setItem(STORAGE_KEY_COLOR_PALETTE, 'couleurs');
        return 'couleurs';
      }
      // Migration : convertir 'normal' vers 'couleurs' si présent
      if (saved === 'normal') {
        localStorage.setItem(STORAGE_KEY_COLOR_PALETTE, 'couleurs');
        return 'couleurs';
      }
    } catch {
      // Ignorer les erreurs
    }
    return 'couleurs';
  }

  private loadShapeMode(): ShapeMode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHAPE_MODE);
      if (saved && ['none', 'enabled'].includes(saved)) {
        return saved as ShapeMode;
      }
    } catch {
      // Ignorer les erreurs
    }
    return 'none';
  }

  // Retourne la forme associée à une couleur (pour le mode shapeMode)
  getShapeForColor(color: string): 'square' | 'circle' | 'triangle' | 'cross' | 'star' | null {
    if (this.shapeMode() === 'none') return null;
    
    const shapeMap: { [key: string]: 'square' | 'circle' | 'triangle' | 'cross' | 'star' } = {
      yellow: 'square',
      red: 'circle',
      green: 'triangle',
      blue: 'cross',
      purple: 'star',
    };
    
    return shapeMap[color] || null;
  }

  // Retourne la forme associée à une couleur en mode daltonien
  getColorblindShape(color: string | null | undefined): 'square' | 'circle' | 'hexagon' | 'triangle' | 'star' | null {
    if (!color) return null;
    
    const shapeMap: { [key: string]: 'square' | 'circle' | 'hexagon' | 'triangle' | 'star' } = {
      yellow: 'square',   // Carré pour jaune
      red: 'circle',      // Rond pour rouge
      green: 'triangle',  // Triangle pour vert
      blue: 'hexagon',    // Hexagone pour bleu
      purple: 'star',     // Étoile pour violet
    };
    
    return shapeMap[color] || null;
  }

  setColorPalette(palette: ColorPalette): void {
    this.colorPalette.set(palette);
    try {
      localStorage.setItem(STORAGE_KEY_COLOR_PALETTE, palette);
    } catch {
      // Ignorer les erreurs
    }
  }

  setShapeMode(mode: ShapeMode): void {
    this.shapeMode.set(mode);
    try {
      localStorage.setItem(STORAGE_KEY_SHAPE_MODE, mode);
    } catch {
      // Ignorer les erreurs
    }
  }

  // Définir les palettes de couleurs
  getColorPaletteClasses(palette: ColorPalette): { [key: string]: { bg: string; shadow?: string } } {
    switch (palette) {
      case 'daltonien':
        // Mode daltonien : mêmes couleurs que le mode couleurs, mais avec symboles
        return {
          blue: { bg: 'bg-cyan-400', shadow: 'rgba(8, 145, 178, 0.5)' },
          red: { bg: 'bg-red-500', shadow: 'rgba(185, 28, 28, 0.5)' },
          green: { bg: 'bg-green-500', shadow: 'rgba(21, 128, 61, 0.5)' },
          yellow: { bg: 'bg-amber-400', shadow: 'rgba(217, 119, 6, 0.5)' },
          purple: { bg: 'bg-violet-500', shadow: 'rgba(109, 40, 217, 0.5)' },
        };
      case 'couleurs':
      default:
        return {
          blue: { bg: 'bg-cyan-400', shadow: 'rgba(8, 145, 178, 0.5)' },
          red: { bg: 'bg-red-500', shadow: 'rgba(185, 28, 28, 0.5)' },
          green: { bg: 'bg-green-500', shadow: 'rgba(21, 128, 61, 0.5)' },
          yellow: { bg: 'bg-amber-400', shadow: 'rgba(217, 119, 6, 0.5)' },
          purple: { bg: 'bg-violet-500', shadow: 'rgba(109, 40, 217, 0.5)' },
        };
    }
  }
}
