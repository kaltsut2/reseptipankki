# Alkuperäiskuvat

Täysikokoiset ruokakuvat sellaisina kuin ne on otettu tai saatu.

**Nämä tiedostot eivät ole versiohistoriassa.** Ne elävät kahdessa paikassa:

1. Tässä kansiossa Kallen koneella.
2. Supabasen `kuvat`-ämpärissä polun `alkuperaiset/` alla.

Sovellus ei lue kuvia kummastakaan. Reseptissä näkyvä kuva tallennetaan
erikseen Supabasen `kuvat`-ämpärin juureen, ja resepti viittaa siihen
`kuva_url`-kentällä. Nämä alkuperäiset ovat varmuuskopio: jos jokin kuva
pitää joskus rajata toisin tai lisätä uudelleen, täysikokoinen löytyy täältä.

Sovelluksen lomake pienentää kuvan automaattisesti ennen lähetystä —
enintään 1400 pikseliä pitkältä sivulta, JPEG-laadulla 0,82. Puhelimen usean
megatavun kamerakuvasta jää tyypillisesti 150–250 kilotavua.
