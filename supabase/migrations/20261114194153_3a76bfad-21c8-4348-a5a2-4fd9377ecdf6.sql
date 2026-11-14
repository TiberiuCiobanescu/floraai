DO $migration$
DECLARE
 definition text;
 original text;
BEGIN
 SELECT pg_get_functiondef('public.aplica_extragere_comanda(text[],jsonb,text,integer)'::regprocedure) INTO definition;
 original := definition;
 definition := replace(definition,
 'IF v_date IS NOT NULL AND v_interval IS NOT NULL THEN v_deadline:=v_date+split_part(v_interval,''-'',1)::time-make_interval(hours=>v_hours); END IF;',
 'IF v_date IS NOT NULL THEN v_deadline:=v_date+coalesce(nullif(btrim(split_part(replace(v_interval,''–'',''-''),''-'',1)),''''),''08:00'')::time-make_interval(hours=>v_hours); END IF;');
 IF definition = original THEN RAISE EXCEPTION 'Expected deadline calculation not found'; END IF;
 original := definition;
 definition := replace(definition,
 'IF v_type=''modificare'' AND (v_order.termen_modificare IS NULL AND (v_order.data_livrare IS NULL OR v_order.interval IS NULL)) THEN',
 'IF v_type=''modificare'' AND v_order.termen_modificare IS NULL AND v_order.data_livrare IS NULL THEN');
 IF definition = original THEN RAISE EXCEPTION 'Expected missing-date guard not found'; END IF;
 original := definition;
 definition := replace(definition,
 'v_order.data_livrare+split_part(replace(v_order.interval,''–'',''-''),''-'',1)::time-make_interval(hours=>v_hours)',
 'v_order.data_livrare+coalesce(nullif(btrim(split_part(replace(v_order.interval,''–'',''-''),''-'',1)),''''),''08:00'')::time-make_interval(hours=>v_hours)');
 IF definition = original THEN RAISE EXCEPTION 'Expected late-change calculation not found'; END IF;
 EXECUTE definition;
END;
$migration$;