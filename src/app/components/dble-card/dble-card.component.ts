import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DobbleItem, PlacedItem } from '../../interfaces/dobble.interface';
import { DbleCardEditorComponent } from '../../dble-card-editor/DbleCardEditorComponent'

@Component({
  selector: 'app-dble-card',
  standalone: true,
  imports: [CommonModule, DbleCardEditorComponent],
  templateUrl: './dble-card.component.html',
  styleUrl: './dble-card.component.scss',
})
export class DbleCardComponent implements OnChanges {
  // Megkapja az adott kártya szimbólumait a szülőtől
  @Input() items: DobbleItem[] = [];
  // Megkapja a globálisan kijelölt/felvillantott emojikat az ellenőrzőből
  @Input() highlightedItems: string[] = [];

  // Ez a tömb tárolja a már véletlenszerűen elhelyezett elemeket
  placedItems: PlacedItem[] = [];

  isPopupOpen = false;
  selectedItemIndex: number | null = null;

  openCardPopUp(event: MouseEvent): void {
    event.preventDefault(); // Böngésző menü tiltása
    event.stopPropagation(); // Buborékolás megállítása
    this.isPopupOpen = true;
    console.log('Popup megnyitva a :host-on keresztül!', event);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Ha új kártyatartalom érkezik, újraosztjuk a pozíciókat
    if (changes['items'] && this.items) {
      this.generateRandomPositions();
    }
  }

  public closePopup(): void {
    this.isPopupOpen = false;
    this.selectedItemIndex = null;
  }

  /**
   * Külsőleg vagy belsőleg is meghívható metódus, ami helyben
   * újrakeveri a pozíciókat és méreteket ugyanazokkal az elemekkel.
   */
  public shuffle(): void {
    if (this.items && this.items.length > 0) {
      this.generateRandomPositions();
    }
  }

  /**
   * Kiszámolja a szimbólumok random helyét egy kör alakú pályán belül.
   * Minden meghíváskor teljesen új pozíciókat, méreteket és forgatásokat oszt ki.
   */
  private generateRandomPositions(): void {
    const count = this.items.length;
    this.placedItems = [];

    if (count === 0) return;

    // 1. LÉPÉS: Leklónozzuk és véletlenszerűen megkeverjük a bejövő elemek sorrendjét (Fisher-Yates shuffle).
    // Ez garantálja, hogy az emojik kártyánként teljesen más indexet kapjanak, így drasztikusan új helyre kerülnek!
    const shuffledItems = [...this.items];
    for (let i = shuffledItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledItems[i], shuffledItems[j]] = [
        shuffledItems[j],
        shuffledItems[i],
      ];
    }

    // 2. LÉPÉS: Pozíciók kiosztása a megkevert elemeknek
    shuffledItems.forEach((item, index) => {
      // Az arany metszés szöge (Golden Angle) biztosítja a szép eloszlást
      const goldenAngle = 137.5;

      // Kisebb random eltolás a szögnél, hogy ne bomoljon fel teljesen a kitöltési minta (+/- 10 fok)
      const randomAngleOffset = (Math.random() * 20 - 10) * (Math.PI / 180);
      const angle = index * goldenAngle * (Math.PI / 180) + randomAngleOffset;

      // UGYANAZ AZ ELOSZLÁS, DE JOBB TÉRKITÖLTÉSSEL:
      // A belső elemek közelebb mehetnek a középponthoz (0.05), a külsők pedig sokkal kijjebb (0.88-ig).
      const baseR = (Math.sqrt(index + 0.5) / Math.sqrt(count)) * 0.83 + 0.05;
      const randomROffset = Math.random() * 0.08 - 0.04; // Kicsit szűkebb +/- 4% random eltolás

      // Biztonsági korlát: 0.88-ig engedjük ki az elemeket. 
      // (Ha 1.0 lenne, az elem közepe pontosan a kör szélére esne, így a fele lelógna. A 0.88 ideális kompromisszum.)
      const r = Math.min(Math.max(baseR + randomROffset, 0.05), 0.88);

      // Átváltás Descartes-koordinátákra (X, Y) százalékos formában a kártya közepéhez képest (50%, 50%)
      const left = 50 + r * Math.cos(angle) * 50;
      const top = 50 + r * Math.sin(angle) * 50;

      // Véletlenszerű forgatás és egyedi méretezés generálása
      const rotation = Math.floor(Math.random() * 360);
      const scale = parseFloat(
        (Math.random() * (1.3 - 0.75) + 0.75).toFixed(2),
      );

      this.placedItems.push({
        text: item.text,
        isImage: !!item.isImage,
        top: `${top}%`,
        left: `${left}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
      });
    });
  }
}
