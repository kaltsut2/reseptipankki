# Reseptipankki

Äidin lempireseptit yhdessä paikassa. Selaimessa toimiva sovellus, joka
asennetaan puhelimen ja iPadin kotinäytölle. Reseptit lisätään **suoraan
puhelimesta** sovelluksen omalla lomakkeella — ei koneen, koodin eikä
Clauden kautta.

## Miten se toimii

GitHub Pages tarjoilee vain valmiita tiedostoja, joten reseptit tarvitsevat
oman paikkansa. Tässä ratkaisuna on **Supabase**: ilmainen pilvitietokanta,
johon selain kirjoittaa suoraan.

```
Puhelin (lomake)  ──►  Supabase  ◄──  iPad (selaus)
                          ▲
                   GitHub Pages tarjoilee
                   sovelluksen tiedostot
```

Kun äiti tallentaa reseptin puhelimella, se on iPadilla näkyvissä heti
seuraavalla latauksella. Kuvat pienennetään selaimessa ennen lähetystä,
joten kameran 4 megatavun kuvasta jää noin 150 kilotavua.

## Käyttöönotto

### 1. Supabase

1. Luo tili osoitteessa [supabase.com](https://supabase.com) ja tee uusi
   projekti. Ilmainen taso riittää tähän moninkertaisesti.
2. Avaa vasemmalta **SQL Editor**, liitä sinne tämän kansion
   `supabase.sql`-tiedoston sisältö ja paina **Run**. Se luo reseptitaulun,
   kuvien tallennuspaikan ja käyttöoikeudet.
3. Mene kohtaan **Project Settings → API** ja kopioi kaksi arvoa:
   - `Project URL` (muotoa `https://abcdefgh.supabase.co`)
   - `anon` `public` -avain (pitkä merkkijono)
4. Avaa `config.js` ja liitä arvot paikoilleen:

```js
const SUPABASE_URL = 'https://abcdefgh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
```

Nämä avaimet ovat tarkoitettu selaimessa näkyviksi, joten ne saa turvallisesti
tallentaa GitHubiin. **Älä koskaan laita tänne `service_role`-avainta** — se
ohittaa kaikki käyttöoikeudet.

Jos SQL-skripti valittaa kuvakäytännöistä, ne voi tehdä myös käsin:
**Storage → New bucket → nimi `kuvat`, Public bucket päälle.**

### 2. Julkaisu GitHubissa

1. Luo GitHubiin uusi repositorio, esimerkiksi `reseptipankki`.
2. Vie tämän kansion sisältö sinne:

```bash
git add -A && git commit -m "Reseptipankki" && git branch -M main
```

```bash
git remote add origin https://github.com/KAYTTAJANIMI/reseptipankki.git && git push -u origin main
```

3. Repositorion **Settings → Pages**: valitse *Source: Deploy from a branch*,
   haara `main`, kansio `/ (root)`. Tallenna.
4. Minuutin päästä sovellus on osoitteessa
   `https://KAYTTAJANIMI.github.io/reseptipankki/`.

### 3. Kotinäytölle

Lähetä osoite äidille ja neuvo tämä kerran:

- **iPhone / iPad (Safari):** avaa osoite → jakopainike → *Lisää
  Koti-valikkoon*.
- **Android (Chrome):** avaa osoite → kolme pistettä → *Lisää aloitusnäyttöön*.

Tämän jälkeen sovellus avautuu omasta kuvakkeestaan ilman selaimen palkkeja,
aivan kuin tavallinen sovellus.

## Reseptin lisääminen puhelimella

Alareunan **Lisää uusi** avaa lomakkeen. Kuvan voi ottaa suoraan kameralla.
Ainekset ja työvaiheet kirjoitetaan **yksi rivi kerrallaan** — sovellus
muotoilee niistä listan ja numeroidut ohjeet automaattisesti. Tallennuksen
jälkeen resepti on heti kaikilla laitteilla.

Reseptiä voi myöhemmin muokata tai poistaa sen omalta sivulta.

## Mitä sovelluksessa on

- **Arvo minulle ruoka** — arpoo satunnaisen reseptin ja nostaa sen levylle
  ruudun alareunasta. Levyn voi työntää sormella pois samalla eleellä jolla se
  tuli, ja uuden arvonnan saa painamalla “Arvo toinen”. Sama ruoka ei tule
  kahdesti peräkkäin. Toimii myös suodatettuna, eli "arvo jokin kanaruoka"
  onnistuu valitsemalla ensin kategorian.
- **Haku** nimen, kategorian, pääraaka-aineen ja ainesosien perusteella.
- **Suosikit** omalla välilehdellään.
- **Ainesten kuittaus** — napauta ainesta kokatessasi, niin se yliviivautuu.
- **Näyttö auki** -painike, jottei puhelin sammu kesken kokkaamisen.
- Toimii sekä vaalealla että tummalla teemalla.

## Väreistä

Paletti on äidin itsensä valitsema: salvia `#d8e2dc`, persikka `#ffe5d9`,
pinkki `#ffcad4`, ruusu `#f4acb7` ja mauve `#9d8189`. Pastellit ovat liian
vaaleita kantamaan valkoista tekstiä, joten sävyjä käytetään pintoina ja
teksti on syvä luumun sävy. Näin kontrasti riittää myös keittiön valossa.
Värit ovat tiedoston `style.css` alussa omina muuttujinaan, joten niitä on
helppo vaihtaa.

Jokainen kategoria saa oman pastellitaustansa niihin resepteihin, joihin ei
ole vielä lisätty kuvaa — sen määrittelee `KATEGORIA_VARI` tiedostossa
`config.js`.

## Turvallisuudesta

Sovellus on auki kaikille, jotka tietävät osoitteen: kuka tahansa linkin
saanut voi myös lisätä ja poistaa reseptejä. Osoite on arvaamaton eikä sitä
linkitetä mistään, joten käytännön riski on pieni.

Jos haluat myöhemmin rajata muokkausoikeutta, se onnistuu muuttamalla
`supabase.sql`-tiedoston `insert`-, `update`- ja `delete`-käytännöt vaatimaan
kirjautumista, tai lisäämällä lomakkeen eteen PIN-kyselyn.

## Tiedostot

| Tiedosto | Tehtävä |
|---|---|
| `index.html` / `selaa.js` | Reseptien selaus, haku, suodatus, arvonta |
| `resepti.html` / `resepti.js` | Yksittäisen reseptin sivu |
| `lisaa.html` / `lisaa.js` | Lisäys- ja muokkauslomake |
| `db.js` | Yhteys Supabaseen ja kuvien pienennys |
| `config.js` | Supabase-avaimet ja kategorialista |
| `supabase.sql` | Tietokannan luonti |
| `style.css` | Ulkoasu |
