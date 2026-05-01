import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, Lightbulb, Wand2 } from "lucide-react";
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
}

const levelStyles: Record<KRReviewResult["level"], string> = {
  Débil: "bg-destructive/15 text-destructive border-destructive/30",
  Aceptable: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
  Bueno: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400",
  Excelente: "bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400",
};

const KRReviewButton = ({
  kr_id,
  objective,
  keyResult,
  cycle,
  context,
  onApplySuggestion,
  onResultChange,
}: KRReviewButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KRReviewResult | null>(null);

  const canReview = keyResult.trim().length > 0 && objective.trim().length > 0;

  const handleReview = async () => {
    if (!canReview) {
      toast.error("Necesito el objetivo y la descripción del KR");
      return;
    }
    setLoading(true);
    try {
      const payload = { kr_id, objective, keyResult, cycle, context };
      console.log("[review-kr] request payload:", payload);
      const { data, error } = await supabase.functions.invoke("review-kr", {
        body: payload,
      });
      console.log("[review-kr] response:", { data, error });
      if (error) throw error;
      const r = data as KRReviewResult;
      setResult(r);
      onResultChange?.(r);
      if (r.blocked) {
        toast.error("Este KR no cumple estándar mínimo SMART");
      } else {
        toast.success(`KR ${r.level.toLowerCase()} (score ${r.score})`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al revisar el KR";
      toast.error(msg);
      setResult(null);
      onResultChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = () => {
    if (!result?.ai_review.improved_kr) return;
    onApplySuggestion(result.ai_review.improved_kr);
    toast.success("Sugerencia aplicada al KR");
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleReview}
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

      {result && (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-3 text-sm">
          {/* Header: score + level + blocked */}
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
                <CheckCircle2 className="w-3 h-3" /> Apto para guardar
              </Badge>
            )}
          </div>

          {/* SMART dimensions */}
          <div className="grid grid-cols-5 gap-1.5 text-xs">
            {([
              ["S", result.smart_score.specific],
              ["M", result.smart_score.measurable],
              ["A", result.smart_score.achievable],
              ["R", result.smart_score.relevant],
              ["T", result.smart_score.timeBound],
            ] as const).map(([letter, val]) => (
              <div
                key={letter}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded border border-border/50 bg-card"
                title={`Score ${val}/4`}
              >
                <span className="font-bold text-foreground">{letter}</span>
                <span className="text-muted-foreground">{val}/4</span>
              </div>
            ))}
          </div>

          {/* Summary */}
          {result.ai_review.summary && (
            <p className="text-xs text-foreground italic">"{result.ai_review.summary}"</p>
          )}

          {/* Issues */}
          {result.ai_review.issues.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Problemas detectados
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-xs text-foreground">
                {result.ai_review.issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
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

          {/* Improved KR + Apply */}
          {result.ai_review.improved_kr && (
            <div className="space-y-1.5 pt-1 border-t border-border/50">
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
  );
};

export default KRReviewButton;
