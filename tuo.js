// ---------------------------------------------------------------
//  Reseptien tuonti ja vienti.
//
//  Tuonti ei kirjoita mitään ennen kuin sisältö on tarkistettu ja
//  hyväksytty: sadan reseptin sokkotuonti olisi sadan reseptin sotku,
//  jos tiedosto sattuisi olemaan väärässä muodossa.
// ---------------------------------------------------------------

const TUETTU_VERSIO = 1;

const tarkistaNappi = document.getElementById('tarkista');
const liitettyKentta = document.getElementById('liitetty');
const tiedostoSyote = document.getElementById('tiedosto');
const tuoTila = document.getElementById('tuoTila');
const esikatseluElementti = document.getElementById('esikatselu');

let tarkistetut = [];      // { resepti, varoitukset, kaksoiskappale }
let olemassaOlevat = [];

// --- Mallitiedosto -------------------------------------------------

document.getElementById('malli').textContent = JSON.stringify({
  versio: 1,
  reseptit: [
    {
      nimi: 'Mummon lihapullat',
      kategoriat: ['Arkiruoka'],
      paaraaka_aineet: ['Jauheliha'],
      aika: '1 h 15 min',
      annokset: 4,
      ainekset: ['400 g jauhelihaa', '1 sipuli', '2 dl kermaa'],
      ohje: ['Kuullota sipuli.', 'Pyörittele ja paista pullat.'],
      vinkki: 'Puolukkahillo kuuluu tähän.',
      lisaaja: 'Äiti',
      lahde: 'https://esimerkki.fi/lihapullat'
    }
  ]
}, null, 2);

// --- Jäsennys ------------------------------------------------------

// Muoto saa olla joko { versio, reseptit: [...] } tai pelkkä lista.
function poimiReseptit(teksti) {
  let data;
  try {
    data = JSON.parse(teksti);
  } catch (virhe) {
    throw new Error('Tiedosto ei ole kelvollista JSONia. Tarkista että kopioit koko sisällön.');
  }

  if (Array.isArray(data)) return data;

  if (data && Array.isArray(data.reseptit)) {
    const versio = data.versio ?? 1;
    if (versio > TUETTU_VERSIO) {
      throw new Error(
        `Tiedosto on muotoa ${versio}, mutta tämä sovellus tuntee muodon ${TUETTU_VERSIO}. Päivitä sovellus.`);
    }
    return data.reseptit;
  }

  throw new Error('JSONista ei löytynyt reseptilistaa. Odotettu muoto: { "reseptit": [ … ] }');
}

// Tunnetun listan kirjoitusasu, jos arvo täsmää isoja ja pieniä
// kirjaimia lukuun ottamatta. Muuten null, jolloin arvosta varoitetaan.
function tunnistaArvo(arvo, sallitut) {
  const siisti = String(arvo || '').trim();
  if (!siisti) return null;
  return sallitut.find((s) => s.toLowerCase() === siisti.toLowerCase()) || null;
}

function tekstiksi(arvo) {
  if (Array.isArray(arvo)) return arvo.map((r) => String(r).trim()).filter(Boolean).join('\n');
  const teksti = String(arvo ?? '').trim();
  return teksti || null;
}

function normalisoi(raaka, jarjestys) {
  const varoitukset = [];
  const nimi = String(raaka?.nimi ?? '').trim();

  if (!nimi) {
    return { virhe: `Rivillä ${jarjestys + 1} ei ole nimeä — se ohitetaan.` };
  }

  // Kategoriat ja raaka-aineet tunnetun listan kirjoitusasuun.
  const kategoriat = [];
  for (const arvo of listaksi(raaka.kategoriat)) {
    const tunnettu = tunnistaArvo(arvo, KATEGORIAT);
    if (tunnettu) kategoriat.push(tunnettu);
    else { kategoriat.push(String(arvo).trim()); varoitukset.push(`tuntematon kategoria “${arvo}”`); }
  }

  const raakaAineet = [];
  for (const arvo of listaksi(raaka.paaraaka_aineet ?? raaka.raaka_aineet)) {
    const tunnettu = tunnistaArvo(arvo, RAAKA_AINEET);
    if (tunnettu) raakaAineet.push(tunnettu);
    else { raakaAineet.push(String(arvo).trim()); varoitukset.push(`tuntematon raaka-aine “${arvo}”`); }
  }

  if (kategoriat.length === 0) varoitukset.push('ei kategoriaa');

  // Aika saa olla mitä tahansa muotoa — sama jäsennys kuin lomakkeella.
  const aikaSyote = raaka.aika ?? raaka.aika_min;
  const aika = jasennaAika(aikaSyote);
  if (aikaSyote && !aika) varoitukset.push(`aikaa “${aikaSyote}” ei tunnistettu`);

  const annokset = parseInt(raaka.annokset, 10);

  // Lähde talteen vinkkikenttään: erillistä saraketta ei ole.
  const vinkkiOsat = [tekstiksi(raaka.vinkki)];
  if (raaka.lahde) vinkkiOsat.push(`Lähde: ${String(raaka.lahde).trim()}`);
  const vinkki = vinkkiOsat.filter(Boolean).join('\n\n') || null;

  const resepti = {
    nimi,
    kategoriat,
    paaraaka_aineet: raakaAineet,
    aika_min: aika,
    annokset: Number.isFinite(annokset) ? annokset : null,
    ainekset: tekstiksi(raaka.ainekset),
    ohje: tekstiksi(raaka.ohje),
    vinkki,
    lisaaja: normalisoiLisaaja(tekstiksi(raaka.lisaaja)),
    kuva_url: null
  };

  if (!resepti.ainekset) varoitukset.push('ei aineksia');
  if (!resepti.ohje) varoitukset.push('ei ohjetta');

  const kaksoiskappale = olemassaOlevat.some(
    (r) => r.nimi.trim().toLowerCase() === nimi.toLowerCase());

  return { resepti, varoitukset, kaksoiskappale };
}

