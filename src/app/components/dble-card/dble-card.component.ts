import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DobbleItem, PlacedItem } from '../../interfaces/dobble.interface';

@Component({
  selector: 'app-dble-card',
  standalone: true,
  imports: [CommonModule],
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

  ngOnChanges(changes: SimpleChanges): void {
    // Ha új kártyatartalom érkezik, újraosztjuk a pozíciókat
    if (changes['items'] && this.items) {
      this.generateRandomPositions();
    }
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

      // Adunk a szöghöz egy kis extra random csavart is (+/- 15 fok), hogy ne legyen túl szabályos a spirál
      const randomAngleOffset = (Math.random() * 30 - 15) * (Math.PI / 180);
      const angle = index * goldenAngle * (Math.PI / 180) + randomAngleOffset;

      // A sugár (középponttól való távolság) kiszámítása.
      // Egy kis véletlenszerűséggel megbolondítjuk, hogy ne fix körvonalakon üljenek az elemek.
      const baseR = (Math.sqrt(index + 0.5) / Math.sqrt(count)) * 0.55 + 0.1;
      const randomROffset = Math.random() * 0.1 - 0.05; // +/- 5% eltolás a sugárban

      // Biztonsági korlát, hogy semmiképp ne lógjon ki a 0.7-es maximális sugárból
      const r = Math.min(Math.max(baseR + randomROffset, 0.1), 0.68);

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
