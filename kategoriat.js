// ---------------------------------------------------------------
//  Kategoriasivu: ruuat ja leivonta avattavina ryhminä.
//
//  Ryhmät ovat aluksi kiinni, jotta molemmat otsikot näkyvät yhdellä
//  silmäyksellä ilman rullaamista. Jokaisen kategorian kohdalla näkyy
//  reseptien määrä, ja tyhjät kategoriat ovat himmennettyjä eikä niitä
//  voi avata — muuten napautus veisi tyhjään näkymään.
// ---------------------------------------------------------------

const ryhmatElementti = document.getElementById('ryhmat');
const vahennaLiiketta = window.matchMedia('(prefers-reduced-motion: reduce)');

function reseptienMaara(reseptit, kategoria) {
  return reseptit.filter((r) => listaksi(r.kategoriat).includes(kategoria)).length;
}

function korttiHtml(kategoria, maara, jarjestys) {
  const emoji = kategorianEmoji(kategoria);
  const vari = kategorianVari(kategoria);
  const tyyli = `style="--i:${Math.min(jarjestys, 11)}"`;
  const merkki = `<span class="merkki ${vari}" aria-hidden="true">${emoji}</span>`;
  const nimi = `<span class="nimi">${suojaa(kategoria)}</span>`;

  if (maara === 0) {
    return `<div class="kategoriakortti tyhjana" ${tyyli}>
      ${merkki}${nimi}<span class="maara">Ei vielä reseptejä</span>
    </div>`;
  }

  return `<a class="kategoriakortti" ${tyyli}
      href="index.html?kategoria=${encodeURIComponent(kategoria)}">
    ${merkki}${nimi}<span class="maara">${reseptienMaaraTeksti(maara)}</span>
  </a>`;
}

// Ryhmän kokonaismäärä lasketaan eri resepteinä, ei kategorioiden
// summana: yksi resepti voi kuulua useaan saman ryhmän kategoriaan
// eikä sitä pidä laskea monta kertaa.
function ryhmanReseptit(reseptit, kategoriat) {
  return reseptit.filter((r) =>
    listaksi(r.kategoriat).some((k) => kategoriat.includes(k))).length;
}

function ryhmaHtml(nimi, emoji, kuvaus, kategoriat, reseptit, tunniste) {
  const yhteensa = ryhmanReseptit(reseptit, kategoriat);
  const kortit = kategoriat
    .map((k, i) => korttiHtml(k, reseptienMaara(reseptit, k), i))
    .join('');

  return `
    <section class="ryhma">
      <button class="ryhma-otsikko" type="button"
              aria-expanded="false" aria-controls="ryhma-${tunniste}">
        <span class="ryhma-merkki" aria-hidden="true">${emoji}</span>
        <span class="ryhma-teksti">
          <span class="ryhma-nimi">${suojaa(nimi)}</span>
          <span class="ryhma-kuvaus">${suojaa(kuvaus)} · ${reseptienMaaraTeksti(yhteensa)}</span>
        </span>
        <span class="nuoli" aria-hidden="true">⌄</span>
      </button>
      <div class="ryhma-sisus" id="ryhma-${tunniste}">
        <div class="ryhma-sisalto">
          <div class="kategoriaruudukko">${kortit}</div>
        </div>
      </div>
    </section>`;
}

function piirra(reseptit) {
  const osiot = KATEGORIARYHMAT.map((ryhma, i) =>
    ryhmaHtml(ryhma.nimi, ryhma.emoji, ryhma.kuvaus, ryhma.kategoriat, reseptit, i));

  // Kategoriat, joita ei ole enää listoilla mutta joita resepteissä yhä
  // esiintyy. Ilman tätä sellainen resepti katoaisi näkyvistä.
  const tuntemattomat = [...new Set(reseptit.flatMap((r) => listaksi(r.kategoriat)))]
    .filter((k) => !KATEGORIAT.includes(k));

  if (tuntemattomat.length) {
    osiot.push(ryhmaHtml('Muut kategoriat', '📦',
      'Näitä ei ole kategorialistoilla', tuntemattomat, reseptit, 'muut'));
  }

  ryhmatElementti.className = '';
  ryhmatElementti.innerHTML = osiot.join('');
  liitaAvaus();
}

// --- Avaaminen ja sulkeminen --------------------------------------
//
//  Korkeutta ei mitata lainkaan: sisus on ruudukko, jonka rivikorkeus
//  siirtyy 0fr:stä 1fr:ään. Selain hoitaa välit, joten liike toimii
//  molempiin suuntiin eikä sisällön korkeutta tarvitse tietää etukäteen.

function liitaAvaus() {
  document.querySelectorAll('.ryhma').forEach((ryhma) => {
    const otsikko = ryhma.querySelector('.ryhma-otsikko');

    otsikko.addEventListener('click', () => {
      const auki = ryhma.classList.toggle('auki');
      otsikko.setAttribute('aria-expanded', String(auki));
    });
  });
}

async function kaynnista() {
  if (!ON_ASETETTU) {
    ryhmatElementti.className = '';
    ryhmatElementti.innerHTML = `
      <div class="huomio"><h2>Yhteys puuttuu vielä</h2>
      <p>Täytä <code>config.js</code>-tiedostoon Supabase-projektin osoite ja
      anon-avain.</p></div>`;
    return;
  }
  try {
    piirra(await haeReseptit());
  } catch (virhe) {
    ryhmatElementti.className = '';
    ryhmatElementti.innerHTML = `
      <div class="tyhja"><span class="iso" aria-hidden="true">📡</span>
      <h2>Kategorioita ei saatu haettua</h2>
      <p>Tarkista verkkoyhteys ja yritä uudelleen.</p></div>`;
    console.error(virhe);
  }
}

kaynnista();
