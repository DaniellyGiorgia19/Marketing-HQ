import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Campaign { id: string; nome: string }
interface Content {
  id: string; campaign_id: string; data: string; tipo_conteudo: string;
  tema: string; objetivo_post: string; status: string; agente_atual: string;
  texto_gerado?: string;
  resultados_agentes?: { pesquisa?: string; copy?: string; design?: string; design_images?: string[] };
  campaign?: { nome: string }
}

const TIPOS = ["Reels", "Carrossel", "Post Estático", "Stories", "Vídeo Longo", "Artigo Blog", "E-mail"]
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDENTE: { label: "Pendente", color: "bg-slate-100 text-slate-700 border-slate-200" },
  EM_PRODUCAO: { label: "Em Produção", color: "bg-blue-100 text-blue-700 border-blue-200" },
  REVISAO: { label: "Revisão", color: "bg-amber-100 text-amber-700 border-amber-200" },
  APROVADO: { label: "Aprovado", color: "bg-green-100 text-green-700 border-green-200" },
  PUBLICADO: { label: "Publicado", color: "bg-purple-100 text-purple-700 border-purple-200" },
}

export default function ContentCalendar() {
  const [searchParams] = useSearchParams()
  const initialCampaignId = searchParams.get("campaignId")
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [activeCampaignId, setActiveCampaignId] = useState("")
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [reviewItem, setReviewItem] = useState<Content | null>(null)
  const [activeTab, setActiveTab] = useState<"pesquisa"|"copy"|"design">("pesquisa")
  const [observation, setObservation] = useState("")
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

  const fetchContents = () => {
    if (!activeCampaignId) return
    setLoading(true)
    fetch(`/api/contents?campaign_id=${activeCampaignId}`)
      .then(r => r.json())
      .then(data => setContents(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { 
    fetchContents();
    
    // Atualização em tempo real (polling) para acompanhar os agentes trabalhando
    const interval = setInterval(() => {
      if (!activeCampaignId) return;
      fetch(`/api/contents?campaign_id=${activeCampaignId}`)
        .then(r => r.json())
        .then(data => {
          setContents(Array.isArray(data) ? data : []);
          setReviewItem(prev => {
            if (!prev) return null;
            const updated = (Array.isArray(data) ? data : []).find((c: Content) => c.id === prev.id);
            return updated || prev;
          });
        });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [activeCampaignId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/contents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, campaign_id: activeCampaignId })
    })
    setIsOpen(false)
    setFormData({ data: "", tipo_conteudo: "Carrossel", tema: "", objetivo_post: "" })
    fetchContents()
  }

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/contents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    })
    fetchContents()
  }

  const handleApproveContent = async () => {
    if (!reviewItem) return;
    await fetch(`/api/contents/${reviewItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APROVADO", agente_atual: "Pronto para Publicar" })
    });
    setReviewItem(null);
    fetchContents();
  }

  const handleAdvance = async () => {
    if (!reviewItem) return
    // Map active tab to agent name for the backend
    const tabToAgent: Record<string, string> = { pesquisa: 'Pesquisador', copy: 'Copywriter', design: 'Designer' };
    const currentAgent = tabToAgent[activeTab] || reviewItem.agente_atual;
    const res = await fetch(`/api/contents/${reviewItem.id}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        current_agent: currentAgent, 
        observacao: observation 
      })
    })
    const updated = await res.json()
    setReviewItem(prev => prev ? { ...prev, ...updated } : null)
    setObservation("")
    fetchContents()
  }

  const handleRetry = async () => {
    if (!reviewItem) return
    // Map active tab to agent name so retry works from any state
    const tabToAgent: Record<string, string> = { pesquisa: 'Pesquisador', copy: 'Copywriter', design: 'Designer' };
    const targetAgent = tabToAgent[activeTab] || reviewItem.agente_atual;
    const res = await fetch(`/api/contents/${reviewItem.id}/retry`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ observacao: observation, target_agent: targetAgent })
    })
    const updated = await res.json()
    setReviewItem(prev => prev ? { ...prev, ...updated } : null)
    setObservation("")
    fetchContents()
  }

  const statusKeys = Object.keys(STATUS_CONFIG)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Review Dialog */}
      <Dialog open={!!reviewItem} onOpenChange={(o) => {
        if(!o) { setReviewItem(null); setObservation(""); }
        setActiveTab("pesquisa")
      }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Conteúdo - {reviewItem?.tema}</DialogTitle>
            <DialogDescription>Acompanhe o progresso da IA ou revise o conteúdo finalizado.</DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-4 overflow-y-auto flex-1">
            
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
                3. Design
              </button>
            </div>

            <div className="bg-muted p-4 rounded-md text-sm border min-h-[150px] space-y-4">
               {activeTab === 'pesquisa' && (
                 <div className="whitespace-pre-wrap">{reviewItem?.resultados_agentes?.pesquisa || "Aguardando agente Pesquisador..."}</div>
               )}
               {activeTab === 'copy' && (() => {
                 const copyText = reviewItem?.resultados_agentes?.copy || reviewItem?.texto_gerado || "";
                 if (!copyText) return <div className="text-muted-foreground">Aguardando agente Copywriter...</div>;
                 const sections = copyText.split('---').map((s: string) => s.trim()).filter(Boolean);
                 return (
                   <div className="space-y-4">
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
                 const designImages = reviewItem?.resultados_agentes?.design_images || [];
                 if (!designText && designImages.length === 0) return <div className="text-muted-foreground">Aguardando agente Designer...</div>;
                 const sections = designText ? designText.split('---').map((s: string) => s.trim()).filter(Boolean) : [];
                 return (
                   <div className="space-y-4">
                     {sections.map((section: string, i: number) => {
                       const isIdentidade = section.includes('IDENTIDADE VISUAL');
                       const isSugestao = section.includes('SUGESTÃO DE ARTE');
                       const bgClass = isIdentidade 
                         ? 'bg-amber-50 border-amber-200' 
                         : isSugestao
                           ? 'bg-emerald-50 border-emerald-200'
                           : 'bg-white border-slate-200';
                       return (
                         <div key={i} className={`p-4 rounded-lg border ${bgClass} whitespace-pre-wrap`}>
                           {section}
                         </div>
                       );
                     })}
                     {designImages.length > 0 && (
                       <div className="space-y-3">
                         <p className="text-sm font-semibold text-slate-700">🖼️ Prévia das Artes Geradas (4:5 — 1080x1350px):</p>
                         <div className="grid grid-cols-3 gap-3">
                           {designImages.map((img: string, i: number) => (
                             <div key={i} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                               <img src={img} alt={`Arte ${i + 1}`} className="w-full h-auto" />
                               <p className="text-xs text-center text-muted-foreground py-1">Página {i + 1}</p>
                             </div>
                           ))}
                         </div>
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
                      ? '✏️ Solicitar ajustes no design (cores, layout, elementos...)' 
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
                      className="bg-amber-500 hover:bg-amber-600 text-white gap-1"
                    >
                      📩 Enviar Observação e Refazer Etapa
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-end gap-2 flex-shrink-0">
            {reviewItem?.status === 'REVISAO' ? (
              <>
                <Button variant="outline" onClick={() => {
                  fetch(`/api/contents/${reviewItem.id}/generate`, { method: "POST" })
                    .then(() => { setReviewItem(null); fetchContents(); })
                }}>
                  Rejeitar (Refazer)
                </Button>
                <Button onClick={handleApproveContent} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  👍 Aprovar Conteúdo
                </Button>
              </>
            ) : reviewItem?.status === 'EM_PRODUCAO' || reviewItem?.agente_atual ? (
              <>
                <Button variant="outline" onClick={handleRetry}>
                  Refazer Etapa 🔄
                </Button>
                <Button variant="outline" onClick={() => { setReviewItem(null); setObservation(""); }}>Fechar</Button>
                
                {reviewItem?.agente_atual !== 'Aguardando Aprovação' && (
                  <Button onClick={handleAdvance} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    Avançar Processo 🚀
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
                                  .then(() => fetchContents())
                              }}
                              className="text-xs w-full bg-primary text-primary-foreground font-semibold px-2 py-1.5 rounded hover:bg-primary/90 transition-colors flex items-center justify-center gap-1 mb-2"
                            >
                              ✨ Gerar com IA
                            </button>
                          )}
                          {['EM_PRODUCAO', 'REVISAO', 'APROVADO', 'PUBLICADO'].includes(statusKey) && (
                            <button
                              onClick={() => setReviewItem(item)}
                              className={`text-xs w-full text-white font-semibold px-2 py-1.5 rounded transition-colors flex items-center justify-center gap-1 mb-2 ${statusKey === 'REVISAO' ? 'bg-amber-500 hover:bg-amber-600' : statusKey === 'EM_PRODUCAO' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-800'}`}
                            >
                              {statusKey === 'REVISAO' ? '👁️ Revisar Conteúdo' : statusKey === 'EM_PRODUCAO' ? '🔭 Acompanhar IA' : '👁️ Ver Conteúdo'}
                            </button>
                          )}
                          {statusKey === 'APROVADO' && (
                            <button
                              onClick={() => {
                                fetch(`/api/contents/${item.id}/publish`, { method: "POST" })
                                  .then(() => fetchContents())
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
