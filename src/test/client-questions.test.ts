import { describe, expect, it } from "vitest";
import { recommendedClientQuestions } from "@/features/florist/client-questions";
import { initialMessages, initialOrders } from "@/features/florist/data";

const bouquet = initialOrders[0];
if (!bouquet) throw new Error("Missing bouquet fixture");

describe("Întrebări recomandate pentru fiecare caz", () => {
  it("adaptează recomandările când se completează adresa", () => {
    expect(recommendedClientQuestions(bouquet, [])).toContain("Ne puteți trimite adresa completă de livrare?");
    expect(recommendedClientQuestions({ ...bouquet, address: "Strada Florilor 24" }, [])).not.toContain("Ne puteți trimite adresa completă de livrare?");
  });
  it("folosește ultimul mesaj al comenzii, nu al altui client", () => {
    expect(recommendedClientQuestions(bouquet, initialMessages)).toContain("Confirmați că toate detaliile din rezumatul comenzii sunt corecte?");
    expect(recommendedClientQuestions(bouquet, initialMessages)).not.toContain("Mulțumim pentru completare! Mai sunt și alte detalii pe care doriți să le adăugați comenzii?");
  });
  it("include cantitățile actuale pentru o modificare", () => {
    const order = initialOrders[1];
    if (!order) throw new Error("Missing modification fixture");
    const question = recommendedClientQuestions(order, initialMessages).find((entry) => entry.includes("Vă rugăm să confirmați modificarea comenzii"));
    expect(question).toContain("11 Trandafiri albi");
    expect(question).toContain("Mihai Ionescu");
    expect(question).toContain("Ioana Ionescu");
  });
  it("recomandă clarificări specifice nunții fără a cere bilețel", () => {
    const questions = recommendedClientQuestions({ ...bouquet, type: "Nuntă", note: "" }, []);
    expect(questions).toContain("Ce buget aveți în vedere pentru aranjamentele de nuntă?");
    expect(questions).not.toContain("Doriți să adăugăm un mesaj pe bilețel? Ce text să scriem?");
  });
  it("pentru o comandă livrată cere feedback, nu reconfirmarea livrării", () => {
    expect(recommendedClientQuestions({ ...bouquet, status: "Livrată", address: "Strada Florilor" }, [])).toEqual(["Buchetul a ajuns în regulă? Cum vi s-a părut?"]);
  });
});