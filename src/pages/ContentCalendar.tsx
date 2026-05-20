import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Campaign { id: string; nome: string }
type CopySlide = {
  index: number
  role: "hook" | "insight" | "proof" | "cta"
  text: string
}

type CopyPayload = {
  tema: string
  post_type: "carrossel" | "post_unico" | "capa_reels" | "story"
  hook: string
  slides: CopySlide[]
  caption: string[]
  hashtags: string[]
  strategic_objective?: string
  user_direction?: string
}

type DesignSlide = {
  width: number
  height: number
  background: "primary" | "secondary" | "gradient"
  title: string
  subtitle?: string
  alignment: "left" | "center"
  elements: Array<"logo" | "divider" | "cta_button">
}

type DesignerPayload = {
  template: string
  style_preset: "bold" | "spotlight" | "kinetic"
  layout_variant: "editorial" | "split" | "spotlight" | "stacked"
  reference_mode?: boolean
  reference_image_url?: string
  reference_template_name?: string
  theme: {
    primary: string
    secondary: string
    accent: string
    neutral: string
    titleFont: string
    bodyFont: string
  }
  slides_json: DesignSlide[]
  html_templates: string[]
  export: string[]
  notes?: string[]
}

const DESIGNER_THEME_FALLBACK: DesignerPayload["theme"] = {
  primary: "#161E1F",
  secondary: "#EA5E0B",
  accent: "#FFFFFF",
  neutral: "#F8FAFC",
  titleFont: "Sora",
  bodyFont: "Inter",
}

interface Content {
  id: string; campaign_id: string; data: string; tipo_conteudo: string;
  tema: string; objetivo_post: string; status: string; agente_atual: string;
  created_at?: string;
  updated_at?: string;
  texto_gerado?: string;
  resultados_agentes?: { pesquisa?: string; copy?: string; copy_payload?: CopyPayload; design?: string; design_payload?: DesignerPayload; design_images?: string[]; _retryCount?: number };
  campaign?: { nome: string }
}

function parseDesignerPayload(content: Content | null): DesignerPayload | null {
  const normalizePayload = (payload: Partial<DesignerPayload> | null | undefined): DesignerPayload | null => {
    if (!payload || !Array.isArray(payload.slides_json) || !Array.isArray(payload.html_templates) || !Array.isArray(payload.export)) {
      return null
    }

    return {
      template: payload.template || "carousel_educativo",
      style_preset: payload.style_preset || "bold",
      layout_variant: payload.layout_variant || "editorial",
      reference_mode: payload.reference_mode,
      reference_image_url: payload.reference_image_url,
      reference_template_name: payload.reference_template_name,
      theme: {
        ...DESIGNER_THEME_FALLBACK,
        ...(payload.theme || {}),
      },
      slides_json: payload.slides_json,
      html_templates: payload.html_templates,
      export: payload.export,
      notes: payload.notes,
    }
  }

  const payload = normalizePayload(content?.resultados_agentes?.design_payload)
  if (payload) return payload

  const raw = content?.resultados_agentes?.design
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<DesignerPayload>
    return normalizePayload(parsed)
  } catch {
    return null
  }
}

function parseCopyPayload(content: Content | null): CopyPayload | null {
  const payload = content?.resultados_agentes?.copy_payload
  if (!payload || !Array.isArray(payload.slides) || !Array.isArray(payload.caption) || !Array.isArray(payload.hashtags)) {
    return null
  }

  return {
    tema: payload.tema,
    post_type: payload.post_type || "carrossel",
    hook: payload.hook,
    slides: payload.slides,
    caption: payload.caption,
    hashtags: payload.hashtags,
    strategic_objective: payload.strategic_objective,
    user_direction: payload.user_direction,
  }
}

function buildPreviewBackground(background: DesignSlide["background"], payload: DesignerPayload) {
  if (background === "gradient") {
    return `linear-gradient(135deg, ${payload.theme.primary} 0%, ${payload.theme.secondary} 100%)`
  }

  return background === "secondary" ? payload.theme.secondary : payload.theme.primary
}

