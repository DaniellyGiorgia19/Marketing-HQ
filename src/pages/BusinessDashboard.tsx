import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, BadgeCheck, BriefcaseBusiness, CalendarDays, Palette, Pencil, PenLine, Plus, Search, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Business {
  id: string;
  nome_marca: string;
  nome_interno: string;
  segmento: string;
  site_url?: string;
  redes_sociais?: Record<string, string>;
  brand_profiles?: { id: string }[];
}

type SectorId = "designer" | "copy" | "pesquisa" | "campanhas"

const studioModules = [
  {
    id: "designer",
    title: "Designer",
    short: "Identidade visual",
    description: "Paleta, fontes, imagens e prompt visual.",
    icon: Palette,
    status: "Disponivel",
    accent: "bg-orange-500 text-white",
    activeRing: "ring-orange-200",
    actionLabel: "Criei suas peças",
    pendingLabel: "Criei suas peças",
    cardDescription: "Configure identidade visual, referencias e comandos para posts.",
  },
  {
    id: "copy",
    title: "Copy",
    short: "Textos e hooks",
    description: "Legendas, hooks, ideias e narrativas.",
    icon: PenLine,
    status: "Em desenho",
    accent: "bg-sky-500 text-white",
    activeRing: "ring-sky-200",
    actionLabel: "Abrir Copy",
    pendingLabel: "Preparar Copy",
    cardDescription: "Crie textos, legendas e ideias com o tom da marca.",
  },
  {
    id: "pesquisa",
    title: "Pesquisa",
    short: "Insights de mercado",
    description: "Tendencias, audiencia e oportunidades.",
    icon: Search,
    status: "Em desenho",
    accent: "bg-emerald-500 text-white",
    activeRing: "ring-emerald-200",
    actionLabel: "Abrir Pesquisa",
    pendingLabel: "Preparar Pesquisa",
    cardDescription: "Levante contexto, tendencias e oportunidades antes de produzir.",
  },
  {
    id: "campanhas",
    title: "Campanhas",
    short: "Planejamento",
    description: "Objetivos, calendario e producao.",
    icon: CalendarDays,
    status: "Disponivel",
    accent: "bg-violet-500 text-white",
    activeRing: "ring-violet-200",
    actionLabel: "Abrir Campanhas",
    pendingLabel: "Planejar Campanhas",
    cardDescription: "Organize campanhas e avance para o calendario de conteudos.",
  },
] as const

