const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "../data/unified_products_en_gbp.json");

const MEN_TITLES = [
  "1 Million Paco Rabanne",
  "1 Million Parfum Paco Rabanne",
  "212 Men",
  "Acqua di Gio Profondo Giorgio Armani",
  "Armaf Club de Nuit Intense Man Armaf",
  "Armani Beauty Eau pour Homme Pour homme",
  "Armani Code Giorgio Armani",
  "Azzaro Pour Homme Eau De Toilette",
  "Bad Boy Carolina Herrera",
  "Bleu de Chanel Chanel",
  "Bleu De Chanel Parfum",
  "Boss Bottled Infinite Hugo Boss",
  "Boss The Scent Hugo Boss",
  "Bulgari In Black Bulgari",
  "Creed Aventus Creed",
  "Dior Sauvage Dior",
  "Eau de Parfum Guerlain L'Homme Idéal L'Intense",
  "Emporio Armani Stronger With You",
  "Ferrari Black Ferrari",
  "Gentleman Réserve Privée Givenchy",
  "Givenchy Gentleman Givenchy",
  "Gucci Guilty Pour Homme Gucci",
  "Hugo Boss Perfume Bottled",
  "Invictus Paco Rabanne",
  "Invictus Victory Paco Rabanne Edp",
  "Issey Miyake Nuit d'Issey",
  "Jean Paul Gaultier Le Male Jean Paul Gaultier",
  "Jean Paul Gaultier Le Male Elixir",
  "Jean Paul Gaultier Scandal H.",
  "Kenzo Homme Eau de Parfum",
  "Louis Vuitton Imagination Louis Vuitton",
  "Montblanc Explorer Extreme Eau De",
  "Moschino Toy Boy Moschino",
  "Paco Rabanne Phantom Paco Rabanne",
  "Paco Rabanne Pure XS",
  "Paco Rabanne Ultra Male",
  "Prada Luna Rossa Black Prada",
  "Rabanne Phantom Parfum",
  "Scandal Pour Homme",
  "Silver Scent Jacques Bogart",
  "Valentino Uomo Valentino",
  "Dylan Blue Versace",
  "Versace Eros Versace",
  "Y by YSL",
  "Y Eau de Parfum Yves Saint Laurent",
  "Y Le Parfum da marca Yves Saint Laurent",
];

const WOMEN_TITLES = [
  "212 VIP Rose Carolina Herrera",
  "Amadeirado Floral Fragrância Marcante",
  "Mugler Alien Eau Extraordinaire Mugler",
  "Angel Mugler Les Perfuma Corps",
  "Armani Beauty Sì Eau de Parfum Refilável",
  "YSL Black Opium Yves Saint Laurent",
  "Burberry Her Eau de Parfum",
  "Miss 212 Carolina Herrera",
  "Good Girl Carolina Herrera",
  "Chloe Signature Chloe",
  "Coco Mademoiselle Chanel",
  "Creed Love in White Creed",
  "Dior Hypnotic Poison Dior",
  "Dior J'adore Dior",
  "Frederic Malle Portrait of a Lady Frederic Malle",
  "Giorgio Armani Si Giorgio Armani",
  "Givenchy Amarige Givenchy",
  "Givenchy L'Interdit Givenchy",
  "Gucci Flora Gorgeous Gardenia Gucci",
  "Lancôme La Nuit Trésor Fem",
  "La Vie Est Belle Lancome",
  "Libre Yves Saint Laurent",
  "Marc Jacobs Perfect Marc Jacobs",
  "Million Gold for Her",
  "Montblanc Signature Absolue",
  "Paco Rabanne Olympéa",
  "Paradoxe Prada",
  "Fame Paco Rabanne",
  "D&G The Only One",
  "Valentino Donna Born in Roma Valentino",
  "Dylan Turquoise Versace",
  "Versace Eros Pour Femme",
  "Mon Paris Yves Saint Laurent",
  "Mugler Angel Mugler",
];

const UNISEX_TITLES = [
  "Byredo Rose of No Man's Land Byredo",
  "Parfums de Marly Layton",
  "D&G Light Blue",
  "French Avenue Royal Blend Extrait De Parfum",
  "Initio Oud for Greatness Initio",
  "Le Labo Santal 33 Le Labo",
  "M. Micallef GnTonic",
  "Orientica Royal Bleu Eau De Parfum",
  "Tom Ford Tobacco Vanille",
  "Xerjoff Erba Pura Xerjoff",
];

const normalize = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();

const menSet = new Set(MEN_TITLES.map(normalize));
const womenSet = new Set(WOMEN_TITLES.map(normalize));
const unisexSet = new Set(UNISEX_TITLES.map(normalize));

let raw = fs.readFileSync(FILE, "utf8");
const hasBOM = raw.charCodeAt(0) === 0xfeff;
if (hasBOM) raw = raw.slice(1);

const data = JSON.parse(raw);

let menCount = 0;
let womenCount = 0;
let unisexCount = 0;
const unmatched = [];

for (const product of data.products) {
  const key = normalize(product.title);
  const isMen = menSet.has(key) || unisexSet.has(key);
  const isWomen = womenSet.has(key) || unisexSet.has(key);

  if (!isMen && !isWomen) {
    unmatched.push(product.title);
    continue;
  }

  if (!Array.isArray(product.tags)) product.tags = [];

  if (isMen && !product.tags.includes("men")) {
    product.tags.push("men");
    menCount++;
  }
  if (isWomen && !product.tags.includes("women")) {
    product.tags.push("women");
    womenCount++;
  }
  if (unisexSet.has(key)) unisexCount++;
}

const output = (hasBOM ? "﻿" : "") + JSON.stringify(data, null, 2);
const tmp = FILE + ".tmp";
fs.writeFileSync(tmp, output, "utf8");
fs.renameSync(tmp, FILE);

console.log(`Tags adicionadas:`);
console.log(`  "men"   → ${menCount} produtos`);
console.log(`  "women" → ${womenCount} produtos`);
console.log(`  unissex (ambas) → ${unisexCount} produtos`);
if (unmatched.length) {
  console.log(`\nSem correspondência (${unmatched.length}):`);
  unmatched.forEach((t) => console.log("  - " + t));
}
