// ---------------------------------------------------------------
//  Reseptin lisäys ja muokkaus.
//  Sama sivu hoitaa molemmat: ?id=... tarkoittaa muokkausta.
// ---------------------------------------------------------------

const muokattavaId = new URLSearchParams(location.search).get('id');

const lomake = document.getElementById('lomake');
const tallennaNappi = document.getElementById('tallenna');
const tilaTeksti = document.getElementById('tila');
const kuvaSyote = document.getElementById('kuva');

let valittuKuvatiedosto = null;   // uusi kuva, joka lähetetään tallennuksen yhteydessä
let nykyinenKuvaUrl = null;       // muokattaessa jo tallennettu kuva

// --- Kategorialista ----------------------------------------------

document.getElementById('kategoria').innerHTML = KATEGORIAT
  .map((kategoria) => `<option value="${kategoria}">${kategoria}</option>`)
  .join('');

// --- Kuvan esikatselu --------------------------------------------

function naytaEsikatselu(lahde) {
  document.getElementById('kuvaTeksti').innerHTML =
    `<img src="${lahde}" alt="Valittu kuva">`;
}

kuvaSyote.addEventListener('change', () => {
  const tiedosto = kuvaSyote.files[0];
  if (!tiedosto) return;
  valittuKuvatiedosto = tiedosto;
  naytaEsikatselu(URL.createObjectURL(tiedosto));
});

// --- Tallennus ----------------------------------------------------

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

    const tiedot = {
      nimi,
      kategoria: document.getElementById('kategoria').value,
      paaraaka_aine: document.getElementById('paaraaka').value.trim() || null,
      aika_min: numeroTaiNull(document.getElementById('aika').value),
      annokset: numeroTaiNull(document.getElementById('annokset').value),
      ainekset: document.getElementById('ainekset').value.trim() || null,
      ohje: document.getElementById('ohje').value.trim() || null,
      vinkki: document.getElementById('vinkki').value.trim() || null,
      kuva_url: kuvaUrl
    };

    tallennaNappi.textContent = 'Tallennetaan…';

    const tallennettu = muokattavaId
      ? await paivitaResepti(muokattavaId, tiedot)
      : await lisaaResepti(tiedot);

    location.href = `resepti.html?id=${encodeURIComponent(tallennettu.id)}`;
  } catch (virhe) {
    console.error(virhe);
    tilaTeksti.textContent =
      'Tallennus ei onnistunut. Tarkista verkkoyhteys ja yritä uudelleen.';
    tallennaNappi.disabled = false;
    tallennaNappi.textContent = 'Tallenna resepti';
  }
});

// --- Muokkaustila -------------------------------------------------

async function lataaMuokattava() {
  document.getElementById('otsikko').textContent = 'Muokkaa reseptiä';
  document.title = 'Muokkaa reseptiä · Reseptipankki';
  tallennaNappi.textContent = 'Tallenna muutokset';

  try {
    const resepti = await haeResepti(muokattavaId);
    if (!resepti) return;

    document.getElementById('nimi').value = resepti.nimi || '';
    document.getElementById('kategoria').value = resepti.kategoria || 'Muut';
    document.getElementById('paaraaka').value = resepti.paaraaka_aine || '';
    document.getElementById('aika').value = resepti.aika_min ?? '';
    document.getElementById('annokset').value = resepti.annokset ?? '';
    document.getElementById('ainekset').value = resepti.ainekset || '';
    document.getElementById('ohje').value = resepti.ohje || '';
    document.getElementById('vinkki').value = resepti.vinkki || '';

    nykyinenKuvaUrl = resepti.kuva_url || null;
    if (nykyinenKuvaUrl) naytaEsikatselu(nykyinenKuvaUrl);

    document.querySelector('.takaisin').setAttribute(
      'href',
      `resepti.html?id=${encodeURIComponent(muokattavaId)}`
    );
  } catch (virhe) {
    console.error(virhe);
    tilaTeksti.textContent = 'Reseptin tietoja ei saatu haettua.';
  }
}

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
}
