---
name: reseptipankki
description: Muuntaa reseptin Reseptipankki-sovelluksen JSON-muotoon. Käytä kun käyttäjä antaa reseptin verkkosivun osoitteena, tekstinä tai valokuvana keittokirjan sivusta, käsinkirjoitetusta lapusta tai skannauksesta, ja haluaa sen sovellukseen. Käytä myös kun käyttäjä pyytää muuntamaan useita reseptejä kerralla tuontitiedostoksi.
---

# Reseptipankin tuontimuoto

Tuota resepteistä JSON, jonka voi liittää sellaisenaan sovelluksen
tuontisivulle osoitteessa `kaltsut2.github.io/reseptipankki/tuo.html`.

## Vastauksen muoto

Vastaa **vain** näin, ilman johdantoa:

1. Yksi JSON-koodilohko.
2. Sen jälkeen otsikko **Epävarmat kohdat** ja luettelomerkein ne asiat, joista
   et ole varma — mutta vain jos sellaisia on.

Ei muuta. Käyttäjä kopioi lohkon puhelimellaan, joten kaikki ylimääräinen on
tiellä.

## Rakenne

```json
{
  "versio": 1,
  "reseptit": [
    {
      "nimi": "Mummon lihapullat",
      "kategoriat": ["Arkiruoka", "Uuniruoat"],
      "paaraaka_aineet": ["Jauheliha"],
      "aika": "1 h 15 min",
      "annokset": 4,
      "ainekset": ["400 g jauhelihaa", "1 sipuli", "2 dl kermaa"],
      "ohje": ["Kuullota sipuli pannulla.", "Pyörittele pullat ja paista."],
      "vinkki": "Puolukkahillo kuuluu tähän.",
      "lahde": "https://esimerkki.fi/lihapullat"
    }
  ]
}
```

Vain `nimi` on pakollinen. Jätä kenttä kokonaan pois, jos sille ei ole arvoa —
älä kirjoita tyhjää merkkijonoa tai `null`. Useat reseptit menevät saman
`reseptit`-listan sisään.

Älä lisää `kuva_url`-kenttää. Kuvia ei voi tuoda tiedostosta, vaan ne lisätään
sovelluksessa jälkeenpäin.

## Kategoriat

Valitse **vain** näistä. Kirjoita täsmälleen tässä muodossa.

**Ruuat:** Arkiruoka · Keitot ja padat · Uuniruoat · Liharuuat · Kanaruoat ·
Kalaruoat · Kasvisruoat · Pastat ja risotot · Salaatit · Juhlaruoat · Muut

**Leivonta:** Kakut · Piirakat · Pullat ja sämpylät · Leivät ·
Keksit ja pikkuleivät · Jälkiruoat

Anna **yhdestä kolmeen** kategoriaa. Ota aina mukaan se tarkin, ja lisää
`Arkiruoka` jos ruoka on tavallista viikkoruokaa. Kanapasta on sekä
`Kanaruoat` että `Pastat ja risotot` että usein `Arkiruoka`.

Jos mikään ei sovi, käytä `Muut` ja mainitse asia Epävarmat kohdat -osiossa.
Älä keksi uusia kategorioita: sovellus hyväksyy ne, mutta ne jäävät roikkumaan
omaan lokeroonsa.

## Pääraaka-aineet

Valitse **vain** näistä, yhdestä neljään tärkeintä:

Kana · Kalkkuna · Naudanliha · Porsaanliha · Jauheliha · Makkara · Lohi ·
Valkoinen kala · Katkarapu · Kananmuna · Juusto · Peruna · Riisi · Pasta ·
Kasvikset · Sienet · Pavut ja linssit · Marjat · Omena · Suklaa · Pähkinät

`Liharuuat` on naudan, porsaan, jauhelihan ja makkaran kategoria — kana ja
kalkkuna kuuluvat omaan kategoriaansa `Kanaruoat`.

Merkitse se mitä ruoassa on eniten ja mikä ratkaisee valinnan jääkaappia
katsoessa. Mausteita, voita tai kermaa ei merkitä pääraaka-aineiksi.
Broileri on `Kana`. Mustikka ja vadelma ovat `Marjat`.

## Aika

