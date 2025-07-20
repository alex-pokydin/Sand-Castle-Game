import { COLORS, getPartColor } from '@/config/gameConfig';
import { PartLevel } from '@/types/Game';

/**
 * Base interface for castle part renderers
 * Each part level has its own renderer for modular, maintainable code
 * 
 * All renderers provide:
 * - Solid color fills using getPartColor() for the level
 * - White outline borders for clear definition and contrast
 * - Detailed sand textures and organic design elements on top
 * - Natural randomness and size variations for authentic hand-built appearance
 * - Consistent seeded randomness for stable part appearance across renders
 */
export interface IPartRenderer {
  render(graphics: Phaser.GameObjects.Graphics, width: number, height: number, offsetX: number, offsetY: number): void;
}

/**
 * Base class with common sand castle rendering utilities
 */
export abstract class BasePartRenderer implements IPartRenderer {
  protected partLevel: PartLevel;

  constructor(partLevel: PartLevel) {
    this.partLevel = partLevel;
  }

  abstract render(graphics: Phaser.GameObjects.Graphics, width: number, height: number, offsetX: number, offsetY: number): void;

  /**
   * Generate consistent random values based on part level and position for natural variations
   */
  protected getSeededRandom(seed: number): number {
    // Simple seeded random for consistent variations per part
    const x = Math.sin(seed + this.partLevel * 1000) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Add natural size variations to dimensions
   */
  protected getVariedDimension(baseDimension: number, variance: number = 0.1, seed: number = 0): number {
    const randomFactor = (this.getSeededRandom(seed) - 0.5) * 2; // -1 to 1
    return baseDimension + (baseDimension * variance * randomFactor);
  }

  /**
   * Create organic shape outline with natural irregularities
   */
  protected drawOrganicRect(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, irregularity: number = 2): void {
    const points = [];
    const segments = 12; // More segments for smoother organic shape
    
    for (let i = 0; i <= segments; i++) {
      const progress = i / segments;
      let px, py;
      
      if (progress <= 0.25) {
        // Top edge
        const edgeProgress = progress * 4;
        px = x + edgeProgress * width;
        py = y;
      } else if (progress <= 0.5) {
        // Right edge
        const edgeProgress = (progress - 0.25) * 4;
        px = x + width;
        py = y + edgeProgress * height;
      } else if (progress <= 0.75) {
        // Bottom edge
        const edgeProgress = (progress - 0.5) * 4;
        px = x + width - edgeProgress * width;
        py = y + height;
      } else {
        // Left edge
        const edgeProgress = (progress - 0.75) * 4;
        px = x;
        py = y + height - edgeProgress * height;
      }
      
      // Add natural irregularity
      const randomOffset = (this.getSeededRandom(i * 100 + this.partLevel) - 0.5) * irregularity;
      px += randomOffset;
      py += randomOffset;
      
      points.push({ x: px, y: py });
    }
    
    // Draw organic shape
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
  }

  /**
   * Draw sand grain texture for realistic sand appearance
   */
  protected drawSandGrains(graphics: Phaser.GameObjects.Graphics, width: number, height: number, offsetX: number, offsetY: number, density: number = 0.3): void {
    graphics.lineStyle(0.5, COLORS.SAND_DARK, 0.2);
    
    const baseGrainCount = Math.floor(width * height * density / 100);
    const grainCount = Math.max(1, baseGrainCount + Math.floor((this.getSeededRandom(800) - 0.5) * baseGrainCount * 0.3));
    
    for (let i = 0; i < grainCount; i++) {
      const x = offsetX + this.getSeededRandom(i * 100 + 600) * width;
      const y = offsetY + this.getSeededRandom(i * 100 + 700) * height;
      const size = 0.5 + this.getSeededRandom(i * 80 + 750) * 2;
      
      // Small irregular grain dots with size variation
      graphics.fillStyle(COLORS.SAND_DARK, 0.1 + this.getSeededRandom(i * 90 + 850) * 0.1);
      graphics.fillCircle(x, y, size);
    }
  }

  /**
   * Draw organic, sand-sculpted edges instead of perfect straight lines
   */
  protected drawSandyEdge(graphics: Phaser.GameObjects.Graphics, startX: number, startY: number, endX: number, endY: number): void {
    graphics.lineStyle(1, COLORS.SAND_DARK, 0.4);
    
    const segments = Math.floor(Math.abs(endX - startX) / 8) + 1;
    graphics.beginPath();
    graphics.moveTo(startX, startY);
    
    for (let i = 1; i <= segments; i++) {
      const progress = i / segments;
      const x = startX + (endX - startX) * progress;
      const y = startY + (endY - startY) * progress;
      
      // Add slight randomness for organic sand appearance
      const wobble = (Math.random() - 0.5) * 2;
      graphics.lineTo(x + wobble, y + wobble);
    }
    
    graphics.strokePath();
  }

  /**
   * Create sand-drip effect for wet sand appearance
   */
  protected drawSandDrips(graphics: Phaser.GameObjects.Graphics, width: number, height: number, offsetX: number, offsetY: number): void {
    graphics.fillStyle(COLORS.SAND_DARK, 0.2);
    
    const baseDripCount = Math.floor(width / 15);
    const dripCount = Math.max(1, baseDripCount + Math.floor((this.getSeededRandom(500) - 0.5) * 3));
    
    for (let i = 0; i < dripCount; i++) {
      const baseX = offsetX + (i + 0.5) * (width / dripCount);
      const randomXOffset = (this.getSeededRandom(i * 200 + 300) - 0.5) * 12;
      const x = baseX + randomXOffset;
      
      const baseY = offsetY + height - 2;
      const dripHeight = 3 + this.getSeededRandom(i * 150 + 250) * 10;
      const dripWidth = 0.5 + this.getSeededRandom(i * 180 + 400) * 1.5;
      
      // Natural teardrop-shaped drip with size variation
      graphics.beginPath();
      graphics.moveTo(x, baseY);
      graphics.lineTo(x - dripWidth, baseY + dripHeight * 0.7);
      graphics.lineTo(x, baseY + dripHeight);
      graphics.lineTo(x + dripWidth, baseY + dripHeight * 0.7);
      graphics.closePath();
      graphics.fillPath();
    }
  }
}

/**
 * Level 1 - Sand Foundation Blocks
 * Packed wet sand with visible compression marks
 */
export class FoundationRenderer extends BasePartRenderer {
  constructor() {
    super(1);
  }

