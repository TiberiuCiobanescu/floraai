# FloraAI — tabele conectate

Datele operaționale provin exclusiv din proiectul conectat. Nu există liste de rezervă cu date fictive. Fișierele din `src/test` conțin doar intrări izolate pentru teste, neimportate în aplicație.

| Ecran | Date utilizate |
| --- | --- |
| Inbox | `mesaje`, `clienti` pentru numele expeditorilor |
| Comenzi | `comenzi`, `linii_comanda`, `produse`, `clienti`, `termene` |
| Detaliu comandă | `comenzi`, `linii_comanda`, `produse`, `clienti`, `mesaje`, `termene`, `stoc` |
| Stoc | `stoc`, `livrari_furnizor` cu `receptionat = 'nu'` |
| Setări | `termene`, `stoc`; salvarea actualizează orele și pragurile existente |

Un singur încărcător comun citește toate cele opt tabele în paralel, cu paginare de 1.000 de rânduri, și alimentează aceste ecrane din aceeași stare. Interfața traduce valorile tehnice fără să le rescrie în tabele. Nu se folosesc chei administrative pentru citiri sau salvări.

Prezentarea de la `/` păstrează desenele promoționale existente; acestea nu reprezintă și nu modifică datele atelierului.

## Limitări existente

- Politicile `demo_acces_total` permit deja acces anonim la toate tabelele. Nu au fost schimbate; datele clienților nu sunt protejate de autentificare. Înainte de publicarea cu date private, echipa trebuie să restrângă aceste politici și să configureze autentificarea.
- Nu există în baza conectată o funcție/tranzacție pentru execuție și scădere de stoc. Butonul nu mai simulează succesul și nu face scăderi parțiale. Este necesară aprobarea unei operații atomice fără schimbarea tabelelor.
- Importul WhatsApp și introducerea Fizic/Telefon salvează mesajele originale, apoi procesează consecutiv grupurile cu AI. Reimportul nu reprocesează mesajele deja clasificate.

## Verificare completă a fluxurilor

Regulă: ecranele atelierului trebuie să afișeze datele conectate, fără a inventa rânduri, compoziții sau mesaje originale; comenzile încheiate rămân nemodificate.

- Inbox, căutări, filtre și contoare: folosesc `mesaje` și `clienti`; un mesaj fără comandă deschide propriul dialog cu răspuns editabil.
- Comenzi, sortare și execuție: folosesc datele comune. Un termen fără dată sau interval nu mai provoacă eroare de afișare; execuția rămâne blocată fără operația atomică necesară.
- Detaliu, produse și întrebări: folosesc datele comune. Schimbarea numelui produsului actualizează rețeta din catalog; un produs necunoscut nu păstrează rețeta produsului anterior. Lipsa mesajului original este afișată explicit, fără canal sau dată inventate.
- Salvare, confirmare și întrebări: nu permit modificarea comenzilor executate sau livrate; actualizarea mesajelor păstrează rândurile confirmate sau ignorate. WhatsApp deschide mesajul pregătit; trimiterea efectivă se face în WhatsApp și nu este verificată de aplicație.
- Stoc și furnizori: numai rânduri conectate; 11 flori, 75 fire pentru trandafir roșu. Pragul inclusiv se aplică atât stării, cât și alertelor.
- Setări: numai termene și praguri conectate; explicația pragului corespunde regulii `cantitate <= prag`.
- Meniu și contoare: datele comune; profilul și identitatea florăriei rămân editori locali existenți, deoarece tabelele furnizate nu conțin aceste câmpuri.
- Prezentare: grafica promoțională existentă nu reprezintă stoc real și nu modifică tabelele; neschimbată.
- Extracția folosește `/api/extrage-comanda` în aplicație, nu Supabase Edge Functions, conform infrastructurii proiectului. `aplica_extragere_comanda` salvează tranzacțional rezultatul în tabelele existente, cu accesul demonstrativ existent. Nu modifică stocul.

Eroarea `useState` nu s-a reprodus cu codul curent pe niciuna dintre cele șase pagini sau la navigare. Raportul inițial combina două versiuni diferite ale modulelor React după actualizarea dependențelor; pagina deschisă care a răspuns verificării folosește acum aceeași versiune și afișează Inbox. Nu s-a schimbat logica React sau configurația pentru o eroare care nu mai este prezentă.