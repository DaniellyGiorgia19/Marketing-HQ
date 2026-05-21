import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Download, FileText, Image as ImageIcon, Plus, RefreshCw, Sparkles, Wand2, X } from "lucide-react"
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

interface DesignRequest {
  id: string;
  type: string;
  format: string;
  objective: string;
  prompt: string;
  title: string;
  attachments: string[];
}

interface CreationAttachment {
  id: string;
  name: string;
  type: "image" | "document";
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  attachments?: string[];
}

interface GeneratedDesign {
  id: string;
  title: string;
  type: string;
  format: string;
  prompt: string;
  createdAt: string;
  primaryColor: string;
  accentColor: string;
  attachments: string[];
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

const DESIGN_REQUEST_TYPES = [
  "Post estatico",
  "Carrossel",
  "Story",
  "Capa para video",
  "Anuncio",
] as const

const DESIGN_FORMAT_OPTIONS = [
  "Feed 4:5",
  "Quadrado 1:1",
  "Story/Reels 9:16",
  "LinkedIn 1.91:1",
] as const

function buildRequestTitle(prompt: string, fallback: string) {
  const words = prompt
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 5)

  return words.length > 0 ? words.join(" ") : fallback
}

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
  const [designerPrompt, setDesignerPrompt] = useState("")
  const [requestType, setRequestType] = useState<string>("Post estatico")
  const [requestFormat, setRequestFormat] = useState<string>("Feed 4:5")
  const [currentDesignRequest, setCurrentDesignRequest] = useState<DesignRequest | null>(null)
  const [generatedDesigns, setGeneratedDesigns] = useState<GeneratedDesign[]>([])
  const [activeGeneratedDesignId, setActiveGeneratedDesignId] = useState("")
  const [creationAttachments, setCreationAttachments] = useState<CreationAttachment[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "designer-welcome",
      role: "assistant",
      text: "Me diga quais peças você quer criar, para qual objetivo e qualquer referência que eu devo considerar.",
    },
  ])
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false)
  const [isEditingSaved, setIsEditingSaved] = useState(false)
  const registeredFontFacesRef = useRef<FontFace[]>([])
  const uploadedFontsRef = useRef<UploadedFont[]>([])

  const activeBusiness = useMemo(
    () => businesses.find(business => business.id === activeBusinessId),
    [activeBusinessId, businesses]
  )

  const activeGeneratedDesign = useMemo(
    () => generatedDesigns.find(design => design.id === activeGeneratedDesignId) || generatedDesigns[0],
    [activeGeneratedDesignId, generatedDesigns]
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

  const handleCreationAttachmentsAdd = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const nextAttachments = Array.from(files).map(file => ({
      id: `${file.name.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      type: file.type.startsWith("image/") ? "image" as const : "document" as const,
    }))

    setCreationAttachments(previous => [...previous, ...nextAttachments])
  }

  const removeCreationAttachment = (attachmentId: string) => {
    setCreationAttachments(previous => previous.filter(attachment => attachment.id !== attachmentId))
  }

  const addDesignRequestFromPrompt = (prompt: string) => {
    const request: DesignRequest = {
      id: `design-request-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: requestType,
      format: requestFormat,
      objective: formData.objective.trim() || "Campanha de conversao",
      prompt,
      title: buildRequestTitle(prompt, requestType),
      attachments: creationAttachments.map(attachment => attachment.name),
    }

    setCurrentDesignRequest(request)
    return request
  }

  const handleSendDesignerMessage = () => {
    const prompt = designerPrompt.trim()
    if (!prompt) {
      alert("Escreva o prompt da peça primeiro.")
      return null
    }

    const request = addDesignRequestFromPrompt(prompt)
    const attachmentNames = creationAttachments.map(attachment => attachment.name)

    setChatMessages(previous => [
      ...previous,
      {
        id: `user-message-${request.id}`,
        role: "user",
        text: prompt,
        attachments: attachmentNames,
      },
      {
        id: `assistant-message-${request.id}`,
        role: "assistant",
        text: `Perfeito. Vou preparar ${request.type.toLowerCase()} no formato ${request.format}${request.objective ? ` com foco em ${request.objective}` : ""}.`,
      },
    ])
    setDesignerPrompt("")
    setCreationAttachments([])
    return request
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

  const createGeneratedDesign = (request: DesignRequest): GeneratedDesign => ({
    id: `generated-design-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: request.title,
    type: request.type,
    format: request.format,
    prompt: request.prompt,
    createdAt: new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }),
    primaryColor: visualDirection.palette[0] || "#111827",
    accentColor: visualDirection.palette[1] || "#F97316",
    attachments: request.attachments,
  })

  const downloadGeneratedDesign = (design: GeneratedDesign) => {
    const brandName = activeBusiness?.nome_marca || "Marketing HQ"
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
        <defs>
          <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${design.primaryColor}" />
            <stop offset="100%" stop-color="${design.accentColor}" />
          </linearGradient>
        </defs>
        <rect width="1080" height="1350" rx="64" fill="url(#bg)" />
        <rect x="78" y="86" width="924" height="1178" rx="48" fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="3" />
        <text x="118" y="180" fill="white" font-family="Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="10">${brandName.toUpperCase()}</text>
        <text x="118" y="470" fill="white" font-family="Arial, sans-serif" font-size="96" font-weight="900">${design.title.toUpperCase()}</text>
        <foreignObject x="118" y="560" width="760" height="360">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif; color: white; font-size: 46px; line-height: 1.24;">${design.prompt}</div>
        </foreignObject>
        <rect x="118" y="1088" width="286" height="82" rx="41" fill="white" />
        <text x="166" y="1142" fill="${design.primaryColor}" font-family="Arial, sans-serif" font-size="28" font-weight="900">VER PROPOSTA</text>
        <text x="710" y="1142" fill="white" font-family="Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="8">${design.format.toUpperCase()}</text>
      </svg>
    `
    const blob = new Blob([svg], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${design.title.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase() || "peca"}-${design.id}.svg`
    link.click()
    URL.revokeObjectURL(url)
  }

  const requestVariation = (design: GeneratedDesign) => {
    setDesignerPrompt(`Crie uma variação desta peça mantendo a mesma ideia: ${design.prompt}`)
    setRequestType(design.type)
    setRequestFormat(design.format)
  }

  const regenerateDesign = (design: GeneratedDesign) => {
    const request: DesignRequest = {
      id: `design-request-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: design.type,
      format: design.format,
      objective: "Nova geracao",
      prompt: design.prompt,
      title: design.title,
      attachments: design.attachments,
    }
    setCurrentDesignRequest(request)
    setStep("generating")
    setTimeout(() => {
      const generatedDesign = createGeneratedDesign(request)
      setGeneratedDesigns(previous => [generatedDesign, ...previous])
      setActiveGeneratedDesignId(generatedDesign.id)
      setChatMessages(previous => [
        ...previous,
        {
          id: `assistant-regenerated-${generatedDesign.id}`,
          role: "assistant",
          text: "Refiz a peça com uma nova variação visual.",
        },
      ])
      setCurrentDesignRequest(null)
      setStep("input")
    }, 2600)
  }

  const handleGenerate = () => {
    if (!activeBusinessId) return alert("Selecione um negócio primeiro.")
    const request = designerPrompt.trim() ? handleSendDesignerMessage() : currentDesignRequest
    if (!request) return alert("Envie um pedido para o Designer primeiro.")
    setStep("generating")
    
    // Simula a criação da peça sem acionar o fluxo antigo de perfil de marca.
    setTimeout(() => {
      const generatedDesign = createGeneratedDesign(request)
      setGeneratedDesigns(previous => [generatedDesign, ...previous])
      setActiveGeneratedDesignId(generatedDesign.id)
      setChatMessages(previous => [
        ...previous,
        {
          id: `assistant-generated-${generatedDesign.id}`,
          role: "assistant",
          text: "Sua peça está pronta. Você pode baixar, refazer ou pedir uma variação.",
        },
      ])
      setCurrentDesignRequest(null)
      setStep("input")
    }, 2600)
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
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-orange-600" />
              Designer
            </div>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-slate-950">
              {activeBusiness ? activeBusiness.nome_marca : "Studio visual"}
            </h2>
          </div>
          <select
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
            value={activeBusinessId}
            onChange={(e) => selectBusinessAndCheckProfile(e.target.value, businesses)}
          >
            <option value="">Selecione uma marca</option>
            {businesses.map(b => (
              <option key={b.id} value={b.id}>{b.nome_marca}</option>
            ))}
          </select>
        </div>
      </div>

      {step === "input" && (
        <div className="mx-auto max-w-4xl space-y-4">
          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-950">Criação de peças</h3>
                  <p className="mt-1 text-sm text-slate-500">Converse com o Designer para pedir o que precisa.</p>
                </div>
                <Wand2 className="h-5 w-5 text-orange-600" />
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-3xl bg-slate-50 p-4">
                <div className="max-h-[360px] min-h-[240px] space-y-4 overflow-y-auto pr-1">
                  {chatMessages.map(message => (
                    <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                        message.role === "user"
                          ? "bg-slate-950 text-white"
                          : "bg-white text-slate-700"
                      }`}>
                        <p>{message.text}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {message.attachments.map(attachment => (
                              <span key={attachment} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                message.role === "user" ? "bg-white/10 text-white/75" : "bg-slate-100 text-slate-500"
                              }`}>
                                {attachment}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm transition-all focus-within:border-orange-200 focus-within:ring-4 focus-within:ring-orange-50">
                  <textarea
                    className="min-h-[76px] w-full resize-none bg-transparent px-3 py-2 text-base leading-7 text-slate-700 outline-none placeholder:text-slate-400"
                    value={designerPrompt}
                    onChange={(e) => setDesignerPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleGenerate()
                      }
                    }}
                    placeholder="Digite aqui o que você deseja criar..."
                  />

                  {creationAttachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {creationAttachments.map(attachment => {
                        const AttachmentIcon = attachment.type === "image" ? ImageIcon : FileText

                        return (
                          <span key={attachment.id} className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            <AttachmentIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="max-w-[12rem] truncate">{attachment.name}</span>
                            <button
                              type="button"
                              onClick={() => removeCreationAttachment(attachment.id)}
                              className="rounded-full text-slate-400 hover:text-red-500"
                              aria-label={`Remover ${attachment.name}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  )}

                  <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 lg:flex-row lg:items-center">
                    <label className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950">
                      <Plus className="h-6 w-6" />
                      <span className="sr-only">Anexar</span>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.txt,.ppt,.pptx"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          handleCreationAttachmentsAdd(e.target.files)
                          e.currentTarget.value = ""
                        }}
                      />
                    </label>

                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                      <select
                        className="h-10 min-w-0 rounded-full border-0 bg-slate-50 px-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 sm:w-40"
                        value={requestType}
                        onChange={(e) => setRequestType(e.target.value)}
                      >
                        {DESIGN_REQUEST_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                      <select
                        className="h-10 min-w-0 rounded-full border-0 bg-slate-50 px-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 sm:w-36"
                        value={requestFormat}
                        onChange={(e) => setRequestFormat(e.target.value)}
                      >
                        {DESIGN_FORMAT_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>

                    <div className="flex shrink-0 items-center justify-end gap-2">
                      <Button onClick={handleGenerate} className="h-10 gap-2 rounded-full bg-orange-600 px-5 hover:bg-orange-700">
                        <Sparkles className="h-4 w-4" />
                        Gerar peças
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {activeGeneratedDesign && (
            <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-950">Peça criada</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeGeneratedDesign.type} · {activeGeneratedDesign.format} · {activeGeneratedDesign.createdAt}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="h-9 gap-2 rounded-full" onClick={() => requestVariation(activeGeneratedDesign)}>
                    <Sparkles className="h-4 w-4" />
                    Variação
                  </Button>
                  <Button type="button" variant="outline" className="h-9 gap-2 rounded-full" onClick={() => regenerateDesign(activeGeneratedDesign)}>
                    <RefreshCw className="h-4 w-4" />
                    Refazer
                  </Button>
                  <Button type="button" className="h-9 gap-2 rounded-full bg-slate-950 px-4 hover:bg-slate-800" onClick={() => downloadGeneratedDesign(activeGeneratedDesign)}>
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_240px]">
                <div className="rounded-[24px] bg-slate-50 p-4">
                  <div
                    className="relative mx-auto aspect-[4/5] max-w-[420px] overflow-hidden rounded-[24px] p-8 text-white shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${activeGeneratedDesign.primaryColor}, ${activeGeneratedDesign.accentColor})`,
                    }}
                  >
                    <div className="absolute inset-6 rounded-[20px] border border-white/25"></div>
                    <div className="relative flex h-full flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.28em] text-white/75">
                        <span>Designer IA</span>
                        <span>{activeGeneratedDesign.format}</span>
                      </div>
                      <div className="space-y-4">
                        <p className="max-w-[16rem] text-xs font-semibold uppercase tracking-[0.24em] text-white/65">
                          {activeGeneratedDesign.type}
                        </p>
                        <h4 className="max-w-[18rem] font-display text-4xl font-black leading-[0.95] tracking-tight">
                          {activeGeneratedDesign.title}
                        </h4>
                        <p className="max-w-[19rem] text-sm leading-6 text-white/85">
                          {activeGeneratedDesign.prompt}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-white px-4 py-2 text-xs font-black uppercase text-slate-950">Ver proposta</span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/75">
                          {activeBusiness?.nome_marca || "Marketing HQ"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-bold text-slate-950">Peças criadas</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Histórico simples das últimas gerações.</p>
                  </div>
                  <div className="space-y-2">
                    {generatedDesigns.map(design => (
                      <button
                        key={design.id}
                        type="button"
                        onClick={() => setActiveGeneratedDesignId(design.id)}
                        className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                          activeGeneratedDesign.id === design.id ? "border-orange-300 bg-orange-50" : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <p className="truncate text-sm font-semibold text-slate-950">{design.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{design.createdAt}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

        </div>
      )}

      {step === "generating" && (
        <Card className="mx-auto max-w-4xl overflow-hidden rounded-[28px] border-orange-200 bg-white shadow-sm">
           <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-5 p-12 text-center">
             <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-orange-50">
               <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
               <div className="absolute inset-0 rounded-full border-4 border-orange-600 border-t-transparent animate-spin"></div>
               <Sparkles className="h-7 w-7 text-orange-600" />
             </div>
             <div>
               <h3 className="font-display text-2xl font-black tracking-tight text-slate-950">Gerando sua peça...</h3>
               <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                 O Designer está criando a imagem com base no seu prompt, formato escolhido e identidade visual da marca.
               </p>
             </div>
             <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-500">
               <span className="h-2 w-2 animate-pulse rounded-full bg-orange-600"></span>
               Preparando preview visual
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
