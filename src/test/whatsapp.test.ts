import { describe,it,expect } from "vitest";
import { parseWhatsApp,groupMessages,whatsappUrl } from "@/features/florist/whatsapp";
describe("WhatsApp import rules",()=>{
 it("converts Romanian timestamp and appends continuation lines",()=>{
  expect(parseWhatsApp("14.11.2026, 09:02 - +40712345678: Buchet\nBilet: La mulți ani!")[0]).toEqual({telefon:"+40712345678",ora:"2026-11-14 09:02:00",text:"Buchet\nBilet: La mulți ani!"});
 });
 it("groups consecutive same-phone messages at exactly ten minutes",()=>{
  const messages=parseWhatsApp("14.11.2026, 09:02 - +40712345678: A\n14.11.2026, 09:12 - +40712345678: B\n14.11.2026, 09:23 - +40712345678: C");
  expect(groupMessages(messages).map(g=>g.length)).toEqual([2,1]);
 });
 it("does not group across another sender",()=>{
  expect(groupMessages(parseWhatsApp("14.11.2026, 09:02 - +40712345678: A\n14.11.2026, 09:03 - +40712345679: B\n14.11.2026, 09:04 - +40712345678: C")).length).toBe(3);
 });
 it("rejects invalid dates",()=>{expect(()=>parseWhatsApp("31.11.2026, 09:02 - +40712345678: A")).toThrow();});
 it("encodes the editable original WhatsApp text",()=>{expect(whatsappUrl("+40 712 345 678","Bună!\nConfirmi?")).toBe("https://wa.me/40712345678?text=Bun%C4%83!%0AConfirmi%3F");});
});