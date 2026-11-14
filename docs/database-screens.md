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
- Crearea de comenzi din mesajul liber nu mai generează comenzi fictive; importul WhatsApp rămâne neimplementat.