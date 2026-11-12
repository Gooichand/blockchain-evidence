-- Local review only. Do not run on production without approval.
-- Before rollout inspect duplicate task_id report groups. This migration preserves
-- all rows and adds no uniqueness constraint; ambiguous groups fail closed.
BEGIN;
ALTER TABLE public.analysis_reports ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION public.analyst_report_transition(
  p_operation text, p_task_id integer, p_analyst_id integer, p_wallet text,
  p_summary text DEFAULT NULL, p_findings text DEFAULT NULL,
  p_report_hash text DEFAULT NULL, p_submit boolean DEFAULT false,
  p_expected_revision integer DEFAULT NULL, p_progress integer DEFAULT NULL,
  p_notes text DEFAULT NULL, p_priority text DEFAULT NULL, p_estimated integer DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public
AS $$
DECLARE
  t public.analysis_tasks%ROWTYPE;
  r public.analysis_reports%ROWTYPE;
  n integer;
  stamp timestamptz := clock_timestamp();
BEGIN
  IF p_operation NOT IN ('save','start','progress') THEN
    RETURN jsonb_build_object('code','INVALID_INPUT');
  END IF;
  SELECT * INTO t FROM public.analysis_tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND OR NOT (coalesce(t.analyst_id = p_analyst_id,false)
      OR coalesce(t.analyst_wallet = p_wallet,false)) THEN
    RETURN jsonb_build_object('code','NOT_ASSIGNED');
  END IF;
  -- The task lock serializes every application report/start/progress write.
  SELECT count(*) INTO n FROM public.analysis_reports WHERE task_id = t.id;
  IF n > 1 THEN RETURN jsonb_build_object('code','DUPLICATE_REPORTS'); END IF;
  SELECT * INTO r FROM public.analysis_reports WHERE task_id = t.id FOR UPDATE;

  IF p_operation = 'save' THEN
    IF p_submit IS NULL OR coalesce(length(p_summary),0) > 10000
       OR coalesce(length(p_findings),0) > 50000
       OR (coalesce(length(btrim(p_summary)),0) = 0 AND coalesce(length(btrim(p_findings)),0) = 0)
       OR p_report_hash IS NULL OR p_report_hash !~ '^[0-9a-f]{64}$' THEN
      RETURN jsonb_build_object('code','INVALID_INPUT');
    END IF;
    IF r.id IS NOT NULL AND r.status <> 'draft' THEN
      -- An exact duplicate submit is an idempotent acknowledgement, not a new
      -- finalization. No write, new timestamp or completion notification.
      IF p_submit AND r.status = 'submitted' AND t.status = 'completed'
        AND r.result_summary IS NOT DISTINCT FROM p_summary
        AND r.findings IS NOT DISTINCT FROM p_findings
        AND r.report_hash = p_report_hash THEN
        RETURN jsonb_build_object('code','OK','report_id',r.id,'task_id',t.id,
          'report_hash',r.report_hash,'status',r.status,'revision',r.revision,'did_submit',false);
      END IF;
      RETURN jsonb_build_object('code','FINALIZED');
    END IF;
    IF t.status = 'completed' THEN RETURN jsonb_build_object('code','FINALIZED'); END IF;
    IF (r.id IS NULL AND coalesce(p_expected_revision,0) <> 0)
      OR (r.id IS NOT NULL AND (p_expected_revision IS NULL OR p_expected_revision <> r.revision)) THEN
      RETURN jsonb_build_object('code','STALE_REVISION');
    END IF;
    IF r.id IS NULL THEN
      INSERT INTO public.analysis_reports(task_id,evidence_id,case_id,analyst_id,analyst_wallet,
        status,report_hash,result_summary,findings,submitted_at,updated_at,revision)
      VALUES(t.id,t.evidence_id,t.case_id,p_analyst_id,p_wallet,
        CASE WHEN p_submit THEN 'submitted' ELSE 'draft' END,p_report_hash,p_summary,p_findings,
        CASE WHEN p_submit THEN stamp ELSE NULL END,stamp,1) RETURNING * INTO r;
    ELSE
      UPDATE public.analysis_reports SET status = CASE WHEN p_submit THEN 'submitted' ELSE 'draft' END,
        report_hash=p_report_hash,result_summary=p_summary,findings=p_findings,
        submitted_at=CASE WHEN p_submit THEN stamp ELSE NULL END,updated_at=stamp,revision=revision+1
        WHERE id=r.id RETURNING * INTO r;
    END IF;
    UPDATE public.analysis_tasks SET status=CASE WHEN p_submit THEN 'completed' ELSE 'in_progress' END,
      progress=CASE WHEN p_submit THEN 100 ELSE greatest(coalesce(progress,0),50) END,
      started_at=coalesce(started_at,stamp),completed_at=CASE WHEN p_submit THEN stamp ELSE NULL END
      WHERE id=t.id;
    RETURN jsonb_build_object('code','OK','report_id',r.id,'task_id',t.id,'report_hash',r.report_hash,
      'status',r.status,'revision',r.revision,'did_submit',p_submit,
      'requested_by',t.requested_by,'evidence_id',t.evidence_id,'case_id',t.case_id,'analysis_type',to_jsonb(t)->>'analysis_type');
  END IF;

  IF t.status='completed' OR (r.id IS NOT NULL AND r.status <> 'draft') THEN
    RETURN jsonb_build_object('code','FINALIZED');
  END IF;
  IF p_operation='start' THEN
    IF p_priority NOT IN ('critical','high','medium','low') OR p_priority IS NULL
      OR (p_estimated IS NOT NULL AND (p_estimated < 1 OR p_estimated > 525600)) THEN
      RETURN jsonb_build_object('code','INVALID_INPUT');
    END IF;
    UPDATE public.analysis_tasks SET status='in_progress',started_at=coalesce(started_at,stamp),
      priority=p_priority,estimated_time_minutes=p_estimated WHERE id=t.id;
    RETURN jsonb_build_object('code','OK','task_id',t.id,'status','in_progress');
  END IF;
  IF p_progress IS NULL OR p_progress < 0 OR p_progress > 100 OR coalesce(length(p_notes),0)>5000 THEN
    RETURN jsonb_build_object('code','INVALID_INPUT');
  END IF;
  UPDATE public.analysis_tasks SET progress=p_progress,notes=coalesce(p_notes,notes) WHERE id=t.id;
  RETURN jsonb_build_object('code','OK','task_id',t.id,'progress',p_progress,'status',t.status);
END;
$$;
REVOKE ALL ON FUNCTION public.analyst_report_transition(text,integer,integer,text,text,text,text,boolean,integer,integer,text,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.analyst_report_transition(text,integer,integer,text,text,text,text,boolean,integer,integer,text,text,integer) TO service_role;
COMMIT;
