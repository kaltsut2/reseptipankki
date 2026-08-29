// ---------------------------------------------------------------
//  Yksittäisen reseptin sivu.
// ---------------------------------------------------------------

const osoiteParametrit = new URLSearchParams(location.search);
const reseptiId = osoiteParametrit.get('id');
const oliArvottu = osoiteParametrit.get('arvottu') === '1';

const sisaltoElementti = document.getElementById('sisalto');
let resepti = null;
let naytonLukko = null;

function suojaa(teksti) {
  return String(teksti ?? '').replace(/[&<>"']/g, (merkki) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[merkki]);
}

// Muuttaa monirivisen tekstin listaksi ja siivoaa tyhjät rivit sekä
// käsin kirjoitetut luetteloviivat pois.
function riveiksi(teksti) {
  return String(teksti || '')
    .split('\n')
    .map((rivi) => rivi.replace(/^\s*[-–•*]\s*/, '').trim())
    .filter(Boolean);
}

function piirra() {
  const emoji = KATEGORIA_EMOJI[resepti.kategoria] || '🍴';

  const kuvaOsa = resepti.kuva_url
    ? `<img class="hero" src="${suojaa(resepti.kuva_url)}" alt="${suojaa(resepti.nimi)}">`
    : `<div class="hero-tyhja" aria-hidden="true">${emoji}</div>`;

  const tiedot = [
    resepti.kategoria,
    resepti.aika_min ? `⏱ ${resepti.aika_min} min` : null,
    resepti.annokset ? `🍽 ${resepti.annokset} annosta` : null,
    resepti.paaraaka_aine
  ].filter(Boolean);

  const ainekset = riveiksi(resepti.ainekset);
  const askeleet = riveiksi(resepti.ohje);

  sisaltoElementti.className = '';
  sisaltoElementti.innerHTML = `
    ${kuvaOsa}
    <div class="sisalto">
      ${oliArvottu ? '<div class="huomio" style="margin-top:16px">🎲 Arvottu ehdotus — paina uudelleen etusivulla jos haluat toisen.</div>' : ''}

      <div class="resepti-otsikko">
        <h1>${suojaa(resepti.nimi)}</h1>
      </div>

      <div class="tiedot">
        ${tiedot.map((tieto) => `<span class="tieto">${suojaa(tieto)}</span>`).join('')}
      </div>

      <div class="toiminnot">
        <button class="nappi" type="button" id="suosikkiNappi"></button>
        <button class="nappi" type="button" id="hereillaNappi">💡 Pidä näyttö auki</button>
      </div>

      ${ainekset.length ? `
      <section class="osio">
        <h2>Ainekset</h2>
        <ul class="ainekset">
          ${ainekset.map((aines) => `
            <li><span class="ruutu" aria-hidden="true">✓</span><span>${suojaa(aines)}</span></li>
          `).join('')}
        </ul>
      </section>` : ''}

      ${askeleet.length ? `
      <section class="osio">
        <h2>Näin teet</h2>
        <ol class="askeleet">
          ${askeleet.map((askel) => `<li><div>${suojaa(askel)}</div></li>`).join('')}
        </ol>
      </section>` : ''}

      ${resepti.vinkki ? `
      <section class="osio">
        <h2>Äidin vinkki</h2>
        <div class="vinkki">${suojaa(resepti.vinkki)}</div>
      </section>` : ''}

      <div class="toiminnot">
        <a class="nappi" href="lisaa.html?id=${encodeURIComponent(resepti.id)}">✏️ Muokkaa</a>
        <button class="nappi vaara" type="button" id="poistaNappi">🗑 Poista</button>
      </div>
    </div>`;

  paivitaSuosikkiNappi();
  liitaTapahtumat();
}

function paivitaSuosikkiNappi() {
  document.getElementById('suosikkiNappi').textContent =
    resepti.suosikki ? '❤️ Suosikki' : '🤍 Merkitse suosikiksi';
}

function liitaTapahtumat() {
  // Aineksen voi kuitata tehdyksi napauttamalla riviä.
  document.querySelectorAll('.ainekset li').forEach((rivi) => {
    rivi.addEventListener('click', () => rivi.classList.toggle('valmis'));
  });

  document.getElementById('suosikkiNappi').addEventListener('click', async (tapahtuma) => {
    const nappi = tapahtuma.currentTarget;
    nappi.disabled = true;
    try {
      resepti.suosikki = !resepti.suosikki;
      await paivitaResepti(resepti.id, { suosikki: resepti.suosikki });
      paivitaSuosikkiNappi();
    } catch (virhe) {
      resepti.suosikki = !resepti.suosikki;
      alert('Suosikkimerkinnän tallennus ei onnistunut.');
      console.error(virhe);
    } finally {
      nappi.disabled = false;
    }
  });

  document.getElementById('poistaNappi').addEventListener('click', async () => {
    if (!confirm(`Poistetaanko resepti “${resepti.nimi}” pysyvästi?`)) return;
    try {
      await poistaResepti(resepti.id);
      location.href = 'index.html';
    } catch (virhe) {
      alert('Poisto ei onnistunut.');
      console.error(virhe);
    }
  });

  // Näyttö pysyy hereillä kokkaamisen ajan (tuettu uudemmissa selaimissa).
  const hereillaNappi = document.getElementById('hereillaNappi');
  if (!('wakeLock' in navigator)) {
    hereillaNappi.remove();
  } else {
    hereillaNappi.addEventListener('click', async () => {
      try {
        if (naytonLukko) {
          await naytonLukko.release();
          naytonLukko = null;
          hereillaNappi.textContent = '💡 Pidä näyttö auki';
        } else {
          naytonLukko = await navigator.wakeLock.request('screen');
          naytonLukko.addEventListener('release', () => {
            naytonLukko = null;
            hereillaNappi.textContent = '💡 Pidä näyttö auki';
          });
          hereillaNappi.textContent = '🔆 Näyttö pysyy auki';
        }
      } catch (virhe) {
        console.error(virhe);
      }
    });
  }
}

async function kaynnista() {
  if (!ON_ASETETTU || !reseptiId) {
    sisaltoElementti.className = '';
    sisaltoElementti.innerHTML = `
      <div class="tyhja"><span class="iso">🤔</span><h2>Reseptiä ei löytynyt</h2>
      <p><a href="index.html">Takaisin listaan</a></p></div>`;
    return;
  }
  try {
    resepti = await haeResepti(reseptiId);
    if (!resepti) throw new Error('Ei löytynyt');
    document.title = `${resepti.nimi} · Reseptipankki`;
    piirra();
  } catch (virhe) {
    sisaltoElementti.className = '';
    sisaltoElementti.innerHTML = `
      <div class="tyhja"><span class="iso">🤔</span><h2>Reseptiä ei löytynyt</h2>
      <p><a href="index.html">Takaisin listaan</a></p></div>`;
    console.error(virhe);
  }
}

kaynnista();
