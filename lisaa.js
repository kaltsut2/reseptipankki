// ---------------------------------------------------------------
//  Reseptin lisäys ja muokkaus.
//  Sama sivu hoitaa molemmat: ?id=... tarkoittaa muokkausta.
// ---------------------------------------------------------------

const muokattavaId = new URLSearchParams(location.search).get('id');

const lomake = document.getElementById('lomake');
const tallennaNappi = document.getElementById('tallenna');
const tilaTeksti = document.getElementById('tila');
const kuvaSyote = document.getElementById('kuva');
const aikaKentta = document.getElementById('aika');
const lisaajaKentta = document.getElementById('lisaaja');

const LISAAJA_AVAIN = 'reseptipankki.lisaaja';

let valittuKuvatiedosto = null;   // uusi kuva, joka lähetetään tallennuksen yhteydessä
let nykyinenKuvaUrl = null;       // muokattaessa jo tallennettu kuva

// --- Monivalintasirut ---------------------------------------------
//
//  Puhelimessa napautettavat sirut ovat selvästi helpompia kuin
//  monivalintavalikko, joka iOS:ssä vaatii vierityslistan raahaamista.

function siruHtml(arvo, ryhmanNimi) {
  return `<button type="button" class="valintasiru" data-ryhma="${ryhmanNimi}"
    data-arvo="${suojaa(arvo)}" aria-pressed="false">${suojaa(arvo)}</button>`;
}

document.getElementById('kategoriavalinnat').innerHTML = KATEGORIARYHMAT
  .map((ryhma) => `
    <div class="valintaosio">
      <h3><span aria-hidden="true">${ryhma.emoji}</span> ${suojaa(ryhma.nimi)}</h3>
      <div class="valintasirut">
        ${ryhma.kategoriat.map((k) => siruHtml(k, 'kategoria')).join('')}
      </div>
    </div>`)
  .join('');

document.getElementById('raakaainevalinnat').innerHTML =
  RAAKA_AINEET.map((a) => siruHtml(a, 'raakaaine')).join('');

document.querySelectorAll('.valintasiru').forEach((siru) => {
  siru.addEventListener('click', () => {
    const paalla = siru.getAttribute('aria-pressed') === 'true';
    siru.setAttribute('aria-pressed', String(!paalla));
  });
});

function valitut(ryhma) {
  return [...document.querySelectorAll(
    `.valintasiru[data-ryhma="${ryhma}"][aria-pressed="true"]`
  )].map((s) => s.dataset.arvo);
}

function asetaValinnat(ryhma, arvot) {
  const lista = listaksi(arvot);
  document.querySelectorAll(`.valintasiru[data-ryhma="${ryhma}"]`).forEach((siru) => {
    siru.setAttribute('aria-pressed', String(lista.includes(siru.dataset.arvo)));
  });
}

// --- Valmistusaika -------------------------------------------------
//
//  Kenttä ottaa vastaan minkä tahansa muodon, ja esikatselu kertoo heti
//  mihin muotoon se tallentuu.

function paivitaAikaEsikatselu() {
  const esikatselu = document.getElementById('aikaEsikatselu');
  const syote = aikaKentta.value.trim();

  if (!syote) { esikatselu.textContent = ''; return; }

  const minuutit = jasennaAika(syote);
  esikatselu.textContent = minuutit
    ? `Tallennetaan muodossa ${muotoileAika(minuutit)}`
    : 'Aikaa ei tunnistettu — kokeile esimerkiksi “45 min” tai “1,5 h”';
}

aikaKentta.addEventListener('input', paivitaAikaEsikatselu);

// --- Kuvan esikatselu ----------------------------------------------

function naytaEsikatselu(lahde) {
  document.getElementById('kuvalaatikko').classList.add('taytetty');
  document.getElementById('kuvaTeksti').innerHTML =
    `<img src="${lahde}" alt="Valittu kuva">`;
}

kuvaSyote.addEventListener('change', () => {
  const tiedosto = kuvaSyote.files[0];
  if (!tiedosto) return;
  valittuKuvatiedosto = tiedosto;
  naytaEsikatselu(URL.createObjectURL(tiedosto));
});

// --- Lisääjän muistaminen ------------------------------------------
//
//  Nimi tallennetaan selaimen muistiin ensimmäisen lisäyksen
//  yhteydessä, jolloin se on jatkossa valmiina. Muistiin menee sama
//  muoto kuin kantaan, eli vastaavuustaulun läpi kulkenut nimi. Kenttä
//  on silti tavallinen tekstikenttä, joten toisen laitetta lainatessa
//  nimen voi vaihtaa käsin ilman että se muuttaa laitteen omaa
//  oletusta pysyvästi.

function muistettuLisaaja() {
  try {
    return localStorage.getItem(LISAAJA_AVAIN) || '';
  } catch (virhe) {
    return '';   // yksityinen selaus tai estetty tallennus
  }
}

function muistaLisaaja(nimi) {
  try {
    if (nimi) localStorage.setItem(LISAAJA_AVAIN, nimi);
  } catch (virhe) {
    /* ei kriittinen */
  }
}

