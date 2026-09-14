// ---------------------------------------------------------------
//  Supabase-asetukset
//
//  Nämä avaimet ovat tarkoitettu julkisiksi — anon-avain on
//  selaimessa näkyvä avain, jonka oikeuksia rajataan Supabasen
//  päässä. Älä koskaan laita tähän service_role-avainta.
// ---------------------------------------------------------------

const SUPABASE_URL = 'https://dywjdsbwxpoishlloasv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cw32W786oD39dWEhZl3uig_2unA2hkG';

// ---------------------------------------------------------------
//  Kategoriat
//
//  Kategoriat on jaettu kahteen ryhmään, jotka näkyvät sekä
//  Kategoriat-sivulla että lisäyslomakkeen valikossa. Voit muokata
//  listoja vapaasti — muista lisätä uudelle kategorialle myös emoji
//  ja väri alempaa, muuten se saa oletukset.
// ---------------------------------------------------------------

const KATEGORIARYHMAT = [
  {
    nimi: 'Ruuat',
    emoji: '🍽️',
    kuvaus: 'Aamiaisesta illalliseen',
    kategoriat: [
      'Arkiruoka',
      'Keitot ja padat',
      'Uuniruoat',
      'Liharuoat',
      'Kanaruoat',
      'Kalaruoat',
      'Kasvisruoat',
      'Pastat ja risotot',
      'Salaatit',
      'Juhlaruoat',
      'Muut'
    ]
  },
  {
    nimi: 'Leivonta',
    emoji: '🥧',
    kuvaus: 'Kahvipöytään ja jälkiruoaksi',
    kategoriat: [
      'Kakut',
      'Piirakat',
      'Pullat ja sämpylät',
      'Leivät',
      'Suolaiset leivonnaiset',
      'Keksit ja pikkuleivät',
      'Jälkiruoat',
      'Ninja Creami'
    ]
  }
];

// Yhtenäinen lista kaikista kategorioista, johdettu ryhmistä.
const KATEGORIAT = KATEGORIARYHMAT.flatMap((ryhma) => ryhma.kategoriat);

// ---------------------------------------------------------------
//  Pääraaka-aineet
//
//  Reseptille voi valita näistä useamman. Lista näkyy lisäyslomakkeella
//  napautettavina painikkeina, ja valitut näkyvät reseptisivulla omina
//  ruutuinaan. Voit muokata listaa vapaasti.
// ---------------------------------------------------------------

const RAAKA_AINEET = [
  'Kana',
  'Kalkkuna',
  'Naudanliha',
  'Porsaanliha',
  'Jauheliha',
  'Makkara',
  'Lohi',
  'Valkoinen kala',
  'Katkarapu',
  'Kananmuna',
  'Juusto',
  'Peruna',
  'Riisi',
  'Pasta',
  'Kasvikset',
  'Sienet',
  'Pavut ja linssit',
  'Marjat',
  'Omena',
  'Suklaa',
  'Pähkinät'
];

// Pieni kuvake jokaiselle kategorialle — näkyy kortissa jos kuvaa ei ole.
const KATEGORIA_EMOJI = {
  'Arkiruoka': '🍽️',
  'Keitot ja padat': '🍲',
  'Uuniruoat': '🥘',
  'Liharuoat': '🥩',
  'Kanaruoat': '🍗',
  'Kalaruoat': '🐟',
  'Kasvisruoat': '🥦',
  'Pastat ja risotot': '🍝',
  'Salaatit': '🥗',
  'Juhlaruoat': '🎉',
  'Muut': '🍴',
  'Kakut': '🎂',
  'Piirakat': '🥧',
  'Pullat ja sämpylät': '🥐',
  'Leivät': '🍞',
  'Suolaiset leivonnaiset': '🫓',
  'Keksit ja pikkuleivät': '🍪',
  'Jälkiruoat': '🍰',
  'Ninja Creami': '🍨'
};

// Kortin taustasävy silloin kun reseptillä ei ole vielä kuvaa.
// Arvot viittaavat style.css:n väreihin: salvia, persikka, pinkki, ruusu.
const KATEGORIA_VARI = {
  'Arkiruoka': 'salvia',
  'Keitot ja padat': 'persikka',
  'Uuniruoat': 'ruusu',
  'Liharuoat': 'ruusu',
  'Kanaruoat': 'persikka',
  'Kalaruoat': 'salvia',
  'Kasvisruoat': 'salvia',
  'Pastat ja risotot': 'persikka',
  'Salaatit': 'salvia',
  'Juhlaruoat': 'ruusu',
  'Muut': 'persikka',
  'Kakut': 'pinkki',
  'Piirakat': 'pinkki',
  'Pullat ja sämpylät': 'persikka',
  'Leivät': 'persikka',
  'Suolaiset leivonnaiset': 'persikka',
  'Keksit ja pikkuleivät': 'pinkki',
  'Jälkiruoat': 'pinkki',
  'Ninja Creami': 'salvia'
};

function kategorianVari(kategoria) {
  return KATEGORIA_VARI[kategoria] || 'persikka';
}

function kategorianEmoji(kategoria) {
  return KATEGORIA_EMOJI[kategoria] || '🍴';
}

// Mihin ryhmään kategoria kuuluu. Palauttaa null jos kategoriaa ei
// löydy listoilta — esimerkiksi vanha kategoria, joka on poistettu.
function kategorianRyhma(kategoria) {
  const ryhma = KATEGORIARYHMAT.find((r) => r.kategoriat.includes(kategoria));
  return ryhma ? ryhma.nimi : null;
}

// ---------------------------------------------------------------
//  Vinkkiotsikon taivutus
//
//  Reseptisivun vinkkiotsikko taipuu lisääjän mukaan: Kallen vinkki,
//  Alexin vinkki, Äidin vinkki. Taivutus tehdään säännöillä, mutta
//  epäsäännölliset sanat luetellaan tässä. Jos jokin nimi taipuu
//  väärin, lisää sille oikea muoto tähän — se voittaa säännöt.
// ---------------------------------------------------------------

const GENETIIVI_POIKKEUKSET = {
  'äiti': 'äidin',
  'isoäiti': 'isoäidin',
  'täti': 'tädin',
  'setä': 'sedän',
  'veli': 'veljen',
  'poika': 'pojan',
  'tytär': 'tyttären',
  'mies': 'miehen',
  'lapsi': 'lapsen',
  'ystävä': 'ystävän'
};

// Lisääjän nimen vastaavuudet. Vasemmalla se mitä kirjoitetaan, oikealla
// se mikä tallennetaan. Vertailu ei välitä kirjainkoosta, ja vastaavuus
// toimii myös useamman lisääjän kohdalla: "irja ja kalle" tallentuu
// muodossa "Mummi ja Kalle".
const LISAAJA_VASTAAVUUS = {
  'riitta': 'Äiti',
  'irja': 'Mummi'
};
