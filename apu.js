// ---------------------------------------------------------------
//  Yhteiset apufunktiot, joita kaikki sivut käyttävät.
// ---------------------------------------------------------------

function suojaa(teksti) {
  return String(teksti ?? '').replace(/[&<>"']/g, (merkki) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[merkki]);
}

// Monirivinen teksti listaksi: tyhjät rivit pois ja käsin kirjoitetut
// luetteloviivat siivotaan. Tähti jätetään paikalleen, koska se merkitsee
// väliotsikkoa — ks. osioiksi().
function riveiksi(teksti) {
  return String(teksti || '')
    .split('\n')
    .map((rivi) => rivi.replace(/^\s*[-–•]\s*/, '').trim())
    .filter(Boolean);
}

// Ainekset ja työvaiheet osiin. Tähdellä alkava rivi on väliotsikko, jolla
// resepti jaetaan osiin: *Pohja … *Täyte. Ennen ensimmäistä otsikkoa tulevat
// rivit menevät nimettömään osioon.
//
// Palauttaa listan muotoa [{ otsikko: string|null, rivit: [string] }].
function osioiksi(teksti) {
  const osiot = [];
  let nykyinen = { otsikko: null, rivit: [] };

  const talteen = () => {
    if (nykyinen.otsikko !== null || nykyinen.rivit.length) osiot.push(nykyinen);
  };

  for (const raaka of String(teksti || '').split('\n')) {
    const rivi = raaka.trim();
    if (!rivi || rivi === '*') continue;

    const otsikko = rivi.match(/^\*\s*(.+)$/);
    if (otsikko) {
      talteen();
      nykyinen = { otsikko: otsikko[1].trim(), rivit: [] };
      continue;
    }

    nykyinen.rivit.push(rivi.replace(/^[-–•]\s*/, '').trim());
  }

  talteen();
  return osiot;
}

// Onko osioissa yhtään sisältöä otsikoiden lisäksi?
function osioissaSisaltoa(osiot) {
  return osiot.some((osio) => osio.rivit.length > 0);
}

// Taulukkokenttä turvallisesti listaksi. Vanhoissa resepteissä arvo voi
// olla vielä yksittäinen teksti, joten se kelpaa myös.
function listaksi(arvo) {
  if (Array.isArray(arvo)) return arvo.filter(Boolean);
  if (typeof arvo === 'string' && arvo.trim()) return [arvo.trim()];
  return [];
}

// --- Valmistusaika ------------------------------------------------

// Pyöristys viiden minuutin tarkkuuteen. Alle viiden minuutin syötteet
// nostetaan viiteen, jottei "2 min" katoaisi nollaksi.
function pyorista5(minuutit) {
  return Math.max(5, Math.round(minuutit / 5) * 5);
}

// Käyttäjä saa kirjoittaa ajan miten haluaa: "90", "1,5 h", "1h30min",
// "2 tuntia 15 min", "240min", "1:30". Tästä tulee aina minuutteja.
function jasennaAika(syote) {
  if (syote === null || syote === undefined) return null;

  const teksti = String(syote).toLowerCase().replace(/,/g, '.').trim();
  if (!teksti) return null;

  const kaksoispiste = teksti.match(/^(\d+)\s*:\s*(\d{1,2})$/);
  if (kaksoispiste) {
    return pyorista5(Number(kaksoispiste[1]) * 60 + Number(kaksoispiste[2]));
  }

  const osat = [...teksti.matchAll(
    /(\d+(?:\.\d+)?)\s*(tuntia|tunnit|tunti|minuuttia|minuutti|min|h|t|m)?/g
  )].filter((osa) => osa[1] !== undefined && osa[0].trim() !== '');

  if (osat.length === 0) return null;

  let minuutit = 0;
  for (const osa of osat) {
    const luku = parseFloat(osa[1]);
    if (!Number.isFinite(luku)) continue;
    const yksikko = osa[2] || '';
    // Ilman yksikköä luku tulkitaan minuuteiksi — myös silloin kun se
    // seuraa tunteja, jolloin "1 h 30" tarkoittaa puoltatoista tuntia.
    minuutit += /^(h|t|tunti|tunnit|tuntia)$/.test(yksikko) ? luku * 60 : luku;
  }

  return minuutit > 0 ? pyorista5(minuutit) : null;
}

// Tunnista ensin, minuutit perään. Tasatunnit ilman minuuttiosaa.
function muotoileAika(minuutit) {
  const luku = Number(minuutit);
  if (!Number.isFinite(luku) || luku <= 0) return null;
  if (luku < 60) return `${luku} min`;

  const tunnit = Math.floor(luku / 60);
  const jaannos = luku % 60;
  return jaannos === 0 ? `${tunnit} h` : `${tunnit} h ${jaannos} min`;
}

function reseptienMaaraTeksti(maara) {
  return maara === 1 ? '1 resepti' : `${maara} reseptiä`;
}
