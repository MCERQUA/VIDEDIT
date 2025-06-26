
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface ChromaKeySettings {
  color: RGBColor;
  hexColor: string;
  tolerance: number;
}

export interface VideoTransform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PageKey = 'bk-ground-swap' | 'ai-video-gen' | 'combine-clips';