  render(graphics: Phaser.GameObjects.Graphics, width: number, height: number, offsetX: number, offsetY: number): void {
    // Create trapezoid shape with natural variations
    const baseTopWidth = width * 0.85;
    const baseBottomWidth = width;
    
    // Add subtle size variations for natural look
    const topWidth = this.getVariedDimension(baseTopWidth, 0.08, 1);
    const bottomWidth = this.getVariedDimension(baseBottomWidth, 0.05, 2);
    const variedHeight = this.getVariedDimension(height, 0.06, 3);
    
    const topOffset = (width - topWidth) / 2;
    
    // Draw organic trapezoid shape with solid fill first
    graphics.fillStyle(getPartColor(this.partLevel), 1.0);
    
    // Create organic trapezoid with natural irregularities
    const points = [];
    const segments = 16;
    
    // Generate organic trapezoid points
    for (let i = 0; i <= segments; i++) {
      const progress = i / segments;
      let px, py;
      
      if (progress <= 0.25) {
        // Top edge
        const edgeProgress = progress * 4;
        px = offsetX + topOffset + edgeProgress * topWidth;
        py = offsetY;
      } else if (progress <= 0.5) {
        // Right edge
        const edgeProgress = (progress - 0.25) * 4;
        const currentWidth = topWidth + (bottomWidth - topWidth) * edgeProgress;
        px = offsetX + topOffset + currentWidth;
        py = offsetY + edgeProgress * variedHeight;
      } else if (progress <= 0.75) {
        // Bottom edge
        const edgeProgress = (progress - 0.5) * 4;
        px = offsetX + bottomWidth - edgeProgress * bottomWidth;
        py = offsetY + variedHeight;
      } else {
        // Left edge
        const edgeProgress = (progress - 0.75) * 4;
        const currentWidth = bottomWidth - (bottomWidth - topWidth) * edgeProgress;
        px = offsetX + (width - currentWidth) / 2;
        py = offsetY + variedHeight - edgeProgress * variedHeight;
      }
      
      // Add natural irregularity
      const irregularity = 1.5;
      const randomOffset = (this.getSeededRandom(i * 50 + 100) - 0.5) * irregularity;
      px += randomOffset;
      py += randomOffset * 0.5; // Less vertical variation
      
      points.push({ x: px, y: py });
    }
    
    // Draw organic fill
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.fillPath();
    
    // Draw organic outline with white border for contrast
    graphics.lineStyle(2, COLORS.WHITE, 0.8);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.strokePath();
    
    // Create compressed sand block pattern within trapezoid
    const blockHeight = 10;
    const blockWidth = bottomWidth / 3;
    
    // Draw sand compression lines (horizontal ridges from packing)
    graphics.lineStyle(1, COLORS.SAND_DARK, 0.6);
    
    for (let y = blockHeight; y < height; y += blockHeight) {
      const levelProgress = y / height;
      const levelWidth = bottomWidth - (bottomWidth - topWidth) * levelProgress;
      const levelOffset = (bottomWidth - levelWidth) / 2;
      
      // Slightly wavy compression lines following trapezoid shape
      this.drawSandyEdge(graphics, offsetX + levelOffset + 2, offsetY + y, offsetX + levelOffset + levelWidth - 2, offsetY + y);
    }
    
    // Add vertical separation cracks between sand blocks
    graphics.lineStyle(0.5, COLORS.SAND_DARK, 0.4);
    for (let x = blockWidth; x < bottomWidth; x += blockWidth) {
      this.drawSandyEdge(graphics, offsetX + x, offsetY + height * 0.1, offsetX + x * (topWidth / bottomWidth) + topOffset, offsetY + height - 5);
    }
    
    // Sand grain texture
    this.drawSandGrains(graphics, width, height, offsetX, offsetY, 0.4);
    
    // Wet sand drips at bottom
    this.drawSandDrips(graphics, width, height, offsetX, offsetY);
  }
}

/**
 * Level 2 - Sculpted Sand Walls
 * Hand-carved sand blocks with tool marks
 */
export class WallRenderer extends BasePartRenderer {
  constructor() {
    super(2);
  }

