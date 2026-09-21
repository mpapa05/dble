import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop'; // <-- 1. IMPORTÁLD BE
import { PlacedItem } from '../../interfaces/dobble.interface';

@Component({
  selector: 'app-dble-card-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule], // <-- 2. ADDD HOZZÁ AZ IMPORTS-HOZ
  templateUrl: './dble-card-editor.component.html',
  styleUrl: './dble-card-editor.component.scss'
})
export class DbleCardEditorComponent implements AfterViewInit, OnDestroy {
  @Input() placedItems: PlacedItem[] = [];
  @Output() close = new EventEmitter<void>();
  @Output('placedItemsChange') placedItemsChange = new EventEmitter<PlacedItem[]>();

  @ViewChild('editorDialog') dialogElement!: ElementRef<HTMLDialogElement>;
  @ViewChild('cardBoundary') cardBoundary!: ElementRef<HTMLDivElement>; // <-- Szükségünk lesz a kör határaira

  selectedItemIndex: number | null = null;
  currentScale = 1;
  currentRotation = 0;

  ngAfterViewInit(): void {
    this.dialogElement.nativeElement.showModal();
  }

  public closePopup(): void {
    this.dialogElement.nativeElement.close();
    this.close.emit();
  }

  public closeOnOverlayClick(event: MouseEvent): void {
    if (event.target === this.dialogElement.nativeElement) {
      this.closePopup();
    }
  }

  // Kijelölés kattintásra (mérethez és forgatáshoz)
  public selectItem(index: number): void {
    this.selectedItemIndex = index;
    const item = this.placedItems[index];

    const scaleMatch = item.transform.match(/scale\(([^)]+)\)/);
    const rotateMatch = item.transform.match(/rotate\(([^)]+)deg\)/);

    this.currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
    this.currentRotation = rotateMatch ? parseFloat(rotateMatch[1]) : 0;
  }

  // Amikor a csúszkákon CSAK a méretet vagy forgatást módosítod
  public updateItemTransform(): void {
    if (this.selectedItemIndex === null) return;
    const item = this.placedItems[this.selectedItemIndex];
    
    // Megtartjuk a meglévő top/left-et, és csak a forgatást/skálázást írjuk felül
    item.transform = `translate(-50%, -50%) rotate(${this.currentRotation}deg) scale(${this.currentScale})`;
    this.placedItemsChange.emit([...this.placedItems]);
  }

  // EZ KEZELI AZ EGÉRREL VALÓ HÚZÁST:
  // Kiszámolja az új pozíciót százalékosan a kártya aktuális fizikai méretéhez képest
  public onDragEnded(event: any, index: number): void {
    const item = this.placedItems[index];
    const boundaryRect = this.cardBoundary.nativeElement.getBoundingClientRect();
    
    // Lekérjük, hogy az egér hova mozdította el az elemet az eredeti helyéről
    const distance = event.source.getFreeDragPosition();
    
    // Kiolvassuk a jelenlegi százalékos pozíciót pixelben
    const currentLeftPx = (parseFloat(item.left) / 100) * boundaryRect.width;
    const currentTopPx = (parseFloat(item.top) / 100) * boundaryRect.height;

    // Kiszámoljuk az új pixel pozíciót
    const newLeftPx = currentLeftPx + distance.x;
    const newTopPx = currentTopPx + distance.y;

    // Visszaalakítjuk százalékká, hogy reszponzív maradjon a nyomtatásnál is!
    const newLeftPercent = (newLeftPx / boundaryRect.width) * 100;
    const newTopPercent = (newTopPx / boundaryRect.height) * 100;

    // Elmentjük a pontos koordinátákat
    item.left = `${newLeftPercent.toFixed(2)}%`;
    item.top = `${newTopPercent.toFixed(2)}%`;

    // Alaphelyzetbe állítjuk a CDK drag belső eltolás számlálóját
    event.source.reset();

    // Értesítjük a szülőt
    this.placedItemsChange.emit([...this.placedItems]);
  }

  ngOnDestroy(): void {
    if (this.dialogElement?.nativeElement?.open) {
      this.dialogElement.nativeElement.close();
    }
  }
}