function SlidePreview({ slide, index, payload }: { slide: DesignSlide; index: number; payload: DesignerPayload }) {
  const alignItems = slide.alignment === "center" ? "items-center text-center" : "items-start text-left"
  const panelStyle = {
    background: slide.background === "secondary" ? "rgba(15,23,42,0.22)" : "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.18)",
  }
  const isList = payload.template === "carousel_lista"
  const isStory = payload.template === "carousel_storytelling"
  const isAuthority = payload.template === "carousel_autoridade"
  const isSplit = payload.layout_variant === "split"
  const isSpotlightLayout = payload.layout_variant === "spotlight"
  const isStacked = payload.layout_variant === "stacked"

  return (
    <div className="space-y-2">
      <div
        className={`relative flex aspect-[4/5] w-full flex-col justify-between overflow-hidden rounded-xl p-6 shadow-sm ${alignItems}`}
        style={{ background: buildPreviewBackground(slide.background, payload), color: "#F8FAFC" }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {payload.style_preset === "kinetic" && (
            <>
              <div className="absolute -right-10 -top-10 h-40 w-40 rotate-12 rounded-[2rem] opacity-90" style={{ background: payload.theme.secondary }} />
              <div className="absolute -left-10 bottom-16 h-32 w-32 rounded-full opacity-20" style={{ background: payload.theme.accent }} />
            </>
          )}
          {payload.style_preset === "spotlight" && (
            <div className="absolute right-10 top-10 h-40 w-40 rounded-full opacity-40 blur-2xl" style={{ background: payload.theme.accent }} />
          )}
          {payload.style_preset === "bold" && (
            <div className="absolute inset-5 rounded-[1.75rem] border" style={{ borderColor: "rgba(255,255,255,0.18)" }} />
          )}
        </div>
        <div className={`relative flex w-full ${isSplit || (isList && slide.alignment === "left") ? "gap-4" : ""}`}>
          <div className={`flex flex-1 flex-col gap-4 ${isSpotlightLayout ? "items-center text-center" : alignItems} ${isStacked ? "justify-end" : ""}`}>
            <div className={`flex w-full ${slide.alignment === "center" ? "justify-center" : "justify-start"}`}>
              <span className="inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90" style={panelStyle}>
                {payload.template.replace("carousel_", "").replace("_", " ")}
              </span>
            </div>
            {slide.elements.includes("divider") && (
              <div className="h-1.5 w-24 rounded-full bg-white/90" />
            )}
            <div
              className={`${isStory || isSpotlightLayout || isStacked ? "rounded-[1.5rem] border p-4" : ""} ${isStacked ? "mt-auto" : ""}`}
              style={isStory || isSpotlightLayout || isStacked ? panelStyle : undefined}
            >
              <h3 className="max-w-[90%] text-2xl font-black leading-[0.95] tracking-tight">
                {slide.title}
              </h3>
              {slide.subtitle && (
                <p className="mt-3 max-w-[90%] text-sm leading-relaxed text-white/90">
                  {slide.subtitle}
                </p>
              )}
            </div>
          </div>
          {(isSplit || (isList && slide.alignment === "left")) && (
            <div className="hidden w-24 shrink-0 rounded-[1.5rem] border p-3 md:flex md:flex-col md:justify-between" style={panelStyle}>
              <div className={`h-16 overflow-hidden rounded-xl ${isSplit ? "block" : "hidden"}`} style={{ background: "rgba(255,255,255,0.10)" }}>
                {payload.reference_mode && payload.reference_image_url ? (
                  <img src={payload.reference_image_url} alt="Referência visual" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <span className="text-3xl font-black leading-none">0{index + 1}</span>
              <span className="mt-2 text-[10px] uppercase tracking-[0.14em] text-white/70">passo</span>
            </div>
          )}
        </div>
        <div className={`relative flex w-full flex-wrap items-center gap-3 ${slide.alignment === "center" ? "justify-center" : "justify-between"}`}>
          {slide.elements.includes("cta_button") ? (
            <div className="rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-slate-900" style={{ background: payload.theme.accent }}>
              CTA
            </div>
          ) : (
            <div />
          )}
          {slide.elements.includes("logo") && (
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">
              {isAuthority ? "assinatura" : "logo"}
            </div>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500">
        {slide.width}x{slide.height} • {slide.background} • {slide.alignment} • {payload.style_preset}
      </p>
    </div>
  )
}

const TIPOS = ["Reels", "Carrossel", "Post Estático", "Stories", "Vídeo Longo", "Artigo Blog", "E-mail"]
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDENTE: { label: "Pendente", color: "bg-slate-100 text-slate-700 border-slate-200" },
  EM_PRODUCAO: { label: "Em Produção", color: "bg-blue-100 text-blue-700 border-blue-200" },
  REVISAO: { label: "Revisão", color: "bg-amber-100 text-amber-700 border-amber-200" },
  APROVADO: { label: "Aprovado", color: "bg-green-100 text-green-700 border-green-200" },
  PUBLICADO: { label: "Publicado", color: "bg-purple-100 text-purple-700 border-purple-200" },
}

const WORKFLOW_STEPS = [
  { key: "pesquisa", label: "Pesquisa", agent: "Pesquisador" },
  { key: "copy", label: "Copy", agent: "Copywriter" },
  { key: "design", label: "Direcao Visual", agent: "Designer" },
] as const

const DESIGN_TEMPLATE_OPTIONS = [
  { value: "carousel_educativo", label: "Educativo" },
  { value: "carousel_autoridade", label: "Autoridade" },
  { value: "carousel_lista", label: "Lista" },
  { value: "carousel_storytelling", label: "Storytelling" },
  { value: "post_piramide_ia", label: "Pirâmide IA" },
] as const

const DESIGN_STYLE_OPTIONS = [
  { value: "bold", label: "Bold" },
  { value: "spotlight", label: "Elegante" },
  { value: "kinetic", label: "Dinâmico" },
] as const

const DESIGN_ALIGNMENT_OPTIONS = [
  { value: "left", label: "Esquerda" },
  { value: "center", label: "Centro" },
] as const

export default function ContentCalendar() {
  const [searchParams] = useSearchParams()
  const initialCampaignId = searchParams.get("campaignId")
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [activeCampaignId, setActiveCampaignId] = useState("")
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [loadedCampaignId, setLoadedCampaignId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [reviewItem, setReviewItem] = useState<Content | null>(null)
  const [activeTab, setActiveTab] = useState<"pesquisa"|"copy"|"design">("pesquisa")
  const [observation, setObservation] = useState("")
  const [designTemplate, setDesignTemplate] = useState<DesignerPayload["template"]>("carousel_educativo")
  const [designStylePreset, setDesignStylePreset] = useState<DesignerPayload["style_preset"]>("bold")
  const [designAlignment, setDesignAlignment] = useState<DesignSlide["alignment"]>("left")
  const [designReferenceImageUrl, setDesignReferenceImageUrl] = useState("")
  const [designReferenceNotes, setDesignReferenceNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [formData, setFormData] = useState({ data: "", tipo_conteudo: "Carrossel", tema: "", objetivo_post: "" })

  useEffect(() => {
    fetch("/api/campaigns").then(r => r.json()).then(data => {
      const list = Array.isArray(data) ? data : []
      setCampaigns(list)
      if (initialCampaignId && list.some(c => c.id === initialCampaignId)) {
        setActiveCampaignId(initialCampaignId)
      } else if (list.length > 0) {
        setActiveCampaignId(list[0].id)
      }
    })
  }, [initialCampaignId])

  const refreshContents = useCallback(async (
    campaignId: string,
    reviewId?: string | null,
    options?: { silent?: boolean }
  ) => {
    if (!campaignId) return

    const silent = options?.silent ?? false
    const shouldShowLoading = !silent && loadedCampaignId !== campaignId

    if (shouldShowLoading) {
      setLoading(true)
    }

    try {
      const response = await fetch(`/api/contents?campaign_id=${campaignId}`)
      const data = await response.json()
      const list = Array.isArray(data) ? data : []

      setContents(previousContents => {
        const hasSameData = JSON.stringify(previousContents) === JSON.stringify(list)
        return hasSameData ? previousContents : list
      })
      setLoadedCampaignId(campaignId)

      if (reviewId) {
        const updated = list.find((content: Content) => content.id === reviewId)
        setReviewItem(updated || null)
      }
    } finally {
      if (shouldShowLoading) {
        setLoading(false)
      }
    }
  }, [loadedCampaignId])

  useEffect(() => {
    if (!activeCampaignId) return

    if (loadedCampaignId !== activeCampaignId) {
      setLoading(true)
    }
  }, [activeCampaignId, loadedCampaignId])

  useEffect(() => { 
    void refreshContents(activeCampaignId, reviewItem?.id);
    
    // Atualização em tempo real (polling) para acompanhar os agentes trabalhando
    const interval = setInterval(() => {
      // Pause polling while a mutation is in progress to prevent UI jumping/overwriting
      if (!activeCampaignId || isProcessing) return;

      void refreshContents(activeCampaignId, reviewItem?.id, { silent: true })
        .catch(err => console.error("Polling error:", err)); // Silently handle polling errors
    }, 2000);
    
    return () => clearInterval(interval);
  }, [activeCampaignId, isProcessing, refreshContents, reviewItem?.id])

  useEffect(() => {
    const payload = parseDesignerPayload(reviewItem)
    if (!payload) {
      setDesignReferenceImageUrl("")
      return
    }

    setDesignTemplate(payload.template)
    setDesignStylePreset(payload.style_preset)
    setDesignAlignment(payload.slides_json[0]?.alignment || "left")
    setDesignReferenceImageUrl(payload.reference_image_url || "")
  }, [reviewItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/contents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, campaign_id: activeCampaignId })
    })
    setIsOpen(false)
    setFormData({ data: "", tipo_conteudo: "Carrossel", tema: "", objetivo_post: "" })
    await refreshContents(activeCampaignId)
  }

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/contents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    })
    await refreshContents(activeCampaignId, reviewItem?.id)
  }

  const handleApproveContent = async () => {
    if (!reviewItem) return;
    await fetch(`/api/contents/${reviewItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APROVADO", agente_atual: "Pronto para Publicar" })
    });
    setReviewItem(null);
    await refreshContents(activeCampaignId);
  }

  const agentToTab: Record<string, "pesquisa"|"copy"|"design"> = { 'Pesquisador': 'pesquisa', 'Copywriter': 'copy', 'Designer': 'design' };

  const getStepState = (stepKey: "pesquisa" | "copy" | "design") => {
    if (!reviewItem) return "pending"

    const results = reviewItem.resultados_agentes
    const designPayload = parseDesignerPayload(reviewItem)
    const isDone =
      (stepKey === "pesquisa" && Boolean(results?.pesquisa)) ||
      (stepKey === "copy" && Boolean(results?.copy || reviewItem.texto_gerado)) ||
      (stepKey === "design" && Boolean(results?.design || designPayload?.slides_json?.length || results?.design_images?.length))

    if (stepKey === activeTab && isProcessing) return "active"
    if (stepKey === activeTab && reviewItem.status !== "APROVADO" && reviewItem.status !== "PUBLICADO") return "active"
    if (isDone) return "done"
    return "pending"
  }

  const completedStepsCount = reviewItem
    ? WORKFLOW_STEPS.filter(step => getStepState(step.key) === "done").length
    : 0

  const progressValue = Math.round((completedStepsCount / WORKFLOW_STEPS.length) * 100)

  const getStepTimestampLabel = (stepKey: "pesquisa" | "copy" | "design") => {
    if (!reviewItem?.updated_at) return null
    if (getStepState(stepKey) === "pending") return null
    return new Date(reviewItem.updated_at).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const buildObservationPayload = () => {
    if (activeTab !== "design") return observation

    const directives = [
      `template ${designTemplate}`,
      `estilo ${designStylePreset}`,
      `alinhamento ${designAlignment === "center" ? "central" : "esquerda"}`,
      designReferenceImageUrl.trim() ? `imagem_referencia ${designReferenceImageUrl.trim()}` : "",
      designReferenceNotes.trim() ? `referencia_visual ${designReferenceNotes.trim()}` : "",
      observation.trim(),
    ].filter(Boolean)

    return directives.join(". ")
  }

  const handleAdvance = async () => {
    if (!reviewItem) return
    setIsProcessing(true)
    try {
      // Map active tab to agent name for the backend
      const tabToAgent: Record<string, string> = { pesquisa: 'Pesquisador', copy: 'Copywriter', design: 'Designer' };
      const currentAgent = tabToAgent[activeTab] || reviewItem.agente_atual;
      const res = await fetch(`/api/contents/${reviewItem.id}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          current_agent: currentAgent, 
          observacao: buildObservationPayload()
        })
      })
      if (!res.ok) throw new Error("Falha ao avançar")
      const updated = await res.json()
      setReviewItem(prev => prev ? { ...prev, ...updated } : null)
      setObservation("")
      // Auto-switch tab to the next agent so user sees the new content
      if (updated.agente_atual && agentToTab[updated.agente_atual]) {
        setActiveTab(agentToTab[updated.agente_atual])
      }
      await refreshContents(activeCampaignId, reviewItem.id)
    } catch (err) {
      console.error(err)
      alert("Erro ao avançar o processo. Tente novamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = async () => {
    if (!reviewItem) return
    setIsProcessing(true)
    try {
      // Map active tab to agent name so retry works from any state
      const tabToAgent: Record<string, string> = { pesquisa: 'Pesquisador', copy: 'Copywriter', design: 'Designer' };
      const targetAgent = tabToAgent[activeTab] || reviewItem.agente_atual;
      const res = await fetch(`/api/contents/${reviewItem.id}/retry`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observacao: buildObservationPayload(), target_agent: targetAgent })
      })
      if (!res.ok) throw new Error("Falha ao refazer")
      const updated = await res.json()
      setReviewItem(prev => prev ? { ...prev, ...updated } : null)
      setObservation("")
      await refreshContents(activeCampaignId, reviewItem.id)
    } catch (err) {
      console.error(err)
      alert("Erro ao refazer a etapa. Tente novamente.")
    } finally {
      setIsProcessing(false)
    }
  }

  const statusKeys = Object.keys(STATUS_CONFIG)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Review Dialog */}
      <Dialog open={!!reviewItem} onOpenChange={(o) => {
        if(!o) {
          setReviewItem(null);
          setObservation("");
          setActiveTab("pesquisa");
          setDesignReferenceImageUrl("");
          setDesignReferenceNotes("");
        }
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Conteúdo - {reviewItem?.tema}</DialogTitle>
            <DialogDescription>Acompanhe o progresso da IA ou revise o conteúdo finalizado.</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4 overflow-y-auto flex-1">
            <div className="rounded-xl border bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Progresso do fluxo</p>
                  <p className="text-xs text-slate-500">Acompanhe a evolução entre pesquisa, copy e design.</p>
                </div>
                <span className="text-sm font-bold text-slate-700">{progressValue}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {WORKFLOW_STEPS.map((step, index) => {
                const stepState = getStepState(step.key)
                const timeLabel = getStepTimestampLabel(step.key)
                const style =
                  stepState === "done"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : stepState === "active"
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                const badge =
                  stepState === "done"
                    ? "Concluido"
                    : stepState === "active"
                      ? (isProcessing ? "Processando" : "Atual")
                      : "Pendente"

                return (
                  <div key={step.key} className={`rounded-lg border p-3 ${style}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide">Etapa {index + 1}</p>
                        <p className="text-sm font-bold">{step.label}</p>
                        <p className="text-xs opacity-80">{step.agent}</p>
                        {timeLabel && (
                          <p className="mt-1 text-[11px] opacity-70">Atualizado às {timeLabel}</p>
                        )}
                      </div>
                      <span className="rounded-full border border-current/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">
                        {badge}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="flex border-b">
              <button 
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'pesquisa' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('pesquisa')}
              >
                1. Pesquisa
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'copy' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('copy')}
              >
                2. Texto (Copy)
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium ${activeTab === 'design' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab('design')}
              >
                3. Direcao Visual
              </button>
            </div>

            <div className="bg-muted p-4 rounded-md text-sm border min-h-[150px] space-y-4">
               {activeTab === 'pesquisa' && (
                 <div className="whitespace-pre-wrap">{reviewItem?.resultados_agentes?.pesquisa || "Aguardando agente Pesquisador..."}</div>
               )}
               {activeTab === 'copy' && (() => {
                 const copyText = reviewItem?.resultados_agentes?.copy || reviewItem?.texto_gerado || "";
                 const copyPayload = parseCopyPayload(reviewItem);
                 if (!copyText) return <div className="text-muted-foreground">Aguardando agente Copywriter...</div>;
                 const sections = copyText.split('---').map((s: string) => s.trim()).filter(Boolean);
                 return (
                   <div className="space-y-4">
                     {copyPayload && (
                       <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
                         <div className="flex flex-wrap items-center gap-2">
                           <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                             Formato: {copyPayload.post_type.replace("_", " ")}
                           </span>
                           <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                             Hook: {copyPayload.hook}
                           </span>
                         </div>
                         <div className="grid gap-3 md:grid-cols-2">
                           {copyPayload.slides.map((slide) => (
                             <div key={slide.index} className="rounded-lg border border-slate-200 bg-white p-4">
                               <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                 Slide {slide.index} • {slide.role}
                               </p>
                               <p className="mt-2 text-sm font-medium text-slate-900">{slide.text}</p>
                             </div>
                           ))}
                         </div>
                         <div className="rounded-lg border border-slate-200 bg-white p-4">
                           <p className="text-sm font-semibold text-slate-800">Legenda estruturada</p>
                           <div className="mt-2 space-y-2 text-sm text-slate-700">
                             {copyPayload.caption.map((paragraph, index) => (
                               <p key={index}>{paragraph}</p>
                             ))}
                           </div>
                         </div>
                         <div className="flex flex-wrap gap-2">
                           {copyPayload.hashtags.map((tag) => (
                             <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                               {tag}
                             </span>
                           ))}
                         </div>
                       </div>
                     )}
                     {sections.map((section: string, i: number) => {
                       const isArte = section.includes('TEXTO DA ARTE');
                       const isLegenda = section.includes('LEGENDA');
                       const isHashtags = section.includes('HASHTAGS');
                       const bgClass = isArte 
                         ? 'bg-violet-50 border-violet-200' 
                         : isHashtags 
                           ? 'bg-blue-50 border-blue-200'
                           : isLegenda
                             ? 'bg-white border-slate-200'
                             : 'bg-white border-slate-200';
                       return (
                         <div key={i} className={`p-4 rounded-lg border ${bgClass} whitespace-pre-wrap`}>
                           {section}
                         </div>
                       );
                     })}
                   </div>
                 );
               })()}
               {activeTab === 'design' && (() => {
                 const designText = reviewItem?.resultados_agentes?.design || "";
                 const designPayload = parseDesignerPayload(reviewItem);
                 const designVersion = (reviewItem?.resultados_agentes?._retryCount || 0) + 1;
                 if (!designText && !designPayload) return <div className="text-muted-foreground">Aguardando agente Designer...</div>;
                 return (
                   <div className="space-y-4">
                     <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                       <div>
                         <p className="text-sm font-semibold text-slate-800">Versao da estrutura visual</p>
                         <p className="text-xs text-slate-500">Cada refacao atualiza o pacote do Designer pronto para renderizacao via Satori.</p>
                       </div>
                       <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                         V{designVersion}
                       </span>
                     </div>
                     {designPayload && (
                       <>
                         <div className="rounded-lg border border-slate-200 bg-white p-4">
                           <div className="flex flex-wrap items-center gap-2">
                             <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                               Template: {DESIGN_TEMPLATE_OPTIONS.find(option => option.value === designPayload.template)?.label || designPayload.template}
                             </span>
                             <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                               Estilo: {DESIGN_STYLE_OPTIONS.find(option => option.value === designPayload.style_preset)?.label || designPayload.style_preset}
                             </span>
                             <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                               Layout: {designPayload.layout_variant}
                             </span>
                             {designPayload.reference_mode && (
                               <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                 Referência visual ativa
                               </span>
                             )}
                             <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                               Alinhamento: {designPayload.slides_json[0]?.alignment === "center" ? "Centro" : "Esquerda"}
                             </span>
                           </div>
                         </div>
                         {designPayload.notes && designPayload.notes.length > 0 && (
                           <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                             <p className="text-sm font-semibold text-amber-900">Notas do Designer</p>
                             <div className="mt-2 space-y-1 text-sm text-amber-950">
                               {designPayload.notes.map((note, index) => (
                                 <p key={index}>{note}</p>
                               ))}
                             </div>
                           </div>
                         )}
                         <div className="space-y-3">
                           <p className="text-sm font-semibold text-slate-700">Previa visual dos slides</p>
                           <div className="grid gap-3 md:grid-cols-2">
                             {designPayload.slides_json.map((slide, index) => (
                               <SlidePreview key={index} slide={slide} index={index} payload={designPayload} />
                             ))}
                           </div>
                         </div>
                         <details className="rounded-lg border border-slate-200 bg-white p-4">
                           <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                             Ver estrutura tecnica para Satori
                           </summary>
                           <div className="mt-4 space-y-4">
                             <div className="space-y-3">
                               <p className="text-sm font-semibold text-slate-700">Slides estruturados</p>
                               <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                 <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-slate-800">
                                   {JSON.stringify(designPayload.slides_json, null, 2)}
                                 </pre>
                               </div>
                             </div>
                             <div className="space-y-3">
                               <p className="text-sm font-semibold text-slate-700">HTML/CSS para Satori</p>
                               <div className="space-y-3">
                                 {designPayload.html_templates.map((template, index) => (
                                   <div key={index} className="rounded-lg border border-slate-200 bg-slate-950 p-4">
                                     <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">Slide {index + 1}</p>
                                     <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-slate-100">{template}</pre>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           </div>
                         </details>
                         <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                           <p className="text-sm font-semibold text-emerald-900">Export planejado</p>
                           <p className="mt-2 text-sm text-emerald-950">{designPayload.export.join(", ")}</p>
                         </div>
                         <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
                           <div>
                             <p className="text-sm font-semibold text-slate-800">Editor de Template</p>
                             <p className="text-xs text-slate-500">Escolha a estrutura visual antes de atualizar a etapa.</p>
                           </div>
                           <div className="grid gap-4 md:grid-cols-3">
                             <div className="space-y-2">
                               <Label>Template</Label>
                               <select
                                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                 value={designTemplate}
                                 onChange={(e) => setDesignTemplate(e.target.value as DesignerPayload["template"])}
                               >
                                 {DESIGN_TEMPLATE_OPTIONS.map(option => (
                                   <option key={option.value} value={option.value}>{option.label}</option>
                                 ))}
                               </select>
                             </div>
                             <div className="space-y-2">
                               <Label>Estilo</Label>
                               <select
                                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                 value={designStylePreset}
                                 onChange={(e) => setDesignStylePreset(e.target.value as DesignerPayload["style_preset"])}
                               >
                                 {DESIGN_STYLE_OPTIONS.map(option => (
                                   <option key={option.value} value={option.value}>{option.label}</option>
                                 ))}
                               </select>
                             </div>
                             <div className="space-y-2">
                               <Label>Alinhamento</Label>
                               <select
                                 className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                 value={designAlignment}
                                 onChange={(e) => setDesignAlignment(e.target.value as DesignSlide["alignment"])}
                               >
                                 {DESIGN_ALIGNMENT_OPTIONS.map(option => (
                                   <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                               </select>
                             </div>
                           </div>
                           <div className="grid gap-4 md:grid-cols-2">
                             <div className="space-y-2">
                               <Label>Imagem de referência</Label>
                               <Input
                                 placeholder="https://site.com/referencia.jpg"
                                 value={designReferenceImageUrl}
                                 onChange={(e) => setDesignReferenceImageUrl(e.target.value)}
                               />
                               <p className="text-xs text-slate-500">Cole a URL de uma imagem ou screenshot do site para guiar o HTML do template.</p>
                             </div>
                             <div className="space-y-2">
                               <Label>Leitura visual da referência</Label>
                               <textarea
                                 className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                 placeholder="Ex: hero com imagem lateral, cards minimalistas, muito espaço em branco..."
                                 value={designReferenceNotes}
                                 onChange={(e) => setDesignReferenceNotes(e.target.value)}
                               />
                             </div>
                           </div>
                           {designReferenceImageUrl.trim() && (
                             <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                               <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prévia da referência</p>
                               <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                 <img src={designReferenceImageUrl} alt="Referência visual do template" className="max-h-56 w-full object-cover" />
                               </div>
                             </div>
                           )}
                         </div>
                       </>
                     )}
                     {!designPayload && designText && (
                       <div className="rounded-lg border border-slate-200 bg-white p-4 whitespace-pre-wrap">
                         {designText}
                       </div>
                     )}
                   </div>
                 );
               })()}
             </div>
            
            {(reviewItem?.status === 'EM_PRODUCAO' || reviewItem?.agente_atual) && (
              <div className="space-y-4 mt-4">
                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded flex items-center gap-2 font-medium">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  🤖 Finalizado passo: {reviewItem?.agente_atual}
                </div>
                
                <div className="space-y-2 mt-4">
                  <Label>
                    {reviewItem?.agente_atual === 'Designer' 
                      ? '✏️ Solicitar ajustes na direcao visual (cores, layout, elementos...)' 
                      : 'Observação para os próximos passos (Opcional)'}
                  </Label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder={reviewItem?.agente_atual === 'Designer' 
                      ? 'Ex: Preciso que use as cores da minha marca, mude a fonte do título...'
                      : 'Ex: Gostaria que o tom de voz ficasse mais humorado e rápido...'}
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                  />
                  {observation.trim().length > 0 && (
                    <Button 
                      size="sm" 
                      onClick={handleRetry}
                      disabled={isProcessing}
                      className="bg-amber-500 hover:bg-amber-600 text-white gap-1"
                    >
                      {isProcessing ? (
                        <><span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span> Processando...</>
                      ) : (
                        <>📩 Atualizar Briefing Visual</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-end gap-2 flex-shrink-0">
            {reviewItem?.status === 'REVISAO' ? (
              <>
                <Button variant="outline" onClick={handleRetry} disabled={isProcessing}>
                  {isProcessing ? <span className="h-4 w-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin mr-1"></span> : "🔄 "}
                  Rejeitar (Pedir Ajuste)
                </Button>
                <Button onClick={handleApproveContent} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  👍 Aprovar Conteúdo
                </Button>
              </>
            ) : reviewItem?.status === 'EM_PRODUCAO' || reviewItem?.agente_atual ? (
              <>
                <Button variant="outline" onClick={handleRetry} disabled={isProcessing}>
                  {isProcessing ? <span className="h-4 w-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin mr-1"></span> : "🔄 "}
                  Atualizar Etapa
                </Button>
                <Button variant="outline" onClick={() => { setReviewItem(null); setObservation(""); }} disabled={isProcessing}>Fechar</Button>
                
                {reviewItem?.agente_atual !== 'Aguardando Aprovação' && (
                  <Button onClick={handleAdvance} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    {isProcessing ? (
                      <><span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span> Avançando...</>
                    ) : (
                      <>Avançar Processo 🚀</>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <Button variant="outline" onClick={() => setReviewItem(null)}>Fechar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendário de Conteúdo</h2>
          <p className="text-muted-foreground">Visão Kanban dos seus itens de conteúdo por campanha.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={activeCampaignId}
            onChange={e => setActiveCampaignId(e.target.value)}
          >
            <option value="">-- Campanha --</option>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button disabled={!activeCampaignId}>Adicionar Conteúdo</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Item de Conteúdo</DialogTitle>
                <DialogDescription>Adicione uma peça de conteúdo à campanha selecionada.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Data de Publicação</Label>
                  <Input type="date" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Conteúdo</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.tipo_conteudo} onChange={e => setFormData({...formData, tipo_conteudo: e.target.value})}>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tema / Pauta</Label>
                  <Input placeholder="Ex: 5 dicas para aumentar vendas online" value={formData.tema} onChange={e => setFormData({...formData, tema: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Objetivo do Post</Label>
                  <Input placeholder="Ex: Gerar cliques no link da bio" value={formData.objetivo_post} onChange={e => setFormData({...formData, objetivo_post: e.target.value})} />
                </div>
                <DialogFooter>
                  <Button type="submit">Criar Conteúdo</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!activeCampaignId ? (
        <div className="border rounded-xl border-dashed p-12 text-center bg-card flex flex-col items-center gap-4">
          <p className="text-lg font-medium">Selecione uma campanha</p>
          <p className="text-sm text-muted-foreground">Para visualizar o calendário, é preciso ter uma campanha ativa.</p>
        </div>
      ) : loading ? (
        <p className="text-muted-foreground text-center py-12">Carregando...</p>
      ) : contents.length === 0 ? (
        <div className="border rounded-xl border-dashed p-12 text-center bg-card flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          </div>
          <p className="text-lg font-medium">Calendário vazio</p>
          <p className="text-sm text-muted-foreground max-w-sm">Adicione itens de conteúdo manualmente ou peça para o agente planejador gerar automaticamente.</p>
          <Button onClick={() => setIsOpen(true)} className="mt-2">Adicionar Primeiro Conteúdo</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statusKeys.map(statusKey => {
            const cfg = STATUS_CONFIG[statusKey]
            const items = contents.filter(c => c.status === statusKey)
            return (
              <div key={statusKey} className="space-y-3">
                <div className={`text-xs font-bold px-3 py-1.5 rounded-full border text-center ${cfg.color}`}>
                  {cfg.label} ({items.length})
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {items.map(item => (
                    <Card key={item.id} className="shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-sm font-medium leading-tight">{item.tema}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-1 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="bg-muted px-1.5 py-0.5 rounded">{item.tipo_conteudo}</span>
                          {item.data && <span>{new Date(item.data).toLocaleDateString("pt-BR")}</span>}
                        </div>
                        {item.agente_atual && (
                          <p className="text-xs text-blue-600 mt-2 font-medium flex items-center gap-1">
                             <span className="relative flex h-2 w-2">
                               {item.status !== 'APROVADO' && item.status !== 'PUBLICADO' && (
                                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                               )}
                               <span className={`relative inline-flex rounded-full h-2 w-2 ${item.status === 'APROVADO' || item.status === 'PUBLICADO' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                             </span>
                             🤖 {item.agente_atual}
                          </p>
                        )}
                        <div className="flex gap-1 flex-wrap pt-2">
                          {statusKey === 'PENDENTE' && (
                            <button
                              onClick={() => {
                                fetch(`/api/contents/${item.id}/generate`, { method: "POST" })
                                  .then(() => refreshContents(activeCampaignId))
                              }}
                              className="text-xs w-full bg-primary text-primary-foreground font-semibold px-2 py-1.5 rounded hover:bg-primary/90 transition-colors flex items-center justify-center gap-1 mb-2"
                            >
                              ✨ Gerar com IA
                            </button>
                          )}
                          {['EM_PRODUCAO', 'REVISAO', 'APROVADO', 'PUBLICADO'].includes(statusKey) && (
                            <button
                              onClick={() => {
                                setReviewItem(item)
                                // Auto-navigate to the current agent's tab
                                const tab = agentToTab[item.agente_atual || '']
                                if (tab) setActiveTab(tab)
                                else if (item.agente_atual === 'Aguardando Aprovação') setActiveTab('design')
                                else setActiveTab('pesquisa')
                              }}
                              className={`text-xs w-full text-white font-semibold px-2 py-1.5 rounded transition-colors flex items-center justify-center gap-1 mb-2 ${statusKey === 'REVISAO' ? 'bg-amber-500 hover:bg-amber-600' : statusKey === 'EM_PRODUCAO' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-800'}`}
                            >
                              {statusKey === 'REVISAO' ? '👁️ Revisar Conteúdo' : statusKey === 'EM_PRODUCAO' ? '🔭 Acompanhar IA' : '👁️ Ver Conteúdo'}
                            </button>
                          )}
                          {statusKey === 'APROVADO' && (
                            <button
                              onClick={() => {
                                fetch(`/api/contents/${item.id}/publish`, { method: "POST" })
                                  .then(() => refreshContents(activeCampaignId))
                              }}
                              className="text-xs w-full bg-green-600 text-white font-semibold px-2 py-1.5 rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1 mb-2"
                            >
                              🚀 Publicar Agora
                            </button>
                          )}
                          {statusKeys.map(sk => sk !== statusKey && (
                            <button
                              key={sk}
                              onClick={() => updateStatus(item.id, sk)}
                              className="text-[10px] px-1.5 py-0.5 rounded border hover:bg-muted transition-colors"
                            >
                              → {STATUS_CONFIG[sk].label}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