  render(graphics: Phaser.GameObjects.Graphics, width: number, height: number, offsetX: number, offsetY: number): void {
    // Create trapezoid shape (slightly tapered for wall stability)
    const topWidth = width * 0.9;
    const bottomWidth = width;
    const topOffset = (width - topWidth) / 2;
    
    // Draw trapezoid shape with solid fill first
    graphics.fillStyle(getPartColor(this.partLevel), 1.0);
    graphics.beginPath();
    graphics.moveTo(offsetX + topOffset, offsetY);
    graphics.lineTo(offsetX + topOffset + topWidth, offsetY);
    graphics.lineTo(offsetX + bottomWidth, offsetY + height);
    graphics.lineTo(offsetX, offsetY + height);
    graphics.closePath();
    graphics.fillPath();
    
    // Then draw trapezoid outline with white border for contrast
    graphics.lineStyle(2, COLORS.WHITE, 0.8);
    graphics.beginPath();
    graphics.moveTo(offsetX + topOffset, offsetY);
    graphics.lineTo(offsetX + topOffset + topWidth, offsetY);
    graphics.lineTo(offsetX + bottomWidth, offsetY + height);
    graphics.lineTo(offsetX, offsetY + height);
    graphics.closePath();
    graphics.strokePath();
    
    // Create hand-sculpted sand brick pattern within trapezoid
    const brickHeight = 8;
    const brickWidth = bottomWidth / 4;
    
    // Draw sculpted brick separations
    graphics.lineStyle(1, COLORS.SAND_DARK, 0.5);
    
    for (let y = 0; y < height; y += brickHeight) {
      const offset = (y / brickHeight) % 2 === 0 ? 0 : brickWidth / 2;
      const levelProgress = y / height;
      const levelWidth = bottomWidth - (bottomWidth - topWidth) * levelProgress;
      const levelOffset = (bottomWidth - levelWidth) / 2;
      
      // Horizontal sand-carved lines following trapezoid shape
      this.drawSandyEdge(graphics, offsetX + levelOffset, offsetY + y, offsetX + levelOffset + levelWidth, offsetY + y);
      
      // Vertical brick separations following tapering shape
      for (let x = offset; x < levelWidth; x += brickWidth) {
        if (x > 0 && x < levelWidth) {
          const bottomX = offsetX + x;
          const topX = offsetX + x * (topWidth / bottomWidth) + topOffset;
          const currentX = bottomX + (topX - bottomX) * (levelProgress);
          
          this.drawSandyEdge(graphics, currentX, offsetY + y, currentX, offsetY + Math.min(y + brickHeight, height));
        }
      }
    }
    
    // Add tool marks (bucket/shovel patterns)
    graphics.lineStyle(0.5, COLORS.SAND_LIGHT, 0.3);
    for (let y = brickHeight / 2; y < height; y += brickHeight) {
      const levelProgress = y / height;
      const levelWidth = bottomWidth - (bottomWidth - topWidth) * levelProgress;
      const levelOffset = (bottomWidth - levelWidth) / 2;
      
      for (let x = 5; x < levelWidth; x += 12) {
        // Small curved tool marks
        graphics.beginPath();
        graphics.arc(offsetX + levelOffset + x, offsetY + y, 2, 0, Math.PI, false);
        graphics.strokePath();
      }
    }
    
    // Sand grain texture
    this.drawSandGrains(graphics, width, height, offsetX, offsetY, 0.3);
  }
}

/**
 * Level 3 - Detailed Sand Structures with Windows
 * Carefully carved window openings in packed sand
 */
export class DetailedWallRenderer extends BasePartRenderer {
  constructor() {
    super(3);
  }

