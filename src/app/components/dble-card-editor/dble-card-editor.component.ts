import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlacedItem } from '../../interfaces/dobble.interface';

@Component({
  selector: 'app-dble-card-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dble-card-editor.component.html',
  styleUrl: './dble-card-editor.component.scss'
})
export class DbleCardEditorComponent {
  // Megkapja a kártya elemeit a szülőtől
  @Input() placedItems: PlacedItem[] = [];
  
  // Események a szülő felé: bezárás és adatok frissülése
  @Output() close = new EventEmitter<void>();
  @Output('placedItemsChange') placedItemsChange = new EventEmitter<PlacedItem[]>();

  selectedItemIndex: number | null = null;
  
  currentTop = 50;
  currentLeft = 50;
  currentScale = 1;
  currentRotation = 0;

  public closePopup(): void {
    this.close.emit();
  }

  public selectItem(index: number): void {
    this.selectedItemIndex = index;
    const item = this.placedItems[index];

    this.currentTop = parseFloat(item.top);
    this.currentLeft = parseFloat(item.left);

    const scaleMatch = item.transform.match(/scale\(([^)]+)\)/);
    const rotateMatch = item.transform.match(/rotate\(([^)]+)deg\)/);

    this.currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
    this.currentRotation = rotateMatch ? parseFloat(rotateMatch[1]) : 0;
  }

  public updateItemTransform(): void {
    if (this.selectedItemIndex === null) return;

    // Módosítjuk a helyi referenciát
    const item = this.placedItems[this.selectedItemIndex];
    item.top = `${this.currentTop}%`;
    item.left = `${this.currentLeft}%`;
    item.transform = `translate(-50%, -50%) rotate(${this.currentRotation}deg) scale(${this.currentScale})`;

    // Értesítjük a szülőt, hogy megváltozott a tömb tartalma
    this.placedItemsChange.emit([...this.placedItems]);
  }
}