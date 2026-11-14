CREATE OR REPLACE FUNCTION public.aplica_extragere_comanda(p_mesaje text[], p_rezultat jsonb, p_comanda text, p_versiune integer) RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
 v_phone text; v_type text := p_rezultat->>'tip_mesaj'; v_order public.comenzi%ROWTYPE; v_id text; v_missing text[]; v_status text; v_date date; v_interval text; v_deadline timestamp; v_hours integer; v_product jsonb; v_product_id text; v_quantity integer; v_expected integer; v_now timestamp := timestamp '2026-11-14 10:05:00'; v_reply text;
BEGIN
 IF coalesce(array_length(p_mesaje,1),0)=0 THEN RAISE EXCEPTION 'Lipsesc mesajele.'; END IF;
 SELECT telefon INTO v_phone FROM public.mesaje WHERE id=p_mesaje[1];
 IF v_phone IS NULL THEN RAISE EXCEPTION 'Mesajul nu exista.'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(regexp_replace(v_phone,'[^0-9]','','g')));
 PERFORM id FROM public.mesaje WHERE id=ANY(p_mesaje) FOR UPDATE;
 SELECT count(*) INTO v_expected FROM public.mesaje WHERE id=ANY(p_mesaje) AND telefon=v_phone AND directie='client' AND status IN ('nou','asteapta_client') AND tip_mesaj IS NULL;
 IF v_expected<>array_length(p_mesaje,1) THEN RAISE EXCEPTION 'Mesajele au fost deja procesate sau s-au schimbat. Reincarca Inbox.'; END IF;
 IF v_type NOT IN ('comanda_noua','modificare','completare','confirmare','intrebare_pret','altceva') THEN RAISE EXCEPTION 'Tip de mesaj invalid.'; END IF;
 IF nullif(p_comanda,'') IS NOT NULL THEN
  SELECT * INTO v_order FROM public.comenzi WHERE id=p_comanda AND telefon=v_phone FOR UPDATE;
  IF NOT FOUND OR v_order.status IN ('executata','livrata') OR v_order.versiune<>p_versiune THEN RAISE EXCEPTION 'Comanda s-a schimbat. Nu a fost modificata.'; END IF;
  v_id:=v_order.id;
 END IF;
 IF v_type IN ('modificare','completare','confirmare') AND v_id IS NULL THEN RAISE EXCEPTION 'Nu exista o comanda deschisa pentru acest mesaj.'; END IF;
 IF v_type IN ('comanda_noua','modificare','completare') THEN
  IF p_rezultat->>'tip_comanda' NOT IN ('buchet_oras','nunta') OR p_rezultat->>'tip_comanda' IS NULL THEN RAISE EXCEPTION 'Tip de comanda invalid.'; END IF;
  SELECT coalesce(array_agg(x),ARRAY[]::text[]) INTO v_missing FROM jsonb_array_elements_text(p_rezultat->'campuri_lipsa') x;
  v_date:=nullif(p_rezultat->>'data_livrare','')::date;
  v_interval:=nullif(p_rezultat->>'interval','');
  IF v_date IS NULL THEN v_missing:=array_append(v_missing,'data_livrare'); END IF;
  IF coalesce(p_rezultat->>'adresa','')='' THEN v_missing:=array_append(v_missing,'adresa'); END IF;
  IF coalesce(p_rezultat->>'destinatar','')='' THEN v_missing:=array_append(v_missing,'destinatar'); END IF;
  IF jsonb_array_length(p_rezultat->'produse')=0 THEN v_missing:=array_append(v_missing,'produse'); END IF;
  SELECT coalesce(array_agg(DISTINCT x),ARRAY[]::text[]) INTO v_missing FROM unnest(v_missing) x;
  SELECT ore_inainte_de_livrare INTO v_hours FROM public.termene WHERE tip_comanda=p_rezultat->>'tip_comanda';
  IF v_hours IS NULL THEN RAISE EXCEPTION 'Lipseste termenul din Setari.'; END IF;
  IF v_date IS NOT NULL THEN v_deadline:=v_date+coalesce(nullif(btrim(split_part(replace(v_interval,'–','-'),'-',1)),''),'08:00')::time-make_interval(hours=>v_hours); END IF;
  IF v_type='modificare' AND v_order.termen_modificare IS NULL AND v_order.data_livrare IS NULL THEN RAISE EXCEPTION 'Termenul nu poate fi verificat; verifica manual comanda.'; END IF;
  IF v_type='modificare' THEN
   SELECT ore_inainte_de_livrare INTO v_hours FROM public.termene WHERE tip_comanda=v_order.tip_comanda;
   IF v_now >= coalesce(v_order.data_livrare+coalesce(nullif(btrim(split_part(replace(v_order.interval,'–','-'),'-',1)),''),'08:00')::time-make_interval(hours=>v_hours),v_order.termen_modificare) THEN
    UPDATE public.comenzi SET avertisment='Modificare primita dupa termen' WHERE id=v_id;
    UPDATE public.mesaje SET tip_mesaj=v_type,comanda_id=v_id,intrebare_client=p_rezultat->>'intrebare_client' WHERE id=ANY(p_mesaje) AND status IN ('nou','asteapta_client');
    INSERT INTO public.mesaje(telefon,ora,text,canal,tip_mesaj,status,comanda_id,directie) VALUES(v_phone,v_now,'Am primit cererea de modificare. Termenul pentru modificări a trecut, așa că verificăm dacă o putem face și revenim în scurt timp.','WhatsApp',NULL,'confirmat',v_id,'florarie');
    RETURN v_id;
   END IF;
  END IF;
  FOR v_product IN SELECT value FROM jsonb_array_elements(p_rezultat->'produse') LOOP
   SELECT id INTO v_product_id FROM public.produse WHERE nume=v_product->>'nume_catalog';
   IF v_product_id IS NULL THEN RAISE EXCEPTION 'Produsul nu exista in catalog.'; END IF;
   v_quantity:=(v_product->>'cantitate')::integer;
   IF v_quantity<1 OR (v_product->>'cantitate')::numeric<>v_quantity THEN RAISE EXCEPTION 'Cantitate invalida.'; END IF;
  END LOOP;
  v_status:=CASE WHEN coalesce(array_length(v_missing,1),0)>0 OR v_type='comanda_noua' THEN 'draft' ELSE 'asteapta_client' END;
  IF v_type='comanda_noua' THEN
   INSERT INTO public.clienti(telefon,nume,tip) VALUES(v_phone,v_phone,'persoana') ON CONFLICT(telefon) DO NOTHING;
   INSERT INTO public.comenzi(telefon,tip_comanda,data_livrare,interval,adresa,destinatar,bilet,status,versiune,termen_modificare,campuri_lipsa,intrebare_client) VALUES(v_phone,p_rezultat->>'tip_comanda',v_date,v_interval,p_rezultat->>'adresa',p_rezultat->>'destinatar',p_rezultat->>'bilet',v_status,1,v_deadline,v_missing,p_rezultat->>'intrebare_client') RETURNING id INTO v_id;
  ELSE
   UPDATE public.comenzi SET tip_comanda=p_rezultat->>'tip_comanda',data_livrare=v_date,interval=v_interval,adresa=p_rezultat->>'adresa',destinatar=p_rezultat->>'destinatar',bilet=p_rezultat->>'bilet',status=v_status,versiune=versiune+1,termen_modificare=v_deadline,campuri_lipsa=v_missing,intrebare_client=p_rezultat->>'intrebare_client' WHERE id=v_id;
   DELETE FROM public.linii_comanda WHERE comanda_id=v_id;
  END IF;
  INSERT INTO public.linii_comanda(comanda_id,produs_id,cantitate,auxiliare) SELECT v_id,p.id,(j.value->>'cantitate')::integer,CASE WHEN j.ordinality=1 THEN (SELECT string_agg(x,', ') FROM jsonb_array_elements_text(p_rezultat->'auxiliare') x) ELSE NULL END FROM jsonb_array_elements(p_rezultat->'produse') WITH ORDINALITY j(value,ordinality) JOIN public.produse p ON p.nume=j.value->>'nume_catalog';
 ELSIF v_type='confirmare' THEN
  IF coalesce(array_length(v_order.campuri_lipsa,1),0)>0 OR v_order.data_livrare IS NULL OR coalesce(v_order.adresa,'')='' OR coalesce(v_order.destinatar,'')='' OR NOT EXISTS(SELECT 1 FROM public.linii_comanda WHERE comanda_id=v_id) THEN RAISE EXCEPTION 'Completeaza campurile lipsa inainte de confirmare.'; END IF;
  IF v_order.avertisment IS NOT NULL AND v_order.avertisment<>'' THEN RAISE EXCEPTION 'Comanda are un avertisment; confirmarea necesita decizia florarului.'; END IF;
  UPDATE public.comenzi SET status='asteapta_validare',versiune=versiune+1,intrebare_client=NULL WHERE id=v_id;
 END IF;
 UPDATE public.mesaje SET tip_mesaj=v_type,comanda_id=v_id,intrebare_client=p_rezultat->>'intrebare_client',status=CASE WHEN v_type='altceva' THEN 'ignorat' WHEN v_type='confirmare' THEN 'confirmat' ELSE status END WHERE id=ANY(p_mesaje) AND status IN ('nou','asteapta_client');
 v_reply:=CASE WHEN v_type='confirmare' THEN 'Mulțumim! Comanda a fost trimisă florarului spre validare. Vă anunțăm imediat ce este confirmată.' WHEN nullif(btrim(p_rezultat->>'intrebare_client'),'') IS NOT NULL THEN p_rezultat->>'intrebare_client' ELSE NULL END;
 IF v_reply IS NOT NULL THEN INSERT INTO public.mesaje(telefon,ora,text,canal,tip_mesaj,status,comanda_id,directie) VALUES(v_phone,v_now,v_reply,'WhatsApp',NULL,'confirmat',v_id,'florarie'); END IF;
 RETURN v_id;
END; $$;
REVOKE ALL ON FUNCTION public.aplica_extragere_comanda(text[],jsonb,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aplica_extragere_comanda(text[],jsonb,text,integer) TO anon,authenticated,service_role;