  render(graphics: Phaser.GameObjects.Graphics, width: number, height: number, offsetX: number, offsetY: number): void {
    // Create trapezoid shape (subtle taper for detailed wall)
    const topWidth = width * 0.92;
    const bottomWidth = width;
    const topOffset = (width - topWidth) / 2;
    
    // Draw trapezoid shape with solid fill first
    graphics.fillStyle(getPartColor(this.partLevel), 1.0);
    graphics.beginPath();
    graphics.moveTo(offsetX + topOffset, offsetY);
    graphics.lineTo(offsetX + topOffset + topWidth, offsetY);
    graphics.lineTo(offsetX + bottomWidth, offsetY + height);
    graphics.lineTo(offsetX, offsetY + height);
    graphics.closePath();
    graphics.fillPath();
    
    // Then draw trapezoid outline with white border for contrast
    graphics.lineStyle(2, COLORS.WHITE, 0.8);
    graphics.beginPath();
    graphics.moveTo(offsetX + topOffset, offsetY);
    graphics.lineTo(offsetX + topOffset + topWidth, offsetY);
    graphics.lineTo(offsetX + bottomWidth, offsetY + height);
    graphics.lineTo(offsetX, offsetY + height);
    graphics.closePath();
    graphics.strokePath();
    
    // Create sand-carved window opening
    const windowWidth = width * 0.35;
    const windowHeight = height * 0.4;
    const windowX = (width - windowWidth) / 2;
    const windowY = (height - windowHeight) / 2;
    
    // Window cavity (darker sand showing depth)
    graphics.fillStyle(COLORS.SAND_DARK, 0.6);
    graphics.fillRect(offsetX + windowX, offsetY + windowY, windowWidth, windowHeight);
    
    // Rough-carved window frame
    graphics.lineStyle(2, COLORS.SAND_DARK, 0.8);
    this.drawSandyEdge(graphics, offsetX + windowX, offsetY + windowY, offsetX + windowX + windowWidth, offsetY + windowY);
    this.drawSandyEdge(graphics, offsetX + windowX + windowWidth, offsetY + windowY, offsetX + windowX + windowWidth, offsetY + windowY + windowHeight);
    this.drawSandyEdge(graphics, offsetX + windowX + windowWidth, offsetY + windowY + windowHeight, offsetX + windowX, offsetY + windowY + windowHeight);
    this.drawSandyEdge(graphics, offsetX + windowX, offsetY + windowY + windowHeight, offsetX + windowX, offsetY + windowY);
    
    // Simple cross pattern inside window (carved sticks or driftwood)
    graphics.lineStyle(1, COLORS.SAND_DARK, 0.7);
    // Vertical piece
    this.drawSandyEdge(graphics, offsetX + windowX + windowWidth / 2, offsetY + windowY + 2, offsetX + windowX + windowWidth / 2, offsetY + windowY + windowHeight - 2);
    // Horizontal piece
    this.drawSandyEdge(graphics, offsetX + windowX + 2, offsetY + windowY + windowHeight / 2, offsetX + windowX + windowWidth - 2, offsetY + windowY + windowHeight / 2);
    
    // Sand shelf below window (natural sand accumulation)
    graphics.fillStyle(COLORS.SAND_LIGHT, 0.4);
    graphics.fillRect(offsetX + windowX - 2, offsetY + windowY + windowHeight, windowWidth + 4, 2);
    
    // Sand grain texture
    this.drawSandGrains(graphics, width, height, offsetX, offsetY, 0.25);
    
    // Drip marks from window
    this.drawSandDrips(graphics, windowWidth, height - windowY - windowHeight, offsetX + windowX, offsetY + windowY + windowHeight);
  }
}

/**
 * Level 4 - Sand Castle Towers
 * Sculpted battlements with sand finger-towers
 */
export class TowerRenderer extends BasePartRenderer {
  constructor() {
    super(4);
  }

