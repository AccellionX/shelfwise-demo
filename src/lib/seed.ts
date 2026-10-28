import {
  AppState,
  Book,
  DEFAULT_GENRES,
  DEFAULT_SHELF_LOCATIONS,
  Sale,
  StockMovement,
  STORE_VERSION,
  Supplier,
} from "./types";
import { daysAgo, generateId, toISODate } from "./utils";

const suppliers: Supplier[] = [
  {
    id: "sup_allied",
    name: "Allied Book Distributors",
    email: "orders@alliedbooks.com.au",
    phone: "(02) 9555 2100",
    contactName: "Priya Nair",
  },
  {
    id: "sup_southern",
    name: "Southern Presses Wholesale",
    email: "wholesale@southernpresses.com.au",
    phone: "(03) 9412 8800",
    contactName: "Marcus Webb",
  },
  {
    id: "sup_harbour",
    name: "Harbour Literary Supply",
    email: "hello@harbourlit.com.au",
    phone: "(08) 8221 4560",
    contactName: "Elena Rossi",
  },
];

type SeedBook = Omit<Book, "id" | "dateAdded"> & { daysSinceAdded: number };

/** Deterministic-ish ISBN-13 from a seed index (valid check digit). */
function makeIsbn(index: number): string {
  const base = `978${String(640000000 + index).padStart(9, "0")}`.slice(0, 12);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = Number(base[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return `${base}${check}`;
}

const seedBooks: SeedBook[] = [
  // Fiction
  { isbn: makeIsbn(1), title: "The Quiet Harbour", author: "Mira Ellison", genre: "Fiction", publisher: "Cedar & Tide Press", shelfLocation: "A1-Front", quantityOnHand: 8, reorderPoint: 3, costPrice: 12.5, retailPrice: 29.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 120 },
  { isbn: makeIsbn(2), title: "Letters from the Verandah", author: "Tobias Crane", genre: "Fiction", publisher: "Wattle House", shelfLocation: "A1-Front", quantityOnHand: 5, reorderPoint: 3, costPrice: 11.0, retailPrice: 27.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 95 },
  { isbn: makeIsbn(3), title: "A Season of Dust", author: "Helena Voss", genre: "Fiction", publisher: "Northbridge Books", shelfLocation: "A2-Front", quantityOnHand: 2, reorderPoint: 3, costPrice: 13.2, retailPrice: 32.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 80 },
  { isbn: makeIsbn(4), title: "The Last Picnic", author: "James O'Rourke", genre: "Fiction", publisher: "Cedar & Tide Press", shelfLocation: "A2-Front", quantityOnHand: 0, reorderPoint: 2, costPrice: 10.5, retailPrice: 24.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 60 },
  { isbn: makeIsbn(5), title: "Under the Railway Clock", author: "Sara Lind", genre: "Fiction", publisher: "Wattle House", shelfLocation: "A3-Front", quantityOnHand: 12, reorderPoint: 4, costPrice: 14.0, retailPrice: 34.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 40 },
  { isbn: makeIsbn(6), title: "Paper Boats at Dusk", author: "Noah Greer", genre: "Fiction", publisher: "Harbour Editions", shelfLocation: "A3-Front", quantityOnHand: 6, reorderPoint: 3, costPrice: 9.8, retailPrice: 22.99, supplierId: "sup_harbour", condition: "Second-hand", daysSinceAdded: 200 },
  { isbn: makeIsbn(7), title: "The Soft Geometry of Homes", author: "Amelia Rhodes", genre: "Fiction", publisher: "Northbridge Books", shelfLocation: "B1-Mid", quantityOnHand: 4, reorderPoint: 3, costPrice: 12.0, retailPrice: 28.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 55 },
  { isbn: makeIsbn(8), title: "When the Mangoes Fell", author: "Dev Patel", genre: "Fiction", publisher: "Cedar & Tide Press", shelfLocation: "B1-Mid", quantityOnHand: 9, reorderPoint: 3, costPrice: 11.5, retailPrice: 26.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 70 },
  { isbn: makeIsbn(9), title: "Ordinary Thunder", author: "Claire Denham", genre: "Fiction", publisher: "Wattle House", shelfLocation: "Window", quantityOnHand: 3, reorderPoint: 3, costPrice: 13.5, retailPrice: 31.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 25 },
  // Kids
  { isbn: makeIsbn(10), title: "Pippa and the Possum Parade", author: "Lucy Hart", genre: "Kids", publisher: "Little Wombat Press", shelfLocation: "Kids-Wall", quantityOnHand: 14, reorderPoint: 5, costPrice: 7.5, retailPrice: 16.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 90 },
  { isbn: makeIsbn(11), title: "Captain Bean's Big Adventure", author: "Tom Wicks", genre: "Kids", publisher: "Little Wombat Press", shelfLocation: "Kids-Wall", quantityOnHand: 1, reorderPoint: 4, costPrice: 8.0, retailPrice: 18.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 45 },
  { isbn: makeIsbn(12), title: "The Midnight Treehouse", author: "Anya Brooks", genre: "Kids", publisher: "Storybox AU", shelfLocation: "Kids-Wall", quantityOnHand: 7, reorderPoint: 4, costPrice: 9.0, retailPrice: 19.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 110 },
  { isbn: makeIsbn(13), title: "Where Did My Sock Go?", author: "Ben Carter", genre: "Kids", publisher: "Storybox AU", shelfLocation: "Kids-Wall", quantityOnHand: 11, reorderPoint: 5, costPrice: 6.5, retailPrice: 14.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 30 },
  { isbn: makeIsbn(14), title: "Ruby Finds a River", author: "Mei Chen", genre: "Kids", publisher: "Little Wombat Press", shelfLocation: "Kids-Wall", quantityOnHand: 0, reorderPoint: 3, costPrice: 8.5, retailPrice: 17.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 75 },
  { isbn: makeIsbn(15), title: "The Grumpy Magpie", author: "Owen Blake", genre: "Kids", publisher: "Storybox AU", shelfLocation: "Counter", quantityOnHand: 5, reorderPoint: 3, costPrice: 7.0, retailPrice: 15.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 50 },
  { isbn: makeIsbn(16), title: "Space Socks and Moon Cheese", author: "Tara Quinn", genre: "Kids", publisher: "Little Wombat Press", shelfLocation: "Kids-Wall", quantityOnHand: 8, reorderPoint: 4, costPrice: 9.5, retailPrice: 21.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 20 },
  { isbn: makeIsbn(17), title: "Grandad's Garden Secrets", author: "Samira Ali", genre: "Kids", publisher: "Storybox AU", shelfLocation: "Kids-Wall", quantityOnHand: 6, reorderPoint: 3, costPrice: 8.2, retailPrice: 18.5, supplierId: "sup_southern", condition: "Second-hand", daysSinceAdded: 150 },
  // Non-fiction
  { isbn: makeIsbn(18), title: "How Cities Remember", author: "Dr. Lena Forsyth", genre: "Non-fiction", publisher: "Clarion Academic", shelfLocation: "B2-Mid", quantityOnHand: 4, reorderPoint: 2, costPrice: 18.0, retailPrice: 39.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 100 },
  { isbn: makeIsbn(19), title: "The Art of Slow Work", author: "Hugh Merton", genre: "Non-fiction", publisher: "Quiet Path Press", shelfLocation: "B2-Mid", quantityOnHand: 7, reorderPoint: 3, costPrice: 14.5, retailPrice: 32.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 65 },
  { isbn: makeIsbn(20), title: "Birds of the Inland", author: "Rachel Menzies", genre: "Non-fiction", publisher: "Outback Field Guides", shelfLocation: "B3-Mid", quantityOnHand: 3, reorderPoint: 2, costPrice: 22.0, retailPrice: 49.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 85 },
  { isbn: makeIsbn(21), title: "Building Better Habits", author: "Chris Nolan", genre: "Non-fiction", publisher: "Quiet Path Press", shelfLocation: "B3-Mid", quantityOnHand: 10, reorderPoint: 4, costPrice: 13.0, retailPrice: 29.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 35 },
  { isbn: makeIsbn(22), title: "A Brief History of Tea", author: "Yuko Tanaka", genre: "Non-fiction", publisher: "Clarion Academic", shelfLocation: "C1-Back", quantityOnHand: 2, reorderPoint: 2, costPrice: 16.5, retailPrice: 36.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 140 },
  { isbn: makeIsbn(23), title: "Designing for Small Spaces", author: "Ingrid Berg", genre: "Non-fiction", publisher: "Quiet Path Press", shelfLocation: "C1-Back", quantityOnHand: 5, reorderPoint: 3, costPrice: 19.0, retailPrice: 44.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 48 },
  { isbn: makeIsbn(24), title: "The Long Walk Home: Essays", author: "Peter Lang", genre: "Non-fiction", publisher: "Harbour Editions", shelfLocation: "Window", quantityOnHand: 1, reorderPoint: 2, costPrice: 15.0, retailPrice: 34.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 22 },
  { isbn: makeIsbn(25), title: "Understanding Australian Weather", author: "Dr. Kim Walsh", genre: "Non-fiction", publisher: "Outback Field Guides", shelfLocation: "B3-Mid", quantityOnHand: 6, reorderPoint: 3, costPrice: 17.5, retailPrice: 38.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 88 },
  // Cookbooks
  { isbn: makeIsbn(26), title: "Weeknight Woks", author: "Jin Park", genre: "Cookbooks", publisher: "Kitchen Table AU", shelfLocation: "C2-Back", quantityOnHand: 9, reorderPoint: 3, costPrice: 16.0, retailPrice: 39.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 55 },
  { isbn: makeIsbn(27), title: "Sourdough by the Sea", author: "Emma Fraser", genre: "Cookbooks", publisher: "Kitchen Table AU", shelfLocation: "C2-Back", quantityOnHand: 4, reorderPoint: 3, costPrice: 18.5, retailPrice: 45.0, supplierId: "sup_southern", condition: "New", daysSinceAdded: 70 },
  { isbn: makeIsbn(28), title: "Campfire Feasts", author: "Jed Morgan", genre: "Cookbooks", publisher: "Bush Kitchen Press", shelfLocation: "C2-Back", quantityOnHand: 2, reorderPoint: 2, costPrice: 14.0, retailPrice: 34.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 100 },
  { isbn: makeIsbn(29), title: "Simple Salads for Hot Days", author: "Nina Costa", genre: "Cookbooks", publisher: "Kitchen Table AU", shelfLocation: "Counter", quantityOnHand: 8, reorderPoint: 3, costPrice: 12.5, retailPrice: 29.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 28 },
  { isbn: makeIsbn(30), title: "Grandma's Sunday Roasts", author: "Helen Byrne", genre: "Cookbooks", publisher: "Bush Kitchen Press", shelfLocation: "C3-Back", quantityOnHand: 0, reorderPoint: 2, costPrice: 15.5, retailPrice: 36.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 120 },
  { isbn: makeIsbn(31), title: "Coffee at Home", author: "Luca Moretti", genre: "Cookbooks", publisher: "Kitchen Table AU", shelfLocation: "C3-Back", quantityOnHand: 5, reorderPoint: 3, costPrice: 20.0, retailPrice: 49.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 42 },
  { isbn: makeIsbn(32), title: "Preserving the Harvest", author: "Grace Holloway", genre: "Cookbooks", publisher: "Bush Kitchen Press", shelfLocation: "C3-Back", quantityOnHand: 3, reorderPoint: 2, costPrice: 17.0, retailPrice: 42.99, supplierId: "sup_harbour", condition: "Second-hand", daysSinceAdded: 180 },
  // Crime
  { isbn: makeIsbn(33), title: "The Missing Pier", author: "R.J. Harlan", genre: "Crime", publisher: "Noir Coast Books", shelfLocation: "A1-Front", quantityOnHand: 7, reorderPoint: 3, costPrice: 11.5, retailPrice: 27.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 60 },
  { isbn: makeIsbn(34), title: "Blood on the Billabong", author: "Kate Munro", genre: "Crime", publisher: "Noir Coast Books", shelfLocation: "A2-Front", quantityOnHand: 4, reorderPoint: 3, costPrice: 12.0, retailPrice: 28.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 45 },
  { isbn: makeIsbn(35), title: "Silent Tramlines", author: "Victor Kane", genre: "Crime", publisher: "Harbour Editions", shelfLocation: "A2-Front", quantityOnHand: 1, reorderPoint: 2, costPrice: 10.8, retailPrice: 25.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 33 },
  { isbn: makeIsbn(36), title: "A Case of Bad Timing", author: "Sophie Trent", genre: "Crime", publisher: "Noir Coast Books", shelfLocation: "A3-Front", quantityOnHand: 6, reorderPoint: 3, costPrice: 11.0, retailPrice: 26.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 78 },
  { isbn: makeIsbn(37), title: "The Clerk Who Knew Too Much", author: "Ian Fletcher", genre: "Crime", publisher: "Wattle House", shelfLocation: "B1-Mid", quantityOnHand: 3, reorderPoint: 2, costPrice: 13.0, retailPrice: 29.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 95 },
  { isbn: makeIsbn(38), title: "Night Shift at the Docks", author: "Mara Ellis", genre: "Crime", publisher: "Noir Coast Books", shelfLocation: "Window", quantityOnHand: 5, reorderPoint: 3, costPrice: 12.5, retailPrice: 30.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 18 },
  { isbn: makeIsbn(39), title: "Shadows Over Collingwood", author: "Dan Reeves", genre: "Crime", publisher: "Harbour Editions", shelfLocation: "B1-Mid", quantityOnHand: 2, reorderPoint: 2, costPrice: 11.2, retailPrice: 26.5, supplierId: "sup_harbour", condition: "Second-hand", daysSinceAdded: 160 },
  { isbn: makeIsbn(40), title: "The Last Witness on King Street", author: "Olivia Shaw", genre: "Crime", publisher: "Noir Coast Books", shelfLocation: "A3-Front", quantityOnHand: 8, reorderPoint: 3, costPrice: 12.8, retailPrice: 31.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 12 },
  // Fantasy
  { isbn: makeIsbn(41), title: "The Ember Crown", author: "Liora Vale", genre: "Fantasy", publisher: "Mythwright Press", shelfLocation: "B2-Mid", quantityOnHand: 10, reorderPoint: 4, costPrice: 14.0, retailPrice: 32.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 50 },
  { isbn: makeIsbn(42), title: "Rivers of Glass", author: "Orion Black", genre: "Fantasy", publisher: "Mythwright Press", shelfLocation: "B2-Mid", quantityOnHand: 6, reorderPoint: 3, costPrice: 13.5, retailPrice: 31.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 66 },
  { isbn: makeIsbn(43), title: "The Cartographer's Daughter", author: "Elise Thorn", genre: "Fantasy", publisher: "Starfall Books", shelfLocation: "B3-Mid", quantityOnHand: 2, reorderPoint: 3, costPrice: 15.0, retailPrice: 34.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 40 },
  { isbn: makeIsbn(44), title: "Nine Moons Over Ashvale", author: "Gareth Pike", genre: "Fantasy", publisher: "Mythwright Press", shelfLocation: "B3-Mid", quantityOnHand: 7, reorderPoint: 3, costPrice: 14.5, retailPrice: 33.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 88 },
  { isbn: makeIsbn(45), title: "The Whispering Forge", author: "Nadia Sol", genre: "Fantasy", publisher: "Starfall Books", shelfLocation: "C1-Back", quantityOnHand: 1, reorderPoint: 2, costPrice: 12.0, retailPrice: 28.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 110 },
  { isbn: makeIsbn(46), title: "A Dragon of Modest Means", author: "Felix Rowan", genre: "Fantasy", publisher: "Mythwright Press", shelfLocation: "Window", quantityOnHand: 4, reorderPoint: 3, costPrice: 13.0, retailPrice: 29.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 25 },
  { isbn: makeIsbn(47), title: "The Salt Mage of Port Neve", author: "Isla Quinn", genre: "Fantasy", publisher: "Starfall Books", shelfLocation: "C1-Back", quantityOnHand: 5, reorderPoint: 3, costPrice: 14.2, retailPrice: 32.5, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 58 },
  { isbn: makeIsbn(48), title: "Clockwork & Clover", author: "Theo Marsh", genre: "Fantasy", publisher: "Mythwright Press", shelfLocation: "B2-Mid", quantityOnHand: 3, reorderPoint: 2, costPrice: 11.8, retailPrice: 27.99, supplierId: "sup_southern", condition: "Second-hand", daysSinceAdded: 190 },
  // Local/Australian
  { isbn: makeIsbn(49), title: "Dust and Eucalyptus", author: "Annie Crowe", genre: "Local/Australian", publisher: "Wattle House", shelfLocation: "A1-Front", quantityOnHand: 9, reorderPoint: 3, costPrice: 13.0, retailPrice: 29.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 35 },
  { isbn: makeIsbn(50), title: "Stories from the Murray", author: "Various Authors", genre: "Local/Australian", publisher: "Riverbend Press", shelfLocation: "A1-Front", quantityOnHand: 6, reorderPoint: 3, costPrice: 15.5, retailPrice: 34.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 70 },
  { isbn: makeIsbn(51), title: "The Corner Shop in Ballarat", author: "Maggie Dunn", genre: "Local/Australian", publisher: "Wattle House", shelfLocation: "Window", quantityOnHand: 4, reorderPoint: 2, costPrice: 12.0, retailPrice: 27.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 15 },
  { isbn: makeIsbn(52), title: "Coastal Tracks: Walking Guides", author: "Paul Henshaw", genre: "Local/Australian", publisher: "Outback Field Guides", shelfLocation: "C1-Back", quantityOnHand: 8, reorderPoint: 3, costPrice: 18.0, retailPrice: 42.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 90 },
  { isbn: makeIsbn(53), title: "Bush Poetry for Quiet Evenings", author: "Compiled by Faye Orr", genre: "Local/Australian", publisher: "Riverbend Press", shelfLocation: "Counter", quantityOnHand: 5, reorderPoint: 2, costPrice: 10.0, retailPrice: 22.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 105 },
  { isbn: makeIsbn(54), title: "Fremantle Fog", author: "Jack Linton", genre: "Local/Australian", publisher: "Harbour Editions", shelfLocation: "A2-Front", quantityOnHand: 2, reorderPoint: 2, costPrice: 11.5, retailPrice: 26.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 52 },
  { isbn: makeIsbn(55), title: "The Schoolhouse Years", author: "Ruth Pendleton", genre: "Local/Australian", publisher: "Wattle House", shelfLocation: "B1-Mid", quantityOnHand: 7, reorderPoint: 3, costPrice: 12.5, retailPrice: 28.99, supplierId: "sup_southern", condition: "New", daysSinceAdded: 80 },
  { isbn: makeIsbn(56), title: "Sydney Lanes & Laneways", author: "Claire Ng", genre: "Local/Australian", publisher: "Riverbend Press", shelfLocation: "Window", quantityOnHand: 3, reorderPoint: 3, costPrice: 16.0, retailPrice: 36.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 28 },
  { isbn: makeIsbn(57), title: "Tales from the Red Centre", author: "Warren Blake", genre: "Local/Australian", publisher: "Outback Field Guides", shelfLocation: "C2-Back", quantityOnHand: 1, reorderPoint: 2, costPrice: 14.0, retailPrice: 31.99, supplierId: "sup_harbour", condition: "New", daysSinceAdded: 130 },
  { isbn: makeIsbn(58), title: "Melbourne Rain", author: "Sophie Adler", genre: "Local/Australian", publisher: "Wattle House", shelfLocation: "A3-Front", quantityOnHand: 6, reorderPoint: 3, costPrice: 12.8, retailPrice: 29.5, supplierId: "sup_southern", condition: "New", daysSinceAdded: 44 },
  { isbn: makeIsbn(59), title: "The Ferry Home", author: "Benito Garcia", genre: "Local/Australian", publisher: "Harbour Editions", shelfLocation: "A3-Front", quantityOnHand: 4, reorderPoint: 2, costPrice: 11.0, retailPrice: 25.99, supplierId: "sup_harbour", condition: "Second-hand", daysSinceAdded: 170 },
  { isbn: makeIsbn(60), title: "Gum Leaves & Grammar", author: "Irene Walsh", genre: "Local/Australian", publisher: "Riverbend Press", shelfLocation: "Counter", quantityOnHand: 5, reorderPoint: 2, costPrice: 9.5, retailPrice: 21.99, supplierId: "sup_allied", condition: "New", daysSinceAdded: 62 },
];

/** Simple seeded PRNG for reproducible demo data */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeedState(): AppState {
  const now = new Date();
  const rand = mulberry32(20261028);

  const books: Book[] = seedBooks.map((b, i) => ({
    id: `book_${String(i + 1).padStart(3, "0")}`,
    isbn: b.isbn,
    title: b.title,
    author: b.author,
    genre: b.genre,
    publisher: b.publisher,
    shelfLocation: b.shelfLocation,
    quantityOnHand: b.quantityOnHand,
    reorderPoint: b.reorderPoint,
    costPrice: b.costPrice,
    retailPrice: b.retailPrice,
    supplierId: b.supplierId,
    condition: b.condition,
    dateAdded: toISODate(daysAgo(b.daysSinceAdded, now)),
  }));

  // Working quantities we mutate while generating history
  const qtyMap = new Map(books.map((b) => [b.id, b.quantityOnHand]));
  // We'll generate sales going backwards, so start from current qty and
  // "undo" by adding sold qty, then reverse-apply movements chronologically.
  // Simpler approach: generate sales with quantities that don't exceed
  // a soft max, then set final book quantities from seed (authoritative).

  const sales: Sale[] = [];
  const movements: StockMovement[] = [];

  // Popular books for sales weighting
  const popularIds = [
    "book_001", "book_005", "book_010", "book_013", "book_021",
    "book_026", "book_033", "book_040", "book_041", "book_049",
    "book_011", "book_038", "book_051", "book_016", "book_029",
  ];
  const slowIds = [
    "book_022", "book_032", "book_039", "book_048", "book_059", "book_006",
  ];

  // Generate ~90 days of sales (some days quiet)
  for (let day = 89; day >= 0; day--) {
    const date = daysAgo(day, now);
    // Skip some days (closed Sundays lightly)
    if (date.getDay() === 0 && rand() < 0.6) continue;

    const saleCount = Math.floor(rand() * 4); // 0-3 sales/day
    for (let s = 0; s < saleCount; s++) {
      const lineCount = 1 + Math.floor(rand() * 3);
      const lines: Sale["lines"] = [];
      const used = new Set<string>();

      for (let l = 0; l < lineCount; l++) {
        let bookId: string;
        if (rand() < 0.55) {
          bookId = popularIds[Math.floor(rand() * popularIds.length)];
        } else if (rand() < 0.08) {
          // Rare sale of a slow mover (for variety, but most won't sell recently)
          bookId = books[Math.floor(rand() * books.length)].id;
        } else {
          bookId = books[Math.floor(rand() * books.length)].id;
        }
        // Avoid sales of slow movers in last 65 days
        if (day < 65 && slowIds.includes(bookId)) continue;
        if (used.has(bookId)) continue;
        used.add(bookId);

        const book = books.find((b) => b.id === bookId)!;
        const qty = 1 + (rand() < 0.15 ? 1 : 0);
        lines.push({
          bookId,
          quantity: qty,
          unitPrice: book.retailPrice,
        });
      }

      if (lines.length === 0) continue;

      const saleId = generateId("sale");
      const saleDate = new Date(date);
      saleDate.setHours(9 + Math.floor(rand() * 9), Math.floor(rand() * 60), 0, 0);

      const total = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
      sales.push({
        id: saleId,
        date: toISODate(saleDate),
        lines,
        total: Math.round(total * 100) / 100,
      });

      for (const line of lines) {
        const before = qtyMap.get(line.bookId) ?? 0;
        // Historical: we don't mutate final qty; just record movements
        // with synthetic before/after for audit trail realism
        const after = Math.max(0, before); // placeholder; fixed below
        movements.push({
          id: generateId("mov"),
          bookId: line.bookId,
          type: "stock_out",
          quantity: -line.quantity,
          reason: "sale",
          date: toISODate(saleDate),
          relatedSaleId: saleId,
          quantityBefore: before + line.quantity,
          quantityAfter: after,
        });
      }
    }
  }

  // Fix movement before/after by walking chronologically from seeded start
  // Reconstruct: start qty = current + total sold - stock_ins + adjustments
  // For demo clarity: set before/after relative to rolling totals ending at seed qty.

  // Additional non-sale movements
  const deliveryBooks = ["book_005", "book_010", "book_026", "book_041", "book_049"];
  for (let i = 0; i < deliveryBooks.length; i++) {
    const bookId = deliveryBooks[i];
    const book = books.find((b) => b.id === bookId)!;
    const date = daysAgo(20 + i * 7, now);
    date.setHours(10, 30, 0, 0);
    const qty = 5 + Math.floor(rand() * 6);
    movements.push({
      id: generateId("mov"),
      bookId,
      type: "stock_in",
      quantity: qty,
      reason: "delivery",
      notes: `Delivery from ${suppliers.find((s) => s.id === book.supplierId)?.name}`,
      date: toISODate(date),
      relatedSupplierId: book.supplierId,
      quantityBefore: Math.max(0, book.quantityOnHand - qty + 2),
      quantityAfter: Math.max(0, book.quantityOnHand - qty + 2) + qty,
    });
  }

  // Damage / adjustment examples
  movements.push({
    id: generateId("mov"),
    bookId: "book_006",
    type: "stock_out",
    quantity: -1,
    reason: "damage",
    notes: "Water damage from window leak",
    date: toISODate(daysAgo(14, now)),
    quantityBefore: 7,
    quantityAfter: 6,
  });

  movements.push({
    id: generateId("mov"),
    bookId: "book_018",
    type: "adjustment",
    quantity: -1,
    reason: "stocktake",
    notes: "Stocktake correction, shelf B2",
    date: toISODate(daysAgo(7, now)),
    quantityBefore: 5,
    quantityAfter: 4,
  });

  movements.push({
    id: generateId("mov"),
    bookId: "book_033",
    type: "stock_out",
    quantity: -2,
    reason: "return_to_supplier",
    notes: "Publisher recall: cover defect",
    date: toISODate(daysAgo(21, now)),
    relatedSupplierId: "sup_southern",
    quantityBefore: 9,
    quantityAfter: 7,
  });

  // Sort movements by date
  movements.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Recalculate quantityBefore/After for sale movements ending at seed qty
  const rolling = new Map(books.map((b) => [b.id, b.quantityOnHand]));
  // Walk sales movements reverse (newest first) to rebuild history
  const saleMovements = movements
    .filter((m) => m.reason === "sale")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const m of saleMovements) {
    const after = rolling.get(m.bookId) ?? 0;
    const before = after - m.quantity; // quantity is negative
    m.quantityAfter = after;
    m.quantityBefore = before;
    rolling.set(m.bookId, before);
  }

  // Auto-suggest reorder list for low/out stock
  const reorderList = books
    .filter((b) => b.quantityOnHand <= b.reorderPoint)
    .map((b) => ({
      bookId: b.id,
      suggestedQty: Math.max(1, b.reorderPoint * 2 - b.quantityOnHand),
      included: true,
    }));

  return {
    version: STORE_VERSION,
    seededAt: toISODate(now),
    settings: {
      shopName: "Harbour Lane Books",
      defaultReorderPoint: 3,
      genres: [...DEFAULT_GENRES],
      shelfLocations: [...DEFAULT_SHELF_LOCATIONS],
      demoBannerDismissed: false,
    },
    suppliers,
    books,
    sales: sales.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
    movements,
    reorderList,
  };
}
