// ---------------------------------------------------------------
//  Etusivu: reseptien selaus, haku, suodatus ja arvonta.
// ---------------------------------------------------------------

const parametrit = new URLSearchParams(location.search);
const vainSuosikit = parametrit.get('suosikit') === '1';

let kaikkiReseptit = [];
let valittuKategoria = 'Kaikki';

const listaElementti = document.getElementById('lista');
const hakuElementti = document.getElementById('haku');

function suojaa(teksti) {
  return String(teksti ?? '').replace(/[&<>"']/g, (merkki) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[merkki]);
}

function naytaAsetusohje() {
  document.getElementById('asetusvaroitus').innerHTML = `
    <div class="huomio">
      <h2>Yhteys puuttuu vielä</h2>
      <p>Avaa tiedosto <code>config.js</code> ja täytä siihen Supabase-projektisi
      <code>Project URL</code> ja <code>anon</code>-avain. Ohjeet ovat
      <code>README.md</code>-tiedostossa.</p>
    </div>`;
  listaElementti.className = '';
  listaElementti.innerHTML = '';
  document.getElementById('arvo').disabled = true;
}

// --- Suodatinsirut ----------------------------------------------

function piirraSuodattimet() {
  const kaytossa = [...new Set(kaikkiReseptit.map((r) => r.kategoria).filter(Boolean))];
  const jarjestetyt = KATEGORIAT.filter((k) => kaytossa.includes(k))
    .concat(kaytossa.filter((k) => !KATEGORIAT.includes(k)));

  document.getElementById('suodattimet').innerHTML = ['Kaikki', ...jarjestetyt]
    .map((kategoria) => `
      <button class="siru" type="button" data-kategoria="${suojaa(kategoria)}"
        aria-pressed="${kategoria === valittuKategoria}">${suojaa(kategoria)}</button>`)
    .join('');

  document.querySelectorAll('.siru').forEach((sirunappi) => {
    sirunappi.addEventListener('click', () => {
      valittuKategoria = sirunappi.dataset.kategoria;
      piirraSuodattimet();
      piirraLista();
    });
  });
}

// --- Suodatuslogiikka -------------------------------------------

function suodatetut() {
  const hakusana = hakuElementti.value.trim().toLowerCase();

  return kaikkiReseptit.filter((resepti) => {
    if (vainSuosikit && !resepti.suosikki) return false;
    if (valittuKategoria !== 'Kaikki' && resepti.kategoria !== valittuKategoria) return false;
    if (!hakusana) return true;

    const haettava = [
      resepti.nimi,
      resepti.kategoria,
      resepti.paaraaka_aine,
      resepti.ainekset
    ].join(' ').toLowerCase();

    return haettava.includes(hakusana);
  });
}

// --- Lista -------------------------------------------------------

function korttiHtml(resepti) {
  const emoji = KATEGORIA_EMOJI[resepti.kategoria] || '🍴';
  const kuva = resepti.kuva_url
    ? `<img src="${suojaa(resepti.kuva_url)}" alt="" loading="lazy">`
    : `<span aria-hidden="true">${emoji}</span>`;

  const meta = [
    resepti.aika_min ? `${resepti.aika_min} min` : null,
    resepti.kategoria
  ].filter(Boolean).join(' · ');

  return `
    <a class="kortti" href="resepti.html?id=${encodeURIComponent(resepti.id)}">
      <div class="kuva">
        ${kuva}
        ${resepti.suosikki ? '<span class="sydan" aria-label="Suosikki">❤️</span>' : ''}
      </div>
      <div class="teksti">
        <h3>${suojaa(resepti.nimi)}</h3>
        <div class="meta">${suojaa(meta)}</div>
      </div>
    </a>`;
}

function piirraLista() {
  const nakyvat = suodatetut();
  listaElementti.className = 'ruudukko';

  if (nakyvat.length === 0) {
    listaElementti.className = '';
    const tyhjaViesti = kaikkiReseptit.length === 0
      ? `<span class="iso" aria-hidden="true">🥣</span>
         <h2>Pankki on vielä tyhjä</h2>
         <p>Lisää ensimmäinen resepti alareunan plus-painikkeesta.</p>`
      : vainSuosikit && !hakuElementti.value && valittuKategoria === 'Kaikki'
        ? `<span class="iso" aria-hidden="true">❤️</span>
           <h2>Ei suosikkeja vielä</h2>
           <p>Merkitse resepti suosikiksi sen omalta sivulta.</p>`
        : `<span class="iso" aria-hidden="true">🔍</span>
           <h2>Ei osumia</h2>
           <p>Kokeile toista hakusanaa tai valitse “Kaikki”.</p>`;
    listaElementti.innerHTML = `<div class="tyhja">${tyhjaViesti}</div>`;
    return;
  }

  listaElementti.innerHTML = nakyvat.map(korttiHtml).join('');
}

// --- Arvonta ------------------------------------------------------

document.getElementById('arvo').addEventListener('click', () => {
  const ehdokkaat = suodatetut();
  if (ehdokkaat.length === 0) {
    alert('Ei reseptejä joista arpoa. Poista suodatin tai lisää uusi resepti.');
    return;
  }
  const valittu = ehdokkaat[Math.floor(Math.random() * ehdokkaat.length)];
  location.href = `resepti.html?id=${encodeURIComponent(valittu.id)}&arvottu=1`;
});

hakuElementti.addEventListener('input', piirraLista);

// --- Alanavigaation korostus --------------------------------------

document
  .querySelector(`[data-navi="${vainSuosikit ? 'suosikit' : 'kaikki'}"]`)
  .setAttribute('aria-current', 'page');

if (vainSuosikit) {
  document.getElementById('otsikko').textContent = 'Suosikit';
  document.getElementById('alaotsikko').textContent = 'Ne parhaat, aina käden ulottuvilla';
}

// --- Käynnistys ----------------------------------------------------

async function kaynnista() {
  if (!ON_ASETETTU) {
    naytaAsetusohje();
    return;
  }
  try {
    kaikkiReseptit = await haeReseptit();
    piirraSuodattimet();
    piirraLista();
  } catch (virhe) {
    listaElementti.className = '';
    listaElementti.innerHTML = `
      <div class="tyhja">
        <span class="iso" aria-hidden="true">📡</span>
        <h2>Reseptejä ei saatu haettua</h2>
        <p>Tarkista verkkoyhteys ja yritä uudelleen.</p>
      </div>`;
    console.error(virhe);
  }
}

kaynnista();
