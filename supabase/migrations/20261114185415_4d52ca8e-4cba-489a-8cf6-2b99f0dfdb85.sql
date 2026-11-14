CREATE OR REPLACE FUNCTION public.executa_comanda(p_comanda text, p_versiune integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
 v_order public.comenzi%ROWTYPE;
 v_line record;
 v_part text;
 v_flower text;
 v_amount bigint;
 v_extra bigint;
 v_need jsonb := '{}'::jsonb;
 v_shortages jsonb := '[]'::jsonb;
 v_item record;
 v_available integer;
 v_count integer;
BEGIN
 SELECT * INTO v_order FROM public.comenzi WHERE id=p_comanda FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Comanda nu există.'; END IF;
 IF v_order.status NOT IN ('confirmata','in_lucru') THEN RAISE EXCEPTION 'Numai comenzile confirmate sau în lucru pot fi executate.'; END IF;
 IF p_versiune IS NULL OR v_order.versiune <> p_versiune THEN RAISE EXCEPTION 'Comanda s-a modificat între timp. Reîncarcă datele.'; END IF;
 PERFORM id FROM public.linii_comanda WHERE comanda_id=p_comanda ORDER BY id FOR UPDATE;
 PERFORM p.id FROM public.produse p WHERE EXISTS (SELECT 1 FROM public.linii_comanda l WHERE l.comanda_id=p_comanda AND l.produs_id=p.id) ORDER BY p.id FOR SHARE;
 IF NOT EXISTS (SELECT 1 FROM public.linii_comanda WHERE comanda_id=p_comanda) THEN RAISE EXCEPTION 'Comanda nu are produse.'; END IF;
 FOR v_line IN SELECT l.*,p.compozitie FROM public.linii_comanda l LEFT JOIN public.produse p ON p.id=l.produs_id WHERE l.comanda_id=p_comanda ORDER BY l.id LOOP
  IF v_line.cantitate <= 0 OR nullif(btrim(v_line.compozitie),'') IS NULL THEN RAISE EXCEPTION 'Compoziția sau cantitatea produsului % este invalidă.',v_line.produs_id; END IF;
  FOREACH v_part IN ARRAY string_to_array(v_line.compozitie,';') LOOP
   IF btrim(v_part)='' THEN CONTINUE; END IF;
   IF v_part !~ '^[^:]+:[[:space:]]*[0-9]+[[:space:]]*$' THEN RAISE EXCEPTION 'Compoziția produsului % este invalidă.',v_line.produs_id; END IF;
   v_flower := btrim(split_part(v_part,':',1));
   v_amount := btrim(split_part(v_part,':',2))::bigint * v_line.cantitate;
   IF v_flower='' OR v_amount<=0 THEN RAISE EXCEPTION 'Compoziția produsului % este invalidă.',v_line.produs_id; END IF;
   v_need := jsonb_set(v_need,ARRAY[v_flower],to_jsonb(coalesce((v_need->>v_flower)::bigint,0)+v_amount));
  END LOOP;
  SELECT count(*) * 3 INTO v_extra FROM regexp_matches(translate(lower(coalesce(v_line.auxiliare,'')), 'ăâîșşțţ','aaisstt'), '\mverdeata\M','g');
  IF v_extra>0 THEN v_need:=jsonb_set(v_need,ARRAY['eucalipt'],to_jsonb(coalesce((v_need->>'eucalipt')::bigint,0)+v_extra)); END IF;
 END LOOP;
 IF v_need='{}'::jsonb THEN RAISE EXCEPTION 'Comanda nu are o compoziție validă.'; END IF;
 -- Fixed lock order prevents two executions consuming the same stems concurrently.
 PERFORM floare FROM public.stoc ORDER BY floare FOR UPDATE;
 FOR v_item IN SELECT key,value::bigint AS needed FROM jsonb_each_text(v_need) ORDER BY key LOOP
  SELECT cantitate_fire INTO v_available FROM public.stoc WHERE floare=v_item.key;
  IF NOT FOUND THEN v_available:=0; END IF;
  IF v_available < v_item.needed THEN
   v_shortages:=v_shortages || jsonb_build_array(jsonb_build_object('flower',v_item.key,'missing',v_item.needed-v_available));
  END IF;
 END LOOP;
 IF jsonb_array_length(v_shortages)>0 THEN RETURN jsonb_build_object('ok',false,'shortages',v_shortages); END IF;
 FOR v_item IN SELECT key,value::bigint AS needed FROM jsonb_each_text(v_need) ORDER BY key LOOP
  UPDATE public.stoc SET cantitate_fire=cantitate_fire-v_item.needed WHERE floare=v_item.key;
  GET DIAGNOSTICS v_count=ROW_COUNT;
  IF v_count<>1 THEN RAISE EXCEPTION 'Stocul nu poate fi salvat. Nu s-a executat comanda.'; END IF;
 END LOOP;
 UPDATE public.comenzi SET status='executata',versiune=versiune+1 WHERE id=p_comanda;
 GET DIAGNOSTICS v_count=ROW_COUNT;
 IF v_count<>1 THEN RAISE EXCEPTION 'Comanda nu poate fi salvată. Stocul nu s-a modificat.'; END IF;
 RETURN jsonb_build_object('ok',true,'shortages','[]'::jsonb);
END;
$$;
REVOKE ALL ON FUNCTION public.executa_comanda(text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.executa_comanda(text,integer) TO anon, authenticated, service_role;