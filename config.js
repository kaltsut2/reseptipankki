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

const SUPABASE_URL = 'TÄHÄN_PROJECT_URL';
const SUPABASE_ANON_KEY = 'TÄHÄN_ANON_KEY';

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
