import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, Lightbulb, Wand2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface KRReviewResult {
  kr_id: string | null;
  reviewed_at: string;
  ai_review: {
    overall_score: number;
    rating: "excellent" | "good" | "needs_work" | "poor";
    is_outcome: boolean;
    is_measurable: boolean;
    is_time_bound: boolean;
    is_aligned: boolean;
    ambition_level: "low" | "balanced" | "stretch" | "unrealistic";
    specific_score: number;
    measurable_score: number;
    achievable_score: number;
    relevant_score: number;
    time_bound_score: number;
    strengths: string[];
    issues: string[];
    suggestions: string[];
    improved_kr: string;
    summary: string;
  };
  smart_score: {
    specific: number;
    measurable: number;
    achievable: number;
    relevant: number;
    timeBound: number;
  };
  score: number;
  level: "Débil" | "Aceptable" | "Bueno" | "Excelente";
  blocked: boolean;
}

interface KRReviewButtonProps {
  kr_id?: string;
  objective: string;
  keyResult: string;
  cycle?: string;
  context?: Record<string, unknown>;
  onApplySuggestion: (improvedKR: string) => void;
  onResultChange?: (result: KRReviewResult | null) => void;
  /** Habilita validación automática con debounce (default: true) */
  autoReview?: boolean;
  /** Debounce en ms para auto-review (default: 800) */
  debounceMs?: number;
}

const levelStyles: Record<KRReviewResult["level"], string> = {
  Débil: "bg-destructive/15 text-destructive border-destructive/30",
  Aceptable: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
  Bueno: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400",
  Excelente: "bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400",
};

// Color por puntaje SMART (1-4): rojo 1-2, amarillo 3, verde 4
const smartColor = (val: number): string => {
  if (val <= 2) return "bg-destructive/15 text-destructive border-destructive/40";
  if (val === 3) return "bg-yellow-500/15 text-yellow-700 border-yellow-500/40 dark:text-yellow-400";
  return "bg-green-500/15 text-green-700 border-green-500/40 dark:text-green-400";
};

const KRReviewButton = ({
  kr_id,
  objective,
  keyResult,
  cycle,
  context,
  onApplySuggestion,
  onResultChange,
  autoReview = true,
  debounceMs = 800,
}: KRReviewButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KRReviewResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(autoReview);
  const debounceRef = useRef<number | null>(null);
  const lastReviewedKey = useRef<string>("");
  const inFlight = useRef(false);

  const canReview = keyResult.trim().length > 0 && objective.trim().length > 0;

  const runReview = useCallback(
    async (silent: boolean) => {
      if (!canReview || inFlight.current) return;
      const key = `${objective}|${keyResult}|${cycle ?? ""}|${JSON.stringify(context ?? {})}`;
      if (key === lastReviewedKey.current) return;
      inFlight.current = true;
      setLoading(true);
      try {
        const payload = { kr_id, objective, keyResult, cycle, context };
        console.log("[review-kr] request payload:", payload, { silent });
        const { data, error } = await supabase.functions.invoke("review-kr", { body: payload });
        console.log("[review-kr] response:", { data, error });
        if (error) throw error;
        const r = data as KRReviewResult;
        lastReviewedKey.current = key;
        setResult(r);
        setShowSuggestions(false);
        onResultChange?.(r);
        if (!silent) {
          if (r.blocked) toast.error("Este KR no cumple estándar mínimo SMART");
          else toast.success(`KR ${r.level.toLowerCase()} (score ${r.score})`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al revisar el KR";
        if (!silent) toast.error(msg);
        else console.warn("[review-kr] auto-review falló:", msg);
      } finally {
        inFlight.current = false;
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canReview, kr_id, objective, keyResult, cycle, JSON.stringify(context ?? {}), onResultChange],
  );

  // Auto-review con debounce al cambiar el KR/objetivo
  useEffect(() => {
    if (!autoEnabled || !canReview) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      runReview(true);
    }, debounceMs);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyResult, objective, cycle, JSON.stringify(context ?? {}), autoEnabled, canReview, debounceMs]);

  // Si el KR queda vacío, limpiamos el resultado anterior
  useEffect(() => {
    if (!canReview && result) {
      setResult(null);
      lastReviewedKey.current = "";
      onResultChange?.(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReview]);

  const applySuggestion = () => {
    if (!result?.ai_review.improved_kr) return;
    onApplySuggestion(result.ai_review.improved_kr);
    toast.success("Sugerencia aplicada al KR");
  };

  const topIssues = result?.ai_review.issues.slice(0, 2) ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => runReview(false)}
          disabled={loading || !canReview}
          className="gap-1.5"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Revisando…
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" /> Revisar con IA
            </>
          )}
        </Button>
        {autoEnabled && canReview && !result && !loading && (
          <span className="text-[11px] text-muted-foreground">Validación automática activa</span>
        )}
        {autoEnabled && loading && (
          <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Validando en vivo…
          </span>
        )}
      </div>

      {result && (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2.5 text-sm">
          {/* SMART en vivo: S M A R T con colores */}
          <div className="grid grid-cols-5 gap-1.5 text-xs">
            {([
              ["S", result.smart_score.specific, "Específico"],
              ["M", result.smart_score.measurable, "Medible"],
              ["A", result.smart_score.achievable, "Alcanzable"],
              ["R", result.smart_score.relevant, "Relevante"],
              ["T", result.smart_score.timeBound, "Temporal"],
            ] as const).map(([letter, val, label]) => (
              <div
                key={letter}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded border ${smartColor(val)}`}
                title={`${label}: ${val}/4`}
              >
                <span className="font-bold">{letter}</span>
                <span className="opacity-90">{val}/4</span>
              </div>
            ))}
          </div>

          {/* Score + nivel + blocked */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={levelStyles[result.level]}>
              {result.level} · {result.score.toFixed(2)}/4
            </Badge>
            {result.blocked ? (
              <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30 gap-1">
                <AlertTriangle className="w-3 h-3" /> Bloqueado
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400 gap-1">
                <CheckCircle2 className="w-3 h-3" /> Apto
              </Badge>
            )}
          </div>

          {result.blocked && (
            <p className="text-xs font-semibold text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Este KR no cumple estándar mínimo SMART
            </p>
          )}

          {/* Advertencias clave (top 2) */}
          {topIssues.length > 0 && (
            <ul className="list-disc pl-5 space-y-0.5 text-xs text-foreground">
              {topIssues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
          )}

          {/* Toggle: Ver mejora */}
          {(result.ai_review.suggestions.length > 0 || result.ai_review.improved_kr) && (
            <div className="pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions((s) => !s)}
                className="gap-1.5 h-7 px-2 text-xs"
              >
                {showSuggestions ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Ocultar mejora
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> Ver mejora
                  </>
                )}
              </Button>
            </div>
          )}

          {showSuggestions && (
            <div className="space-y-3 pt-1 border-t border-border/50">
              {result.ai_review.summary && (
                <p className="text-xs text-foreground italic">"{result.ai_review.summary}"</p>
              )}

              {result.ai_review.suggestions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-yellow-600" /> Sugerencias
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5 text-xs text-foreground">
                    {result.ai_review.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.ai_review.improved_kr && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-foreground">KR sugerido por IA</p>
                  <p className="text-xs text-foreground bg-card border border-border/50 rounded p-2">
                    {result.ai_review.improved_kr}
                  </p>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={applySuggestion}
                    className="gap-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Usar sugerencia
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KRReviewButton;
