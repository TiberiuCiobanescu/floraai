DO $patch$
DECLARE definition text;
BEGIN
 definition := pg_get_functiondef('public.aplica_extragere_comanda(text[],jsonb,text,integer)'::regprocedure);
 IF position('''confirmare'',''intrebare_pret'',''altceva''' in definition)=0 OR position(' IF v_type IN (''comanda_noua'',''modificare'',''completare'') THEN' in definition)=0 THEN RAISE EXCEPTION 'Definitia functiei nu corespunde versiunii asteptate.'; END IF;
 definition := replace(definition, '''confirmare'',''intrebare_pret'',''altceva''', '''confirmare'',''intrebare_pret'',''recomandare'',''altceva''');
 definition := replace(definition, ' IF v_type IN (''comanda_noua'',''modificare'',''completare'') THEN', ' IF nullif(btrim(p_rezultat->>''nume_client''),'''') IS NOT NULL THEN
  INSERT INTO public.clienti(telefon,nume,tip) VALUES(v_phone,v_phone,''persoana'') ON CONFLICT(telefon) DO NOTHING;
  UPDATE public.clienti SET nume=p_rezultat->>''nume_client'' WHERE telefon=v_phone AND nume=telefon;
 END IF;
 IF v_type IN (''comanda_noua'',''modificare'',''completare'') THEN');
 EXECUTE definition;
END $patch$;