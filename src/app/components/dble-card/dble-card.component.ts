import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlacedItem } from '../../interfaces/dobble.interface';
import { DbleCardEditorComponent } from '../dble-card-editor/dble-card-editor.component';

@Component({
  selector: 'app-dble-card',
  standalone: true,
  imports: [CommonModule, DbleCardEditorComponent],
  templateUrl: './dble-card.component.html',
  styleUrl: './dble-card.component.scss',
})
export class DbleCardComponent implements OnChanges {
  // A szülőtől kapott kész pozíciók
  @Input() placedItems: PlacedItem[] = [];
  @Input() highlightedItems: string[] = [];

  @Output() cardChanged = new EventEmitter<PlacedItem[]>();
  @Output() requestShuffle = new EventEmitter<void>();

  isPopupOpen = false;
  selectedItemIndex: number | null = null;

  openCardPopUp(): void {
    this.isPopupOpen = true;
    console.log('Popup megnyitva gombnyomásra!');
  }

  ngOnChanges(changes: SimpleChanges): void {
    // FONTOS: Csak akkor engedjük lefutni, ha a placedItems most érkezett meg LEGELSŐSZÖR (üresből jött)
    // Ha már van benne adat, és nem külső generálás történt, nem nyúlunk hozzá, hogy a kézi szerkesztés megmaradjon!
    if (changes['placedItems'] && this.placedItems && this.placedItems.length > 0) {
      const prev = changes['placedItems'].previousValue;
      if (!prev || prev.length === 0) {
        // Ez az első betöltés, ilyenkor megtartjuk a szülő által adott pozíciókat
        console.log('Első betöltés, megtartjuk a szülő pozícióit');
      }
    }
  }

  public closePopup(): void {
    this.isPopupOpen = false;
    this.selectedItemIndex = null;
  }

  onItemsChanged(updatedItems: PlacedItem[]): void {
    this.placedItems = updatedItems;
    this.cardChanged.emit(updatedItems);
  }

  /**
   * Amikor megnyomják a Keverés gombot, helyben újrakeverjük az elemek koordinátáit,
   * majd az új elrendezést visszaküldjük a szülőnek is!
   */
  public shuffle(): void {
    if (this.placedItems && this.placedItems.length > 0) {
      this.generateRandomPositions();
      // Az újrakevert pozíciókat azonnal elmentjük a szülőben is, hogy a nyomtatásba is átkerüljön!
      this.cardChanged.emit([...this.placedItems]);
    }
  }

  /**
   * JAVÍTOTT LOGIKA: Nem semmisíti meg az adatokat, hanem a meglévő elemeket
   * keveri újra teljesen véletlenszerű helyekre.
   */
  private generateRandomPositions(): void {
    const count = this.placedItems.length;
    if (count === 0) return;

    // 1. LÉPÉS: Először LEMÁSÓLJUK a meglévő elemeket egy biztonságos lokális tömbbe!
    const itemsToShuffle = [...this.placedItems];

    // 2. LÉPÉS: Most már biztonságosan kiüríthetjük a kártya aktuális megjelenítését
    this.placedItems = [];

    // 3. LÉPÉS: Fisher-Yates shuffle a lemásolt elemeken
    for (let i = itemsToShuffle.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [itemsToShuffle[i], itemsToShuffle[j]] = [itemsToShuffle[j], itemsToShuffle[i]];
    }

    // 4. LÉPÉS: Új pozíciók, szögek és méretek kiosztása a megkevert elemeknek
    itemsToShuffle.forEach((item, index) => {
      const goldenAngle = 137.5;
      const randomAngleOffset = (Math.random() * 20 - 10) * (Math.PI / 180);
      const angle = index * goldenAngle * (Math.PI / 180) + randomAngleOffset;

      const baseR = (Math.sqrt(index + 0.5) / Math.sqrt(count)) * 0.83 + 0.05;
      const randomROffset = Math.random() * 0.08 - 0.04;
      const r = Math.min(Math.max(baseR + randomROffset, 0.05), 0.88);

      const left = 50 + r * Math.cos(angle) * 50;
      const top = 50 + r * Math.sin(angle) * 50;

      const rotation = Math.floor(Math.random() * 360);
      const scale = parseFloat((Math.random() * (1.3 - 0.75) + 0.75).toFixed(2));

      // Visszatöltjük a frissített koordinátákkal
      this.placedItems.push({
        text: item.text, // Megtartja az eredeti emojit/szöveget!
        isImage: !!item.isImage,
        top: `${top.toFixed(2)}%`,
        left: `${left.toFixed(2)}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
      });
    });
  }
}
