// ---------------------------------------------------------------
//  Yksittäisen reseptin sivu.
// ---------------------------------------------------------------

const osoiteParametrit = new URLSearchParams(location.search);
const reseptiId = osoiteParametrit.get('id');

const sisaltoElementti = document.getElementById('sisalto');
let resepti = null;
let naytonLukko = null;

// Jokainen osio saa oman listansa. Työvaiheissa se tarkoittaa myös omaa
// numerointia: pohjan vaiheet 1–3, täytteen vaiheet taas 1:stä alkaen.
function ainesosiotHtml(osiot) {
  return osiot.map((osio) => `
    ${osio.otsikko ? `<h3 class="osio-otsikko">${suojaa(osio.otsikko)}</h3>` : ''}
    ${osio.rivit.length ? `
      <ul class="ainekset">
        ${osio.rivit.map((aines) => `
          <li><span class="ruutu" aria-hidden="true">✓</span><span class="teksti">${suojaa(aines)}</span></li>
        `).join('')}
      </ul>` : ''}`).join('');
}

function ohjeosiotHtml(osiot) {
  return osiot.map((osio) => `
    ${osio.otsikko ? `<h3 class="osio-otsikko">${suojaa(osio.otsikko)}</h3>` : ''}
    ${osio.rivit.length ? `
      <ol class="askeleet">
        ${osio.rivit.map((askel) => `<li><div>${suojaa(askel)}</div></li>`).join('')}
      </ol>` : ''}`).join('');
}