// --- Esikatselu ----------------------------------------------------

function piirraEsikatselu(virheet) {
  if (tarkistetut.length === 0) {
    esikatseluElementti.innerHTML = `
      <div class="huomio"><p>Tiedostosta ei löytynyt yhtään kelvollista reseptiä.</p></div>`;
    return;
  }

  const rivit = tarkistetut.map((kohta, i) => {
    const { resepti, varoitukset, kaksoiskappale } = kohta;
    const merkinnat = [
      resepti.kategoriat.join(', ') || '—',
      muotoileAika(resepti.aika_min),
      resepti.lisaaja
    ].filter(Boolean).join(' · ');

    const liput = [];
    if (kaksoiskappale) liput.push('<span class="lippu kaksoiskappale">Samanniminen on jo pankissa</span>');
    varoitukset.forEach((v) => liput.push(`<span class="lippu">${suojaa(v)}</span>`));

    return `
      <li class="tuorivi">
        <label>
          <input type="checkbox" data-i="${i}" ${kaksoiskappale ? '' : 'checked'}>
          <span class="tuorivi-teksti">
            <span class="tuorivi-nimi">${suojaa(resepti.nimi)}</span>
            <span class="tuorivi-meta">${suojaa(merkinnat)}</span>
            ${liput.length ? `<span class="liput">${liput.join('')}</span>` : ''}
          </span>
        </label>
      </li>`;
  }).join('');

  const ohitetut = virheet.length
    ? `<div class="huomio"><p>${virheet.map(suojaa).join('<br>')}</p></div>`
    : '';

  esikatseluElementti.innerHTML = `
    ${ohitetut}
    <div class="tuoyhteenveto">
      <strong>${tarkistetut.length}</strong> reseptiä luettu.
      ${tarkistetut.filter((k) => k.kaksoiskappale).length} samannimistä on jo pankissa —
      ne ovat oletuksena valitsematta.
    </div>
    <ul class="tuolista">${rivit}</ul>
    <div class="toiminnot">
      <button class="nappi" type="button" id="valitseKaikki">Valitse kaikki</button>
      <button class="nappi" type="button" id="poistaValinnat">Tyhjennä valinnat</button>
    </div>
    <div class="toiminnot">
      <button class="nappi paa" type="button" id="tuoValitut"></button>
    </div>`;

  esikatseluElementti.addEventListener('change', paivitaTuoNappi);
  document.getElementById('valitseKaikki').addEventListener('click', () => asetaKaikki(true));
  document.getElementById('poistaValinnat').addEventListener('click', () => asetaKaikki(false));
  document.getElementById('tuoValitut').addEventListener('click', tuoValitut);
  paivitaTuoNappi();
}

function ruudut() {
  return [...esikatseluElementti.querySelectorAll('input[type="checkbox"]')];
}

function asetaKaikki(tila) {
  ruudut().forEach((r) => { r.checked = tila; });
  paivitaTuoNappi();
}

function paivitaTuoNappi() {
  const nappi = document.getElementById('tuoValitut');
  if (!nappi) return;
  const maara = ruudut().filter((r) => r.checked).length;
  nappi.textContent = maara === 0 ? 'Ei valintoja' : `Tuo ${maara} reseptiä`;
  nappi.disabled = maara === 0;
}

// --- Tarkistus ja tuonti -------------------------------------------

