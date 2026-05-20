import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ImagePlus, Layers, Megaphone, Palette, Sparkles, Type, Upload, Wand2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface BrandProfile {
  tom_de_voz: string;
  estilo_comunicacao?: string;
  palavras_usadas: string[];
  palavras_evitar: string[];
  publico_alvo: string;
  proposta_valor: string;
  diferenciais?: string[];
  estilo_visual?: string;
  tipos_conteudo?: string[];
  exemplos_abordagem?: string[];
}

interface VisualDirection {
  palette: string[];
  typography: {
    headingFont: string;
    headingFontSource: string;
    bodyFont: string;
    bodyFontSource: string;
    styleNotes: string;
    fallbackNotes: string;
  };
  visualStyle: string;
  gridLayout: string;
  compositionModel: string;
  textAlignment: string;
  density: string;
  logoPlacement: string;
  frameStyle: string;
  compositionRules: string;
  recurringElements: string;
  socialReferenceNotes: string;
  avoidances: string;
  templates: string[];
}

interface UploadedFont {
  id: string;
  label: string;
  family: string;
  source: string;
  previewUrl: string;
}

interface ReferenceImage {
  id: string;
  name: string;
  previewUrl: string;
}

const DEFAULT_VISUAL_DIRECTION: VisualDirection = {
  palette: ["#111827", "#F97316", "#FDE047", "#FFFFFF"],
  typography: {
    headingFont: "Sora",
    headingFontSource: "",
    bodyFont: "Inter",
    bodyFontSource: "",
    styleNotes: "Titulos grandes, contrastados e cheios de atitude; o corpo entra apenas para sustentar a mensagem sem roubar impacto.",
    fallbackNotes: "Se a fonte principal nao estiver disponivel, manter sans serif expressiva nos titulos e uma sans limpa e compacta no apoio.",
  },
  visualStyle: "Impactante, contemporaneo, comercial e pensado para parar o scroll com contraste alto, composicao ousada e energia visual.",
  gridLayout: "Composicoes assimetricas com blocos fortes, chamadas em destaque, sobreposicoes controladas e elementos graficos que criam movimento.",
  compositionModel: "Blocos de destaque",
  textAlignment: "Esquerda",
  density: "Media",
  logoPlacement: "Rodape",
  frameStyle: "Sem moldura",
  compositionRules: "Usar a mesma logica de composicao das redes da marca: titulos dominantes, respiros consistentes, areas de destaque bem marcadas e assinatura visual sempre no mesmo comportamento.",
  recurringElements: "Repetir os elementos que criam reconhecimento na marca: posicionamento do logo, blocos de cor, tarjas, molduras, icones, texturas e padrao de CTA.",
  socialReferenceNotes: "As redes sociais cadastradas devem ser a principal referencia visual. O Designer deve preservar o mesmo clima, densidade de informacao e hierarquia visual dos posts ja publicados.",
  avoidances: "Evitar visual generico, papel timbrado, slide corporativo, excesso de branco sem funcao, composicao burocratica e qualquer layout que pareca diferente demais do feed atual da marca.",
  templates: ["Post estatico", "Carrossel", "Story"],
}

function parseVisualDirection(estiloVisual?: string): VisualDirection {
  if (!estiloVisual) return DEFAULT_VISUAL_DIRECTION

  const getValue = (label: string) => {
    const match = estiloVisual.match(new RegExp(`${label}:\\s*(.+)`, "i"))
    return match?.[1]?.trim() || ""
  }

  const templatesValue = getValue("Templates base")
  const headingFont = getValue("Fonte titulos")
  const headingFontSource = getValue("Fonte titulos origem")
  const bodyFont = getValue("Fonte corpo")
  const bodyFontSource = getValue("Fonte corpo origem")
  const styleNotes = getValue("Notas tipograficas")
  const fallbackNotes = getValue("Fallback tipografico")
  const legacyTypography = getValue("Tipografia")
  const compositionModel = getValue("Modelo de composicao")
  const textAlignment = getValue("Alinhamento")
  const density = getValue("Densidade")
  const logoPlacement = getValue("Posicao da marca")
  const frameStyle = getValue("Moldura")
  const compositionRules = getValue("Regras de composicao")
  const recurringElements = getValue("Elementos recorrentes")
  const socialReferenceNotes = getValue("Referencias sociais")
  const avoidances = getValue("Evitar")

  const parsedPalette = (getValue("Paleta") || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => item.toUpperCase())

  return {
    palette: parsedPalette.length > 0 ? parsedPalette : DEFAULT_VISUAL_DIRECTION.palette,
    typography: {
      headingFont: headingFont || DEFAULT_VISUAL_DIRECTION.typography.headingFont,
      headingFontSource: headingFontSource || DEFAULT_VISUAL_DIRECTION.typography.headingFontSource,
      bodyFont: bodyFont || DEFAULT_VISUAL_DIRECTION.typography.bodyFont,
      bodyFontSource: bodyFontSource || DEFAULT_VISUAL_DIRECTION.typography.bodyFontSource,
      styleNotes: styleNotes || legacyTypography || DEFAULT_VISUAL_DIRECTION.typography.styleNotes,
      fallbackNotes: fallbackNotes || DEFAULT_VISUAL_DIRECTION.typography.fallbackNotes,
    },
    visualStyle: getValue("Estilo") || estiloVisual || DEFAULT_VISUAL_DIRECTION.visualStyle,
    gridLayout: getValue("Grid/Layout") || DEFAULT_VISUAL_DIRECTION.gridLayout,
    compositionModel: compositionModel || DEFAULT_VISUAL_DIRECTION.compositionModel,
    textAlignment: textAlignment || DEFAULT_VISUAL_DIRECTION.textAlignment,
    density: density || DEFAULT_VISUAL_DIRECTION.density,
    logoPlacement: logoPlacement || DEFAULT_VISUAL_DIRECTION.logoPlacement,
    frameStyle: frameStyle || DEFAULT_VISUAL_DIRECTION.frameStyle,
    compositionRules: compositionRules || DEFAULT_VISUAL_DIRECTION.compositionRules,
    recurringElements: recurringElements || DEFAULT_VISUAL_DIRECTION.recurringElements,
    socialReferenceNotes: socialReferenceNotes || DEFAULT_VISUAL_DIRECTION.socialReferenceNotes,
    avoidances: avoidances || DEFAULT_VISUAL_DIRECTION.avoidances,
    templates: templatesValue
      ? templatesValue.split(",").map(item => item.trim()).filter(Boolean)
      : DEFAULT_VISUAL_DIRECTION.templates,
  }
}