Koko aika alusta pöytään, valmisteluineen. Jos lähde erittelee valmistus- ja
kypsennysajan, laske ne yhteen.

Muoto on vapaa — `"90"`, `"1,5 h"`, `"1h30min"` ja `"1:30"` kelpaavat kaikki.
Kirjoita selkeimmässä muodossa: `"45 min"` tai `"1 h 30 min"`. Sovellus
pyöristää viiden minuutin tarkkuuteen.

Jos aikaa ei mainita, jätä kenttä pois. Älä arvaa.

## Ainekset

Yksi aines per listan alkio, määrä ensin: `"400 g jauhelihaa"`.

**Määrät kirjoitetaan sanatarkasti lähteestä.** Älä pyöristä, älä siisti, älä
yhdistele. Väärä määrä pilaa ruoan, ja se on tämän työn ainoa oikeasti
vaarallinen virhe.

Muunna epämetriset yksiköt, koska ne ovat suomalaisessa keittiössä
käyttökelvottomia:

| Lähteessä | Kirjoita |
|---|---|
| 1 cup | 2,4 dl |
| 1 tablespoon / tbsp | 1 rkl |
| 1 teaspoon / tsp | 1 tl |
| 1 oz | 30 g |
| 1 lb | 450 g |
| °F | °C, pyöristettynä viiteen asteeseen |

Merkitse muunnetut määrät Epävarmat kohdat -osioon, koska muunnos on aina
likiarvo.

## Ohje

Yksi työvaihe per listan alkio. Älä numeroi — sovellus numeroi itse.

Kirjoita vaiheet **omin sanoin**, lyhyesti ja käskymuodossa. Verkkosivujen
reseptiteksteissä on usein tekijänoikeuden alaista kuvailua ja turhaa
täytettä; itse työvaiheet ovat käytännön ohjeita, jotka saa kirjoittaa ylös
tiiviisti uudelleen muotoiltuna. Lopputulos on myös luettavampi.

Älä koskaan täydennä puuttuvaa vaihetta omasta päästä. Jos ohje loppuu kesken
tai jotain selvästi puuttuu, kirjoita mitä lähteessä on ja mainitse puute
Epävarmat kohdat -osiossa.

## Vinkki ja lähde

`vinkki` vain jos lähteessä on aito tarjoiluvinkki tai niksi. Älä keksi.

`lahde` verkkoresepteille osoitteena, kirjoista muodossa
`"Kotiruokaa, s. 142"`. Sovellus liittää sen vinkkikentän loppuun.

## Kuvasta tai skannauksesta lukeminen

Tämä on se tapaus, jossa virheitä syntyy. Noudata näitä:

- Lue määrät merkki merkiltä. Käsialassa menevät sekaisin erityisesti
  **dl ja tl**, **1/2 ja 1/3**, sekä **2 ja 7**.
- Jos numero on epäselvä, kirjoita todennäköisin ja **listaa se Epävarmat
  kohdat -osioon**. Älä valitse hiljaa.
- Jos sivu on rajautunut tai teksti jää kuvan ulkopuolelle, sano se. Älä
  täydennä arvaamalla.
- Vanhat reseptit käyttävät mittoja kuten `1 kahvikuppi` tai `1 tee lusikallinen`.
  Kirjoita ne sellaisenaan — älä muunna, koska et tiedä kupin kokoa.
- Jos kuvassa on useita reseptejä, tee niistä kaikista omat alkionsa.

## Verkkosivulta lukeminen

- Jos et pääse sivulle käsiksi, pyydä käyttäjää liittämään reseptin teksti.
  Se on nopeampaa kuin yrittää kiertää estoja.
- Ohita mainokset, kommentit ja kirjoittajan tarina. Ota ainekset, työvaiheet,
  annosmäärä ja aika.
- Ota `lahde` talteen.

## Ennen kuin vastaat

Tarkista nämä:

- Onko JSON validia? Ei pilkkua viimeisen alkion jälkeen.
- Ovatko kaikki kategoriat ja pääraaka-aineet yllä olevilta listoilta,
  täsmälleen samassa kirjoitusasussa?
- Onko jokainen määrä sellainen kuin lähteessä?
- Onko `ohje` omin sanoin eikä kopioitu?
- Onko tyhjät kentät jätetty pois eikä kirjoitettu tyhjiksi?