  render(graphics: Phaser.GameObjects.Graphics, width: number, height: number, offsetX: number, offsetY: number): void {
    // Add subtle size variations for natural tower body
    const variedWidth = this.getVariedDimension(width, 0.04, 10);
    const variedHeight = this.getVariedDimension(height, 0.03, 11);
    const widthOffset = (width - variedWidth) / 2;
    
    // Draw main tower body with organic outline
    graphics.fillStyle(getPartColor(this.partLevel), 1.0);
    this.drawOrganicRect(graphics, offsetX + widthOffset, offsetY, variedWidth, variedHeight, 1.2);
    graphics.fillPath();
    
    // Add white outline for contrast with organic shape
    graphics.lineStyle(2, COLORS.WHITE, 0.8);
    this.drawOrganicRect(graphics, offsetX + widthOffset, offsetY, variedWidth, variedHeight, 1.2);
    graphics.strokePath();
    
    // Create sand finger-tower battlements with natural variations
    const baseFingerWidth = width / 5;
    const baseFingerHeight = height * 0.2;
    
    // Draw sand finger towers with natural variations
    graphics.fillStyle(getPartColor(this.partLevel));
    graphics.lineStyle(1, COLORS.SAND_DARK, 0.6);
    
    for (let i = 0; i < 5; i += 2) {
      const x = i * baseFingerWidth;
      
      // Add natural variations to each finger tower
      const fingerWidth = this.getVariedDimension(baseFingerWidth, 0.15, i * 20 + 50);
      const fingerHeight = this.getVariedDimension(baseFingerHeight, 0.20, i * 25 + 60);
      const fingerOffset = (baseFingerWidth - fingerWidth) / 2;
      
      // Organic finger tower with natural irregularities
      this.drawOrganicRect(graphics, offsetX + x + fingerOffset, offsetY - fingerHeight, fingerWidth, fingerHeight, 1.8);
      graphics.fillPath();
      
      // Organic outline for finger
      graphics.lineStyle(1, COLORS.SAND_DARK, 0.6);
      this.drawOrganicRect(graphics, offsetX + x + fingerOffset, offsetY - fingerHeight, fingerWidth, fingerHeight, 1.8);
      graphics.strokePath();
      
      // Rough sand edges on finger towers
      this.drawSandyEdge(graphics, offsetX + x, offsetY - fingerHeight, offsetX + x + fingerWidth, offsetY - fingerHeight);
      this.drawSandyEdge(graphics, offsetX + x, offsetY - fingerHeight, offsetX + x, offsetY);
      this.drawSandyEdge(graphics, offsetX + x + fingerWidth, offsetY - fingerHeight, offsetX + x + fingerWidth, offsetY);
    }
    
    // Small carved openings (finger holes)
    graphics.fillStyle(COLORS.SAND_DARK, 0.5);
    for (let i = 0; i < 2; i++) {
      const holeX = (width / 3) + (i * width / 3) - 1;
      const holeY = height * 0.25;
      const holeHeight = height * 0.25;
      
      // Narrow carved opening
      graphics.fillRect(offsetX + holeX, offsetY + holeY, 2, holeHeight);
      
      // Rough edges
      this.drawSandyEdge(graphics, offsetX + holeX, offsetY + holeY, offsetX + holeX, offsetY + holeY + holeHeight);
      this.drawSandyEdge(graphics, offsetX + holeX + 2, offsetY + holeY, offsetX + holeX + 2, offsetY + holeY + holeHeight);
    }
    
    // Sand compression rings (building rings)
    graphics.lineStyle(0.5, COLORS.SAND_DARK, 0.4);
    for (let y = height * 0.2; y < height; y += height * 0.15) {
      this.drawSandyEdge(graphics, offsetX + 2, offsetY + y, offsetX + width - 2, offsetY + y);
    }
    
    // Sand grain texture
    this.drawSandGrains(graphics, width, height, offsetX, offsetY, 0.2);
  }
}

/**
 * Level 5 - Sand Castle Roof
 * Trapezoidal roof structure with flat top for flag placement and sand tile patterns
 */
export class RoofRenderer extends BasePartRenderer {
  constructor() {
    super(5);
  }

