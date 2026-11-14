CREATE OR REPLACE FUNCTION public.termen_actual_comanda(p_comanda text) RETURNS timestamp LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$ SELECT coalesce(c.data_livrare + coalesce(nullif(btrim(split_part(replace(c.interval,'–','-'),'-',1)),''),'08:00')::time - make_interval(hours=>t.ore_inainte_de_livrare), c.termen_modificare) FROM public.comenzi c JOIN public.termene t ON t.tip_comanda=c.tip_comanda WHERE c.id=p_comanda $$;
REVOKE ALL ON FUNCTION public.termen_actual_comanda(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.termen_actual_comanda(text) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.raspunde_eroare_extragere(p_mesaje text[]) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_phone text; v_id text; v_reply text := 'Am primit mesajul dumneavoastră. Un coleg de la florărie îl verifică și revine în scurt timp.';
BEGIN
 SELECT telefon INTO v_phone FROM public.mesaje WHERE id=p_mesaje[1] AND directie='client';
 IF v_phone IS NULL THEN RETURN; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(regexp_replace(v_phone,'[^0-9]','','g')));
 PERFORM id FROM public.mesaje WHERE id=ANY(p_mesaje) ORDER BY id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.mesaje WHERE id=ANY(p_mesaje) AND telefon=v_phone AND directie='client' AND tip_mesaj IS NULL AND status IN ('nou','asteapta_client') AND intrebare_client IS DISTINCT FROM v_reply) THEN RETURN; END IF;
 SELECT comanda_id INTO v_id FROM public.mesaje WHERE id=p_mesaje[1];
 UPDATE public.mesaje SET status='nou',intrebare_client=v_reply WHERE id=ANY(p_mesaje) AND telefon=v_phone AND directie='client' AND tip_mesaj IS NULL AND status IN ('nou','asteapta_client');
 INSERT INTO public.mesaje(telefon,ora,text,canal,status,comanda_id,directie) VALUES(v_phone,timestamp '2026-11-14 10:05:00',v_reply,'WhatsApp','confirmat',v_id,'florarie');
