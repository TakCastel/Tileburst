import { Injectable } from '@angular/core';

export type ColorblindShape = 'square' | 'circle' | 'hexagon' | 'triangle' | 'star';

@Injectable({
  providedIn: 'root',
})
export class ColorblindIconService {
  
  /**
   * Retourne la forme associée à une couleur en mode daltonien
   */
  getShapeForColor(color: string | null | undefined): ColorblindShape | null {
    if (!color) return null;
    
    const shapeMap: { [key: string]: ColorblindShape } = {
      yellow: 'square',   // Carré pour jaune
      red: 'circle',      // Rond pour rouge
      green: 'triangle',  // Triangle pour vert
      blue: 'hexagon',    // Hexagone pour bleu
      purple: 'star',     // Étoile pour violet
    };
    
    return shapeMap[color] || null;
  }

  /**
   * Génère le SVG pour une forme donnée (remplie ou non)
   */
  getShapeSvg(shape: ColorblindShape, filled: boolean = false, size: number = 24): string {
    // Pour les versions non remplies, utiliser un trait plus épais pour une meilleure visibilité
    const strokeWidth = filled ? 0 : Math.max(2, size / 12);
    const fillColor = filled ? 'currentColor' : 'none';
    const strokeColor = 'currentColor';
    
    switch (shape) {
      case 'square':
        return this.getSquareSvg(fillColor, strokeColor, strokeWidth, size);
      case 'circle':
        return this.getCircleSvg(fillColor, strokeColor, strokeWidth, size);
      case 'hexagon':
        return this.getHexagonSvg(fillColor, strokeColor, strokeWidth, size);
      case 'triangle':
        return this.getTriangleSvg(fillColor, strokeColor, strokeWidth, size);
      case 'star':
        return this.getStarSvg(fillColor, strokeColor, strokeWidth, size);
      default:
        return '';
    }
  }

  private getSquareSvg(fill: string, stroke: string, strokeWidth: number, size: number): string {
    const padding = strokeWidth / 2;
    const innerSize = size - strokeWidth;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <rect x="${padding}" y="${padding}" width="${innerSize}" height="${innerSize}" 
            fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" 
            stroke-linecap="round" stroke-linejoin="round" rx="1"/>
    </svg>`;
  }

  private getCircleSvg(fill: string, stroke: string, strokeWidth: number, size: number): string {
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${center}" cy="${center}" r="${radius}" 
              fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>
    </svg>`;
  }

  private getHexagonSvg(fill: string, stroke: string, strokeWidth: number, size: number): string {
    const center = size / 2;
    const radius = (size - strokeWidth) / 2;
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6; // Rotation pour avoir un sommet en haut
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <polygon points="${points.join(' ')}" 
               fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" 
               stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  private getTriangleSvg(fill: string, stroke: string, strokeWidth: number, size: number): string {
    const padding = strokeWidth / 2;
    const innerSize = size - strokeWidth;
    const halfWidth = innerSize / 2;
    const height = innerSize * 0.866; // Hauteur d'un triangle équilatéral
    // Centrer verticalement
    const verticalPadding = (size - height) / 2;
    const topY = verticalPadding;
    const bottomY = verticalPadding + height;
    const leftX = padding;
    const rightX = padding + innerSize;
    const centerX = padding + halfWidth;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <polygon points="${centerX},${topY} ${leftX},${bottomY} ${rightX},${bottomY}" 
               fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" 
               stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  private getStarSvg(fill: string, stroke: string, strokeWidth: number, size: number): string {
    const center = size / 2;
    const outerRadius = (size - strokeWidth) / 2;
    const innerRadius = outerRadius * 0.4;
    const points: string[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2; // Rotation pour avoir un sommet en haut
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <polygon points="${points.join(' ')}" 
               fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" 
               stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }
}