  render(graphics: Phaser.GameObjects.Graphics, width: number, height: number, offsetX: number, offsetY: number): void {
    // Create trapezoidal roof shape (flat top for flag placement)
    const centerX = width / 2;
    const topY = height * 0.1; // Flat top near top
    const baseY = height; // Base at bottom
    const roofWidth = width * 0.9; // Bottom width with overhang effect
    const roofOffset = (width - roofWidth) / 2;
    const topWidth = width * 0.3; // Flat top width for flag platform
    const topOffset = (width - topWidth) / 2;
    
    // Draw main roof trapezoid with solid fill
    graphics.fillStyle(getPartColor(this.partLevel), 1.0);
    graphics.beginPath();
    graphics.moveTo(offsetX + topOffset, offsetY + topY); // Left top
    graphics.lineTo(offsetX + topOffset + topWidth, offsetY + topY); // Right top
    graphics.lineTo(offsetX + roofOffset + roofWidth, offsetY + baseY); // Right base
    graphics.lineTo(offsetX + roofOffset, offsetY + baseY); // Left base
    graphics.closePath();
    graphics.fillPath();
    
    // Add white outline for contrast
    graphics.lineStyle(2, COLORS.WHITE, 0.8);
    graphics.beginPath();
    graphics.moveTo(offsetX + topOffset, offsetY + topY);
    graphics.lineTo(offsetX + topOffset + topWidth, offsetY + topY);
    graphics.lineTo(offsetX + roofOffset + roofWidth, offsetY + baseY);
    graphics.lineTo(offsetX + roofOffset, offsetY + baseY);
    graphics.closePath();
    graphics.strokePath();
    
    // Create roof tile/shingle pattern for trapezoid
    graphics.lineStyle(1, COLORS.SAND_DARK, 0.6);
    const tileRows = 6;
    for (let row = 1; row <= tileRows; row++) {
      const rowProgress = row / tileRows;
      const rowY = offsetY + topY + (baseY - topY) * rowProgress;
      // Calculate trapezoid width at this row - interpolate between top and bottom widths
      const rowWidth = topWidth + (roofWidth - topWidth) * rowProgress;
      const rowStartX = offsetX + centerX - rowWidth / 2;
      
      // Draw horizontal tile line with organic curve
      this.drawSandyEdge(graphics, rowStartX, rowY, rowStartX + rowWidth, rowY);
      
      // Add vertical tile separations
      const tilesInRow = Math.floor(rowWidth / 15) + 1;
      const tileWidth = rowWidth / tilesInRow;
      for (let tile = 1; tile < tilesInRow; tile++) {
        const tileX = rowStartX + tile * tileWidth;
        // Alternate tile positions for realistic overlap
        const offset = row % 2 === 0 ? tileWidth / 2 : 0;
        const adjustedX = tileX + offset;
        if (adjustedX > rowStartX && adjustedX < rowStartX + rowWidth) {
          this.drawSandyEdge(graphics, adjustedX, rowY - 3, adjustedX, rowY + 3);
        }
      }
    }
    
    // Add roof ridge line across flat top
    graphics.lineStyle(1.5, COLORS.SAND_DARK, 0.8);
    this.drawSandyEdge(
      graphics, 
      offsetX + topOffset + 2, 
      offsetY + topY, 
      offsetX + topOffset + topWidth - 2, 
      offsetY + topY
    );
    
    // Add roof eaves (overhang details)
    graphics.lineStyle(1, COLORS.SAND_LIGHT, 0.5);
    // Left eave
    this.drawSandyEdge(graphics, offsetX + roofOffset - 2, offsetY + baseY, offsetX + roofOffset, offsetY + baseY - 3);
    // Right eave  
    this.drawSandyEdge(graphics, offsetX + roofOffset + roofWidth, offsetY + baseY - 3, offsetX + roofOffset + roofWidth + 2, offsetY + baseY);
    
    // Add small decorative elements on roof
    graphics.fillStyle(COLORS.SAND_LIGHT, 0.4);
    for (let i = 0; i < 2; i++) {
      const decorX = offsetX + centerX + (i - 0.5) * width * 0.3;
      const decorY = offsetY + height * 0.6;
      
      // Small roof ornament (like a small chimney or vent)
      graphics.fillRect(decorX - 2, decorY - 3, 4, 6);
      graphics.strokeRect(decorX - 2, decorY - 3, 4, 6);
    }
    
    // Sand grain texture (lighter on roof)
    this.drawSandGrains(graphics, width, height, offsetX, offsetY, 0.1);
  }
}

/**
 * Level 6 - Sand Castle Pinnacles
 * Beach decorations with shells, flags, and driftwood
 */
export class PinnacleRenderer extends BasePartRenderer {
  constructor() {
    super(6);
  }

