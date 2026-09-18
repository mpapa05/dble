import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { VisualItem } from './interfaces/dobble.interface';
import { DbleCardComponent } from './components/dble-card/dble-card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ReactiveFormsModule, DbleCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  dobbleForm!: FormGroup;
  generatedDeck: VisualItem[][] = [];
  rawDeck: number[][] = [];

  theoreticalImages = 0;
  theoreticalCards = 0;
  isValidCombination = true;
  isLoading = false; // Betöltési állapot állapota

  // Interaktív ellenőrző változói
  selectedCard1: number | null = null;
  selectedCard2: number | null = null;
  matchingEmojis: string[] = [];

  private worker!: Worker;

  // Elérhető emoji készlet a kártyákhoz
  private emojiList: string[] = [
  '🦊', '🚀', '🍕', '💎', '🦁', '🍀', '🎸', '🌋', '🍉', '👻',
  '🎨', '👑', '🛸', '🦖', '🍿', '🌍', '⚡', '🍄', '🍦', '🎡',
  '🎲', '🦉', '🥥', '🛹', '🥨', '🦩', '🎈', '🥑', '👾', '🌈',
  '🍍', '🧜‍♀️', '🍩', '🌵', '🧩', '⚓', '🧸', '🐝', '🔮', '🌮',
  '🥞', '🍣', '🦘', '🦔', '🐾', '🪁', '🥊', '🏵️', '🧘', '🛶',
  '🏎️', '🏰', '🏕️', '🗺️', '⏰', '🔋', '🔑', '🧿', '🚗', '🍎',
  '🐼', '🐸', '🐙', '🦄', '🐬', '🦜', '🦖', '🐝', '🐢', '🌻', 
  '🌶️', '🍋', '🍒', '🥕', '🍔', '🍟', '🧁', '🍿', '🥤', '🍺',
  '🎈', '🎁', '🏆', '💎', '🎨', '🧩', '🎮', '🔮', '🧸', '🪀',
  '🎵', '🎺', '🛹', '🚲', '🛴', '🚀', '🛸', '⛵', '🗺️', '⏰',
  '👑', '🎭', '🎪', '🎃', '🎄', '🎆', '✨', '🔥', '💧', '☀️',
  '🌙', '⭐', '🌈', '⚡', '🍀', '❤️', '🕶️', '👒', '🎒', '🧲'
];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.dobbleForm = this.fb.group({
      imagesPerCard: [4, [Validators.required, Validators.min(2)]],
      matchingImages: [2, [Validators.required, Validators.min(1)]],
    });

    // Inicializáljuk a Web Workert
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(
        new URL('./dobble-solver.worker', import.meta.url),
      );

      // Amikor a worker végzett a nehéz munkával:
      this.worker.onmessage = ({ data }) => {
        this.rawDeck = data;
        this.generatedDeck = this.mapToVisualDeck(this.rawDeck);
        this.isLoading = false; // Leállítjuk a loading-ot
      };
    }

    this.calculateLimits();
    // Figyeljük a változásokat, de NEM generálunk azonnal, csak a matekot ellenőrizzük
    this.dobbleForm.valueChanges.subscribe(() => {
      this.calculateLimits();
      this.generatedDeck = []; // Elrejtjük a régi paklit változtatáskor
      this.resetSelection();
    });
  }

  calculateLimits(): void {
    if (this.dobbleForm.invalid) return;
    const k = Number(this.dobbleForm.value.imagesPerCard);
    const lambda = Number(this.dobbleForm.value.matchingImages);

    if (lambda >= k || (k * (k - 1)) % lambda !== 0) {
      this.isValidCombination = false;
      return;
    }

    this.theoreticalImages = (k * (k - 1)) / lambda + 1;
    this.theoreticalCards = this.theoreticalImages; // Szimmetrikus eset
    this.isValidCombination = true;
  }

  // Ez a függvény fut le a GENERÁLÁS gomb megnyomásakor!
  startGeneration(): void {
    if (!this.isValidCombination || this.dobbleForm.invalid) return;

    this.isLoading = true; // Elindítjuk a pörgést
    const k = Number(this.dobbleForm.value.imagesPerCard);
    const lambda = Number(this.dobbleForm.value.matchingImages);

    // Átadjuk a munkát a háttérszálnak
    this.worker.postMessage({
      k,
      lambda,
      totalImages: this.theoreticalImages,
      maxCards: this.theoreticalCards,
    });
  }

  processAndGenerate(): void {
    if (this.dobbleForm.invalid) return;

    const k = Number(this.dobbleForm.value.imagesPerCard);
    const lambda = Number(this.dobbleForm.value.matchingImages);

    if (lambda >= k) {
      this.isValidCombination = false;
      this.generatedDeck = [];
      return;
    }

    const r = k;
    const vNumerator = r * (k - 1);

    if (vNumerator % lambda !== 0) {
      this.isValidCombination = false;
      this.generatedDeck = [];
      return;
    }

    this.theoreticalImages = vNumerator / lambda + 1;
    this.theoreticalCards = Math.floor((this.theoreticalImages * r) / k);
    this.isValidCombination = this.theoreticalCards >= this.theoreticalImages;

    if (!this.isValidCombination) {
      this.generatedDeck = [];
      return;
    }

    this.rawDeck = this.generateNumericDeck(
      k,
      lambda,
      this.theoreticalImages,
      this.theoreticalCards,
    );
    this.generatedDeck = this.mapToVisualDeck(this.rawDeck);
  }

  private generateNumericDeck(
    k: number,
    lambda: number,
    totalImages: number,
    maxCards: number,
  ): number[][] {
    // Incidencia mátrix: totalImages (sorok) x maxCards (oszlopok)
    // matrix[s][c] === 1 azt jelenti, hogy az 's' szimbólum szerepel a 'c' kártyán.
    const matrix: number[][] = Array.from({ length: totalImages }, () =>
      new Array(maxCards).fill(0),
    );

    // Nyomon követjük, hogy az egyes kártyákon épp hány szimbólum van (max k lehet)
    const cardSizes = new Array(maxCards).fill(0);
    // Nyomon követjük, hogy az egyes szimbólumok hány kártyára lettek lerakva eddig
    const r = k; // Szimmetrikus eset
    const symbolCounts = new Array(totalImages).fill(0);

    const startTime = performance.now();
    const maxExecutionTimeMs = 2000; // 2 másodperces biztonsági korlát

    // Segédfüggvény: kiszámolja két kártya (oszlop) jelenlegi közös szimbólumainak számát
    const getDotProduct = (c1: number, c2: number): number => {
      let dots = 0;
      for (let s = 0; s < totalImages; s++) {
        if (matrix[s][c1] === 1 && matrix[s][c2] === 1) {
          dots++;
        }
      }
      return dots;
    };

    // Ellenőrzi, hogy a szimbólum (s) elhelyezése a kártyán (c) szabályos-e
    const isValidPlacement = (s: number, c: number): boolean => {
      // 1. Nem léphetjük túl a kártya maximális kapacitását
      if (cardSizes[c] >= k) return false;
      // 2. Egy szimbólum nem szerepelhet több kártyán, mint az elméleti 'r' érték
      if (symbolCounts[s] >= r) return false;

      // 3. Lambda szabály ellenőrzése a többi kártyával szemben
      for (let otherCard = 0; otherCard < maxCards; otherCard++) {
        if (otherCard === c) continue;

        // Ha a másik kártyán is fent van ez a szimbólum
        if (matrix[s][otherCard] === 1) {
          // Ha már most elérték vagy túllépték a megengedett egyezést, akkor ide nem tehetjük
          if (getDotProduct(c, otherCard) >= lambda) {
            return false;
          }
        }
      }
      return true;
    };

    // Mátrix-alapú backtracking kereső
    const solveMatrix = (s: number, c: number): boolean => {
      // Ha az összes szimbólumot sikeresen szétosztottuk az összes kártyára
      if (s === totalImages) {
        // Dupla ellenőrzés: minden kártyának pontosan k méretűnek kell lennie
        return cardSizes.every((size) => size === k);
      }

      if (performance.now() - startTime > maxExecutionTimeMs) {
        return true; // Időtúllépés esetén visszaadjuk az addig elkészült legjobb állapotot
      }

      // Kiszámoljuk a következő pozíciót a mátrixban
      const nextC = (c + 1) % maxCards;
      const nextS = nextC === 0 ? s + 1 : s;

      // 1. OPCIÓ: Megpróbáljuk betenni az 's' szimbólumot a 'c' kártyára
      if (isValidPlacement(s, c)) {
        matrix[s][c] = 1;
        cardSizes[c]++;
        symbolCounts[s]++;

        if (solveMatrix(nextS, nextC)) return true;

        // Visszalépés (Backtrack)
        matrix[s][c] = 0;
        cardSizes[c]--;
        symbolCounts[s]--;
      }

      // 2. OPCIÓ: Kihagyjuk az 's' szimbólumot a 'c' kártyáról (0-n hagyjuk)
      // Csak akkor hagyhatjuk ki, ha a hátralévő kártyák száma elegendő ahhoz, hogy a szimbólum elérje az 'r' darabszámot
      const remainingCards = maxCards - 1 - c;
      if (symbolCounts[s] + remainingCards >= r) {
        if (solveMatrix(nextS, nextC)) return true;
      }

      return false;
    };

    // Algoritmus indítása a 0. szimbólumtól és 0. kártyától
    solveMatrix(0, 0);

    // Az incidencia mátrixból visszaalakítjuk a kártyák listájává (számtömbökké)
    const deck: number[][] = Array.from({ length: maxCards }, () => []);
    for (let c = 0; c < maxCards; c++) {
      for (let s = 0; s < totalImages; s++) {
        if (matrix[s][c] === 1) {
          deck[c].push(s);
        }
      }
    }

    // Csak azokat a kártyákat adjuk vissza, amik teljesen megteltek (validak)
    return deck.filter((card) => card.length === k);
  }

  private mapToVisualDeck(numericDeck: number[][]): VisualItem[][] {
    return numericDeck.map((card) =>
      card.map((num) => ({
        text: this.emojiList[num] || `[${num}]`,
        rotation: Math.floor(Math.random() * 360),
        scale: parseFloat((Math.random() * (1.3 - 0.8) + 0.8).toFixed(2)),
      })),
    );
  }

  // Interaktív kártyakiválasztás kezelése
  selectCard(index: number): void {
    if (this.selectedCard1 === index) {
      this.selectedCard1 = null;
      this.matchingEmojis = [];
      return;
    }
    if (this.selectedCard2 === index) {
      this.selectedCard2 = null;
      this.matchingEmojis = [];
      return;
    }

    if (this.selectedCard1 === null) {
      this.selectedCard1 = index;
    } else if (this.selectedCard2 === null) {
      this.selectedCard2 = index;
      this.checkMatches();
    } else {
      this.selectedCard1 = index;
      this.selectedCard2 = null;
      this.matchingEmojis = [];
    }
  }

  private checkMatches(): void {
    if (this.selectedCard1 === null || this.selectedCard2 === null) return;

    const card1Symbols = this.rawDeck[this.selectedCard1];
    const card2Symbols = this.rawDeck[this.selectedCard2];

    const commonNumbers = card1Symbols.filter((num) =>
      card2Symbols.includes(num),
    );
    this.matchingEmojis = commonNumbers.map((num) =>
      this.emojiList[num] ? this.emojiList[num] : `[${num}]`,
    );
  }

  resetSelection(): void {
    this.selectedCard1 = null;
    this.selectedCard2 = null;
    this.matchingEmojis = [];
  }

  triggerPrint(): void {
    window.print();
  }

  ngOnDestroy(): void {
    if (this.worker) this.worker.terminate();
  }
}