// Aiemmin käytetyt nimet ehdotuksiksi, jotta kirjoitusasu pysyy samana.
async function taytaLisaajaEhdotukset() {
  try {
    const nimet = [...new Set((await haeReseptit())
      .map((r) => r.lisaaja).filter(Boolean))].sort();
    document.getElementById('lisaajaEhdotukset').innerHTML =
      nimet.map((n) => `<option value="${suojaa(n)}"></option>`).join('');
  } catch (virhe) {
    /* ehdotukset ovat mukavuus, ei välttämättömyys */
  }
}

// --- Tallennus ------------------------------------------------------

function numeroTaiNull(arvo) {
  const luku = parseInt(arvo, 10);
  return Number.isFinite(luku) ? luku : null;
}

lomake.addEventListener('submit', async (tapahtuma) => {
  tapahtuma.preventDefault();

  const nimi = document.getElementById('nimi').value.trim();
  if (!nimi) {
    tilaTeksti.textContent = 'Anna ruoalle nimi ennen tallennusta.';
    document.getElementById('nimi').focus();
    return;
  }

  tallennaNappi.disabled = true;
  tallennaNappi.textContent = 'Tallennetaan…';
  tilaTeksti.textContent = '';

  try {
    let kuvaUrl = nykyinenKuvaUrl;

    if (valittuKuvatiedosto) {
      tallennaNappi.textContent = 'Lähetetään kuvaa…';
      kuvaUrl = await lahetaKuva(valittuKuvatiedosto);
    }

    const lisaaja = normalisoiLisaaja(lisaajaKentta.value);

    const tiedot = {
      nimi,
      kategoriat: valitut('kategoria'),
      paaraaka_aineet: valitut('raakaaine'),
      aika_min: jasennaAika(aikaKentta.value),
      annokset: numeroTaiNull(document.getElementById('annokset').value),
      ainekset: document.getElementById('ainekset').value.trim() || null,
      ohje: document.getElementById('ohje').value.trim() || null,
      vinkki: document.getElementById('vinkki').value.trim() || null,
      lisaaja,
      kuva_url: kuvaUrl
    };

    tallennaNappi.textContent = 'Tallennetaan…';

    const tallennettu = muokattavaId
      ? await paivitaResepti(muokattavaId, tiedot)
      : await lisaaResepti(tiedot);

    muistaLisaaja(lisaaja);
    location.href = `resepti.html?id=${encodeURIComponent(tallennettu.id)}`;
  } catch (virhe) {
    console.error(virhe);
    tilaTeksti.textContent =
      'Tallennus ei onnistunut. Tarkista verkkoyhteys ja yritä uudelleen.';
    tallennaNappi.disabled = false;
    tallennaNappi.textContent = muokattavaId ? 'Tallenna muutokset' : 'Tallenna resepti';
  }
});

// --- Muokkaustila ---------------------------------------------------

async function lataaMuokattava() {
  document.getElementById('otsikko').textContent = 'Muokkaa reseptiä';
  document.title = 'Muokkaa reseptiä · Reseptipankki';
  tallennaNappi.textContent = 'Tallenna muutokset';

  try {
    const resepti = await haeResepti(muokattavaId);
    if (!resepti) return;

    document.getElementById('nimi').value = resepti.nimi || '';
    document.getElementById('annokset').value = resepti.annokset ?? '';
    document.getElementById('ainekset').value = resepti.ainekset || '';
    document.getElementById('ohje').value = resepti.ohje || '';
    document.getElementById('vinkki').value = resepti.vinkki || '';

    asetaValinnat('kategoria', resepti.kategoriat);
    asetaValinnat('raakaaine', resepti.paaraaka_aineet);

    // Muokattaessa aika näytetään jo valmiissa muodossa.
    aikaKentta.value = muotoileAika(resepti.aika_min) || '';
    paivitaAikaEsikatselu();

    // Muokatessa säilytetään alkuperäinen lisääjä, ei ylikirjoiteta
    // sitä tämän laitteen muistetulla nimellä.
    lisaajaKentta.value = resepti.lisaaja || '';

    nykyinenKuvaUrl = resepti.kuva_url || null;
    if (nykyinenKuvaUrl) naytaEsikatselu(nykyinenKuvaUrl);

    document.querySelector('.takaisin').setAttribute(
      'href', `resepti.html?id=${encodeURIComponent(muokattavaId)}`);
  } catch (virhe) {
    console.error(virhe);
    tilaTeksti.textContent = 'Reseptin tietoja ei saatu haettua.';
  }
}

// --- Käynnistys -------------------------------------------------------

if (!ON_ASETETTU) {
  document.getElementById('asetusvaroitus').innerHTML = `
    <div class="huomio">
      <h2>Yhteys puuttuu vielä</h2>
      <p>Täytä <code>config.js</code>-tiedostoon Supabase-projektin osoite ja
      anon-avain, niin tallennus alkaa toimia.</p>
    </div>`;
  tallennaNappi.disabled = true;
} else if (muokattavaId) {
  lataaMuokattava();
  taytaLisaajaEhdotukset();
} else {
  lisaajaKentta.value = muistettuLisaaja();
  taytaLisaajaEhdotukset();
}