  render(graphics: Phaser.GameObjects.Graphics, width: number, height: number, offsetX: number, offsetY: number): void {
    const centerX = width / 2;
    const pinnacleColor = getPartColor(this.partLevel);
    
    // Main flag pole (thin driftwood stick extending through full height)
    const poleWidth = width * 0.08;
    const poleX = centerX - poleWidth / 2;
    
    // Draw natural driftwood pole
    graphics.fillStyle(COLORS.SAND_DARK, 0.9);
    graphics.lineStyle(1, COLORS.WHITE, 0.6);
    graphics.fillRect(offsetX + poleX, offsetY, poleWidth, height);
    graphics.strokeRect(offsetX + poleX, offsetY, poleWidth, height);
    
    // Wood grain texture on pole
    graphics.lineStyle(0.5, COLORS.SAND_LIGHT, 0.4);
    for (let i = 0; i < 4; i++) {
      const grainY = height * 0.1 + i * height * 0.2;
      this.drawSandyEdge(graphics, offsetX + poleX, offsetY + grainY, offsetX + poleX + poleWidth, offsetY + grainY);
    }
    
    // Large flowing victory flag (main feature)
    const flagStartX = poleX + poleWidth;
    const flagY = height * 0.1;
    const flagWidth = width * 0.7;
    const flagHeight = height * 0.6;
    
    // Victory flag with royal colors
    graphics.fillStyle(pinnacleColor, 0.9);
    graphics.lineStyle(2, COLORS.WHITE, 0.9);
    
    // Create flowing, triumphant flag shape
    graphics.beginPath();
    graphics.moveTo(offsetX + flagStartX, offsetY + flagY);
    graphics.lineTo(offsetX + flagStartX + flagWidth * 0.85, offsetY + flagY + flagHeight * 0.15);
    graphics.lineTo(offsetX + flagStartX + flagWidth, offsetY + flagY + flagHeight * 0.4);
    graphics.lineTo(offsetX + flagStartX + flagWidth * 0.8, offsetY + flagY + flagHeight * 0.65);
    graphics.lineTo(offsetX + flagStartX + flagWidth * 0.9, offsetY + flagY + flagHeight * 0.85);
    graphics.lineTo(offsetX + flagStartX + flagWidth * 0.6, offsetY + flagY + flagHeight);
    graphics.lineTo(offsetX + flagStartX, offsetY + flagY + flagHeight * 0.8);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    
    // Flag decorative pattern (victory symbol)
    graphics.lineStyle(1.5, COLORS.WHITE, 0.8);
    const emblemX = flagStartX + flagWidth * 0.3;
    const emblemY = flagY + flagHeight * 0.4;
    
    // Simple crown or star symbol on flag
    graphics.beginPath();
    // Crown base
    graphics.moveTo(offsetX + emblemX - 8, offsetY + emblemY + 4);
    graphics.lineTo(offsetX + emblemX + 8, offsetY + emblemY + 4);
    // Crown points
    graphics.moveTo(offsetX + emblemX - 6, offsetY + emblemY + 4);
    graphics.lineTo(offsetX + emblemX - 6, offsetY + emblemY - 2);
    graphics.moveTo(offsetX + emblemX, offsetY + emblemY + 4);
    graphics.lineTo(offsetX + emblemX, offsetY + emblemY - 6);
    graphics.moveTo(offsetX + emblemX + 6, offsetY + emblemY + 4);
    graphics.lineTo(offsetX + emblemX + 6, offsetY + emblemY - 2);
    graphics.strokePath();
    
    // Flag waves/wind lines to show movement
    graphics.lineStyle(0.5, COLORS.WHITE, 0.6);
    for (let i = 0; i < 3; i++) {
      const waveY = flagY + flagHeight * 0.25 + i * flagHeight * 0.2;
      const waveStartX = flagStartX + flagWidth * 0.1;
      const waveEndX = flagStartX + flagWidth * 0.7;
      
      this.drawSandyEdge(graphics, offsetX + waveStartX, offsetY + waveY, offsetX + waveEndX, offsetY + waveY);
    }
    
    // Small decorative top ornament on pole (shell or treasure)
    const ornamentRadius = width * 0.1;
    const ornamentY = height * 0.02;
    
    graphics.fillStyle(pinnacleColor, 1.0);
    graphics.lineStyle(1, COLORS.WHITE, 0.9);
    graphics.fillCircle(offsetX + centerX, offsetY + ornamentY, ornamentRadius);
    graphics.strokeCircle(offsetX + centerX, offsetY + ornamentY, ornamentRadius);
    
    // Ornament details
    graphics.strokeCircle(offsetX + centerX, offsetY + ornamentY, ornamentRadius * 0.6);
  }
}

/**
 * Factory function to create appropriate renderer for each part level
 */
export function createPartRenderer(partLevel: PartLevel): IPartRenderer {
  switch (partLevel) {
    case 1: return new FoundationRenderer();
    case 2: return new WallRenderer();
    case 3: return new DetailedWallRenderer();
    case 4: return new TowerRenderer();
    case 5: return new RoofRenderer();
    case 6: return new PinnacleRenderer();
    default: return new FoundationRenderer();
  }
} 