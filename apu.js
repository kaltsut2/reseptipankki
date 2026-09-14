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

// --- Genetiivi ----------------------------------------------------
//
//  Lisääjän nimi omistusmuotoon vinkkiotsikkoa varten. Suomen
//  genetiivi ei ole pelkkä n perään: Pekka taipuu Pekaksi ja
//  Virtanen Virtaseksi ennen päätettä.

function sailytaAlkukirjain(alkuperainen, muoto) {
  const isoAlku = alkuperainen.charAt(0) !== alkuperainen.charAt(0).toLowerCase();
  return isoAlku ? muoto.charAt(0).toUpperCase() + muoto.slice(1) : muoto;
}

function taivutaGenetiiviin(sana) {
  const pieni = sana.toLowerCase();

  const poikkeus = typeof GENETIIVI_POIKKEUKSET !== 'undefined'
    && GENETIIVI_POIKKEUKSET[pieni];
  if (poikkeus) return sailytaAlkukirjain(sana, poikkeus);

  // Sukunimet: Virtanen → Virtasen, Syrjänen → Syrjäsen
  if (pieni.length > 3 && pieni.endsWith('nen')) {
    return sana.slice(0, -3) + 'sen';
  }

  const vokaalit = 'aeiouyäöå';

  // Konsonanttiin päättyvät, useimmiten vieraskieliset nimet saavat
  // sidevokaalin: Alex → Alexin, Kim → Kimin, Robert → Robertin.
  if (!vokaalit.includes(pieni.slice(-1))) return sana + 'in';

  // Kaksoiskonsonantin heikentyminen: Pekka → Pekan, Matti → Matin,
  // Seppo → Sepon. Muut kaksoiskirjaimet eivät heikkene: Anna → Annan.
  if (['kk', 'pp', 'tt'].includes(pieni.slice(-3, -1))) {
    return sana.slice(0, -3) + sana.slice(-2) + 'n';
  }

  return sana + 'n';
}

// Lisääjiä voi olla useampi. Erotin otetaan talteen sellaisenaan, jotta
// "Ville ja Valle" palautuu samalla sanajärjestyksellä ja välimerkeillä.
// Parilliset alkiot ovat nimiä, parittomat erottimia.
const LISAAJIEN_EROTIN = /(\s+ja\s+|\s+sekä\s+|\s*&\s*|\s*\+\s*|\s*,\s*)/i;

function jaaLisaajat(teksti) {
  return String(teksti || '').split(LISAAJIEN_EROTIN);
}

// Yksi nimi genetiiviin. Monisanaisesta nimestä taipuu vain viimeinen
// sana, kuten suomessa kuuluukin: Hilja Vienonen → Hilja Vienosen.
function taivutaNimi(nimi) {
  const osat = String(nimi).trim().split(/\s+/).filter(Boolean);
  if (!osat.length) return nimi;
  const viimeinen = osat.pop();
  return [...osat, taivutaGenetiiviin(viimeinen)].join(' ');
}

// Koko lisääjäkenttä genetiiviin. Jokainen nimi taipuu erikseen:
// "Ville ja Valle" → "Villen ja Vallen", ei "Ville ja Vallen".
function genetiivi(nimi) {
  const siisti = String(nimi || '').trim();
  if (!siisti) return null;

  return jaaLisaajat(siisti)
    .map((osa, i) => (i % 2 === 1 ? osa : taivutaNimi(osa)))
    .join('');
}

// Nimen jokainen sana isolla alkukirjaimella. Loppu jätetään ennalleen,
// jotta McDonald ja Mäkinen-Virtanen säilyvät sellaisinaan.
function isollaAlkukirjaimella(teksti) {
  return teksti.replace(/(^|[\s-])(\p{L})/gu,
    (osuma, edellinen, kirjain) => edellinen + kirjain.toUpperCase());
}

// Kirjoitettu nimi tallennusmuotoon vastaavuustaulun mukaan. Toimii myös
// useammalle lisääjälle, jolloin jokainen nimi katsotaan erikseen.
function normalisoiLisaaja(nimi) {
  const siisti = String(nimi || '').trim();
  if (!siisti) return null;

  const taulu = typeof LISAAJA_VASTAAVUUS !== 'undefined' ? LISAAJA_VASTAAVUUS : {};

  return jaaLisaajat(siisti)
    .map((osa, i) => {
      if (i % 2 === 1) return osa;
      const puhdas = osa.trim();
      return taulu[puhdas.toLowerCase()] || isollaAlkukirjaimella(puhdas);
    })
    .join('');
}

// Vinkkiosion otsikko: "Kallen vinkki", "Äidin vinkki". Ilman lisääjää
// pelkkä "Vinkki".
function vinkinOtsikko(lisaaja) {
  const muoto = genetiivi(lisaaja);
  if (!muoto) return 'Vinkki';
  return `${muoto.charAt(0).toUpperCase()}${muoto.slice(1)} vinkki`;
}