function piirra() {
  const kategoriat = listaksi(resepti.kategoriat);
  const raakaAineet = listaksi(resepti.paaraaka_aineet);

  // Kortin ja yläkuvan sävy tulee ensimmäisestä kategoriasta.
  const paakategoria = kategoriat[0] || 'Muut';
  const emoji = kategorianEmoji(paakategoria);
  const vari = kategorianVari(paakategoria);

  const kuvaOsa = resepti.kuva_url
    ? `<img class="hero saapuva-kuva" src="${suojaa(resepti.kuva_url)}" alt="${suojaa(resepti.nimi)}">`
    : `<div class="hero-tyhja saapuva-kuva ${vari}" aria-hidden="true">${emoji}</div>`;

  const aika = muotoileAika(resepti.aika_min);

  // Kategoriat ovat linkkejä omiin listoihinsa, muut tiedot pelkkiä
  // merkintöjä.
  const kategoriaMerkit = kategoriat.map((k) =>
    `<a class="tieto tieto-linkki" href="index.html?kategoria=${encodeURIComponent(k)}">
       <span aria-hidden="true">${kategorianEmoji(k)}</span> ${suojaa(k)}</a>`).join('');

  const muutMerkit = [
    aika ? `⏱ ${aika}` : null,
    resepti.annokset ? `🍽 ${resepti.annokset} annosta` : null
  ].filter(Boolean).map((t) => `<span class="tieto">${suojaa(t)}</span>`).join('');

  const raakaAineMerkit = raakaAineet.length ? `
    <div class="tiedot raaka-aineet">
      ${raakaAineet.map((a) => `<span class="tieto raaka-aine">${suojaa(a)}</span>`).join('')}
    </div>` : '';

  const ainesosiot = osioiksi(resepti.ainekset);
  const ohjeosiot = osioiksi(resepti.ohje);

  sisaltoElementti.className = '';
  sisaltoElementti.innerHTML = `
    ${kuvaOsa}
    <div class="sisalto saapuva-teksti">
      <div class="resepti-otsikko">
        <h1>${suojaa(resepti.nimi)}</h1>
      </div>

      <div class="tiedot">${kategoriaMerkit}${muutMerkit}</div>
      ${raakaAineMerkit}

      ${resepti.lisaaja
        ? `<p class="lisaaja">Reseptin lisäsi <strong>${suojaa(resepti.lisaaja)}</strong></p>`
        : ''}

      <div class="toiminnot">
        <button class="nappi" type="button" id="suosikkiNappi"></button>
        <button class="nappi" type="button" id="jaaNappi">📤 Jaa resepti</button>
        <button class="nappi" type="button" id="hereillaNappi">💡 Pidä näyttö auki</button>
      </div>

      <div class="resepti-palstat">
      ${osioissaSisaltoa(ainesosiot) ? `
      <section class="osio">
        <h2>Ainekset</h2>
        ${ainesosiotHtml(ainesosiot)}
      </section>` : ''}

      ${osioissaSisaltoa(ohjeosiot) ? `
      <section class="osio">
        <h2>Näin teet</h2>
        ${ohjeosiotHtml(ohjeosiot)}
      </section>` : ''}
      </div>

      ${resepti.vinkki ? `
      <section class="osio">
        <h2>${suojaa(vinkinOtsikko(resepti.lisaaja))}</h2>
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

// --- Jakaminen ------------------------------------------------------

// Resepti luettavana tekstinä. Sukulainen näkee ohjeen suoraan viestissä
// eikä joudu avaamaan linkkiä, jos ei halua.
function jaettavaTeksti() {
  const osat = [resepti.nimi];

  const aika = muotoileAika(resepti.aika_min);
  const tiedot = [
    aika,
    resepti.annokset ? `${resepti.annokset} annosta` : null
  ].filter(Boolean).join(' · ');
  if (tiedot) osat.push(tiedot);

  const ainesosiot = osioiksi(resepti.ainekset);
  if (osioissaSisaltoa(ainesosiot)) {
    osat.push('', 'AINEKSET');
    for (const osio of ainesosiot) {
      if (osio.otsikko) osat.push('', osio.otsikko);
      osat.push(...osio.rivit.map((rivi) => `- ${rivi}`));
    }
  }

  const ohjeosiot = osioiksi(resepti.ohje);
  if (osioissaSisaltoa(ohjeosiot)) {
    osat.push('', 'NÄIN TEET');
    for (const osio of ohjeosiot) {
      if (osio.otsikko) osat.push('', osio.otsikko);
      // Numerointi alkaa alusta jokaisessa osiossa, kuten sovelluksessakin.
      osat.push(...osio.rivit.map((rivi, i) => `${i + 1}. ${rivi}`));
    }
  }

  if (resepti.vinkki) osat.push('', `${vinkinOtsikko(resepti.lisaaja)}: ${resepti.vinkki}`);
  if (resepti.lisaaja) osat.push('', `Reseptin lisäsi ${resepti.lisaaja}`);

  return osat.join('\n');
}

function reseptinOsoite() {
  return `${location.origin}${location.pathname}?id=${encodeURIComponent(resepti.id)}`;
}

async function jaaResepti(nappi) {
  const osoite = reseptinOsoite();
  const teksti = jaettavaTeksti();

  // Puhelimessa tämä avaa käyttöjärjestelmän oman jakovalikon, josta
  // reseptin saa lähetettyä millä tahansa asennetulla sovelluksella.
  if (navigator.share) {
    try {
      await navigator.share({ title: resepti.nimi, text: teksti, url: osoite });
      return;
    } catch (virhe) {
      // Jakovalikon sulkeminen ei ole virhe, eikä siitä kerrota mitään.
      if (virhe.name === 'AbortError') return;
    }
  }

  const alkuperainen = nappi.textContent;
  try {
    await navigator.clipboard.writeText(`${teksti}\n\n${osoite}`);
    nappi.textContent = '✓ Kopioitu leikepöydälle';
    nappi.disabled = true;
    setTimeout(() => {
      nappi.textContent = alkuperainen;
      nappi.disabled = false;
    }, 2200);
  } catch (virhe) {
    prompt('Kopioi reseptin linkki:', osoite);
  }
}

// --- Toiminnot -------------------------------------------------------

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

  document.getElementById('jaaNappi').addEventListener('click', (tapahtuma) => {
    jaaResepti(tapahtuma.currentTarget);
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

// --- Käynnistys --------------------------------------------------------

function naytaEiLoytynyt(virhe) {
  sisaltoElementti.className = '';
  sisaltoElementti.innerHTML = `
    <div class="tyhja"><span class="iso" aria-hidden="true">🤔</span>
    <h2>Reseptiä ei löytynyt</h2>
    <p><a href="index.html">Takaisin listaan</a></p></div>`;
  if (virhe) console.error(virhe);
}

async function kaynnista() {
  if (!ON_ASETETTU || !reseptiId) return naytaEiLoytynyt();

  try {
    resepti = await haeResepti(reseptiId);
    if (!resepti) throw new Error('Ei löytynyt');
    document.title = `${resepti.nimi} · Reseptipankki`;
    piirra();
  } catch (virhe) {
    naytaEiLoytynyt(virhe);
  }
}

kaynnista();
