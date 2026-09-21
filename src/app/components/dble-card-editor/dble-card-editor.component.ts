import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
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
export class DbleCardEditorComponent implements AfterViewInit, OnDestroy {
  @Input() placedItems: PlacedItem[] = [];
  @Output() close = new EventEmitter<void>();
  @Output('placedItemsChange') placedItemsChange = new EventEmitter<PlacedItem[]>();

  // Elérjük a HTML-ben lévő dialog elemet
  @ViewChild('editorDialog') dialogElement!: ElementRef<HTMLDialogElement>;

  selectedItemIndex: number | null = null;
  currentTop = 50;
  currentLeft = 50;
  currentScale = 1;
  currentRotation = 0;

  ngAfterViewInit(): void {
    // Amint létrejön a komponens, natívan MODÁLKÉNT nyitjuk meg. 
    // Ez kirakja a DOM legtetejére, átlátszó/sötétített háttérrel.
    this.dialogElement.nativeElement.showModal();
  }

  public closePopup(): void {
    this.dialogElement.nativeElement.close();
    this.close.emit();
  }

  // Ha a modál mellé (a sötétítésre) kattint, akkor is záródjon be
  public closeOnOverlayClick(event: MouseEvent): void {
    if (event.target === this.dialogElement.nativeElement) {
      this.closePopup();
    }
  }

  ngOnDestroy(): void {
    // Biztonsági takarítás, ha az *ngIf lekapcsolná
    if (this.dialogElement?.nativeElement?.open) {
      this.dialogElement.nativeElement.close();
    }
  }

  // ... a korábbi selectItem és updateItemTransform metódusaid változatlanok maradnak ...
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
    const item = this.placedItems[this.selectedItemIndex];
    item.top = `${this.currentTop}%`;
    item.left = `${this.currentLeft}%`;
    item.transform = `translate(-50%, -50%) rotate(${this.currentRotation}deg) scale(${this.currentScale})`;
    this.placedItemsChange.emit([...this.placedItems]);
  }
}
