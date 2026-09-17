export interface DobbleConfig {
  imagesPerCard: number; // k
  matchingImages: number; // lambda
  totalImages: number; // v (opcionális, de kiszámolható, ha r-t rögzítjük)
}

export interface VisualItem {
  text: string;
  rotation: number;
  scale: number;
}

export interface DobbleItem {
  text: string;
  isImage?: boolean;
}

export interface PlacedItem {
  text: string;
  isImage: boolean;
  top: string;
  left: string;
  transform: string;
}