END $$;
REVOKE ALL ON FUNCTION public.raspunde_eroare_extragere(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.raspunde_eroare_extragere(text[]) TO anon,authenticated,service_role;

DO $patch$
DECLARE definition text;
BEGIN
 definition:=pg_get_functiondef('public.aplica_extragere_comanda(text[],jsonb,text,integer)'::regprocedure);
 IF position('''confirmare'',''intrebare_pret'',''recomandare'',''altceva''' in definition)=0 THEN RAISE EXCEPTION 'Versiune de extragere neasteptata'; END IF;
 definition:=replace(definition,'''confirmare'',''intrebare_pret'',''recomandare'',''altceva''','''confirmare'',''anulare'',''intrebare'',''intrebare_pret'',''recomandare'',''altceva''');
 definition:=replace(definition,'v_order.status IN (''executata'',''livrata'')','v_order.status IN (''executata'',''livrata'',''anulata'',''respinsa'')');
 definition:=replace(definition,' IF nullif(btrim(p_rezultat->>''nume_client''),'''') IS NOT NULL THEN',' IF v_type=''anulare'' THEN
  IF v_id IS NULL THEN
   v_reply:=''Nu am găsit o comandă activă pe acest număr.'';
  ELSE
   v_deadline:=public.termen_actual_comanda(v_id);
   IF v_deadline IS NULL THEN RAISE EXCEPTION ''Termenul nu poate fi verificat; verifica manual comanda.''; END IF;
   IF v_now >= v_deadline THEN
    UPDATE public.comenzi SET avertisment=''Anulare primita dupa termen'',versiune=versiune+1 WHERE id=v_id;
    v_reply:=''Am primit cererea de anulare. Termenul a trecut, așa că verificăm dacă o putem anula și revenim în scurt timp.'';
   ELSE
    UPDATE public.comenzi SET status=''anulata'',avertisment=NULL,versiune=versiune+1 WHERE id=v_id;
    v_reply:=''Comanda dumneavoastră a fost anulată. Vă mulțumim și vă așteptăm cu drag!'';
   END IF;
  END IF;
  UPDATE public.mesaje SET tip_mesaj=v_type,comanda_id=v_id,intrebare_client=v_reply WHERE id=ANY(p_mesaje) AND status IN (''nou'',''asteapta_client'');
  INSERT INTO public.mesaje(telefon,ora,text,canal,status,comanda_id,directie) VALUES(v_phone,v_now,v_reply,''WhatsApp'',''confirmat'',v_id,''florarie'');
  RETURN v_id;
 END IF;
 IF nullif(btrim(p_rezultat->>''nume_client''),'''') IS NOT NULL THEN');
 definition:=replace(definition,'IF v_type=''modificare'' AND v_order.termen_modificare','IF (v_type=''modificare'' OR (v_type=''completare'' AND v_order.status IN (''confirmata'',''in_lucru'',''asteapta_validare''))) AND v_order.termen_modificare');
 definition:=replace(definition,'IF v_type=''modificare'' THEN','IF v_type=''modificare'' OR (v_type=''completare'' AND v_order.status IN (''confirmata'',''in_lucru'',''asteapta_validare'')) THEN');
 definition:=replace(definition,'avertisment=''Modificare primita dupa termen'' WHERE','avertisment=''Modificare primita dupa termen'',versiune=versiune+1 WHERE');
 definition:=replace(definition,'status=v_status,versiune=versiune+1,termen_modificare','status=v_status,avertisment=NULL,versiune=versiune+1,termen_modificare');
 definition:=replace(definition,'UPDATE public.comenzi SET status=''asteapta_validare'',versiune=versiune+1,intrebare_client=NULL WHERE id=v_id;','v_deadline:=public.termen_actual_comanda(v_id);
  UPDATE public.comenzi SET status=''asteapta_validare'',versiune=versiune+1,intrebare_client=NULL,termen_modificare=v_deadline WHERE id=v_id;');
 definition:=replace(definition,'''Mulțumim! Comanda a fost trimisă florarului spre validare. Vă anunțăm imediat ce este confirmată.''','''Mulțumim! Comanda a fost trimisă florarului spre validare.'' || CASE WHEN v_deadline > v_now THEN '' O puteți modifica sau anula până pe ''||to_char(v_deadline,''DD.MM.YYYY, "ora" HH24:MI'')||''.'' ELSE '''' END');
 definition:=replace(definition,' IF v_reply IS NOT NULL THEN INSERT INTO public.mesaje',' IF nullif(btrim(v_reply),'''') IS NULL THEN v_reply:=''Ne pare rău, nu am înțeles mesajul. Ne puteți spune dacă doriți o comandă nouă, o modificare, o anulare sau un preț?''; END IF;
 IF v_reply IS NOT NULL THEN INSERT INTO public.mesaje');
 EXECUTE definition;
END $patch$;

CREATE OR REPLACE FUNCTION public.valideaza_comanda(p_comanda text,p_versiune integer) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_order public.comenzi%ROWTYPE; v_products text; v_deadline timestamp; v_now timestamp:=timestamp '2026-11-14 10:05:00'; v_reply text;
BEGIN
 SELECT * INTO v_order FROM public.comenzi WHERE id=p_comanda FOR UPDATE;
 IF NOT FOUND OR v_order.status<>'asteapta_validare' OR v_order.versiune<>p_versiune OR coalesce(v_order.avertisment,'')<>'' THEN RAISE EXCEPTION 'Comanda nu mai așteaptă validarea, are un avertisment sau a fost modificată. Reîncarcă datele.'; END IF;
 SELECT string_agg(l.cantitate||' '||p.nume,', ' ORDER BY l.id) INTO v_products FROM public.linii_comanda l JOIN public.produse p ON p.id=l.produs_id WHERE l.comanda_id=p_comanda;
 v_deadline:=public.termen_actual_comanda(p_comanda);
 UPDATE public.comenzi SET status='confirmata',versiune=versiune+1,termen_modificare=v_deadline WHERE id=p_comanda;
 v_reply:='Comanda dumneavoastră a fost confirmată: '||coalesce(v_products,'produsele agreate')||', '||to_char(v_order.data_livrare,'DD.MM.YYYY')||CASE WHEN nullif(btrim(v_order.interval),'') IS NOT NULL THEN ', '||v_order.interval ELSE '' END||', '||v_order.adresa||'. '||CASE WHEN v_deadline>v_now THEN 'Modificări sau anulare: până pe '||to_char(v_deadline,'DD.MM.YYYY, "ora" HH24:MI')||'. ' ELSE '' END||'Vă mulțumim!';
 INSERT INTO public.mesaje(telefon,ora,text,canal,status,comanda_id,directie) VALUES(v_order.telefon,v_now,v_reply,'WhatsApp','confirmat',p_comanda,'florarie');
END $$;
REVOKE ALL ON FUNCTION public.valideaza_comanda(text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.valideaza_comanda(text,integer) TO anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION public.decide_anulare_comanda(p_comanda text,p_versiune integer,p_accepta boolean) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE v_order public.comenzi%ROWTYPE; v_reply text;
BEGIN
 SELECT * INTO v_order FROM public.comenzi WHERE id=p_comanda FOR UPDATE;
 IF NOT FOUND OR v_order.versiune<>p_versiune OR v_order.avertisment IS DISTINCT FROM 'Anulare primita dupa termen' OR v_order.status IN ('anulata','respinsa','executata','livrata') THEN RAISE EXCEPTION 'Cererea de anulare s-a schimbat. Reîncarcă datele.'; END IF;
 UPDATE public.comenzi SET status=CASE WHEN p_accepta THEN 'anulata' ELSE status END,avertisment=NULL,versiune=versiune+1 WHERE id=p_comanda;
 v_reply:=CASE WHEN p_accepta THEN 'Comanda dumneavoastră a fost anulată. Vă mulțumim și vă așteptăm cu drag!' ELSE 'Din păcate comanda nu mai poate fi anulată, este deja în pregătire.' END;
 INSERT INTO public.mesaje(telefon,ora,text,canal,status,comanda_id,directie) VALUES(v_order.telefon,timestamp '2026-11-14 10:05:00',v_reply,'WhatsApp','confirmat',p_comanda,'florarie');
END $$;
REVOKE ALL ON FUNCTION public.decide_anulare_comanda(text,integer,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_anulare_comanda(text,integer,boolean) TO anon,authenticated,service_role;