import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Pencil, Trash2 } from "lucide-react"
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
  brand_profiles?: any[];
}

export default function BusinessDashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editItem, setEditItem] = useState<Business | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nome_marca: "",
    nome_interno: "",
    segmento: ""
  })

  const fetchBusinesses = async () => {
    try {
      const res = await fetch("/api/businesses")
      const data = await res.json()
      setBusinesses(Array.isArray(data) ? data : [])
    } catch(err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBusinesses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setIsOpen(false)
        setFormData({ nome_marca: "", nome_interno: "", segmento: "" })
        fetchBusinesses()
      }
    } catch(err) {
      console.error(err)
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Negócios</h2>
          <p className="text-muted-foreground">Gerencie suas marcas e empresas.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>Adicionar Negócio</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Negócio</DialogTitle>
              <DialogDescription>
                Adicione um novo espaço de trabalho para uma marca ou empresa.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
              <DialogFooter>
                <Button type="submit">Salvar Negócio</Button>
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
      ) : businesses.length === 0 ? (
        <div className="border rounded-xl border-dashed p-12 text-center bg-card text-card-foreground flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
          </div>
          <div>
             <p className="text-lg font-medium">Nenhum negócio cadastrado</p>
             <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">Crie seu primeiro espaço de atuação para começar a usar a inteligência do Opensquad.</p>
          </div>
          <Button variant="default" className="mt-2" onClick={() => setIsOpen(true)}>Configurar Primeiro Negócio</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business) => (
            <Card key={business.id} className="relative group">
              <CardHeader className="pr-16">
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                    onClick={() => setEditItem(business)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    onClick={() => setDeleteId(business.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="truncate">{business.nome_marca}</CardTitle>
                <CardDescription className="truncate">{business.nome_interno}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Segmento: {business.segmento || "Não definido"}</p>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                {business.brand_profiles && business.brand_profiles.length > 0 ? (
                  <>
                    <Button variant="default" className="w-full" asChild>
                      <Link to={`/campaigns?businessId=${business.id}`}>Gerenciar Campanhas</Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/brand?businessId=${business.id}`}>Editar IA da Marca</Link>
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/brand?businessId=${business.id}`}>Configurar Inteligência</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
