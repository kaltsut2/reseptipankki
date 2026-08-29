// ---------------------------------------------------------------
//  Etusivu: reseptien selaus, haku, suodatus ja arvonta.
// ---------------------------------------------------------------

const parametrit = new URLSearchParams(location.search);
const vainSuosikit = parametrit.get('suosikit') === '1';

let kaikkiReseptit = [];
let valittuKategoria = 'Kaikki';
let ensimmainenPiirto = true;

const listaElementti = document.getElementById('lista');
const hakuElementti = document.getElementById('haku');
const arvoNappi = document.getElementById('arvo');

const vahennaLiiketta = window.matchMedia('(prefers-reduced-motion: reduce)');

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
  arvoNappi.disabled = true;
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

function korttiHtml(resepti, jarjestys) {
  const emoji = KATEGORIA_EMOJI[resepti.kategoria] || '🍴';
  const vari = kategorianVari(resepti.kategoria);

  const kuva = resepti.kuva_url
    ? `<img src="${suojaa(resepti.kuva_url)}" alt="" loading="lazy">`
    : `<span aria-hidden="true">${emoji}</span>`;

  const meta = [
    resepti.aika_min ? `${resepti.aika_min} min` : null,
    resepti.kategoria
  ].filter(Boolean).join(' · ');

  // Porrastus katkaistaan kahdentoista jälkeen, jottei pitkän listan
  // häntä jää odottamaan omaa vuoroaan.
  return `
    <a class="kortti" href="resepti.html?id=${encodeURIComponent(resepti.id)}"
       style="--i:${Math.min(jarjestys, 11)}">
      <div class="kuva ${vari}">
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
    ensimmainenPiirto = false;
    return;
  }

  // Saapumisanimaatio vain ensilatauksella. Haku ja kategorian vaihto
  // päivittävät listan välittömästi, koska niitä tehdään istunnon
  // aikana toistuvasti ja liike tekisi niistä hidastuneen tuntuisia.
  listaElementti.className = ensimmainenPiirto ? 'ruudukko saapuu' : 'ruudukko';
  listaElementti.innerHTML = nakyvat.map(korttiHtml).join('');
  ensimmainenPiirto = false;
}

// --- Arvonnan alalevy --------------------------------------------
//
//  Arvonta ei enää vie toiselle sivulle, vaan nostaa tuloksen levylle
//  ruudun alareunasta. Näin uuden arvonnan voi pyytää heti, ja levyn
//  saa työnnettyä pois samalla eleellä jolla se tuli.

const verho = document.getElementById('verho');
const levy = document.getElementById('arpalevy');
const levySisalto = document.getElementById('arpasisalto');

let levyAuki = false;
let arvottuResepti = null;
let kehysId = null;

// Kevyt jousi. Vain eleen päättävään liikkeeseen: se jatkaa siitä
// nopeudesta jolla sormi irtosi, joten vedon ja animaation väliin ei
// jää saumaa.
function jousiKohti(alku, kohde, alkunopeus, kesto, kimmoisuus, paivita, valmis) {
  const taajuus = (2 * Math.PI) / kesto;
  const vaimennus = 1 - kimmoisuus;
  let arvo = alku;
  let nopeus = alkunopeus;
  let edellinen = null;

  cancelAnimationFrame(kehysId);

  function askel(aika) {
    if (edellinen === null) edellinen = aika;
    const dt = Math.min((aika - edellinen) / 1000, 1 / 30);
    edellinen = aika;

    const kiihtyvyys =
      -taajuus * taajuus * (arvo - kohde) - 2 * vaimennus * taajuus * nopeus;
    nopeus += kiihtyvyys * dt;
    arvo += nopeus * dt;

    if (Math.abs(arvo - kohde) < 0.5 && Math.abs(nopeus) < 12) {
      paivita(kohde);
      if (valmis) valmis();
      return;
    }

    paivita(arvo);
    kehysId = requestAnimationFrame(askel);
  }

  kehysId = requestAnimationFrame(askel);
}

// Apple käyttää tätä vierityksen hidastumiseen: paljonko matkaa on
// vielä jäljellä, kun sormi irtoaa tällä nopeudella.
function projisoi(nopeus, hidastuvuus = 0.998) {
  return (nopeus / 1000) * hidastuvuus / (1 - hidastuvuus);
}

function levySisaltoHtml(resepti) {
  const emoji = KATEGORIA_EMOJI[resepti.kategoria] || '🍴';
  const vari = kategorianVari(resepti.kategoria);

  const kuva = resepti.kuva_url
    ? `<img src="${suojaa(resepti.kuva_url)}" alt="">`
    : `<span aria-hidden="true">${emoji}</span>`;

  const meta = [
    resepti.kategoria,
    resepti.aika_min ? `${resepti.aika_min} min` : null
  ].filter(Boolean).join(' · ');

  return `
    <div class="arpa-ylapuoli">
      <div class="arpa-kuva ${vari}">${kuva}</div>
      <div>
        <h2 class="arpa-nimi">${suojaa(resepti.nimi)}</h2>
        <div class="arpa-meta">${suojaa(meta)}</div>
      </div>
    </div>
    <div class="arpa-napit">
      <button class="nappi" type="button" id="arvoUudelleen">🎲 Arvo toinen</button>
      <a class="nappi paa" href="resepti.html?id=${encodeURIComponent(resepti.id)}">Katso resepti</a>
    </div>`;
}

function avaaLevy(resepti) {
  arvottuResepti = resepti;

  // Sisältö vaihtuu ristihäivytyksellä, jotta uusi arvonta huomataan
  // myös silloin kun levy on jo auki. Siirtymä, ei keyframe — nopeasti
  // toistuva painallus jatkaa nykyisestä arvosta.
  levySisalto.style.opacity = '0';
  levySisalto.innerHTML = levySisaltoHtml(resepti);
  requestAnimationFrame(() => { levySisalto.style.opacity = '1'; });

  document.getElementById('arvoUudelleen').addEventListener('click', arvo);

  if (levyAuki) return;
  levyAuki = true;

  verho.hidden = false;
  levy.hidden = false;
  levy.style.transform = '';
  levy.classList.remove('vetaa');

  // Pakotetaan asettelu, jotta siirtymä lähtee suljetusta tilasta.
  void levy.offsetHeight;

  verho.classList.add('auki');
  levy.classList.add('auki');
}

function piilotaLevy() {
  levyAuki = false;
  cancelAnimationFrame(kehysId);
  levy.classList.remove('vetaa', 'auki');
  levy.style.transform = '';
  verho.classList.remove('auki');
  levy.hidden = true;
  verho.hidden = true;
}

function suljeLevy() {
  if (!levyAuki) return;
  levyAuki = false;
  cancelAnimationFrame(kehysId);

  levy.classList.remove('vetaa');
  levy.style.transform = '';
  levy.classList.remove('auki');
  verho.classList.remove('auki');

  const piiloon = () => {
    if (!levyAuki) {
      levy.hidden = true;
      verho.hidden = true;
    }
  };

  levy.addEventListener('transitionend', piiloon, { once: true });
  setTimeout(piiloon, 500);   // varmistus jos siirtymä ei laukea
}

// --- Levyn vetäminen ---------------------------------------------

let vedossa = false;
let tartuntaY = 0;
let siirtyma = 0;
let historia = [];

function nykyinenSiirtyma() {
  const muunnos = getComputedStyle(levy).transform;
  if (!muunnos || muunnos === 'none') return 0;
  const osat = muunnos.match(/matrix.*\((.+)\)/);
  if (!osat) return 0;
  const luvut = osat[1].split(', ').map(Number);
  return luvut.length === 6 ? luvut[5] : luvut[13];
}

// Reunavastus: mitä pidemmälle ylös vedetään, sitä vähemmän levy seuraa.
function kuminauha(ylitys, korkeus, kerroin = 0.55) {
  return (ylitys * korkeus * kerroin) / (korkeus + kerroin * Math.abs(ylitys));
}

levy.addEventListener('pointerdown', (tapahtuma) => {
  if (vahennaLiiketta.matches) return;              // levy vain häivytetään
  if (tapahtuma.target.closest('.nappi')) return;   // painikkeet toimivat normaalisti

  vedossa = true;

  // Kaappaus pitää vedon käynnissä vaikka sormi liukuisi levyn ulkopuolelle.
  try { levy.setPointerCapture(tapahtuma.pointerId); } catch (virhe) { /* ei tuettu */ }

  // Jatketaan siitä kohdasta jossa levy juuri nyt on, ei siitä mihin
  // se olisi matkalla — muuten tarttuminen kesken avautumisen nykäisisi.
  cancelAnimationFrame(kehysId);
  siirtyma = nykyinenSiirtyma();
  levy.classList.add('vetaa');
  levy.style.transform = `translateY(${siirtyma}px)`;

  tartuntaY = tapahtuma.clientY - siirtyma;
  historia = [{ y: tapahtuma.clientY, aika: tapahtuma.timeStamp }];
});

levy.addEventListener('pointermove', (tapahtuma) => {
  if (!vedossa) return;

  const raaka = tapahtuma.clientY - tartuntaY;
  siirtyma = raaka < 0 ? kuminauha(raaka, levy.offsetHeight) : raaka;
  levy.style.transform = `translateY(${siirtyma}px)`;

  historia.push({ y: tapahtuma.clientY, aika: tapahtuma.timeStamp });
  if (historia.length > 5) historia.shift();
});

function paataVeto(tapahtuma) {
  if (!vedossa) return;
  vedossa = false;

  const korkeus = levy.offsetHeight;
  const ensimmainen = historia[0];
  const viimeinen = historia[historia.length - 1];
  const kesto = viimeinen && ensimmainen ? viimeinen.aika - ensimmainen.aika : 0;
  const nopeus = kesto > 0 ? ((viimeinen.y - ensimmainen.y) / kesto) * 1000 : 0;

  // Päätös tehdään siitä mihin ele on menossa, ei siitä mihin sormi
  // sattui pysähtymään.
  const ennustettu = siirtyma + projisoi(nopeus);
  const suljetaan = ennustettu > korkeus / 2;

  const paivita = (arvo) => { levy.style.transform = `translateY(${arvo}px)`; };

  if (suljetaan) {
    verho.classList.remove('auki');
    jousiKohti(siirtyma, korkeus, nopeus, 0.34, 0, paivita, piilotaLevy);
  } else {
    // Pieni kimmoisuus vain kun ele itse toi mukanaan vauhtia.
    const kimmoisuus = Math.abs(nopeus) > 120 ? 0.18 : 0;
    jousiKohti(siirtyma, 0, nopeus, 0.38, kimmoisuus, paivita, () => {
      levy.classList.remove('vetaa');
      levy.style.transform = '';
    });
  }
}

levy.addEventListener('pointerup', paataVeto);
levy.addEventListener('pointercancel', paataVeto);

verho.addEventListener('click', suljeLevy);

document.addEventListener('keydown', (tapahtuma) => {
  if (tapahtuma.key === 'Escape' && levyAuki) suljeLevy();
});

// --- Arvonta ------------------------------------------------------

function arvo() {
  const ehdokkaat = suodatetut().filter((r) => r.id !== (arvottuResepti && arvottuResepti.id));
  const kaikki = suodatetut();

  if (kaikki.length === 0) {
    alert('Ei reseptejä joista arpoa. Poista suodatin tai lisää uusi resepti.');
    return;
  }

  // Sama ruoka ei tule kahdesti peräkkäin, ellei muuta ole tarjolla.
  const joukko = ehdokkaat.length > 0 ? ehdokkaat : kaikki;
  avaaLevy(joukko[Math.floor(Math.random() * joukko.length)]);
}

arvoNappi.addEventListener('click', arvo);
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