async function tarkista(teksti) {
  tuoTila.textContent = '';
  esikatseluElementti.innerHTML = '';
  tarkistetut = [];

  if (!teksti.trim()) {
    tuoTila.textContent = 'Valitse tiedosto tai liitä JSON kenttään.';
    return;
  }

  try {
    olemassaOlevat = await haeReseptit();
  } catch (virhe) {
    tuoTila.textContent = 'Nykyisiä reseptejä ei saatu haettua, joten kaksoiskappaleita ei voi tunnistaa.';
    olemassaOlevat = [];
  }

  let raakalista;
  try {
    raakalista = poimiReseptit(teksti);
  } catch (virhe) {
    tuoTila.textContent = virhe.message;
    return;
  }

  const virheet = [];
  raakalista.forEach((raaka, i) => {
    const tulos = normalisoi(raaka, i);
    if (tulos.virhe) virheet.push(tulos.virhe);
    else tarkistetut.push(tulos);
  });

  piirraEsikatselu(virheet);
}

async function tuoValitut() {
  const nappi = document.getElementById('tuoValitut');
  const valitut = ruudut().filter((r) => r.checked)
    .map((r) => tarkistetut[Number(r.dataset.i)].resepti);

  if (!valitut.length) return;

  nappi.disabled = true;
  nappi.textContent = 'Tuodaan…';

  try {
    const lisatyt = await lisaaReseptit(valitut);
    esikatseluElementti.innerHTML = `
      <div class="huomio">
        <h2>Valmista</h2>
        <p>${lisatyt.length} reseptiä lisättiin pankkiin.
        <a href="index.html">Katso reseptit</a></p>
      </div>`;
    liitettyKentta.value = '';
    tiedostoSyote.value = '';
    document.getElementById('tiedostoTeksti').innerHTML =
      '<span class="iso" aria-hidden="true">📄</span> Valitse JSON-tiedosto';
  } catch (virhe) {
    console.error(virhe);
    nappi.disabled = false;
    paivitaTuoNappi();
    tuoTila.textContent =
      'Tuonti ei onnistunut eikä yhtään reseptiä lisätty. Tarkista verkkoyhteys ja yritä uudelleen.';
  }
}

tarkistaNappi.addEventListener('click', () => tarkista(liitettyKentta.value));

tiedostoSyote.addEventListener('change', () => {
  const tiedosto = tiedostoSyote.files[0];
  if (!tiedosto) return;

  document.getElementById('tiedostoTeksti').innerHTML =
    `<span class="iso" aria-hidden="true">📄</span> ${suojaa(tiedosto.name)}`;

  const lukija = new FileReader();
  lukija.onload = () => {
    liitettyKentta.value = lukija.result;
    tarkista(lukija.result);
  };
  lukija.onerror = () => { tuoTila.textContent = 'Tiedostoa ei voitu lukea.'; };
  lukija.readAsText(tiedosto);
});

// --- Vienti ---------------------------------------------------------

// Sama muoto kuin tuonnissa, jotta varmuuskopion voi tuoda takaisin.
function vientiMuoto(reseptit) {
  return {
    versio: TUETTU_VERSIO,
    viety: new Date().toISOString().slice(0, 10),
    reseptit: reseptit.map((r) => ({
      nimi: r.nimi,
      kategoriat: listaksi(r.kategoriat),
      paaraaka_aineet: listaksi(r.paaraaka_aineet),
      aika: muotoileAika(r.aika_min) || undefined,
      annokset: r.annokset || undefined,
      ainekset: riveiksi(r.ainekset),
      ohje: riveiksi(r.ohje),
      vinkki: r.vinkki || undefined,
      lisaaja: r.lisaaja || undefined,
      kuva_url: r.kuva_url || undefined,
      suosikki: r.suosikki || undefined
    }))
  };
}

document.getElementById('vie').addEventListener('click', async (tapahtuma) => {
  const nappi = tapahtuma.currentTarget;
  const tila = document.getElementById('vieTila');
  nappi.disabled = true;
  tila.textContent = 'Haetaan reseptejä…';

  try {
    const reseptit = await haeReseptit();
    const sisalto = JSON.stringify(vientiMuoto(reseptit), null, 2);
    const blob = new Blob([sisalto], { type: 'application/json' });
    const osoite = URL.createObjectURL(blob);

    const linkki = document.createElement('a');
    linkki.href = osoite;
    linkki.download = `reseptipankki-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(linkki);
    linkki.click();
    linkki.remove();
    setTimeout(() => URL.revokeObjectURL(osoite), 1000);

    tila.textContent = `${reseptit.length} reseptiä tallennettu tiedostoon.`;
  } catch (virhe) {
    console.error(virhe);
    tila.textContent = 'Vienti ei onnistunut. Tarkista verkkoyhteys.';
  } finally {
    nappi.disabled = false;
  }
});

// --- Käynnistys ------------------------------------------------------

if (!ON_ASETETTU) {
  document.getElementById('asetusvaroitus').innerHTML = `
    <div class="huomio"><h2>Yhteys puuttuu vielä</h2>
    <p>Täytä <code>config.js</code>-tiedostoon Supabase-projektin osoite ja
    anon-avain.</p></div>`;
  tarkistaNappi.disabled = true;
  document.getElementById('vie').disabled = true;
}
