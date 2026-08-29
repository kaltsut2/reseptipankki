// ---------------------------------------------------------------
//  Yhteys Supabaseen.
//  Käytetään suoraan Supabasen REST-rajapintaa (PostgREST), jolloin
//  sovellus ei ole riippuvainen mistään ulkopuolisesta kirjastosta.
// ---------------------------------------------------------------

const ON_ASETETTU =
  SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 30;

const REST = `${SUPABASE_URL}/rest/v1`;
const STORAGE = `${SUPABASE_URL}/storage/v1`;

function otsakkeet(lisaa = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...lisaa
  };
}

async function pyynto(url, asetukset = {}) {
  const vastaus = await fetch(url, asetukset);
  if (!vastaus.ok) {
    const teksti = await vastaus.text();
    throw new Error(`Supabase vastasi ${vastaus.status}: ${teksti}`);
  }
  if (vastaus.status === 204) return null;
  const tyyppi = vastaus.headers.get('content-type') || '';
  return tyyppi.includes('json') ? vastaus.json() : vastaus.text();
}

// --- Reseptit ---------------------------------------------------

async function haeReseptit() {
  return pyynto(`${REST}/reseptit?select=*&order=nimi.asc`, {
    headers: otsakkeet()
  });
}

async function haeResepti(id) {
  const rivit = await pyynto(
    `${REST}/reseptit?select=*&id=eq.${encodeURIComponent(id)}`,
    { headers: otsakkeet() }
  );
  return rivit[0] || null;
}

async function lisaaResepti(resepti) {
  const rivit = await pyynto(`${REST}/reseptit`, {
    method: 'POST',
    headers: otsakkeet({
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }),
    body: JSON.stringify(resepti)
  });
  return rivit[0];
}

// Monta reseptiä yhdellä pyynnöllä. PostgREST käsittelee taulukon
// yhtenä tapahtumana: joko kaikki menevät läpi tai ei yksikään.
async function lisaaReseptit(reseptit) {
  if (!reseptit.length) return [];
  return pyynto(`${REST}/reseptit`, {
    method: 'POST',
    headers: otsakkeet({
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }),
    body: JSON.stringify(reseptit)
  });
}

async function paivitaResepti(id, muutokset) {
  const rivit = await pyynto(
    `${REST}/reseptit?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: otsakkeet({
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      }),
      body: JSON.stringify({ ...muutokset, muokattu: new Date().toISOString() })
    }
  );
  return rivit[0];
}

async function poistaResepti(id) {
  return pyynto(`${REST}/reseptit?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: otsakkeet()
  });
}

// --- Kuvat ------------------------------------------------------

// Pienennetään kuva selaimessa ennen lähetystä: puhelimen kamerakuva
// on helposti 4 Mt, tästä tulee noin 150 kt eikä laatu kärsi näytöllä.
function pienennaKuva(tiedosto, maxLeveys = 1400, laatu = 0.82) {
  return new Promise((onnistui, virhe) => {
    const lukija = new FileReader();
    lukija.onerror = () => virhe(new Error('Kuvan lukeminen ei onnistunut'));
    lukija.onload = () => {
      const kuva = new Image();
      kuva.onerror = () => virhe(new Error('Kuvaa ei voitu avata'));
      kuva.onload = () => {
        const suhde = Math.min(1, maxLeveys / kuva.width);
        const kangas = document.createElement('canvas');
        kangas.width = Math.round(kuva.width * suhde);
        kangas.height = Math.round(kuva.height * suhde);
        kangas.getContext('2d').drawImage(kuva, 0, 0, kangas.width, kangas.height);
        kangas.toBlob(
          (blob) => (blob ? onnistui(blob) : virhe(new Error('Pakkaus epäonnistui'))),
          'image/jpeg',
          laatu
        );
      };
      kuva.src = lukija.result;
    };
    lukija.readAsDataURL(tiedosto);
  });
}

async function lahetaKuva(tiedosto) {
  const blob = await pienennaKuva(tiedosto);
  const nimi = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  await pyynto(`${STORAGE}/object/kuvat/${nimi}`, {
    method: 'POST',
    headers: otsakkeet({ 'Content-Type': 'image/jpeg' }),
    body: blob
  });
  return `${STORAGE}/object/public/kuvat/${nimi}`;
}