function serializeVisualDirection(direction: VisualDirection) {
  return [
    "Sistema visual base da marca:",
    `Paleta: ${direction.palette.join(", ")}`,
    `Fonte titulos: ${direction.typography.headingFont}`,
    `Fonte titulos origem: ${direction.typography.headingFontSource || "Nao informado"}`,
    `Fonte corpo: ${direction.typography.bodyFont}`,
    `Fonte corpo origem: ${direction.typography.bodyFontSource || "Nao informado"}`,
    `Notas tipograficas: ${direction.typography.styleNotes}`,
    `Fallback tipografico: ${direction.typography.fallbackNotes}`,
    `Estilo: ${direction.visualStyle}`,
    `Grid/Layout: ${direction.gridLayout}`,
    `Modelo de composicao: ${direction.compositionModel}`,
    `Alinhamento: ${direction.textAlignment}`,
    `Densidade: ${direction.density}`,
    `Posicao da marca: ${direction.logoPlacement}`,
    `Moldura: ${direction.frameStyle}`,
    `Regras de composicao: ${direction.compositionRules}`,
    `Elementos recorrentes: ${direction.recurringElements}`,
    `Referencias sociais: ${direction.socialReferenceNotes}`,
    `Evitar: ${direction.avoidances}`,
    `Templates base: ${direction.templates.join(", ")}`,
  ].join("\n")
}

function buildFontStack(preferredFont: string, fallbackVariable: string) {
  const cleanedFont = preferredFont.trim()
  if (!cleanedFont) return `var(${fallbackVariable})`

  const normalizedFont = cleanedFont.includes(",") || cleanedFont.includes('"') || cleanedFont.includes("'")
    ? cleanedFont
    : `"${cleanedFont}"`

  return `${normalizedFont}, var(${fallbackVariable})`
}

const DEFAULT_FONT_OPTIONS = [
  { id: "sora", label: "Sora", family: "Sora", source: "Fonte padrao do sistema" },
  { id: "inter", label: "Inter", family: "Inter", source: "Fonte padrao do sistema" },
] as const

const TEMPLATE_OPTIONS = [
  "Post estatico",
  "Carrossel",
  "Capa para video",
  "Story",
  "Reels cover",
  "Anuncio",
  "Case",
  "Institucional",
] as const

const COMPOSITION_MODEL_OPTIONS = [
  "Blocos de destaque",
  "Editorial limpo",
  "Centralizado",
  "Assimetrico",
  "Carrossel denso",
] as const

const ALIGNMENT_OPTIONS = ["Esquerda", "Centralizado"] as const
const DENSITY_OPTIONS = ["Clean", "Media", "Alta"] as const
const LOGO_PLACEMENT_OPTIONS = ["Rodape", "Topo"] as const
const FRAME_STYLE_OPTIONS = ["Sem moldura", "Moldura fina", "Tarja/Box"] as const