export default function BusinessDashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editItem, setEditItem] = useState<Business | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [activeSector, setActiveSector] = useState<SectorId>("designer")
  const [formData, setFormData] = useState({
    nome_marca: "",
    nome_interno: "",
    segmento: "",
    site_url: "",
    instagram: "",
    linkedin: "",
    youtube: "",
  })

  const getApiErrorMessage = async (res: Response, fallback: string) => {
    try {
      const data = await res.json()
      if (typeof data?.error === "string" && data.error.trim()) return data.error
      return fallback
    } catch {
      return fallback
    }
  }

  const activeModule = studioModules.find(module => module.id === activeSector) || studioModules[0]
  const ActiveIcon = activeModule.icon

  const getSectorHref = (businessId: string) => {
    if (activeSector === "designer") return `/brand?businessId=${businessId}`
    if (activeSector === "campanhas") return `/campaigns?businessId=${businessId}`
    return `/campaigns?businessId=${businessId}&sector=${activeSector}`
  }

  const fetchBusinesses = useCallback(async () => {
    try {
      const res = await fetch("/api/businesses")
      if (!res.ok) {
        const message = await getApiErrorMessage(res, "Não foi possível carregar os negócios.")
        setFeedbackMessage(message)
        setBusinesses([])
        return
      }
      const data = await res.json()
      setBusinesses(Array.isArray(data) ? data : [])
      setFeedbackMessage(null)
    } catch(err) {
      console.error(err)
      setFeedbackMessage("Não foi possível conectar com a API. Verifique se o backend está rodando.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchBusinesses()
  }, [fetchBusinesses])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setFeedbackMessage(null)
    try {
      const redes_sociais = {
        instagram: formData.instagram,
        linkedin: formData.linkedin,
        youtube: formData.youtube,
      }

      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_marca: formData.nome_marca,
          nome_interno: formData.nome_interno,
          segmento: formData.segmento,
          site_url: formData.site_url,
          redes_sociais: Object.fromEntries(
            Object.entries(redes_sociais).filter(([, value]) => value.trim())
          ),
        })
      })
      if (!res.ok) {
        const message = await getApiErrorMessage(res, "Não foi possível salvar o negócio.")
        setFeedbackMessage(message)
        alert(message)
        return
      }

      setIsOpen(false)
      setFormData({ nome_marca: "", nome_interno: "", segmento: "", site_url: "", instagram: "", linkedin: "", youtube: "" })
      setFeedbackMessage("Negócio salvo com sucesso.")
      await fetchBusinesses()
    } catch(err) {
      console.error(err)
      const message = "Não foi possível conectar com a API ao salvar o negócio."
      setFeedbackMessage(message)
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return
    try {
      const res = await fetch(`/api/businesses/${editItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem)
      })
      if (res.ok) {
        setEditItem(null)
        fetchBusinesses()
      }
    } catch(err) {
      console.error(err)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/businesses/${deleteId}`, {
        method: "DELETE"
      })
      if (res.ok) {
        setDeleteId(null)
        fetchBusinesses()
      }
    } catch(err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_9%_12%,rgba(249,115,22,0.38),transparent_32%),radial-gradient(circle_at_82%_6%,rgba(14,165,233,0.28),transparent_28%),linear-gradient(135deg,rgba(127,29,29,0.32),rgba(2,6,23,0.96)_48%,rgba(15,23,42,0.98))]" />
        <div className="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,0.92fr)_minmax(560px,1.08fr)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-orange-500" />
              Marketing HQ
            </div>
            <h2 className="mt-6 max-w-3xl font-display text-4xl font-black leading-[0.96] tracking-tight text-white md:text-6xl">
              Seu marketing disponível para você.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
              Qual setor você vai trabalhar agora? Escolha uma área, depois selecione a marca para continuar com uma experiência focada.
            </p>

            <div className="mt-8 rounded-3xl border border-white/12 bg-white/10 p-4 shadow-2xl backdrop-blur">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${activeModule.accent}`}>
                  <ActiveIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">Setor selecionado</p>
                  <p className="text-xl font-bold text-white">{activeModule.title}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/62">{activeModule.cardDescription}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {studioModules.map((module) => {
              const Icon = module.icon
              const isActive = activeSector === module.id

              return (
                <button
                  key={module.id}
                  type="button"
                  onClick={() => setActiveSector(module.id)}
                  className={`group min-h-[150px] rounded-3xl border p-5 text-left transition-all duration-300 ${
                    isActive
                      ? `border-white/18 bg-white text-slate-950 shadow-2xl ring-4 ${module.activeRing}`
                      : "border-white/10 bg-white/10 text-white shadow-sm backdrop-blur hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/15 hover:shadow-xl"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isActive ? module.accent : "bg-white/12 text-white"}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      isActive ? "border-slate-200 text-slate-400" : "border-white/15 text-white/52"
                    }`}>
                        {module.status}
                      </span>
                  </div>
                  <p className="mt-5 text-2xl font-black leading-none">{module.title}</p>
                  <p className={`mt-2 text-sm font-medium ${isActive ? "text-slate-500" : "text-white/70"}`}>{module.short}</p>
                  <p className={`mt-4 text-sm leading-6 ${isActive ? "text-slate-500" : "text-white/58"}`}>{module.description}</p>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="type-kicker">Escolha a marca</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight">
            {activeModule.title}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {activeModule.cardDescription}
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 bg-slate-950 hover:bg-slate-800">
              <Plus className="h-4 w-4" />
              Adicionar Negócio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Novo Negócio</DialogTitle>
              <DialogDescription>
                Adicione um novo espaço de trabalho para uma marca ou empresa.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              {feedbackMessage && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {feedbackMessage}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="nome_marca">Nome da Marca</Label>
                <Input 
                  id="nome_marca" 
                  autoFocus
                  placeholder="Ex: Acme Corp" 
                  value={formData.nome_marca}
                  onChange={(e) => setFormData({...formData, nome_marca: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nome_interno">Nome Interno</Label>
                <Input 
                  id="nome_interno" 
                  placeholder="Ex: Projeto Acme (Q3)" 
                  value={formData.nome_interno}
                  onChange={(e) => setFormData({...formData, nome_interno: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="segmento">Segmento / Nicho</Label>
                <Input 
                  id="segmento" 
                  placeholder="Ex: Tecnologia, Moda, SaaS..." 
                  value={formData.segmento}
                  onChange={(e) => setFormData({...formData, segmento: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_url">Site</Label>
                <Input
                  id="site_url"
                  placeholder="https://suaempresa.com.br"
                  value={formData.site_url}
                  onChange={(e) => setFormData({...formData, site_url: e.target.value})}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    placeholder="https://instagram.com/suaempresa"
                    value={formData.instagram}
                    onChange={(e) => setFormData({...formData, instagram: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    placeholder="https://linkedin.com/company/suaempresa"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({...formData, linkedin: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  placeholder="https://youtube.com/@suaempresa"
                  value={formData.youtube}
                  onChange={(e) => setFormData({...formData, youtube: e.target.value})}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar Negócio"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Negócio</DialogTitle>
              <DialogDescription>
                Atualize as informações do seu espaço de trabalho.
              </DialogDescription>
            </DialogHeader>
            {editItem && (
              <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_nome_marca">Nome da Marca</Label>
                  <Input 
                    id="edit_nome_marca" 
                    value={editItem.nome_marca}
                    onChange={(e) => setEditItem({...editItem, nome_marca: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_nome_interno">Nome Interno</Label>
                  <Input 
                    id="edit_nome_interno" 
                    value={editItem.nome_interno}
                    onChange={(e) => setEditItem({...editItem, nome_interno: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_segmento">Segmento / Nicho</Label>
                  <Input 
                    id="edit_segmento" 
                    value={editItem.segmento || ""}
                    onChange={(e) => setEditItem({...editItem, segmento: e.target.value})}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
                  <Button type="submit">Salvar Alterações</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm de Exclusão */}
        <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Excluir Negócio</DialogTitle>
              <DialogDescription className="text-red-500 font-medium pt-2">
                Atenção: Esta ação é irreversível!
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-sm text-muted-foreground">
              Você tem certeza que deseja excluir este negócio? Todas as campanhas, conteúdos e inteligência de marca associados a ele serão apagados permanentemente.
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
              <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>Sim, Excluir Negócio</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      ) : feedbackMessage && businesses.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {feedbackMessage}
        </div>
      ) : businesses.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-card-foreground">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
             <BriefcaseBusiness className="h-7 w-7" />
          </div>
          <div>
             <p className="text-xl font-bold">Nenhuma marca cadastrada</p>
             <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
               Crie o primeiro workspace para abrir o Designer e configurar identidade visual, referencias e prompts.
             </p>
          </div>
          <Button variant="default" className="mt-6 gap-2 bg-slate-950 hover:bg-slate-800" onClick={() => setIsOpen(true)}>
            <Plus className="h-4 w-4" />
            Configurar Primeira Marca
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {businesses.map((business) => {
            const hasProfile = Boolean(business.brand_profiles && business.brand_profiles.length > 0)
            const actionLabel = hasProfile ? activeModule.actionLabel : activeModule.pendingLabel

            return (
              <Card key={business.id} className="group overflow-hidden rounded-3xl border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">
                <CardHeader className="relative overflow-hidden p-5 pb-4">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-sky-400 to-violet-500 opacity-80" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black uppercase text-white shadow-lg shadow-slate-950/15">
                        {business.nome_marca.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="truncate text-2xl">{business.nome_marca}</CardTitle>
                        <CardDescription className="mt-1 truncate text-sm">{business.nome_interno}</CardDescription>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                        onClick={() => setEditItem(business)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-red-500"
                        onClick={() => setDeleteId(business.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="relative mt-5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                      {business.segmento || "Sem segmento"}
                    </span>
                    {hasProfile ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Identidade ativa
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        Configuracao pendente
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="px-5 pb-4">
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(249,115,22,0.32),transparent_34%),radial-gradient(circle_at_88%_20%,rgba(14,165,233,0.24),transparent_30%)]" />
                    <div className="relative flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/48">Area ativa</p>
                        <p className="mt-1 text-lg font-bold">{activeModule.title}</p>
                        <p className="mt-1 max-w-[13rem] text-xs leading-5 text-white/62">{activeModule.short}</p>
                      </div>
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${activeModule.accent}`}>
                        <ActiveIcon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4">
                  <Button className="h-11 w-full justify-between rounded-xl bg-slate-950 px-4 text-sm hover:bg-slate-800" asChild>
                    <Link to={getSectorHref(business.id)}>
                      <span>{actionLabel}</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  {activeSector !== "campanhas" && hasProfile && (
                    <Button variant="outline" className="h-10 w-full rounded-xl bg-white" asChild>
                      <Link to={`/campaigns?businessId=${business.id}`}>Campanhas</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
