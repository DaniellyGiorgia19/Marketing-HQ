import express from 'express';
import cors from 'cors';
import { Prisma, PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import {
  buildHtmlTemplates,
  buildReferenceTemplateFromSiteImage,
  type DesignAlignment,
  type DesignSlide,
  type DesignerOutput,
  type LayoutVariant,
  type StylePreset,
} from '../shared/designTemplates';

dotenv.config();

const app = express();
let prisma: PrismaClient | null = null;

type SocialLinks = Record<string, string>;

type AgentResults = {
  pesquisa?: string;
  copy?: string;
  copy_payload?: CopyOutput;
  design?: string;
  design_payload?: DesignerOutput;
  design_images?: string[];
  _retryCount?: number;
};

type CopySlideRole = 'hook' | 'insight' | 'proof' | 'cta';

type CopySlide = {
  index: number;
  role: CopySlideRole;
  text: string;
};

type CopyOutput = {
  tema: string;
  post_type: 'carrossel' | 'post_unico' | 'capa_reels' | 'story';
  hook: string;
  slides: CopySlide[];
  caption: string[];
  hashtags: string[];
  strategic_objective?: string;
  user_direction?: string;
};

type BrandData = {
  nomeMarca: string;
  site: string;
  redes: SocialLinks;
  segmento: string;
  estiloVisual: string;
  tomDeVoz: string;
  visualDirection: {
    palette: string;
    typography: string;
    style: string;
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
  };
};

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }

  return prisma;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Erro desconhecido';
}

function isDatabaseConnectionError(error: unknown) {
  const message = getErrorMessage(error);
  return /can't reach database server|connect.*timed out|connection.*refused|p1001|database server/i.test(message);
}

function sendApiError(
  res: express.Response,
  statusCode: number,
  message: string,
  error: unknown
) {
  const detail = getErrorMessage(error);
  console.error(message, detail);

  if (isDatabaseConnectionError(error)) {
    res.status(503).json({
      error: 'Banco de dados indisponível. Verifique a conexão e tente novamente.',
    });
    return;
  }

  res.status(statusCode).json({ error: message });
}

function toAgentResults(value: Prisma.JsonValue | null | undefined): AgentResults {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as unknown as AgentResults;
}

function toSocialLinks(value: Prisma.JsonValue | null | undefined): SocialLinks {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => typeof entryValue === 'string')
  ) as SocialLinks;
}

function normalizeLegacyVisualStyle(value?: string) {
  const base = (value || '').trim();
  const impactFallback = 'Direcao visual impactante, comercial e orientada a performance nas redes sociais';

  if (!base) return impactFallback;

  const looksInstitutional = /(minimal|editorial|institucional|clean|limp[oa]|s[oó]bri|clareza|modular|papel timbrado|apresenta[cç][aã]o)/i.test(base);
  if (!looksInstitutional) return base;

  return `${impactFallback}, evitando visual institucional, papel timbrado ou composicao excessivamente fria.`;
}

function parseVisualDirection(estiloVisual?: string) {
  const normalizedStyle = normalizeLegacyVisualStyle(estiloVisual);
  const fallback = {
    palette: 'Extrair do site e redes da marca',
    typography: 'Titulos: Sora | Corpo: Inter | Notas: tipografia forte, contrastada e pensada para capturar atencao rapidamente',
    style: normalizedStyle,
    gridLayout: 'Composicoes assimetricas, chamadas amplas, blocos de destaque e ritmo visual marcante',
    compositionModel: 'Blocos de destaque',
    textAlignment: 'Esquerda',
    density: 'Media',
    logoPlacement: 'Rodape',
    frameStyle: 'Sem moldura',
    compositionRules: 'Seguir a mesma logica compositiva do feed atual da marca, mantendo hierarquia, respiro e estrutura recorrente.',
    recurringElements: 'Preservar elementos recorrentes da marca, como posicao do logo, tarjas, selos, fundos, molduras, texturas e padrao de CTA.',
    socialReferenceNotes: 'As redes sociais cadastradas devem ser tratadas como referencia primaria para manter a identidade visual das pecas.',
    avoidances: 'Evitar visual generico, papel timbrado, slide corporativo e qualquer composicao que fuja do padrao atual do feed.',
    templates: ['Post estatico', 'Carrossel', 'Story'],
  };

  if (!estiloVisual) return fallback;

  const getValue = (label: string) => {
    const match = estiloVisual.match(new RegExp(`${label}:\\s*(.+)`, 'i'));
    return match?.[1]?.trim() || '';
  };

  const templatesValue = getValue('Templates base');
  const headingFont = getValue('Fonte titulos');
  const headingFontSource = getValue('Fonte titulos origem');
  const bodyFont = getValue('Fonte corpo');
  const bodyFontSource = getValue('Fonte corpo origem');
  const styleNotes = getValue('Notas tipograficas');
  const fallbackNotes = getValue('Fallback tipografico');
  const legacyTypography = getValue('Tipografia');
  const compositionModel = getValue('Modelo de composicao');
  const textAlignment = getValue('Alinhamento');
  const density = getValue('Densidade');
  const logoPlacement = getValue('Posicao da marca');
  const frameStyle = getValue('Moldura');
  const compositionRules = getValue('Regras de composicao');
  const recurringElements = getValue('Elementos recorrentes');
  const socialReferenceNotes = getValue('Referencias sociais');
  const avoidances = getValue('Evitar');

  const typographyParts = [
    headingFont ? `Titulos: ${headingFont}` : '',
    headingFontSource && headingFontSource !== 'Nao informado' ? `Origem titulos: ${headingFontSource}` : '',
    bodyFont ? `Corpo: ${bodyFont}` : '',
    bodyFontSource && bodyFontSource !== 'Nao informado' ? `Origem corpo: ${bodyFontSource}` : '',
    styleNotes ? `Notas: ${styleNotes}` : '',
    fallbackNotes ? `Fallback: ${fallbackNotes}` : '',
  ].filter(Boolean);

  return {
    palette: getValue('Paleta') || fallback.palette,
    typography: typographyParts.join(' | ') || legacyTypography || fallback.typography,
    style: normalizeLegacyVisualStyle(getValue('Estilo') || fallback.style),
    gridLayout: getValue('Grid/Layout') || fallback.gridLayout,
    compositionModel: compositionModel || fallback.compositionModel,
    textAlignment: textAlignment || fallback.textAlignment,
    density: density || fallback.density,
    logoPlacement: logoPlacement || fallback.logoPlacement,
    frameStyle: frameStyle || fallback.frameStyle,
    compositionRules: compositionRules || fallback.compositionRules,
    recurringElements: recurringElements || fallback.recurringElements,
    socialReferenceNotes: socialReferenceNotes || fallback.socialReferenceNotes,
    avoidances: avoidances || fallback.avoidances,
    templates: templatesValue
      ? templatesValue.split(',').map(item => item.trim()).filter(Boolean)
      : fallback.templates,
  };
}

