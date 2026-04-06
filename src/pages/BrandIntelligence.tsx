import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Business {
  id: string;
  nome_marca: string;
  site_url?: string;
  redes_sociais?: Record<string, string>;
  brand_profiles?: any[];
}

export default function BrandIntelligence() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialBusinessId = searchParams.get("businessId")
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [activeBusinessId, setActiveBusinessId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"input" | "generating" | "approval">("input")
  const [brandProfile, setBrandProfile] = useState<any>(null)
  const [isEditingSaved, setIsEditingSaved] = useState(false)

  const selectBusinessAndCheckProfile = (id: string, allB: Business[]) => {
    setActiveBusinessId(id)
    const bus = allB.find(b => b.id === id)
    
    // Pre-fill form with existing business data
    const existingLinks = bus?.redes_sociais 
      ? Object.values(bus.redes_sociais).filter(Boolean) 
      : [""];
    setFormData({
      siteUrl: bus?.site_url || "",
      socialLinks: existingLinks.length > 0 ? existingLinks : [""],
      objective: "",
    });

    if (bus?.brand_profiles && bus.brand_profiles.length > 0) {
      setBrandProfile(bus.brand_profiles[0])
      setIsEditingSaved(true)
      setStep("approval")
    } else {
      setBrandProfile(null)
      setIsEditingSaved(false)
      setStep("input")
    }
  }

  const [formData, setFormData] = useState({
    siteUrl: "",
    socialLinks: [""],
    objective: "",
  })

  const handleSocialLinkChange = (index: number, value: string) => {
    const newLinks = [...formData.socialLinks];
    newLinks[index] = value;
    setFormData({ ...formData, socialLinks: newLinks });
  }

  const addSocialLink = () => {
    setFormData({ ...formData, socialLinks: [...formData.socialLinks, ""] });
  }

  const removeSocialLink = (index: number) => {
    const newLinks = formData.socialLinks.filter((_, i) => i !== index);
    setFormData({ ...formData, socialLinks: newLinks });
  }

  useEffect(() => {
    fetch("/api/businesses")
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setBusinesses(list)
        
        let targetId = ""
        if (initialBusinessId && list.some(b => b.id === initialBusinessId)) {
          targetId = initialBusinessId
        } else if (list.length > 0) {
          targetId = list[0].id
        }

        if (targetId) {
          selectBusinessAndCheckProfile(targetId, list)
        }
      })
  }, [initialBusinessId])

  const handleGenerate = () => {
    if (!activeBusinessId) return alert("Selecione um negócio primeiro.")
    setStep("generating")
    
    // Simulate Opensquad AI processing
    setTimeout(() => {
      setBrandProfile({
        tom_de_voz: "Profissional, inovador e acolhedor",
        estilo_comunicacao: "Direto ao ponto, com foco em resultados práticos.",
        palavras_usadas: ["inovação", "crescimento", "estratégia", "tecnologia"],
        palavras_evitar: ["barato", "gambiarra", "difícil", "complicado"],
        publico_alvo: "Empreendedores e gestores de pequenas e médias empresas tech.",
        proposta_valor: "Aceleramos o crescimento de negócios usando IA e automação inteligente.",
        diferenciais: ["Equipe especializada", "Uso de Inteligência Artificial", "Foco em conversão"],
        estilo_visual: "Minimalista, cores sóbrias, foco em contrastes.",
        tipos_conteudo: ["Carrosséis educativos", "Casos de sucesso", "Vídeos curtos de dicas"],
        exemplos_abordagem: ["Você sabia que sua empresa perde 30% das vendas por falta de automação?"]
      })
      setStep("approval")
    }, 4500)
  }

  const handleApprove = async () => {
    setLoading(true)
    try {
      // Build redes_sociais object from social links
      const redesObj: Record<string, string> = {};
      formData.socialLinks.filter(l => l.trim()).forEach((link, i) => {
        if (link.includes('instagram')) redesObj.instagram = link;
        else if (link.includes('linkedin')) redesObj.linkedin = link;
        else if (link.includes('youtube')) redesObj.youtube = link;
        else if (link.includes('tiktok')) redesObj.tiktok = link;
        else if (link.includes('facebook')) redesObj.facebook = link;
        else if (link.includes('twitter') || link.includes('x.com')) redesObj.twitter = link;
        else redesObj[`rede_${i + 1}`] = link;
      });

      await fetch("/api/brand-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: activeBusinessId,
          site_url: formData.siteUrl || null,
          redes_sociais: redesObj,
          ...brandProfile
        })
      })
      alert(isEditingSaved ? "Perfil de Marca atualizado com sucesso!" : "Perfil de Marca aprovado e salvo no banco de dados!")
      navigate("/campaigns?businessId=" + activeBusinessId)
    } catch(err) {
      console.error(err)
      alert("Erro ao salvar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inteligência da Marca</h2>
        <p className="text-muted-foreground">O agente de Brand Intelligence analisará seu negócio e extraíra padrões.</p>
      </div>

      {step === "input" && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Agente</CardTitle>
            <CardDescription>
              Forneça os links e o sistema fará a leitura para inferir sua identidade (Módulo 2).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Selecione o Negócio</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={activeBusinessId}
                onChange={(e) => selectBusinessAndCheckProfile(e.target.value, businesses)}
              >
                <option value="">-- Selecione --</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.nome_marca}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>URL do Site</Label>
              <Input 
                placeholder="https://suaempresa.com.br" 
                value={formData.siteUrl}
                onChange={e => setFormData({...formData, siteUrl: e.target.value})}
              />
            </div>

            <div className="space-y-3">
              <Label>Redes Sociais (Instagram, LinkedIn, YouTube, etc)</Label>
              {formData.socialLinks.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    placeholder="https://instagram.com/suaempresa" 
                    value={link}
                    onChange={e => handleSocialLinkChange(index, e.target.value)}
                  />
                  {formData.socialLinks.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialLink(index)} className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="text-xs mt-1">
                 + Adicionar outro canal
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Referências e Arquivos Base (Logos, Brandbook, PDFs)</Label>
              <Input type="file" multiple className="cursor-pointer" />
              <p className="text-xs text-muted-foreground mt-1">
                Você pode anexar imagens ou PDFs. O agente usará como complemento para guiar as diretrizes estéticas.
              </p>
            </div>
            
            <div className="space-y-2 pt-2">
              <Label>Objetivo Principal (Opcional)</Label>
              <Input 
                placeholder="Ex: Quero parecer mais premium e focar em gerar leads de serviços corporativos" 
                value={formData.objective}
                onChange={e => setFormData({...formData, objective: e.target.value})}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button onClick={handleGenerate} variant="default" className="w-full sm:w-auto">
               🕵️ Extrair Perfil com IA 
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === "generating" && (
        <Card className="border-primary/50 shadow-sm animate-pulse">
           <CardContent className="flex flex-col items-center justify-center p-12 text-center gap-4">
             <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
             <div>
               <h3 className="text-xl font-bold">O Agente está investigando...</h3>
               <p className="text-muted-foreground mt-2 max-w-sm">Analisando o site, textos da rede social e os arquivos que você enviou para extrair seu tom de voz.</p>
             </div>
           </CardContent>
        </Card>
      )}

      {step === "approval" && brandProfile && (
        <div className="space-y-4">
          <Card className="border-green-500/20 shadow-green-500/5">
            <CardHeader className="bg-green-500/5 pb-4 border-b">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-green-700 dark:text-green-400">Perfil Extraído com Sucesso</CardTitle>
                  <CardDescription>
                    {isEditingSaved 
                      ? "Edite e atualize seu perfil de marca existente."
                      : "Revise os dados antes de aprovar e ativar esta versão (Módulo 3)."}
                  </CardDescription>
                </div>
                <div className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-1 rounded-full">v1</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Site & Social Links Section */}
              <div className="space-y-4 p-4 rounded-lg border border-dashed border-amber-400/60 bg-amber-50/40 dark:bg-amber-900/10">
                <div className="flex items-center gap-2 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  <Label className="text-sm font-semibold text-amber-700 dark:text-amber-400">Presença Online</Label>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">URL do Site</Label>
                  <Input 
                    placeholder="https://suaempresa.com.br" 
                    value={formData.siteUrl}
                    onChange={e => setFormData({...formData, siteUrl: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Redes Sociais</Label>
                  {formData.socialLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input 
                        placeholder="https://instagram.com/suaempresa" 
                        value={link}
                        onChange={e => handleSocialLinkChange(index, e.target.value)}
                      />
                      {formData.socialLinks.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialLink(index)} className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="text-xs mt-1">
                     + Adicionar outro canal
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tom de Voz</Label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={brandProfile.tom_de_voz}
                    onChange={(e) => setBrandProfile({...brandProfile, tom_de_voz: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Proposta de Valor</Label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={brandProfile.proposta_valor}
                    onChange={(e) => setBrandProfile({...brandProfile, proposta_valor: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                 <Label>Público Alvo</Label>
                 <Input 
                   value={brandProfile.publico_alvo} 
                   onChange={(e) => setBrandProfile({...brandProfile, publico_alvo: e.target.value})} 
                 />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Palavras Mais Usadas (Vírgula)</Label>
                  <Input 
                    value={brandProfile.palavras_usadas.join(", ")} 
                    onChange={(e) => setBrandProfile({...brandProfile, palavras_usadas: e.target.value.split(", ")})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Palavras a Evitar</Label>
                  <Input 
                    value={brandProfile.palavras_evitar.join(", ")} 
                    onChange={(e) => setBrandProfile({...brandProfile, palavras_evitar: e.target.value.split(", ")})} 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 bg-muted/20 border-t pt-4">
              {isEditingSaved ? (
                <>
                  <Button variant="outline" onClick={() => { setBrandProfile(null); setStep("input"); }}>Gerar Novo Perfil com IA</Button>
                  <Button onClick={handleApprove} disabled={loading} variant="secondary">
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                  <Button onClick={() => navigate("/campaigns?businessId=" + activeBusinessId)} disabled={loading} className="gap-2">
                    Avançar para Campanhas <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setStep("input")}>Voltar e Re-gerar</Button>
                  <Button onClick={handleApprove} disabled={loading}>
                    {loading ? "Salvando..." : "✅ Aprovar e Salvar Perfil"}
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
