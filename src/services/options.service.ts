import { Injectable, signal } from '@angular/core';

export type ColorPalette = 'normal' | 'highContrast';

export type ShapeMode = 'none' | 'enabled';

const STORAGE_KEY_COLOR_PALETTE = 'tileburst_color_palette';
const STORAGE_KEY_SHAPE_MODE = 'tileburst_shape_mode';

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
      if (saved && ['normal', 'highContrast'].includes(saved)) {
        return saved as ColorPalette;
      }
      // Migration : convertir 'colorblind' vers 'normal' si présent
      if (saved === 'colorblind') {
        localStorage.setItem(STORAGE_KEY_COLOR_PALETTE, 'normal');
        return 'normal';
      }
    } catch {
      // Ignorer les erreurs
    }
    return 'normal';
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

  // Retourne la forme associée à une couleur
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
      case 'highContrast':
        return {
          blue: { bg: 'bg-blue-600', shadow: 'rgba(37, 99, 235, 0.5)' },
          red: { bg: 'bg-red-600', shadow: 'rgba(220, 38, 38, 0.5)' },
          green: { bg: 'bg-green-600', shadow: 'rgba(22, 163, 74, 0.5)' },
          yellow: { bg: 'bg-yellow-500', shadow: 'rgba(234, 179, 8, 0.5)' },
          purple: { bg: 'bg-purple-600', shadow: 'rgba(147, 51, 234, 0.5)' },
        };
      case 'normal':
      default:
        return {
          blue: { bg: 'bg-cyan-400', shadow: 'rgba(8, 145, 178, 0.5)' },
          red: { bg: 'bg-red-400', shadow: 'rgba(220, 38, 38, 0.5)' },
          green: { bg: 'bg-green-400', shadow: 'rgba(22, 163, 74, 0.5)' },
          yellow: { bg: 'bg-amber-400', shadow: 'rgba(217, 119, 6, 0.5)' },
          purple: { bg: 'bg-violet-400', shadow: 'rgba(139, 92, 246, 0.5)' },
        };
    }
  }
}
