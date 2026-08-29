// ---------------------------------------------------------------
//  Supabase-asetukset
//
//  Täytä nämä kaksi arvoa kun olet luonut Supabase-projektin.
//  Ohjeet löytyvät README.md-tiedostosta kohdasta "Supabasen käyttöönotto".
//
//  Nämä avaimet ovat tarkoitettu julkisiksi — anon-avain on
//  selaimessa näkyvä avain, jonka oikeuksia rajataan Supabasen
//  päässä. Älä koskaan laita tähän service_role-avainta.
// ---------------------------------------------------------------

const SUPABASE_URL = 'https://dywjdsbwxpoishlloasv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cw32W786oD39dWEhZl3uig_2unA2hkG';

// Reseptien kategoriat. Voit muokata listaa vapaasti.
const KATEGORIAT = [
  'Arkiruoka',
  'Keitot ja padat',
  'Uuniruoat',
  'Kanaruoat',
  'Kalaruoat',
  'Kasvisruoat',
  'Salaatit',
  'Leivonta',
  'Jälkiruoat',
  'Juhlaruoat',
  'Muut'
];

// Pieni kuvake jokaiselle kategorialle — näkyy kortissa jos kuvaa ei ole.
const KATEGORIA_EMOJI = {
  'Arkiruoka': '🍽️',
  'Keitot ja padat': '🍲',
  'Uuniruoat': '🥘',
  'Kanaruoat': '🍗',
  'Kalaruoat': '🐟',
  'Kasvisruoat': '🥦',
  'Salaatit': '🥗',
  'Leivonta': '🥧',
  'Jälkiruoat': '🍰',
  'Juhlaruoat': '🎉',
  'Muut': '🍴'
};

// Kortin taustasävy silloin kun reseptillä ei ole vielä kuvaa.
// Arvot viittaavat style.css:n väreihin: salvia, persikka, pinkki, ruusu.
const KATEGORIA_VARI = {
  'Arkiruoka': 'salvia',
  'Keitot ja padat': 'persikka',
  'Uuniruoat': 'ruusu',
  'Kanaruoat': 'persikka',
  'Kalaruoat': 'salvia',
  'Kasvisruoat': 'salvia',
  'Salaatit': 'salvia',
  'Leivonta': 'pinkki',
  'Jälkiruoat': 'pinkki',
  'Juhlaruoat': 'ruusu',
  'Muut': 'persikka'
};

function kategorianVari(kategoria) {
  return KATEGORIA_VARI[kategoria] || 'persikka';
}
