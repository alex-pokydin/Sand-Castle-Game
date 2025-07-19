export interface Vector2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PhysicsBody {
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  bounds: BoundingBox;
  mass: number;
  isStatic: boolean;
}

export interface CollisionInfo {
  hasCollision: boolean;
  penetration: number;
  normal: Vector2D;
  contact: Vector2D;
}

export interface DropInfo {
  startX: number;
  startY: number;
  dropTime: number;
  targetX: number;
  targetY: number;
} 