import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { PlacedItem } from './interfaces/dobble.interface';
import { DbleCardComponent } from './components/dble-card/dble-card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ReactiveFormsModule, DbleCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  dobbleForm!: FormGroup;
  generatedDeck: PlacedItem[][] = [];
  rawDeck: number[][] = [];

  theoreticalImages = 0;
  theoreticalCards = 0;
  isValidCombination = true;
  isLoading = false;

  selectedCard1: number | null = null;
  selectedCard2: number | null = null;
  matchingEmojis: string[] = [];

  private worker!: Worker;

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

    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(
        new URL('./dobble-solver.worker', import.meta.url),
      );

      this.worker.onmessage = ({ data }) => {
        if (!data || data.length === 0) {
          console.warn('A Web Worker üres adatot küldött vissza!');
          return;
        }

        console.log('1. SIKER: Nyers számok megérkeztek a háttérszálról:', data);
        this.rawDeck = data;

        const visualResult = this.mapToVisualDeck(this.rawDeck);
        console.log('2. SIKER: Vizuális koordináták legyártva:', visualResult);

        // Kényszerített spread operátoros másolás, hogy az Angular Change Detection azonnal tüzeljen
        this.generatedDeck = [...visualResult];
        this.isLoading = false;
        
        console.log('3. SIKER: generatedDeck frissítve a szülőben, hossza:', this.generatedDeck.length);
      };
    }

    this.calculateLimits();
    this.dobbleForm.valueChanges.subscribe(() => {
      this.calculateLimits();
      this.generatedDeck = [];
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
    this.theoreticalCards = this.theoreticalImages;
    this.isValidCombination = true;
  }

  startGeneration(): void {
    if (!this.isValidCombination || this.dobbleForm.invalid) return;

    this.isLoading = true;
    const k = Number(this.dobbleForm.value.imagesPerCard);
    const lambda = Number(this.dobbleForm.value.matchingImages);

    this.worker.postMessage({
      k,
      lambda,
      totalImages: this.theoreticalImages,
      maxCards: this.theoreticalCards,
    });
  }

  private mapToVisualDeck(numericDeck: number[][]): PlacedItem[][] {
    if (!numericDeck || numericDeck.length === 0) return [];

    return numericDeck.map((card) => {
      const count = card.length;
      const placed: PlacedItem[] = [];
      if (count === 0) return [];

      const shuffledCard = [...card];
      for (let i = shuffledCard.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledCard[i], shuffledCard[j]] = [shuffledCard[j], shuffledCard[i]];
      }

      shuffledCard.forEach((num, index) => {
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

        placed.push({
          text: this.emojiList[num] || `[${num}]`,
          isImage: false,
          top: `${top.toFixed(2)}%`,
          left: `${left.toFixed(2)}%`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
        });
      });

      return placed;
    });
  }

  public updateCardInDeck(cardIndex: number, updatedItems: PlacedItem[]): void {
    this.generatedDeck[cardIndex] = updatedItems;
    // Referencia frissítés a szülő szintjén is a biztonság kedvéért
    this.generatedDeck = [...this.generatedDeck];
    console.log(`Kártya elmentve a központi tömbben! Index: ${cardIndex}`);
  }

  public shuffleSingleCard(cardIndex: number): void {
    const originalCardNumbers = this.rawDeck[cardIndex];
    if (originalCardNumbers) {
      // FIX: Csak az első kártyatömböt [0] emeljük ki, mivel a mapToVisualDeck listát ad vissza
      const singleCardDeck = this.mapToVisualDeck([originalCardNumbers]);
      this.generatedDeck[cardIndex] = singleCardDeck[0];
      this.generatedDeck = [...this.generatedDeck]; // Triggeli a Change Detection-t
    }
  }

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

    if (!card1Symbols || !card2Symbols) return;

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
