import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Business { id: string; nome_marca: string }
interface Campaign {
  id: string; nome: string; objetivo: string; descricao: string;
  status: string; data_inicio: string; data_fim: string;
  tipo_midia: string;
  _count: { contents: number }
}

import { useSearchParams, Link } from "react-router-dom"

const OBJETIVOS = ["Gerar Leads", "Awareness / Reconhecimento", "Vendas Diretas", "Engajamento", "Lançamento"]

export default function CampaignManager() {
  const [searchParams] = useSearchParams()
  const initialBusinessId = searchParams.get("businessId")
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [activeBusinessId, setActiveBusinessId] = useState("")
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    nome: "", objetivo: "Gerar Leads", descricao: "",
    publico_alvo: "", mensagem_central: "", cta_principal: "",
    data_inicio: "", data_fim: "", tipo_midia: "ORGANICO"
  })

  const fetchCampaigns = async (businessId: string) => {
    if (!businessId) {
      setCampaigns([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/campaigns?business_id=${businessId}`)
      const data = await response.json()
      setCampaigns(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch("/api/businesses").then(r => r.json()).then(data => {
      const list = Array.isArray(data) ? data : []
      setBusinesses(list)
      if (initialBusinessId && list.some(b => b.id === initialBusinessId)) {
        setActiveBusinessId(initialBusinessId)
      } else if (list.length > 0) {
        setActiveBusinessId(list[0].id)
      }
    })
  }, [initialBusinessId])

  useEffect(() => {
    if (!activeBusinessId) return
    void fetchCampaigns(activeBusinessId)
  }, [activeBusinessId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, business_id: activeBusinessId })
    })
    setIsOpen(false)
    setFormData({ nome: "", objetivo: "Gerar Leads", descricao: "", publico_alvo: "", mensagem_central: "", cta_principal: "", data_inicio: "", data_fim: "", tipo_midia: "ORGANICO" })
    await fetchCampaigns(activeBusinessId)
  }

  const statusColor: Record<string, string> = {
    RASCUNHO: "bg-yellow-100 text-yellow-800",
    ATIVA: "bg-green-100 text-green-800",
    ENCERRADA: "bg-gray-100 text-gray-600",
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campanhas</h2>
          <p className="text-muted-foreground">Defina campanhas estratégicas antes de gerar o calendário.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={activeBusinessId}
            onChange={e => setActiveBusinessId(e.target.value)}
          >
            {businesses.map(b => <option key={b.id} value={b.id}>{b.nome_marca}</option>)}
          </select>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>Nova Campanha</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Campanha</DialogTitle>
                <DialogDescription>Defina o objetivo e a mensagem central desta campanha.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Nome da Campanha</Label>
                  <Input placeholder="Ex: Lançamento Q2 2026" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Objetivo</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.objetivo} onChange={e => setFormData({...formData, objetivo: e.target.value})}>
                      {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Mídia</Label>
                    <div className="flex bg-muted rounded-md p-1 h-10">
                      <button type="button" onClick={() => setFormData({...formData, tipo_midia: "ORGANICO"})} className={`flex-1 rounded-sm text-sm font-medium transition-colors ${formData.tipo_midia === "ORGANICO" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/80"}`}>
                        Orgânico
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, tipo_midia: "PAGA"})} className={`flex-1 rounded-sm text-sm font-medium transition-colors ${formData.tipo_midia === "PAGA" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/80"}`}>
                        Mídia Paga
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input placeholder="Descreva brevemente a campanha..." value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Mensagem Central</Label>
                  <Input placeholder="A frase tema que guiará todo o conteúdo" value={formData.mensagem_central} onChange={e => setFormData({...formData, mensagem_central: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>CTA Principal</Label>
                  <Input placeholder="Ex: Agende uma demonstração gratuita" value={formData.cta_principal} onChange={e => setFormData({...formData, cta_principal: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Início</Label>
                    <Input type="date" value={formData.data_inicio} onChange={e => setFormData({...formData, data_inicio: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fim</Label>
                    <Input type="date" value={formData.data_fim} onChange={e => setFormData({...formData, data_fim: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Salvar Campanha</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Carregando...</p>
      ) : campaigns.length === 0 ? (
        <div className="border rounded-xl border-dashed p-12 text-center bg-card flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
          </div>
          <p className="text-lg font-medium">Nenhuma campanha ativa</p>
          <p className="text-sm text-muted-foreground max-w-sm">Campanhas direcionam toda a produção de conteúdo. Cada peça do calendário precisa pertencer a uma campanha.</p>
          <Button onClick={() => setIsOpen(true)} className="mt-2">Criar Primeira Campanha</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map(c => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{c.nome}</CardTitle>
                  <span className={`text-xs w-fit font-semibold px-2 py-1 rounded-full ${statusColor[c.status] || "bg-muted"}`}>{c.status}</span>
                </div>
                <div className="flex gap-2 items-center text-sm text-muted-foreground">
                  <span>{c.objetivo}</span>
                  <span className="text-xs px-2 py-0.5 border rounded-full font-medium">
                    {c.tipo_midia === "PAGA" ? "💸 Pago" : "🌱 Orgânico"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{c.descricao || "Sem descrição"}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  {c.data_inicio && <span>📅 {new Date(c.data_inicio).toLocaleDateString("pt-BR")}</span>}
                  <span>📝 {c._count.contents} conteúdos</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" size="sm" asChild>
                  <Link to={`/calendar?campaignId=${c.id}`}>Ver Calendário</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