function sanitizePreviewText(value: string, fallback = '') {
  return (value || fallback)
    .replace(/[*_`#>[\]]/g, '')
    .replace(/(?:TEXTO DA ARTE|LEGENDA|HASHTAGS|NOTA INTERNA|Página \d+|Slide \d+|Capa|CTA|Subtítulo:|Destaque visual:)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeSvg(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildPaletteColors(palette: string) {
  const colors = palette
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => item.match(/^#?[0-9A-Fa-f]{6}$/)?.[0] || item)
    .map(item => item.startsWith('#') ? item : `#${item}`)
    .slice(0, 4);

  return {
    primary: colors[0] || '#0F172A',
    secondary: colors[1] || '#1D4ED8',
    accent: colors[2] || '#F8FAFC',
    neutral: colors[3] || '#CBD5E1',
  };
}

function encodeSvgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function wrapSvgText(text: string, maxCharsPerLine: number, maxLines: number) {
  const words = sanitizePreviewText(text).split(' ').filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= maxCharsPerLine) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
    currentLine = word;

    if (lines.length === maxLines) {
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (words.length > 0 && lines.length === maxLines) {
    const joined = lines.join(' ');
    if (joined.length < sanitizePreviewText(text).length) {
      lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:!?-]*$/, '')}...`;
    }
  }

  return lines;
}

function renderSvgTextBlock(params: {
  anchor?: 'start' | 'middle' | 'end';
  x: number;
  y: number;
  lines: string[];
  fontSize: number;
  lineHeight: number;
  fill: string;
  fontFamily: string;
  fontWeight: number | string;
}) {
  const { x, y, lines, fontSize, lineHeight, fill, fontFamily, fontWeight, anchor } = params;

  return `
    <text x="${x}" y="${y}" fill="${fill}" font-size="${fontSize}" font-family="${fontFamily}" font-weight="${fontWeight}" ${anchor ? `text-anchor="${anchor}"` : ''}>
      ${lines
        .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeSvg(line)}</tspan>`)
        .join('')}
    </text>
  `;
}

function extractCopySections(copyText?: string) {
  const sections = (copyText || '')
    .split('---')
    .map(section => section.trim())
    .filter(Boolean);

  const arteSection = sections.find(section => section.includes('TEXTO DA ARTE')) || '';
  const legendaSection = sections.find(section => section.includes('LEGENDA')) || '';
  const hashtagsSection = sections.find(section => section.includes('HASHTAGS')) || '';

  const arteLines = arteSection
    .split('\n')
    .map(line => sanitizePreviewText(line))
    .filter(Boolean)
    .filter(line => !/^(TEXTO DA ARTE|Subtitulo|Destaque visual)$/i.test(line));

  const legendaLines = legendaSection
    .split('\n')
    .map(line => sanitizePreviewText(line))
    .filter(Boolean)
    .filter(line => !/^LEGENDA$/i.test(line));

  const hashtags = hashtagsSection
    .split('\n')
    .map(line => sanitizePreviewText(line))
    .filter(Boolean)
    .filter(line => !/^HASHTAGS$/i.test(line))
    .join(' ');

  return {
    arteLines,
    legendaLines,
    hashtags,
  };
}

type LayoutSignals = {
  textAlign: 'left' | 'center';
  useFrame: boolean;
  dense: boolean;
  logoPlacement: 'footer' | 'top';
};

function inferStylePresetFromBrand(brand: BrandData): StylePreset {
  const explicitModel = brand.visualDirection.compositionModel.toLowerCase();
  if (explicitModel.includes('centralizado')) return 'spotlight';
  if (explicitModel.includes('assimetrico') || explicitModel.includes('carrossel denso')) return 'kinetic';
  if (explicitModel.includes('blocos')) return 'bold';

  const styleText = `${brand.estiloVisual} ${brand.visualDirection.style} ${brand.visualDirection.gridLayout} ${brand.visualDirection.compositionRules} ${brand.visualDirection.socialReferenceNotes}`.toLowerCase();

  if (/(assimetr|dinamic|movimento|energia|ousad|vibrante|impact|campanha|forte contraste|scroll)/.test(styleText)) {
    return 'kinetic';
  }

  if (/(premium|sofistic|elegan|luxo|refinad|clean com impacto|brilho|destaque)/.test(styleText)) {
    return 'spotlight';
  }

  return 'bold';
}

function deriveLayoutSignals(brand: BrandData): LayoutSignals {
  const source = `${brand.visualDirection.compositionRules} ${brand.visualDirection.recurringElements} ${brand.visualDirection.socialReferenceNotes} ${brand.visualDirection.avoidances}`.toLowerCase();
  const alignment = brand.visualDirection.textAlignment.toLowerCase();
  const densityValue = brand.visualDirection.density.toLowerCase();
  const logoPlacementValue = brand.visualDirection.logoPlacement.toLowerCase();
  const frameStyleValue = brand.visualDirection.frameStyle.toLowerCase();
  const asksForStructure = /(estrutura visual|mesma estrutura|mesmo padrao|feed atual|identidade consistente|padrao recorrente)/.test(source);
  const asksForBreathingRoom = /(margens|respiro|respiros|espacamento|distribuicao equilibrada|equilibrada|organizacao clara|hierarquia visual clara)/.test(source);
  const asksForHighlightBlocks = /(blocos de destaque|blocos|areas de destaque|caixas|tarjas|selos|cards)/.test(source);
  const asksForMoreGraphicLayers = /(elementos graficos|camadas|sobreposicoes|textura|texturas|mais preenchid|rico visualmente)/.test(source);

  return {
    textAlign: alignment.includes('central') || /(centraliz|centro|titulo central|texto central)/.test(source) ? 'center' : 'left',
    useFrame: !frameStyleValue.includes('sem moldura') && (frameStyleValue.includes('moldura') || frameStyleValue.includes('box') || !/(sem moldura|full bleed|sem borda|sem frame)/.test(source) && (/(moldura|borda|frame|contorno|tarja|box)/.test(source) || asksForStructure || asksForBreathingRoom)),
    dense: densityValue.includes('alta') || /(muito elemento|mais elemento|camada|sobreposi|denso|rico|preenchido|textura)/.test(source) || asksForHighlightBlocks || asksForMoreGraphicLayers,
    logoPlacement: logoPlacementValue.includes('topo') || /(logo no topo|assinatura no topo|marca no topo)/.test(source) ? 'top' : 'footer',
  };
}

function trimToMaxChars(value: string, max = 180) {
  const sanitized = sanitizePreviewText(value);
  if (sanitized.length <= max) return sanitized;

  const trimmed = sanitized.slice(0, max - 3).replace(/\s+\S*$/, '').trim();
  return `${trimmed || sanitized.slice(0, max - 3).trim()}...`;
}

function splitCopyIntoChunks(value: string) {
  return value
    .split(/\n+/)
    .flatMap(line => line.split(/(?<=[.!?])\s+/))
    .map(item => sanitizePreviewText(item))
    .filter(Boolean);
}

function dedupeStrings(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function normalizePostType(tipo: string) {
  const normalized = (tipo || '').toLowerCase();
  if (normalized.includes('reels')) return 'capa_reels';
  if (normalized.includes('story')) return 'story';
  if (normalized.includes('post')) return 'post_unico';
  return 'carrossel';
}

function selectDesignerTemplate(copyText: string, tipo: string) {
  const source = `${copyText} ${tipo}`.toLowerCase();
  if (/(piramide|pirâmide|ferramentas de ia|ecossistema de ia|mapa de ferramentas)/.test(source)) {
    return 'post_piramide_ia';
  }
  if (/(passo|passos|etapa|etapas|checklist|lista|guia|como fazer|1\.|2\.|3\.)/.test(source)) {
    return 'carousel_lista';
  }
  if (/(eu|minha|meu|nossa historia|quando|antes|depois|aprendi|jornada|bastidor)/.test(source)) {
    return 'carousel_storytelling';
  }
  if (/(acho|acredito|opiniao|na minha visao|verdade|mito|erro|posicionamento)/.test(source)) {
    return 'carousel_autoridade';
  }
  return 'carousel_educativo';
}

function chooseTemplateFromObservation(obs: string | undefined, fallback: string) {
  const source = (obs || '').toLowerCase();
  if (!source) return fallback;
  const explicit = source.match(/template\s+([a-z_]+)/)?.[1];
  if (explicit && /^(carousel_(educativo|autoridade|lista|storytelling)|post_piramide_ia)$/.test(explicit)) return explicit;
  if (/(piramide|pirâmide|infografico|infográfico|ecossistema de ia)/.test(source)) return 'post_piramide_ia';
  if (/(story|storytelling|narrativ)/.test(source)) return 'carousel_storytelling';
  if (/(lista|checklist|passo|passos|top\s*\d|bullet)/.test(source)) return 'carousel_lista';
  if (/(autoridade|opiniao|posicionamento|premium|sofistic)/.test(source)) return 'carousel_autoridade';
  if (/(educativo|didatico|explica|explicativo)/.test(source)) return 'carousel_educativo';
  return fallback;
}

function chooseStylePresetFromObservation(obs: string | undefined, fallback: StylePreset) {
  const source = (obs || '').toLowerCase();
  if (!source) return fallback;
  const explicit = source.match(/estilo\s+([a-z_]+)/)?.[1];
  if (explicit === 'bold' || explicit === 'spotlight' || explicit === 'kinetic') return explicit;
  if (/(elegant|elegante|sofistic|premium|refinad|luxo|minimal chic)/.test(source)) return 'spotlight';
  if (/(dinamic|dinamico|ousad|energia|movimento|impact|vibrante)/.test(source)) return 'kinetic';
  if (/(forte|editorial|bloco|estrutura|grade|grid)/.test(source)) return 'bold';
  return fallback;
}

function chooseAlignmentFromObservation(obs: string | undefined, fallback: DesignAlignment) {
  const source = (obs || '').toLowerCase();
  if (!source) return fallback;
  const explicit = source.match(/alinhamento\s+([a-z_]+)/)?.[1];
  if (explicit === 'center' || explicit === 'central') return 'center';
  if (explicit === 'left' || explicit === 'esquerda') return 'left';
  if (/(central|center|centro)/.test(source)) return 'center';
  if (/(esquerda|left|alinhado a esquerda)/.test(source)) return 'left';
  return fallback;
}

function chooseLayoutVariant(template: string, stylePreset: StylePreset, versao: number, obs?: string): LayoutVariant {
  const source = (obs || '').toLowerCase();
  const explicit = source.match(/layout\s+([a-z_]+)/)?.[1];
  if (explicit === 'editorial' || explicit === 'split' || explicit === 'spotlight' || explicit === 'stacked') {
    return explicit;
  }

  if (/editorial/.test(source)) return 'editorial';
  if (/(split|duas colunas|coluna lateral)/.test(source)) return 'split';
  if (/(stack|empilhado|faixa inferior|bloco inferior)/.test(source)) return 'stacked';
  if (/(spotlight|hero|premium|elegante|centralizado)/.test(source)) return 'spotlight';

  const variantsByTemplate: Record<string, LayoutVariant[]> = {
    carousel_educativo: ['editorial', 'split', 'stacked', 'spotlight'],
    carousel_autoridade: ['spotlight', 'editorial', 'split', 'stacked'],
    carousel_lista: ['split', 'editorial', 'stacked', 'spotlight'],
    carousel_storytelling: ['stacked', 'editorial', 'spotlight', 'split'],
    post_piramide_ia: ['editorial', 'spotlight', 'split', 'stacked'],
  };

  const variants = variantsByTemplate[template] || ['editorial', 'split', 'spotlight', 'stacked'];
  const styleOffset = stylePreset === 'kinetic' ? 1 : stylePreset === 'spotlight' ? 2 : 0;
  return variants[(versao + styleOffset) % variants.length];
}

function parseReferenceDesignInput(obs?: string) {
  const source = obs || '';
  const imageMatch = source.match(/imagem_referencia\s+(\S+)/i);
  const noteMatch = source.match(/referencia_visual\s+([\s\S]+)/i);

  return {
    imageUrl: imageMatch?.[1],
    notes: noteMatch?.[1]?.trim(),
  };
}

function resolveSlideCount(postType: string, availableBlocks: number) {
  if (postType === 'post_unico' || postType === 'capa_reels' || postType === 'story') {
    return 1;
  }

  return Math.max(2, Math.min(5, availableBlocks));
}

function extractApprovedCopyBlocks(copyText?: string) {
  const { arteLines, legendaLines } = extractCopySections(copyText);
  const explicitSlides = arteLines
    .map(line => {
      const match = line.match(/^(?:pagina|página|slide)\s*(\d+)[:\s-]+(.+)$/i);
      if (!match) return null;
      return { index: Number(match[1]), text: trimToMaxChars(match[2]) };
    })
    .filter((value): value is { index: number; text: string } => Boolean(value))
    .sort((a, b) => a.index - b.index)
    .map(item => item.text);

  if (explicitSlides.length > 0) {
    return explicitSlides;
  }

  const candidateBlocks = dedupeStrings([
    ...arteLines.map(line => trimToMaxChars(line)),
    ...legendaLines.flatMap(splitCopyIntoChunks).map(line => trimToMaxChars(line)),
  ]).filter(Boolean);

  return candidateBlocks;
}

function extractApprovedCopyBlocksFromPayload(copyPayload?: CopyOutput) {
  if (!copyPayload?.slides?.length) return [];
  return copyPayload.slides
    .map(slide => trimToMaxChars(slide.text))
    .filter(Boolean);
}

function selectCtaFromBlocks(blocks: string[]) {
  return [...blocks].reverse().find(block => /(\b(salve|envie|arrasta|clique|acesse|fale|comente|descubra|veja|comece|quero)\b|→)/i.test(block));
}

function splitTitleAndSubtitle(text: string) {
  const sanitized = trimToMaxChars(text);
  if (sanitized.length <= 72) {
    return { title: sanitized, subtitle: undefined };
  }

  const separators = ['. ', ': ', ' - ', ' | ', '? '];
  for (const separator of separators) {
    const index = sanitized.indexOf(separator);
    if (index > 24 && index < 90) {
      return {
        title: sanitized.slice(0, index + (separator.endsWith(' ') ? separator.length - 1 : separator.length)).trim(),
        subtitle: trimToMaxChars(sanitized.slice(index + separator.length).trim(), 100) || undefined,
      };
    }
  }

  const words = sanitized.split(' ');
  const midpoint = Math.max(4, Math.ceil(words.length / 2));
  return {
    title: trimToMaxChars(words.slice(0, midpoint).join(' '), 90),
    subtitle: trimToMaxChars(words.slice(midpoint).join(' '), 100) || undefined,
  };
}

function buildSlidesFromCopy(copyText: string | undefined, tipo: string, copyPayload?: CopyOutput) {
  const postType = normalizePostType(tipo);
  const blocks = extractApprovedCopyBlocksFromPayload(copyPayload).length > 0
    ? extractApprovedCopyBlocksFromPayload(copyPayload)
    : extractApprovedCopyBlocks(copyText);

  if (blocks.length === 0) {
    return {
      postType,
      slideTexts: ['Conteudo aprovado aguardando detalhamento final.'],
    };
  }

  if (postType !== 'carrossel') {
    return {
      postType,
      slideTexts: [trimToMaxChars(blocks[0])],
    };
  }

  const headline = trimToMaxChars(blocks[0]);
  const cta = trimToMaxChars(selectCtaFromBlocks(blocks) || blocks[blocks.length - 1]);
  const middlePool = blocks.slice(1).filter(block => block !== cta);
  const slideCount = resolveSlideCount(postType, blocks.length);
  const middleCount = Math.max(0, slideCount - 2);
  const middleSlides = middlePool.slice(0, middleCount).map(block => trimToMaxChars(block));
  const slideTexts = dedupeStrings([headline, ...middleSlides, cta]).slice(0, 5);

  if (slideTexts.length === 1 && blocks[1]) {
    slideTexts.push(trimToMaxChars(blocks[1]));
  }

  return {
    postType,
    slideTexts,
  };
}

function buildSlideElements(index: number, total: number) {
  const elements: DesignElement[] = [];
  if (index === total - 1) elements.push('logo');
  if (index !== total - 1) elements.push('divider');
  if (index === total - 1) elements.push('cta_button');
  return elements.slice(0, 3);
}

function buildSlideBackground(index: number, total: number): DesignBackground {
  if (index === 0) return 'gradient';
  if (index === total - 1) return 'primary';
  return index % 2 === 0 ? 'primary' : 'secondary';
}

function buildDesignerOutput(params: {
  brand: BrandData;
  tipo: string;
  versao?: number;
  obs?: string;
  copyText?: string;
  copyPayload?: CopyOutput;
}) {
  const { brand, tipo, copyText, copyPayload, obs, versao = 0 } = params;
  const colors = buildPaletteColors(brand.visualDirection.palette);
  const baseTemplate = selectDesignerTemplate(copyText || '', tipo);
  const template = chooseTemplateFromObservation(obs, baseTemplate);
  const baseStylePreset = inferStylePresetFromBrand(brand);
  const stylePreset = chooseStylePresetFromObservation(obs, baseStylePreset);
  const layoutVariant = chooseLayoutVariant(template, stylePreset, versao, obs);
  const layoutSignals = deriveLayoutSignals(brand);
  const referenceInput = parseReferenceDesignInput(obs);
  const fontMatchTitle = brand.visualDirection.typography.match(/Titulos:\s*([^|]+)/i);
  const fontMatchBody = brand.visualDirection.typography.match(/Corpo:\s*([^|]+)/i);
  const titleFont = sanitizePreviewText(fontMatchTitle?.[1] || 'Sora');
  const bodyFont = sanitizePreviewText(fontMatchBody?.[1] || 'Inter');
  const { postType, slideTexts } = buildSlidesFromCopy(copyText, tipo, copyPayload);
  const width = 1080;
  const height = postType === 'capa_reels' || postType === 'story' ? 1920 : 1350;
  const resolvedAlignment = chooseAlignmentFromObservation(obs, layoutSignals.textAlign);
  const alignment: DesignAlignment = versao % 2 === 1 && !obs ? (resolvedAlignment === 'left' ? 'center' : 'left') : resolvedAlignment;

  const slides = slideTexts.map((text, index) => {
    const parts = splitTitleAndSubtitle(text);
    return {
      width,
      height,
      background: versao % 3 === 1
        ? (index === 0 ? 'primary' : index === slideTexts.length - 1 ? 'gradient' : buildSlideBackground(index + 1, slideTexts.length + 1))
        : versao % 3 === 2
          ? (index % 2 === 0 ? 'gradient' : 'secondary')
          : buildSlideBackground(index, slideTexts.length),
      title: parts.title,
      subtitle: parts.subtitle,
      alignment: index === 0 && template === 'carousel_storytelling' ? 'left' : alignment,
      elements: buildSlideElements(index, slideTexts.length),
    } satisfies DesignSlide;
  });

  const theme = {
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent,
    neutral: colors.neutral,
    titleFont,
    bodyFont,
  };
  const referenceTemplate = referenceInput.imageUrl
    ? buildReferenceTemplateFromSiteImage({
        imageUrl: referenceInput.imageUrl,
        siteName: brand.nomeMarca,
        headline: slideTexts[0],
        subheadline: referenceInput.notes || slideTexts[1] || `${brand.nomeMarca} como referência visual`,
        sections: slideTexts.slice(1, 4).map((text, index) => ({
          title: index === 0 ? 'Leitura visual principal' : `Bloco ${index + 2}`,
          body: text,
        })),
      })
    : undefined;
  const htmlTemplates = buildHtmlTemplates({
    brandName: brand.nomeMarca,
    slides,
    template,
    stylePreset,
    layoutVariant,
    theme,
    referenceTemplate,
  });

  return {
    template,
    style_preset: stylePreset,
    layout_variant: layoutVariant,
    reference_mode: Boolean(referenceTemplate),
    reference_image_url: referenceInput.imageUrl,
    reference_template_name: referenceTemplate?.name,
    theme,
    slides_json: slides,
    html_templates: htmlTemplates,
    export: slides.map((_, index) => `slide_${String(index + 1).padStart(2, '0')}.png`),
  } satisfies DesignerOutput;
}

function buildPreviewCard(params: {
  brand: BrandData;
  title: string;
  subtitle: string;
  body?: string;
  kicker: string;
  footer: string;
  variant: 'cover' | 'content' | 'cta';
  stylePreset: StylePreset;
}) {
  const { brand, title, subtitle, body, kicker, footer, variant, stylePreset } = params;
  const colors = buildPaletteColors(brand.visualDirection.palette);
  const layoutSignals = deriveLayoutSignals(brand);
  const textX = layoutSignals.textAlign === 'center' ? 540 : 98;
  const textAnchor = layoutSignals.textAlign === 'center' ? 'middle' : 'start';
  const titleSize = variant === 'cover' ? 108 : variant === 'cta' ? 78 : 68;
  const subtitleSize = variant === 'cover' ? 30 : 24;
  const bodySize = 22;
  const titleLines = wrapSvgText(title, variant === 'cover' ? 13 : 16, variant === 'cta' ? 3 : 4);
  const subtitleLines = wrapSvgText(subtitle, variant === 'cover' ? 28 : 34, 3);
  const bodyLines = body ? wrapSvgText(body, 34, variant === 'content' ? 5 : 3) : [];
  const titleBlock = renderSvgTextBlock({
    x: textX,
    y: variant === 'cover' ? 320 : variant === 'content' ? 270 : 330,
    lines: titleLines,
    fontSize: titleSize,
    lineHeight: Math.round(titleSize * 0.92),
    fill: '#F8FAFC',
    fontFamily: 'Sora, Inter, Arial, sans-serif',
    fontWeight: 800,
    anchor: textAnchor,
  });
  const subtitleBlock = renderSvgTextBlock({
    x: layoutSignals.textAlign === 'center' ? 540 : 104,
    y: variant === 'cover' ? 760 : variant === 'content' ? 760 : 720,
    lines: subtitleLines,
    fontSize: subtitleSize,
    lineHeight: Math.round(subtitleSize * 1.35),
    fill: 'rgba(248,250,252,0.92)',
    fontFamily: 'Inter, Arial, sans-serif',
    fontWeight: 700,
    anchor: textAnchor,
  });
  const bodyBlock = bodyLines.length > 0
    ? renderSvgTextBlock({
        x: layoutSignals.textAlign === 'center' ? 540 : 104,
        y: variant === 'content' ? 920 : 900,
        lines: bodyLines,
        fontSize: bodySize,
        lineHeight: Math.round(bodySize * 1.45),
        fill: 'rgba(248,250,252,0.84)',
        fontFamily: 'Inter, Arial, sans-serif',
        fontWeight: 400,
        anchor: textAnchor,
      })
    : '';
  const anchorAttr = `text-anchor="${textAnchor}"`;
  const logoY = layoutSignals.logoPlacement === 'top' ? 200 : 1268;
  const footerY = layoutSignals.logoPlacement === 'top' ? 232 : 1304;
  const brandStamp = `<text x="${layoutSignals.logoPlacement === 'top' ? 980 : textX}" y="${logoY}" fill="rgba(248,250,252,0.95)" font-size="24" font-family="Inter, Arial, sans-serif" font-weight="800" letter-spacing="1" ${layoutSignals.logoPlacement === 'top' ? 'text-anchor="end"' : anchorAttr}>${escapeSvg(brand.nomeMarca.toUpperCase())}</text>`;
  const footerText = `<text x="${layoutSignals.logoPlacement === 'top' ? 980 : textX}" y="${footerY}" fill="rgba(248,250,252,0.66)" font-size="18" font-family="Inter, Arial, sans-serif" font-weight="500" ${layoutSignals.logoPlacement === 'top' ? 'text-anchor="end"' : anchorAttr}>${escapeSvg(footer)}</text>`;
  const kickerChip = `<rect x="98" y="94" width="190" height="46" rx="23" fill="rgba(255,255,255,0.16)"/><text x="128" y="123" fill="white" font-size="22" font-family="Inter, Arial, sans-serif" font-weight="800" letter-spacing="2">${escapeSvg(kicker.toUpperCase())}</text>`;
  const frame = layoutSignals.useFrame ? `<rect x="58" y="58" width="964" height="1234" rx="46" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="3"/>` : '';
  const extraDensity = layoutSignals.dense ? `<circle cx="860" cy="300" r="120" fill="rgba(255,255,255,0.08)"/><circle cx="220" cy="1010" r="90" fill="rgba(255,255,255,0.08)"/><rect x="760" y="520" width="140" height="140" rx="28" fill="rgba(255,255,255,0.08)" transform="rotate(12 760 520)"/>` : '';

  const styleLayouts: Record<StylePreset, Record<'cover' | 'content' | 'cta', string>> = {
    bold: {
      cover: `
        <rect width="1080" height="1350" fill="${colors.primary}"/>
        <rect x="-80" y="-30" width="560" height="560" rx="120" fill="${colors.secondary}" transform="rotate(-14 0 0)"/>
        <rect x="620" y="720" width="520" height="520" rx="96" fill="${colors.accent}" transform="rotate(16 620 720)"/>
        <rect x="760" y="120" width="220" height="220" rx="44" fill="rgba(255,255,255,0.12)" transform="rotate(10 760 120)"/>
        ${frame}
        ${extraDensity}
        ${kickerChip}
        ${titleBlock}
        ${subtitleBlock}
        ${bodyBlock}
        <rect x="98" y="1120" width="420" height="84" rx="42" fill="${colors.accent}"/>
        <text x="150" y="1173" fill="${colors.primary}" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="800">Visual de campanha real</text>
        ${brandStamp}
        ${footerText}
      `,
      content: `
        <rect width="1080" height="1350" fill="${colors.secondary}"/>
        <polygon points="0,0 1080,0 780,560 0,720" fill="${colors.primary}"/>
        <rect x="740" y="180" width="240" height="240" rx="48" fill="${colors.accent}" transform="rotate(8 740 180)"/>
        <circle cx="850" cy="930" r="170" fill="rgba(255,255,255,0.13)"/>
        ${frame}
        ${extraDensity}
        ${kickerChip}
        ${titleBlock}
        ${subtitleBlock}
        ${bodyBlock}
        <rect x="98" y="1110" width="360" height="18" rx="9" fill="${colors.accent}"/>
        ${brandStamp}
        ${footerText}
      `,
      cta: `
        <rect width="1080" height="1350" fill="${colors.primary}"/>
        <circle cx="980" cy="180" r="230" fill="${colors.accent}" opacity="0.88"/>
        <circle cx="120" cy="1210" r="280" fill="${colors.secondary}" opacity="0.7"/>
        <rect x="760" y="420" width="180" height="180" rx="40" fill="rgba(255,255,255,0.12)" transform="rotate(12 760 420)"/>
        ${frame}
        ${extraDensity}
        ${kickerChip}
        ${titleBlock}
        ${subtitleBlock}
        ${bodyBlock}
        <rect x="98" y="1088" width="500" height="98" rx="49" fill="white"/>
        <text x="164" y="1149" fill="${colors.primary}" font-size="34" font-family="Inter, Arial, sans-serif" font-weight="800">Quero uma arte assim</text>
        ${brandStamp}
        ${footerText}
      `,
    },
    spotlight: {
      cover: `
        <rect width="1080" height="1350" fill="${colors.secondary}"/>
        <rect x="0" y="0" width="1080" height="1350" fill="url(#bg)" opacity="0.82"/>
        <circle cx="180" cy="200" r="210" fill="${colors.accent}" opacity="0.9"/>
        <circle cx="900" cy="1040" r="300" fill="${colors.primary}" opacity="0.36"/>
        <polygon points="660,80 1040,120 920,420" fill="rgba(255,255,255,0.16)"/>
        ${frame}
        ${extraDensity}
        ${kickerChip}
        ${titleBlock}
        ${subtitleBlock}
        ${bodyBlock}
        <rect x="98" y="1094" width="400" height="18" rx="9" fill="white"/>
        ${brandStamp}
        ${footerText}
      `,
      content: `
        <rect width="1080" height="1350" fill="${colors.primary}"/>
        <rect x="-60" y="780" width="620" height="520" rx="120" fill="${colors.accent}" transform="rotate(-12 0 780)"/>
        <rect x="690" y="120" width="280" height="280" rx="60" fill="${colors.secondary}" transform="rotate(10 690 120)"/>
        <rect x="770" y="460" width="140" height="140" rx="30" fill="rgba(255,255,255,0.18)"/>
        ${frame}
        ${extraDensity}
        ${kickerChip}
        ${titleBlock}
        ${subtitleBlock}
        ${bodyBlock}
        ${brandStamp}
        ${footerText}
      `,
      cta: `
        <rect width="1080" height="1350" fill="${colors.accent}"/>
        <rect x="0" y="0" width="1080" height="1350" fill="${colors.primary}" opacity="0.82"/>
        <circle cx="960" cy="220" r="250" fill="${colors.secondary}" opacity="0.82"/>
        <polygon points="0,990 420,860 640,1350 0,1350" fill="rgba(255,255,255,0.14)"/>
        ${frame}
        ${extraDensity}
        ${kickerChip}
        ${titleBlock}
        ${subtitleBlock}
        ${bodyBlock}
        <rect x="98" y="1088" width="470" height="98" rx="49" fill="${colors.accent}"/>
        <text x="164" y="1149" fill="${colors.primary}" font-size="34" font-family="Inter, Arial, sans-serif" font-weight="800">Parar o scroll agora</text>
        ${brandStamp}
        ${footerText}
      `,
    },
    kinetic: {
      cover: `
        <rect width="1080" height="1350" fill="${colors.primary}"/>
        <polygon points="0,0 1080,0 820,340 0,620" fill="${colors.secondary}"/>
        <polygon points="1080,1350 260,1350 520,860 1080,640" fill="${colors.accent}" opacity="0.96"/>
        <rect x="760" y="180" width="160" height="160" rx="28" fill="rgba(255,255,255,0.18)" transform="rotate(14 760 180)"/>
        ${frame}
        ${extraDensity}
        ${kickerChip}
        ${titleBlock}
        ${subtitleBlock}
        ${bodyBlock}
        ${brandStamp}
        ${footerText}
      `,
      content: `
        <rect width="1080" height="1350" fill="${colors.secondary}"/>
        <polygon points="0,0 1080,0 1080,300 220,460 0,340" fill="${colors.primary}"/>
        <polygon points="1080,1350 520,1350 760,920 1080,820" fill="${colors.accent}" opacity="0.94"/>
        <rect x="740" y="210" width="220" height="220" rx="34" fill="rgba(255,255,255,0.16)" transform="rotate(9 740 210)"/>
        ${frame}
        ${extraDensity}
        ${kickerChip}
        ${titleBlock}
        ${subtitleBlock}
        ${bodyBlock}
        ${brandStamp}
        ${footerText}
      `,
      cta: `
        <rect width="1080" height="1350" fill="${colors.primary}"/>
        <polygon points="0,0 1080,0 760,430 0,720" fill="${colors.secondary}"/>
        <polygon points="1080,1350 380,1350 640,930 1080,760" fill="${colors.accent}" opacity="0.95"/>
        <circle cx="180" cy="1100" r="180" fill="rgba(255,255,255,0.12)"/>
        ${frame}
        ${extraDensity}
        ${kickerChip}
        ${titleBlock}
        ${subtitleBlock}
        ${bodyBlock}
        <rect x="98" y="1090" width="490" height="98" rx="49" fill="white"/>
        <text x="154" y="1151" fill="${colors.primary}" font-size="34" font-family="Inter, Arial, sans-serif" font-weight="800">Mais impacto visual</text>
        ${brandStamp}
        ${footerText}
      `,
    },
  };

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${colors.primary}"/>
          <stop offset="100%" stop-color="${colors.secondary}"/>
        </linearGradient>
      </defs>
      ${styleLayouts[stylePreset][variant]}
    </svg>
  `;

  return encodeSvgDataUrl(svg);
}

// Legacy SVG preview helper kept temporarily for fallback experiments.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildDesignPreviews(params: {
  brand: BrandData;
  tema: string;
  titulo: string;
  subtitulo: string;
  copyText?: string;
  versao: number;
}) {
  const { brand, tema, titulo, subtitulo, copyText } = params;
  const { arteLines, legendaLines } = extractCopySections(copyText);
  const stylePreset = inferStylePresetFromBrand(brand);
  const cleanTema = sanitizePreviewText(tema, 'Conteudo de marca');
  const cleanTitle = sanitizePreviewText(arteLines[0] || titulo, cleanTema);
  const cleanSubtitle = sanitizePreviewText(arteLines[1] || subtitulo, 'Mensagem principal da copy aprovada');
  const contentTitle = sanitizePreviewText(arteLines[2] || cleanTema, cleanTema);
  const contentSnippet = sanitizePreviewText(legendaLines[0] || cleanSubtitle, cleanSubtitle);
  const contentBody = sanitizePreviewText(legendaLines.slice(1, 4).join(' '), cleanSubtitle);
  const ctaSnippet = sanitizePreviewText(
    legendaLines.find(line => /salve|envie|arrasta|comenta|fale|clique|proximo passo/i.test(line)) || arteLines[arteLines.length - 1],
    'Seu proximo passo comeca com uma mensagem clara.'
  );

  return [
    buildPreviewCard({
      brand,
      title: cleanTitle,
      subtitle: cleanSubtitle,
      body: sanitizePreviewText(arteLines.slice(2, 4).join(' ')),
      kicker: 'Capa',
      footer: `${brand.segmento || 'Marketing'} • identidade aplicada • ${stylePreset}`,
      variant: 'cover',
      stylePreset,
    }),
    buildPreviewCard({
      brand,
      title: contentTitle,
      subtitle: contentSnippet,
      body: contentBody,
      kicker: 'Conteudo',
      footer: `Copy aprovada transformada em hierarquia visual • ${stylePreset}`,
      variant: 'content',
      stylePreset,
    }),
    buildPreviewCard({
      brand,
      title: 'Seu proximo passo',
      subtitle: ctaSnippet,
      body: sanitizePreviewText(`${brand.visualDirection.style}. ${brand.visualDirection.gridLayout}`),
      kicker: 'CTA',
      footer: `${brand.nomeMarca} • direcao visual atualizada • ${stylePreset}`,
      variant: 'cta',
      stylePreset,
    }),
  ];
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Marketing HQ API is running' });
});

app.get('/api/businesses', async (req, res) => {
  try {
    const businesses = await getPrisma().business.findMany({
      include: {
        brand_profiles: {
          where: { is_active: true },
          take: 1
        }
      }
    });
    res.json(businesses);
  } catch (error) {
    sendApiError(res, 500, 'Erro ao buscar negócios', error);
  }
});

app.post('/api/businesses', async (req, res) => {
  try {
    const data = req.body;
    const business = await getPrisma().business.create({
      data: {
        nome_marca: data.nome_marca,
        nome_interno: data.nome_interno,
        segmento: data.segmento,
        descricao: data.descricao,
        site_url: data.site_url,
        idioma_principal: data.idioma_principal,
        publico_alvo: data.publico_alvo,
        objetivo_marketing: data.objetivo_marketing,
        redes_sociais: data.redes_sociais || {}
      }
    });
    res.json(business);
  } catch (error) {
    sendApiError(res, 500, 'Erro ao criar negócio', error);
  }
});

app.put('/api/businesses/:id', async (req, res) => {
  try {
    const data = req.body;
    const business = await getPrisma().business.update({
      where: { id: req.params.id },
      data: {
        nome_marca: data.nome_marca,
        nome_interno: data.nome_interno,
        segmento: data.segmento
      }
    });
    res.json(business);
  } catch (error) {
    sendApiError(res, 500, 'Erro ao atualizar negócio', error);
  }
});

app.delete('/api/businesses/:id', async (req, res) => {
  try {
    await getPrisma().business.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    sendApiError(res, 500, 'Erro ao excluir negócio', error);
  }
});

app.post('/api/brand-profiles', async (req, res) => {
  try {
    const data = req.body;
    await getPrisma().brandProfile.updateMany({
      where: { business_id: data.business_id },
      data: { is_active: false }
    });

    const profile = await getPrisma().brandProfile.create({
      data: {
        business_id: data.business_id,
        is_active: true,
        tom_de_voz: data.tom_de_voz,
        estilo_comunicacao: data.estilo_comunicacao,
        palavras_usadas: data.palavras_usadas || [],
        palavras_evitar: data.palavras_evitar || [],
        publico_alvo: data.publico_alvo,
        proposta_valor: data.proposta_valor,
        diferenciais: data.diferenciais || [],
        estilo_visual: data.estilo_visual,
        tipos_conteudo: data.tipos_conteudo || [],
        exemplos_abordagem: data.exemplos_abordagem || []
      }
    });

    if (data.site_url !== undefined || data.redes_sociais !== undefined) {
      const businessUpdate: Prisma.BusinessUpdateInput = {};
      if (data.site_url !== undefined) businessUpdate.site_url = data.site_url;
      if (data.redes_sociais !== undefined) businessUpdate.redes_sociais = data.redes_sociais;
      await getPrisma().business.update({
        where: { id: data.business_id },
        data: businessUpdate
      });
    }

    res.json(profile);
  } catch (error) {
    sendApiError(res, 500, 'Erro ao salvar Brand Profile', error);
  }
});

app.get('/api/campaigns', async (req, res) => {
  try {
    const businessId = req.query.business_id as string;
    const where = businessId ? { business_id: businessId } : {};
    const campaigns = await getPrisma().campaign.findMany({
      where,
      include: { _count: { select: { contents: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(campaigns);
  } catch (error) {
    sendApiError(res, 500, 'Erro ao buscar campanhas', error);
  }
});

app.post('/api/campaigns', async (req, res) => {
  try {
    const data = req.body;
    const campaign = await getPrisma().campaign.create({
      data: {
        business_id: data.business_id,
        nome: data.nome,
        objetivo: data.objetivo,
        descricao: data.descricao,
        publico_alvo: data.publico_alvo,
        mensagem_central: data.mensagem_central,
        cta_principal: data.cta_principal,
        canais: data.canais || [],
        data_inicio: data.data_inicio ? new Date(data.data_inicio) : null,
        data_fim: data.data_fim ? new Date(data.data_fim) : null,
        tipo_midia: data.tipo_midia || 'ORGANICO',
        status: data.status || 'RASCUNHO'
      }
    });
    res.json(campaign);
  } catch (error) {
    sendApiError(res, 500, 'Erro ao criar campanha', error);
  }
});

app.get('/api/contents', async (req, res) => {
  try {
    const campaignId = req.query.campaign_id as string;
    const where = campaignId ? { campaign_id: campaignId } : {};
    const contents = await getPrisma().content.findMany({
      where,
      include: { campaign: { select: { nome: true } } },
      orderBy: { data: 'asc' }
    });
    res.json(contents);
  } catch (error) {
    sendApiError(res, 500, 'Erro ao buscar conteúdos', error);
  }
});

app.post('/api/contents', async (req, res) => {
  try {
    const data = req.body;
    const content = await getPrisma().content.create({
      data: {
        campaign_id: data.campaign_id,
        data: data.data ? new Date(data.data) : null,
        tipo_conteudo: data.tipo_conteudo,
        tema: data.tema,
        objetivo_post: data.objetivo_post,
        status: 'PENDENTE'
      }
    });
    res.json(content);
  } catch (error) {
    sendApiError(res, 500, 'Erro ao criar conteúdo', error);
  }
});

app.patch('/api/contents/:id', async (req, res) => {
  try {
    const content = await getPrisma().content.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(content);
  } catch (error) {
    sendApiError(res, 500, 'Erro ao atualizar conteúdo', error);
  }
});

function gerarPesquisa(tema: string, objetivo: string, versao: number) {
  const blocos = [
    `O tema "${tema}" está em alta nas redes sociais. Análise de tendências mostra crescimento de 45% em buscas relacionadas nos últimos 3 meses.\n\nContexto: ${objetivo || 'Engajamento e alcance orgânico'}\n\nPalavras-chave: ${tema.split(' ').slice(0, 3).join(', ')}, Estratégia Digital, Resultados.\n\n🔗 **Fontes de Inteligência Utilizadas:**\n1. [Google Trends - "${tema}"](https://trends.google.com/trends/explore?q=${encodeURIComponent(tema)})\n2. [Análise de Mercado - Semrush](https://semrush.com/analytics)\n3. Benchmark de Concorrentes (Base Interna)`,
    `Pesquisa aprofundada sobre "${tema}": Identificamos que o público-alvo responde melhor a conteúdos que combinam dados concretos com storytelling pessoal.\n\nObjetivo alinhado: ${objetivo || 'Gerar autoridade e conversões'}\n\nPalavras-chave: ${tema.split(' ').slice(0, 3).join(', ')}, Autoridade, Conversão.\n\n🔗 **Fontes de Inteligência Utilizadas:**\n1. [Content Marketing Institute - Report 2026](https://contentmarketinginstitute.com/report)\n2. [HubSpot State of Marketing](https://hubspot.com/state-of-marketing)\n3. Análise de Engajamento dos últimos 30 dias (Base Interna)`,
    `Mapeamento competitivo sobre "${tema}": Os 3 principais concorrentes estão abordando este assunto com foco em educação e prova social. Oportunidade de diferenciação usando tom mais direto e dados exclusivos.\n\nObjetivo: ${objetivo || 'Posicionamento de marca'}\n\nPalavras-chave: ${tema.split(' ').slice(0, 3).join(', ')}, Diferenciação, Prova Social.\n\n🔗 **Fontes de Inteligência Utilizadas:**\n1. [Panorama do Marketing Digital - RD Station](https://resultadosdigitais.com.br/panorama)\n2. [Relatório de Redes Sociais - mLabs](https://mlabs.com.br/relatorio)\n3. Monitoramento de Concorrentes (Base Interna)`
  ];
  return blocos[versao % blocos.length];
}

function normalizeCopySentence(value: string) {
  const removableTokens = ['•', '🔗', '📊', '📈', '👉', '✏️', '🏷️', '📝', '📋'];
  return removableTokens.reduce((acc, token) => acc.replaceAll(token, ''), value)
    .replace(/\[[^\]]+\]\([^)]+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCopyInputs(tema: string, objetivo: string, pesquisa?: string, obs?: string) {
  const linhas = (pesquisa || '')
    .split('\n')
    .map(line => normalizeCopySentence(line))
    .filter(Boolean);

  const metadados = /^(contexto|objetivo alinhado|objetivo|palavras-chave|fontes de inteligência utilizadas|\d+\.)/i;
  const insights = linhas.filter(line => !metadados.test(line));
  const dadoPrincipal = insights.find(line => /\d+%/.test(line)) || `O tema ${tema} apresenta crescimento expressivo em buscas e engajamento nas redes.`;
  const dadoComplementar = insights.find(line => line !== dadoPrincipal) || 'Oportunidade clara para transformar interesse em autoridade e ação.';
  const palavrasChaveMatch = pesquisa?.match(/Palavras-chave:\s*(.+)/i);
  const palavrasChave = palavrasChaveMatch
    ? palavrasChaveMatch[1].split(',').map(k => k.trim()).filter(Boolean).slice(0, 4)
    : [tema.split(' ')[0], 'Marketing', 'Resultados'];
  const objetivoNormalizado = normalizeCopySentence(objetivo || `Gerar valor prático sobre ${tema}.`);
  const observacaoNormalizada = normalizeCopySentence(obs || '');

  return {
    dadoPrincipal,
    dadoComplementar,
    palavrasChave,
    objetivoNormalizado,
    observacaoNormalizada,
  };
}

function buildHashtags(tema: string, palavrasChave: string[]) {
  const base = palavrasChave.map(k => `#${k.replace(/\s+/g, '')}`);
  return [...base, `#${tema.replace(/\s+/g, '')}`, '#MarketingDigital'].join(' ');
}

function buildCarouselArteItems(tema: string, versao: number, inputs: ReturnType<typeof extractCopyInputs>) {
  const { dadoPrincipal, dadoComplementar, objetivoNormalizado, observacaoNormalizada } = inputs;
  const ctaBase = objetivoNormalizado ? `Avance com: ${objetivoNormalizado}` : 'Seu próximo passo começa aqui';

  const pagesByVersion = [
    [
      `${tema}: o que os dados mostram agora`,
      dadoPrincipal,
      dadoComplementar,
      `O que isso muda na prática: ${objetivoNormalizado}`,
      `${ctaBase} →`,
    ],
    [
      `Antes de ignorar ${tema}, veja isso`,
      `Dado-chave: ${dadoPrincipal}`,
      `Leitura estratégica: ${dadoComplementar}`,
      observacaoNormalizada || `Direção sugerida: use ${tema.toLowerCase()} com clareza e consistência.`,
      `Quer transformar isso em ação? ${ctaBase} →`,
    ],
    [
      `${tema}: 4 sinais de que virou prioridade`,
      `Sinal 1: ${dadoPrincipal}`,
      `Sinal 2: ${dadoComplementar}`,
      `Sinal 3: ${objetivoNormalizado}`,
      `Sinal 4: hora de agir →`,
    ],
  ];

  return pagesByVersion[versao % pagesByVersion.length].map(text => trimToMaxChars(text, 140));
}

function buildLegendaParagraphs(tema: string, versao: number, inputs: ReturnType<typeof extractCopyInputs>) {
  const { dadoPrincipal, dadoComplementar, objetivoNormalizado, observacaoNormalizada } = inputs;

  const legendas = [
    [
      `Quando o assunto é ${tema.toLowerCase()}, os sinais estão cada vez mais claros.`,
      dadoPrincipal,
      `Além disso, ${dadoComplementar.charAt(0).toLowerCase()}${dadoComplementar.slice(1)}`,
      `Na prática, isso aponta para uma prioridade: ${objetivoNormalizado}`,
      'Salve este conteúdo e compartilhe com quem precisa tomar decisões melhores agora.',
    ],
    [
      `Muita gente ainda trata ${tema.toLowerCase()} como tendência. Os dados contam outra história.`,
      `📊 ${dadoPrincipal}`,
      `📈 ${dadoComplementar}`,
      observacaoNormalizada || `Se o objetivo é ${objetivoNormalizado.toLowerCase()}, este é o tipo de sinal que merece atenção.`,
      'Qual desses pontos mais conversa com a sua realidade hoje?',
    ],
    [
      `Se você quer usar ${tema.toLowerCase()} com mais critério, comece pela leitura correta do cenário.`,
      dadoPrincipal,
      dadoComplementar,
      `O movimento mais inteligente agora é conectar esse contexto com ${objetivoNormalizado.toLowerCase()}.`,
      'Arraste, salve e volte aqui quando for revisar sua estratégia.',
    ],
  ];

  return legendas[versao % legendas.length];
}

function inferCopySlideRole(index: number, total: number): CopySlideRole {
  if (index === 0) return 'hook';
  if (index === total - 1) return 'cta';
  if (index === 1) return 'proof';
  return 'insight';
}

function buildCopyOutput(tema: string, objetivo: string, versao: number, pesquisa?: string, obs?: string): CopyOutput {
  const inputs = extractCopyInputs(tema, objetivo, pesquisa, obs);
  const arteItems = buildCarouselArteItems(tema, versao, inputs);
  const caption = buildLegendaParagraphs(tema, versao, inputs);
  const hashtags = buildHashtags(tema, inputs.palavrasChave).split(' ').filter(Boolean);

  return {
    tema,
    post_type: 'carrossel',
    hook: arteItems[0] || trimToMaxChars(tema, 140),
    slides: arteItems.map((text, index) => ({
      index: index + 1,
      role: inferCopySlideRole(index, arteItems.length),
      text,
    })),
    caption,
    hashtags,
    strategic_objective: inputs.objetivoNormalizado || undefined,
    user_direction: inputs.observacaoNormalizada || undefined,
  };
}

function gerarCopy(tema: string, objetivo: string, versao: number, pesquisa?: string, obs?: string) {
  const output = buildCopyOutput(tema, objetivo, versao, pesquisa, obs);
  const arte = output.slides.map(slide => `Página ${slide.index}: "${slide.text}"`).join('\n');
  const legenda = output.caption.join('\n\n');
  const hashtags = output.hashtags.join(' ');
  const instrucaoUsuario = output.user_direction ? `\n\n💬 *Ajuste aplicado conforme orientação do usuário: "${output.user_direction}"*` : '';
  const blocoInterno = output.strategic_objective ? `\n\n---\n\n📋 **NOTA INTERNA (não publicar):**\nObjetivo estratégico: ${output.strategic_objective}` : '';

  return `✏️ **TEXTO DA ARTE:**\n${arte}\n\n---\n\n📝 **LEGENDA:**\n${legenda}\n\n---\n\n🏷️ **HASHTAGS:**\n${hashtags}${blocoInterno}${instrucaoUsuario}`;
}

async function fetchBrandData(contentId: string) {
  const content = await getPrisma().content.findUnique({
    where: { id: contentId },
    include: { campaign: { include: { business: { include: { brand_profiles: { where: { is_active: true } } } } } } }
  });
  const biz = content?.campaign?.business;
  const brand = biz?.brand_profiles?.[0];
  return {
    nomeMarca: biz?.nome_marca || 'Marca',
    site: biz?.site_url || '',
    redes: toSocialLinks(biz?.redes_sociais),
    segmento: biz?.segmento || '',
    estiloVisual: brand?.estilo_visual || '',
    tomDeVoz: brand?.tom_de_voz || '',
    visualDirection: parseVisualDirection(brand?.estilo_visual || ''),
  };
}

function gerarDesign(tema: string, tipo: string, versao: number, brand: BrandData, obs?: string, copyText?: string, copyPayload?: CopyOutput) {
  const payload = buildDesignerOutput({
    brand,
    tipo,
    versao,
    obs,
    copyText,
    copyPayload,
  });

  const notas = [
    `Tema: ${tema}`,
    `Versao: ${versao + 1}`,
    `Template selecionado: ${selectDesignerTemplate(copyText || '', tipo)}`,
    `Formato: ${normalizePostType(tipo)}`,
    obs ? `Ajuste aplicado: ${sanitizePreviewText(obs)}` : '',
  ].filter(Boolean);

  return {
    text: JSON.stringify(
      {
        ...payload,
        notes: notas,
      },
      null,
      2
    ),
    payload,
    images: [],
  };
}

app.post('/api/contents/:id/generate', async (req, res) => {
  try {
    const existing = await getPrisma().content.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Conteúdo não encontrado' });
    const pesquisa = gerarPesquisa(existing.tema || 'Tema', existing.objetivo_post || '', 0);
    const content = await getPrisma().content.update({
      where: { id: req.params.id },
      data: { status: 'EM_PRODUCAO', agente_atual: 'Pesquisador', resultados_agentes: { pesquisa, _retryCount: 0 } }
    });
    res.json({ message: 'Squad iniciado', content });
  } catch (error) {
    sendApiError(res, 500, 'Erro ao iniciar', error);
  }
});

app.post('/api/contents/:id/advance', async (req, res) => {
  try {
    const contentId = req.params.id;
    const { current_agent, observacao } = req.body;
    const current = await getPrisma().content.findUnique({ where: { id: contentId } });
    if (!current) return res.status(404).json({ error: 'Conteúdo não encontrado' });
    const antigos = toAgentResults(current.resultados_agentes);

    if (current_agent === 'Pesquisador') {
      const copyPayload = buildCopyOutput(current.tema || 'Tema', current.objetivo_post || '', 0, antigos.pesquisa, observacao);
      const mockCopy = gerarCopy(current.tema || 'Tema', current.objetivo_post || '', 0, antigos.pesquisa, observacao);
      const content = await getPrisma().content.update({
        where: { id: contentId },
        data: { agente_atual: 'Copywriter', texto_gerado: mockCopy, resultados_agentes: { ...antigos, copy: mockCopy, copy_payload: copyPayload, _retryCount: 0 } }
      });
      return res.json(content);
    }

    if (current_agent === 'Copywriter') {
      const brandData = await fetchBrandData(contentId);
      const designResult = gerarDesign(current.tema || 'Tema', current.tipo_conteudo || '', 0, brandData, observacao, current.texto_gerado || undefined, antigos.copy_payload);
      const content = await getPrisma().content.update({
        where: { id: contentId },
        data: { agente_atual: 'Designer', resultados_agentes: { ...antigos, design: designResult.text, design_payload: designResult.payload, design_images: designResult.images, _retryCount: 0 } }
      });
      return res.json(content);
    }

    if (current_agent === 'Designer') {
      const content = await getPrisma().content.update({
        where: { id: contentId },
        data: { status: 'REVISAO', agente_atual: 'Aguardando Aprovação' }
      });
      return res.json(content);
    }

    res.status(400).json({ error: 'Agente não reconhecido' });
  } catch (error) {
    sendApiError(res, 500, 'Erro ao avançar', error);
  }
});

app.post('/api/contents/:id/retry', async (req, res) => {
  try {
    const contentId = req.params.id;
    const { observacao, target_agent } = req.body;
    await new Promise(resolve => setTimeout(resolve, 1000));
    const current = await getPrisma().content.findUnique({ where: { id: contentId } });
    if (!current) return res.status(404).json({ error: 'Conteúdo não encontrado' });
    const antigos = toAgentResults(current.resultados_agentes);
    const version = (antigos._retryCount || 0) + 1;
    const agent = target_agent || current.agente_atual;

    if (agent === 'Pesquisador') {
      const pesquisa = gerarPesquisa(current.tema || 'Tema', current.objetivo_post || '', version);
      const updated = await getPrisma().content.update({
        where: { id: contentId },
        data: { status: 'EM_PRODUCAO', agente_atual: 'Pesquisador', resultados_agentes: { ...antigos, pesquisa, _retryCount: version } }
      });
      return res.json(updated);
    }

    if (agent === 'Copywriter') {
      const copyPayload = buildCopyOutput(current.tema || 'Tema', current.objetivo_post || '', version, antigos.pesquisa, observacao);
      const copy = gerarCopy(current.tema || 'Tema', current.objetivo_post || '', version, antigos.pesquisa, observacao);
      const updated = await getPrisma().content.update({
        where: { id: contentId },
        data: { status: 'EM_PRODUCAO', agente_atual: 'Copywriter', texto_gerado: copy, resultados_agentes: { ...antigos, copy, copy_payload: copyPayload, _retryCount: version } }
      });
      return res.json(updated);
    }

    if (agent === 'Designer') {
      const brandData = await fetchBrandData(contentId);
      const designResult = gerarDesign(current.tema || 'Tema', current.tipo_conteudo || '', version, brandData, observacao, antigos.copy || undefined, antigos.copy_payload);
      const updated = await getPrisma().content.update({
        where: { id: contentId },
        data: { status: 'EM_PRODUCAO', agente_atual: 'Designer', resultados_agentes: { ...antigos, design: designResult.text, design_payload: designResult.payload, design_images: designResult.images, _retryCount: version } }
      });
      return res.json(updated);
    }

    res.json(current);
  } catch (error) {
    sendApiError(res, 500, 'Erro ao refazer', error);
  }
});

app.post('/api/contents/:id/publish', async (req, res) => {
  try {
    const content = await getPrisma().content.update({
      where: { id: req.params.id },
      data: { status: 'PUBLICADO', agente_atual: 'Publicador' }
    });
    res.json({ message: 'Publicado', content });
  } catch (error) {
    sendApiError(res, 500, 'Erro ao publicar', error);
  }
});

export default app;
