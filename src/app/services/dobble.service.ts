import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DobbleService {
  constructor() {}

  /**
   * Ellenőrzi és kiszámolja a matematikai elméleti határokat.
   * Szimmetrikus esetre (r = k), ami a leggyakoribb a Dobble-nél.
   */
  public calculateTheoreticalLimits(k: number, lambda: number) {
    // Szimmetrikus dizájn esetén r = k, így:
    const r = k;
    const v = Math.floor((r * (k - 1)) / lambda) + 1;
    const b = Math.floor((v * r) / k);

    const isValidInteger = (r * (k - 1)) % lambda === 0 && (v * r) % k === 0;

    return {
      isValidTheoretical: isValidInteger && b >= v,
      totalImagesNeeded: v,
      maxCardsPossible: b,
    };
  }

  /**
   * Univerzális pakli generátor mohó (Greedy) stratégiával
   */
  public generateDeck(k: number, lambda: number): number[][] {
    const limits = this.calculateTheoreticalLimits(k, lambda);
    const v = limits.totalImagesNeeded;
    const b = limits.maxCardsPossible;

    const deck: number[][] = [];

    // Elérhető szimbólumok listája (0-tól v-1-ig indexelve)
    const allSymbols = Array.from({ length: v }, (_, i) => i);

    // Kártyák generálása
    for (let i = 0; i < b; i++) {
      const currentCard: number[] = [];

      // Megpróbálunk k darab szimbólumot pakolni a kártyára
      for (const symbol of allSymbols) {
        if (currentCard.length === k) break;

        // Ellenőrizzük, hogy a szimbólum hozzáadása megsérti-e a lambda szabályt a már meglévő kártyákkal
        let canAdd = true;
        for (const existingCard of deck) {
          // Megszámoljuk hány közös elem lenne, ha ezt a szimbólumot betennénk
          const potentialMatches = existingCard.filter(
            (s) => currentCard.includes(s) || s === symbol,
          ).length;

          // Ha túllépné a megengedett egyezést, akkor ezt a szimbólumot most nem tehetjük le
          if (potentialMatches > lambda) {
            canAdd = false;
            break;
          }
        }
        if (canAdd) {
          currentCard.push(symbol);
        }
      }

      // Ha sikerült egy teljes kártyát összeállítani k darab szimbólummal, hozzáadjuk a paklihoz
      if (currentCard.length === k) {
        deck.push(currentCard);
      } else {
        // Ha elakadt a mohó algoritmus, akkor ebben a konfigurációban nem talált több valid lapot
        break;
      }
    }

    return deck;
  }
}
