import { describe, expect, it } from "vitest";
import { clientQuestionOptions, recommendedClientQuestions } from "@/features/florist/client-questions";
import { initialMessages, initialOrders } from "./florist-fixtures";

const bouquet = initialOrders[0];
if (!bouquet) throw new Error("Missing bouquet fixture");

describe("Întrebări recomandate pentru fiecare caz", () => {
  it("adaptează recomandările când se completează adresa", () => {
    expect(clientQuestionOptions(bouquet, []).some((entry) => entry.label === "Adresa de livrare")).toBe(true);
    expect(clientQuestionOptions({ ...bouquet, address: "Strada Florilor 24" }, []).some((entry) => entry.label === "Adresa de livrare")).toBe(false);
  });
  it("folosește ultimul mesaj al comenzii, nu al altui client", () => {
    expect(clientQuestionOptions(bouquet, initialMessages).some((entry) => entry.label === "Confirmarea detaliilor comenzii")).toBe(true);
    expect(clientQuestionOptions(bouquet, initialMessages).some((entry) => entry.label === "Completarea detaliilor")).toBe(false);
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
    const questions = clientQuestionOptions({ ...bouquet, type: "Nuntă", note: "" }, []);
    expect(questions.some((entry) => entry.label === "Bugetul pentru nuntă")).toBe(true);
    expect(questions.some((entry) => entry.label === "Textul bilețelului")).toBe(false);
  });
  it("pentru o comandă livrată cere feedback, nu reconfirmarea livrării", () => {
    const questions = clientQuestionOptions({ ...bouquet, status: "Livrată", address: "Strada Florilor" }, []);
    expect(questions).toHaveLength(1);
    expect(questions.some((entry) => entry.label === "Feedback după livrare")).toBe(true);
  });
});