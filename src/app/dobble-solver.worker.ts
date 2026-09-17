/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const { k, lambda, totalImages, maxCards } = data;
  let finalDeck: number[][] = [];

  // --- 1. UTRI: HA LAMBDA = 1 (Klasszikus Dobble tiszta Galois-geometriával) ---
  if (lambda === 1) {
    const n = k - 1;

    if (isPrimeOrPrimePower(n)) {
      const cards: number[][] = [];

      // 1. Kártyablokk: A horizontális végtelen vonal (1 darab kártya)
      const horizonCard: number[] = [];
      for (let i = 0; i <= n; i++) {
        horizonCard.push(i);
      }
      cards.push(horizonCard);

      // 2. Kártyablokk: Függőleges egyenesek (n darab kártya)
      for (let i = 0; i < n; i++) {
        const verticalCard: number[] = [0]; // Mind a 0-s iránypontból indul
        for (let j = 0; j < n; j++) {
          verticalCard.push(n + 1 + i * n + j);
        }
        cards.push(verticalCard);
      }

      // 3. Kártyablokk: Ferde egyenesek Galois-test szorzással (n * n darab kártya)
      for (let slope = 0; slope < n; slope++) {
        for (let intercept = 0; intercept < n; intercept++) {
          const slantedCard: number[] = [slope + 1]; // Iránypontok 1-től n-ig

          for (let x = 0; x < n; x++) {
            // FONTOS: Sima szorzás és modulo helyett Galois-test (GF) aritmetikát használunk!
            const y = gfMultiply(slope, x, n) ^ intercept;
            const symbol = n + 1 + x * n + y;
            slantedCard.push(symbol);
          }
          cards.push(slantedCard);
        }
      }

      finalDeck = cards;
    }
  }

  // --- 2. UTRI: HA LAMBDA > 1 vagy nem-prímhatvány az alap ---
  if (finalDeck.length === 0) {
    finalDeck = generateCombinatorialDeck(k, lambda, totalImages, maxCards);
  }

  postMessage(finalDeck.filter((card) => card.length === k));
});

/**
 * GALOIS-TEST (GF) SZORZÁS: Ez kiküszöböli a prímhatványok (pl. n=8) modulo torzítását.
 * Bit szintű orosz paraszt-szorzás primitív polinom redukcióval.
 */
function gfMultiply(a: number, b: number, n: number): number {
  if (a === 0 || b === 0) return 0;

  // Ha n prím (2, 3, 5, 7), a sima modulo tökéletes és gyorsabb
  if (n === 2 || n === 3 || n === 5 || n === 7) {
    return (a * b) % n;
  }

  // Ha n = 8 (GF(2^3)), a generáló primitív polinom: x^3 + x + 1 (binárisan: 1011 -> 11)
  if (n === 8) {
    let p = 0;
    while (b > 0) {
      if (b & 1) p ^= a;
      a <<= 1;
      if (a & 8) a ^= 11; // Redukció a polinommal (x^3 levágása, x+1 hozzáadása)
      b >>= 1;
    }
    return p;
  }

  // Alapértelmezett biztonsági visszaesés
  return (a * b) % n;
}

function isPrimeOrPrimePower(n: number): boolean {
  if (n < 2) return false;
  let d = 2;
  while (d * d <= n) {
    if (n % d === 0) {
      let temp = n;
      while (temp % d === 0) temp /= d;
      return temp === 1;
    }
    d++;
  }
  return true;
}

function generateCombinatorialDeck(
  k: number,
  lambda: number,
  totalImages: number,
  maxCards: number,
): number[][] {
  const deck: number[][] = [];
  const symbolUsage = new Array(totalImages).fill(0);
  const r = k;

  for (let c = 0; c < maxCards; c++) {
    const currentCard: number[] = [];
    for (let s = 0; s < totalImages; s++) {
      if (currentCard.length === k) break;
      if (symbolUsage[s] >= r) continue;

      let valid = true;
      for (const existingCard of deck) {
        const matches = existingCard.filter(
          (num) => currentCard.includes(num) || num === s,
        ).length;
        if (matches > lambda) {
          valid = false;
          break;
        }
      }
      if (valid) currentCard.push(s);
    }

    if (currentCard.length === k) {
      deck.push(currentCard);
      for (const s of currentCard) symbolUsage[s]++;
    } else {
      break;
    }
  }
  return deck;
}