function createUploadedFont(file: File): UploadedFont {
  const baseName = file.name.replace(/\.[^/.]+$/, "").trim() || "Fonte personalizada"
  const familyToken = baseName.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase() || "custom-font"

  return {
    id: `${familyToken}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: baseName,
    family: `brand-font-${familyToken}-${Math.random().toString(36).slice(2, 8)}`,
    source: `Arquivo carregado: ${file.name}`,
    previewUrl: URL.createObjectURL(file),
  }
}

function createReferenceImage(file: File): ReferenceImage {
  return {
    id: `${file.name.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    previewUrl: URL.createObjectURL(file),
  }
}

interface Business {
  id: string;
  nome_marca: string;
  site_url?: string;
  redes_sociais?: Record<string, string>;
  brand_profiles?: BrandProfile[];
}

export default function BrandIntelligence() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialBusinessId = searchParams.get("businessId")
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [activeBusinessId, setActiveBusinessId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"input" | "generating" | "approval">("input")
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null)
  const [visualDirection, setVisualDirection] = useState<VisualDirection>(DEFAULT_VISUAL_DIRECTION)
  const [uploadedFonts, setUploadedFonts] = useState<UploadedFont[]>([])
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([])
  const [designerPrompt, setDesignerPrompt] = useState(
    "Crie um post de Instagram com cara de campanha premium, usando minha paleta, minhas fontes e uma hierarquia visual forte para gerar desejo e conversao."
  )
  const [studioPostTitle, setStudioPostTitle] = useState("Campanha que para o scroll")
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false)
  const [isEditingSaved, setIsEditingSaved] = useState(false)
  const registeredFontFacesRef = useRef<FontFace[]>([])
  const uploadedFontsRef = useRef<UploadedFont[]>([])
  const referenceImagesRef = useRef<ReferenceImage[]>([])

  const activeBusiness = useMemo(
    () => businesses.find(business => business.id === activeBusinessId),
    [activeBusinessId, businesses]
  )

  const persistedFonts = useMemo(() => {
    const fontEntries = [
      {
        family: visualDirection.typography.headingFont,
        source: visualDirection.typography.headingFontSource,
      },
      {
        family: visualDirection.typography.bodyFont,
        source: visualDirection.typography.bodyFontSource,
      },
    ]

    return fontEntries
      .filter(font => font.family)
      .filter(font => !DEFAULT_FONT_OPTIONS.some(option => option.family === font.family))
      .filter(font => !uploadedFonts.some(option => option.family === font.family))
      .filter((font, index, array) => array.findIndex(item => item.family === font.family) === index)
      .map(font => ({
        id: `saved-${font.family}`,
        label: font.family,
        family: font.family,
        source: font.source || "Fonte previamente salva",
        removable: false,
      }))
  }, [
    uploadedFonts,
    visualDirection.typography.bodyFont,
    visualDirection.typography.bodyFontSource,
    visualDirection.typography.headingFont,
    visualDirection.typography.headingFontSource,
  ])

  const availableFonts = useMemo(
    () => [
      ...persistedFonts,
      ...DEFAULT_FONT_OPTIONS.map(font => ({
        ...font,
        removable: false,
      })),
      ...uploadedFonts.map(font => ({
        ...font,
        removable: true,
      })),
    ],
    [persistedFonts, uploadedFonts]
  )

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
      setVisualDirection(parseVisualDirection(bus.brand_profiles[0].estilo_visual))
      setIsEditingSaved(true)
      setStep("input")
    } else {
      setBrandProfile(null)
      setVisualDirection(DEFAULT_VISUAL_DIRECTION)
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

  const updatePaletteColor = (index: number, value: string) => {
    const nextPalette = [...visualDirection.palette]
    const normalizedValue = value.startsWith("#") ? value.toUpperCase() : `#${value.toUpperCase()}`
    nextPalette[index] = normalizedValue
    setVisualDirection({ ...visualDirection, palette: nextPalette })
  }

  const addPaletteColor = () => {
    setVisualDirection({ ...visualDirection, palette: [...visualDirection.palette, "#000000"] })
  }

  const removePaletteColor = (index: number) => {
    const nextPalette = visualDirection.palette.filter((_, itemIndex) => itemIndex !== index)
    setVisualDirection({
      ...visualDirection,
      palette: nextPalette.length > 0 ? nextPalette : DEFAULT_VISUAL_DIRECTION.palette,
    })
  }

  const syncFontSelection = (fontFamily: string, target: "heading" | "body") => {
    const selectedFont = availableFonts.find(font => font.family === fontFamily)
    if (!selectedFont) return

    if (target === "heading") {
      setVisualDirection(previous => ({
        ...previous,
        typography: {
          ...previous.typography,
          headingFont: selectedFont.family,
          headingFontSource: selectedFont.source,
        },
      }))
      return
    }

    setVisualDirection(previous => ({
      ...previous,
      typography: {
        ...previous.typography,
        bodyFont: selectedFont.family,
        bodyFontSource: selectedFont.source,
      },
    }))
  }

  const handleTypographyFilesAdd = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const nextFonts = Array.from(files).map(createUploadedFont)
    setUploadedFonts(previous => [...previous, ...nextFonts])

    if (visualDirection.typography.headingFont === DEFAULT_VISUAL_DIRECTION.typography.headingFont && nextFonts[0]) {
      syncFontSelection(nextFonts[0].family, "heading")
    }
  }

  const handleReferenceImagesAdd = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const nextImages = Array.from(files)
      .filter(file => file.type.startsWith("image/"))
      .map(createReferenceImage)

    if (nextImages.length === 0) return
    setReferenceImages(previous => [...previous, ...nextImages])
  }

  const removeReferenceImage = (imageId: string) => {
    setReferenceImages(previous => {
      const targetImage = previous.find(image => image.id === imageId)
      if (targetImage) URL.revokeObjectURL(targetImage.previewUrl)
      return previous.filter(image => image.id !== imageId)
    })
  }

  const applyPromptToPreview = () => {
    const promptWords = designerPrompt
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 6)

    if (promptWords.length > 0) {
      setStudioPostTitle(promptWords.join(" "))
    }
  }

  const removeUploadedFont = (fontId: string) => {
    setUploadedFonts(previous => {
      const targetFont = previous.find(font => font.id === fontId)
      if (!targetFont) return previous

      URL.revokeObjectURL(targetFont.previewUrl)

      const nextFonts = previous.filter(font => font.id !== fontId)

      setVisualDirection(current => {
        const nextHeadingFont = current.typography.headingFont === targetFont.family
          ? DEFAULT_VISUAL_DIRECTION.typography.headingFont
          : current.typography.headingFont
        const nextBodyFont = current.typography.bodyFont === targetFont.family
          ? DEFAULT_VISUAL_DIRECTION.typography.bodyFont
          : current.typography.bodyFont

        return {
          ...current,
          typography: {
            ...current.typography,
            headingFont: nextHeadingFont,
            headingFontSource: nextHeadingFont === DEFAULT_VISUAL_DIRECTION.typography.headingFont
              ? ""
              : current.typography.headingFontSource,
            bodyFont: nextBodyFont,
            bodyFontSource: nextBodyFont === DEFAULT_VISUAL_DIRECTION.typography.bodyFont
              ? ""
              : current.typography.bodyFontSource,
          },
        }
      })

      return nextFonts
    })
  }

  const availableTemplates = useMemo(() => {
    const merged = [...TEMPLATE_OPTIONS, ...visualDirection.templates]
    return merged.filter((template, index) => merged.indexOf(template) === index)
  }, [visualDirection.templates])

  const toggleTemplate = (template: string) => {
    setVisualDirection(current => {
      if (!template) return current

      const isSelected = current.templates.includes(template)
      const nextTemplates = isSelected
        ? current.templates.filter(item => item !== template)
        : [...current.templates, template]

      return {
        ...current,
        templates: nextTemplates.length > 0 ? nextTemplates : [DEFAULT_VISUAL_DIRECTION.templates[0]],
      }
    })
    setIsTemplateMenuOpen(false)
  }

  useEffect(() => {
    uploadedFontsRef.current = uploadedFonts
  }, [uploadedFonts])

  useEffect(() => {
    referenceImagesRef.current = referenceImages
  }, [referenceImages])

  useEffect(() => {
    const nextFontFaces: FontFace[] = []

    async function loadUploadedFonts() {
      for (const uploadedFont of uploadedFonts) {
        const fontFace = new FontFace(
          uploadedFont.family,
          `url(${uploadedFont.previewUrl})`
        )

        try {
          await fontFace.load()
          document.fonts.add(fontFace)
          nextFontFaces.push(fontFace)
        } catch (error) {
          console.error("Erro ao carregar fonte personalizada", error)
        }
      }

      registeredFontFacesRef.current = nextFontFaces
    }

    void loadUploadedFonts()

    return () => {
      for (const fontFace of registeredFontFacesRef.current) {
        document.fonts.delete(fontFace)
      }
      registeredFontFacesRef.current = []
    }
  }, [uploadedFonts])

  useEffect(() => {
    return () => {
      uploadedFontsRef.current.forEach(font => URL.revokeObjectURL(font.previewUrl))
      referenceImagesRef.current.forEach(image => URL.revokeObjectURL(image.previewUrl))
    }
  }, [])

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
    applyPromptToPreview()
    setStep("generating")
    
    // Simulate Opensquad AI processing
    setTimeout(() => {
      setBrandProfile({
        tom_de_voz: "Profissional, inovador e acolhedor",
        estilo_comunicacao: "Direto ao ponto, com foco em resultados práticos.",
        palavras_usadas: ["inovação", "crescimento", "estratégia", "tecnologia"],
        palavras_evitar: ["barato", "gambiarra", "difícil", "complicado"],
        publico_alvo: "Empreendedores e gestores de pequenas e médias empresas tech.",
        proposta_valor: formData.objective || designerPrompt,
        diferenciais: ["Identidade visual consistente", "Direção criativa com IA", "Foco em conversão"],
        estilo_visual: serializeVisualDirection(visualDirection),
        tipos_conteudo: ["Carrosséis educativos", "Casos de sucesso", "Vídeos curtos de dicas"],
        exemplos_abordagem: [designerPrompt]
      })
      setStep("approval")
    }, 4500)
  }

  const buildDesignerProfilePayload = () => {
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

    return {
      business_id: activeBusinessId,
      site_url: formData.siteUrl || null,
      redes_sociais: redesObj,
      tom_de_voz: brandProfile?.tom_de_voz || "Visual, direto e orientado a performance.",
      estilo_comunicacao: brandProfile?.estilo_comunicacao || "Comunicação clara, comercial e com foco em conversão.",
      palavras_usadas: brandProfile?.palavras_usadas || ["estrategia", "crescimento", "marca", "conteudo"],
      palavras_evitar: brandProfile?.palavras_evitar || ["generico", "amador", "confuso"],
      publico_alvo: brandProfile?.publico_alvo || "Publico definido pela marca.",
      proposta_valor: formData.objective || brandProfile?.proposta_valor || designerPrompt,
      diferenciais: brandProfile?.diferenciais || ["Identidade visual consistente", "Direção criativa com IA"],
      estilo_visual: serializeVisualDirection(visualDirection),
      tipos_conteudo: brandProfile?.tipos_conteudo || visualDirection.templates,
      exemplos_abordagem: brandProfile?.exemplos_abordagem || [designerPrompt],
    };
  }

  const handleSaveDesigner = async () => {
    if (!activeBusinessId) return alert("Selecione uma marca primeiro.")
    setLoading(true)
    try {
      const response = await fetch("/api/brand-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildDesignerProfilePayload())
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Erro ao salvar Designer")
      }

      const savedProfile = await response.json()
      setBrandProfile(savedProfile)
      setIsEditingSaved(true)
      alert("Designer salvo com sucesso.")
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Erro ao salvar Designer")
    } finally {
      setLoading(false)
    }
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
          ...brandProfile,
          estilo_visual: serializeVisualDirection(visualDirection)
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.35),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.28),transparent_30%)]" />
        <div className="relative grid gap-8 px-6 py-8 lg:grid-cols-[1fr_360px] lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              Fase 1: Designer
            </div>
            <h2 className="mt-5 max-w-2xl font-display text-4xl font-black leading-[0.94] tracking-tight md:text-5xl">
              Designer Studio{activeBusiness ? ` para ${activeBusiness.nome_marca}` : " visual"}.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 md:text-base">
              Defina paleta, fontes, imagens e comandos criativos para a IA manter um padrao visual consistente em cada post.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">Fluxo desta fase</p>
            <div className="mt-4 space-y-3">
              {[
                ["01", "Identidade", "Paleta, fontes e referencias"],
                ["02", "Prompt", "Direcao visual em linguagem natural"],
                ["03", "Preview", "Post gerado com padrao de marca"],
              ].map(([index, title, text]) => (
                <div key={index} className="flex gap-3 rounded-xl border border-white/10 bg-slate-950/35 p-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-slate-950">
                    {index}
                  </span>
                  <div>
                    <p className="text-sm font-bold">{title}</p>
                    <p className="text-xs text-white/58">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {step === "input" && (
        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)_380px]">
          <section className="space-y-4">
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b bg-slate-50">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-orange-600" />
                  <CardTitle className="text-lg">Marca</CardTitle>
                </div>
                <CardDescription>Escolha o negocio e conecte os canais que servem de referencia.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="space-y-2">
                  <Label>Negocio</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={activeBusinessId}
                    onChange={(e) => selectBusinessAndCheckProfile(e.target.value, businesses)}
                  >
                    <option value="">Selecione uma marca</option>
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>{b.nome_marca}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Site</Label>
                  <Input
                    placeholder="https://suaempresa.com.br"
                    value={formData.siteUrl}
                    onChange={e => setFormData({...formData, siteUrl: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Redes sociais</Label>
                  {formData.socialLinks.map((link, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="https://instagram.com/suaempresa"
                        value={link}
                        onChange={e => handleSocialLinkChange(index, e.target.value)}
                      />
                      {formData.socialLinks.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialLink(index)} className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="text-xs">
                    Adicionar canal
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b bg-slate-50">
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4 text-sky-600" />
                  <CardTitle className="text-lg">Referencias</CardTitle>
                </div>
                <CardDescription>Suba imagens que indiquem atmosfera, composicao e estilo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition-colors hover:border-slate-400 hover:bg-slate-100">
                  <Upload className="h-5 w-5 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-700">Carregar imagens</span>
                  <span className="text-xs leading-5 text-slate-500">Logo, print do feed, campanha antiga ou moodboard.</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleReferenceImagesAdd(e.target.files)
                      e.currentTarget.value = ""
                    }}
                  />
                </label>

                {referenceImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {referenceImages.map(image => (
                      <div key={image.id} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                        <img src={image.previewUrl} alt={image.name} className="aspect-square w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeReferenceImage(image.id)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/75 text-white opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label={`Remover ${image.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b bg-white">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-orange-600" />
                  <CardTitle className="text-lg">Brand board</CardTitle>
                </div>
                <CardDescription>Configure o norte visual que o Designer vai seguir.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
                  <div className="space-y-3">
                    <Label>Paleta</Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {visualDirection.palette.map((color, index) => (
                        <div key={`${color}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => updatePaletteColor(index, e.target.value)}
                            className="h-9 w-10 shrink-0 rounded border border-slate-200 bg-white p-1"
                          />
                          <Input
                            value={color}
                            onChange={(e) => updatePaletteColor(index, e.target.value)}
                            className="h-9 bg-white"
                            placeholder="#000000"
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removePaletteColor(index)} className="h-9 w-9 shrink-0 text-slate-400 hover:text-red-600">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addPaletteColor}>
                      Adicionar cor
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-slate-500" />
                      <Label>Fontes</Label>
                    </div>
                    <div className="grid gap-3">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Titulos</p>
                        <select
                          className="mt-2 flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                          value={visualDirection.typography.headingFont}
                          onChange={(e) => syncFontSelection(e.target.value, "heading")}
                        >
                          {availableFonts.map(font => <option key={font.id} value={font.family}>{font.label}</option>)}
                        </select>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Corpo</p>
                        <select
                          className="mt-2 flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                          value={visualDirection.typography.bodyFont}
                          onChange={(e) => syncFontSelection(e.target.value, "body")}
                        >
                          {availableFonts.map(font => <option key={font.id} value={font.family}>{font.label}</option>)}
                        </select>
                      </div>
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        <Upload className="h-4 w-4" />
                        Carregar fonte
                        <input
                          type="file"
                          accept=".ttf,.otf,.woff,.woff2"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            handleTypographyFilesAdd(e.target.files)
                            e.currentTarget.value = ""
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Composicao</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={visualDirection.compositionModel} onChange={(e) => setVisualDirection({ ...visualDirection, compositionModel: e.target.value })}>
                      {COMPOSITION_MODEL_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Densidade</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={visualDirection.density} onChange={(e) => setVisualDirection({ ...visualDirection, density: e.target.value })}>
                      {DENSITY_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Marca</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={visualDirection.logoPlacement} onChange={(e) => setVisualDirection({ ...visualDirection, logoPlacement: e.target.value })}>
                      {LOGO_PLACEMENT_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <CardHeader className="border-b bg-white">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-violet-600" />
                  <CardTitle className="text-lg">Prompt do Designer</CardTitle>
                </div>
                <CardDescription>Comande a IA como se estivesse passando briefing para um designer.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <textarea
                  className="flex min-h-[132px] w-full rounded-lg border border-input bg-background px-4 py-3 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={designerPrompt}
                  onChange={(e) => setDesignerPrompt(e.target.value)}
                  placeholder="Ex: Crie um post premium para Instagram sobre automacao comercial, com contraste alto, titulo grande, CTA claro e visual parecido com campanhas de tecnologia."
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Objetivo do post</Label>
                    <Input
                      placeholder="Ex: gerar leads para consultoria"
                      value={formData.objective}
                      onChange={e => setFormData({...formData, objective: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estilo visual</Label>
                    <Input
                      value={visualDirection.visualStyle}
                      onChange={(e) => setVisualDirection({ ...visualDirection, visualStyle: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 border-t bg-slate-50 sm:flex-row sm:justify-between">
                <Button type="button" variant="outline" onClick={applyPromptToPreview} className="w-full sm:w-auto">
                  Atualizar preview
                </Button>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <Button type="button" variant="secondary" onClick={handleSaveDesigner} disabled={loading} className="w-full sm:w-auto">
                    {loading ? "Salvando..." : isEditingSaved ? "Salvar alterações" : "Salvar Designer"}
                  </Button>
                  <Button onClick={handleGenerate} className="w-full gap-2 bg-orange-600 hover:bg-orange-700 sm:w-auto">
                    <Sparkles className="h-4 w-4" />
                    Gerar com Designer
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </section>

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <Card className="overflow-hidden border-slate-200 shadow-xl">
              <CardHeader className="border-b bg-slate-950 text-white">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-orange-300" />
                  <CardTitle className="text-lg">Preview do post</CardTitle>
                </div>
                <CardDescription className="text-white/60">Amostra visual baseada no seu brand board.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 bg-slate-100 p-4">
                <div
                  className="relative aspect-[4/5] overflow-hidden rounded-2xl p-5 text-white shadow-2xl"
                  style={{
                    background: `linear-gradient(145deg, ${visualDirection.palette[0] || "#111827"} 0%, ${visualDirection.palette[1] || "#F97316"} 58%, ${visualDirection.palette[2] || "#FDE047"} 100%)`,
                  }}
                >
                  {referenceImages[0] && (
                    <img src={referenceImages[0].previewUrl} alt="Referencia principal" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity" />
                  )}
                  <div className="absolute -right-14 top-10 h-36 w-36 rotate-12 rounded-[2rem] bg-white/16" />
                  <div className="absolute -left-10 bottom-20 h-32 w-32 rounded-full bg-white/10" />
                  <div className="relative flex h-full flex-col justify-between rounded-2xl border border-white/15 bg-slate-950/42 p-5 backdrop-blur-[2px]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white/14 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                        Designer IA
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                        {visualDirection.logoPlacement}
                      </span>
                    </div>

                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                        {formData.objective || "Campanha de conversao"}
                      </p>
                      <h3
                        className="text-4xl font-black uppercase leading-[0.88] tracking-tight"
                        style={{ fontFamily: buildFontStack(visualDirection.typography.headingFont, "--font-display") }}
                      >
                        {studioPostTitle}
                      </h3>
                      <p
                        className="mt-4 text-sm leading-6 text-white/76"
                        style={{ fontFamily: buildFontStack(visualDirection.typography.bodyFont, "--font-body") }}
                      >
                        {designerPrompt.slice(0, 142)}{designerPrompt.length > 142 ? "..." : ""}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-950">
                        Ver proposta
                      </div>
                      <div className="text-right text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">
                        Marketing HQ
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {visualDirection.palette.slice(0, 4).map((color, index) => (
                    <div key={`${color}-${index}`} className="h-11 rounded-lg border border-slate-200" style={{ backgroundColor: color }} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
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

              <div className="space-y-4 rounded-xl border border-sky-200 bg-sky-50/60 p-4">
                <div>
                  <Label className="text-sm font-semibold text-sky-900">Sistema Visual Base</Label>
                  <p className="text-xs text-sky-700 mt-1">
                    Defina o padrao visual que vai servir de base para post estatico, carrossel e capa para video.
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { title: "1. Referencias", text: "Confirme links, paleta, tipografia e o que no feed atual precisa ser repetido." },
                    { title: "2. Layout Base", text: "Escolha o modelo de composicao, alinhamento, densidade e posicao da marca." },
                    { title: "3. Regras Fixas", text: "Defina o que repetir e o que nunca fazer para o Designer parar de inventar." },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-sky-200 bg-white/90 p-4">
                      <p className="text-sm font-semibold text-sky-950">{item.title}</p>
                      <p className="mt-2 text-xs leading-5 text-sky-800">{item.text}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div className="space-y-2">
                    <Label>Modelo de Composição</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={visualDirection.compositionModel}
                      onChange={(e) => setVisualDirection({ ...visualDirection, compositionModel: e.target.value })}
                    >
                      {COMPOSITION_MODEL_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Alinhamento</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={visualDirection.textAlignment}
                      onChange={(e) => setVisualDirection({ ...visualDirection, textAlignment: e.target.value })}
                    >
                      {ALIGNMENT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Densidade Visual</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={visualDirection.density}
                      onChange={(e) => setVisualDirection({ ...visualDirection, density: e.target.value })}
                    >
                      {DENSITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Posição da Marca</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={visualDirection.logoPlacement}
                      onChange={(e) => setVisualDirection({ ...visualDirection, logoPlacement: e.target.value })}
                    >
                      {LOGO_PLACEMENT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Moldura / Box</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={visualDirection.frameStyle}
                      onChange={(e) => setVisualDirection({ ...visualDirection, frameStyle: e.target.value })}
                    >
                      {FRAME_STYLE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Paleta de Cores</Label>
                    <div className="space-y-2 rounded-md border border-input bg-background p-3">
                      {visualDirection.palette.map((color, index) => (
                        <div key={`${color}-${index}`} className="flex items-center gap-2">
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => updatePaletteColor(index, e.target.value)}
                            className="h-10 w-12 rounded border border-input bg-background p-1"
                          />
                          <Input
                            value={color}
                            onChange={(e) => updatePaletteColor(index, e.target.value)}
                            placeholder="#000000"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePaletteColor(index)}
                            className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addPaletteColor} className="text-xs">
                        + Adicionar cor
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipografia</Label>
                    <div className="space-y-3 rounded-md border border-input bg-background p-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Biblioteca de Fontes</Label>
                        <div className="space-y-2 rounded-md border border-input bg-background p-3">
                          {availableFonts.map((font) => {
                            const isHeading = visualDirection.typography.headingFont === font.family
                            const isBody = visualDirection.typography.bodyFont === font.family

                            return (
                              <div key={font.id} className="rounded-md border border-input bg-white p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p
                                      className="truncate text-base font-semibold text-slate-900"
                                      style={{ fontFamily: buildFontStack(font.family, "--font-body") }}
                                    >
                                      {font.label}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">{font.source}</p>
                                  </div>
                                  {font.removable ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeUploadedFont(font.id)}
                                      className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                    </Button>
                                  ) : (
                                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                      Base
                                    </span>
                                  )}
                                </div>

                                <p
                                  className="mt-3 text-sm leading-6 text-slate-700"
                                  style={{ fontFamily: buildFontStack(font.family, "--font-body") }}
                                >
                                  Aa Bb Cc 123. Previa rapida da fonte carregada para validar leitura e personalidade.
                                </p>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    variant={isHeading ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => syncFontSelection(font.family, "heading")}
                                  >
                                    {isHeading ? "Usando em titulos" : "Usar em titulos"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={isBody ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => syncFontSelection(font.family, "body")}
                                  >
                                    {isBody ? "Usando no corpo" : "Usar no corpo"}
                                  </Button>
                                </div>
                              </div>
                            )
                          })}

                          <label className="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100">
                            + Adicionar fonte
                            <input
                              type="file"
                              accept=".ttf,.otf,.woff,.woff2"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                handleTypographyFilesAdd(e.target.files)
                                e.currentTarget.value = ""
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estilo Visual</Label>
                    <textarea
                      className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={visualDirection.visualStyle}
                      onChange={(e) => setVisualDirection({ ...visualDirection, visualStyle: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Grid / Layout</Label>
                    <textarea
                      className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={visualDirection.gridLayout}
                      onChange={(e) => setVisualDirection({ ...visualDirection, gridLayout: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Regras de Composição</Label>
                    <textarea
                      className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={visualDirection.compositionRules}
                      onChange={(e) => setVisualDirection({ ...visualDirection, compositionRules: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Descreva como seus posts costumam organizar título, subtítulo, CTA, respiro e áreas de destaque.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Elementos Recorrentes da Marca</Label>
                    <textarea
                      className="flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={visualDirection.recurringElements}
                      onChange={(e) => setVisualDirection({ ...visualDirection, recurringElements: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Liste o que faz seu feed ser reconhecivel: tarjas, molduras, selo, textura, posição do logo, CTA, ícones.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Referência das Redes Sociais</Label>
                    <textarea
                      className="flex min-h-[104px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={visualDirection.socialReferenceNotes}
                      onChange={(e) => setVisualDirection({ ...visualDirection, socialReferenceNotes: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use este campo para dizer o que o Designer deve copiar do seu feed atual.
                    </p>
                    {formData.socialLinks.some(link => link.trim()) && (
                      <p className="text-xs text-sky-700">
                        Links cadastrados: {formData.socialLinks.filter(link => link.trim()).join(" | ")}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>O que Nunca Fazer</Label>
                    <textarea
                      className="flex min-h-[104px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={visualDirection.avoidances}
                      onChange={(e) => setVisualDirection({ ...visualDirection, avoidances: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe explícito o que descaracteriza sua marca para o Designer não repetir esse erro.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Templates Base</Label>
                  <div className="space-y-2 rounded-md border border-input bg-background p-3">
                    <div className="rounded-md border border-slate-200 bg-white">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm font-medium text-slate-700"
                        onClick={() => setIsTemplateMenuOpen(current => !current)}
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                            {visualDirection.templates.length} selecionado{visualDirection.templates.length > 1 ? "s" : ""}
                          </p>
                          <span className="block truncate">
                            {visualDirection.templates.join(", ")}
                          </span>
                        </div>
                        <span className={`text-xs text-slate-400 transition-transform ${isTemplateMenuOpen ? "rotate-180" : ""}`}>
                          ▼
                        </span>
                      </button>
                      {isTemplateMenuOpen && (
                        <div className="space-y-2 border-t border-slate-200 px-3 py-3">
                          {availableTemplates.map((option) => {
                            const isSelected = visualDirection.templates.includes(option)

                            return (
                              <label
                                key={option}
                                className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleTemplate(option)}
                                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <span>{option}</span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="type-kicker">Previa da arte</p>
                      <p className="mt-2 text-sm text-slate-600">
                        A amostra abaixo precisa parecer campanha, nao papel timbrado. Use para validar impacto, contraste e apelo visual.
                      </p>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Ao vivo
                    </div>
                  </div>

                  <div
                    className="relative overflow-hidden rounded-[28px] border border-slate-200"
                    style={{
                      background: `linear-gradient(140deg, ${visualDirection.palette[0] || "#111827"} 0%, ${visualDirection.palette[1] || visualDirection.palette[0] || "#F97316"} 55%, ${visualDirection.palette[2] || visualDirection.palette[1] || "#FDE047"} 100%)`,
                    }}
                  >
                    <div className="pointer-events-none absolute -left-8 top-10 h-36 w-36 rounded-full opacity-70 blur-2xl" style={{ backgroundColor: visualDirection.palette[2] || "#FDE047" }} />
                    <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 translate-x-10 -translate-y-8 rounded-full opacity-40 blur-3xl" style={{ backgroundColor: visualDirection.palette[3] || "#FFFFFF" }} />
                    <div className="pointer-events-none absolute bottom-0 right-10 h-24 w-24 rounded-full border border-white/30" />

                    <div className="relative grid gap-4 p-5 md:grid-cols-[1.4fr_0.9fr] md:p-6">
                      <div className="rounded-[26px] border border-white/15 bg-slate-950/82 p-5 text-white shadow-2xl backdrop-blur-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
                            Campanha em destaque
                          </span>
                          <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
                            Feed + Story + Carrossel
                          </span>
                        </div>

                        <h3
                          className="mt-5 max-w-lg text-4xl font-black uppercase leading-[0.88] tracking-[-0.06em] md:text-5xl"
                          style={{ fontFamily: buildFontStack(visualDirection.typography.headingFont, "--font-display") }}
                        >
                          Arte bonita, chamativa e com cara de campanha
                        </h3>

                        <p
                          className="mt-4 max-w-md text-sm leading-6 text-white/78 md:text-[15px]"
                          style={{ fontFamily: buildFontStack(visualDirection.typography.bodyFont, "--font-body") }}
                        >
                          O layout precisa capturar atencao em segundos com contraste forte, ritmo visual e hierarquia agressiva para redes sociais.
                        </p>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                          {["Tipografia forte", "Composicao dinamica", "Visual memoravel"].map((item) => (
                            <div key={item} className="rounded-2xl border border-white/10 bg-white/8 px-3 py-3">
                              <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Direcao</p>
                              <p className="mt-2 text-sm font-semibold text-white">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div
                          className="rounded-[26px] border border-slate-950/10 px-4 py-4 text-slate-950 shadow-xl"
                          style={{ backgroundColor: visualDirection.palette[2] || "#FDE047" }}
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-700/70">Headline font</p>
                          <p
                            className="mt-3 text-2xl font-black leading-none tracking-[-0.05em]"
                            style={{ fontFamily: buildFontStack(visualDirection.typography.headingFont, "--font-display") }}
                          >
                            {visualDirection.typography.headingFont || "Fonte de titulos"}
                          </p>
                        </div>

                        <div className="rounded-[26px] border border-white/20 bg-white/88 p-4 shadow-xl backdrop-blur-sm">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">Body font</p>
                          <p
                            className="mt-3 text-lg font-semibold text-slate-900"
                            style={{ fontFamily: buildFontStack(visualDirection.typography.bodyFont, "--font-body") }}
                          >
                            {visualDirection.typography.bodyFont || "Fonte de corpo"}
                          </p>
                          <p className="mt-4 text-sm leading-6 text-slate-600">
                            {visualDirection.typography.styleNotes}
                          </p>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                          {visualDirection.palette.slice(0, 4).map((color, index) => (
                            <div key={`${color}-${index}`} className="space-y-2">
                              <div className="h-14 rounded-2xl border border-white/30 shadow-sm" style={{ backgroundColor: color }} />
                              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-white/85 md:text-slate-100">
                                {color}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
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
