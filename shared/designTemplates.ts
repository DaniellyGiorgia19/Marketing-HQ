export type StylePreset = "bold" | "spotlight" | "kinetic";
export type LayoutVariant = "editorial" | "split" | "spotlight" | "stacked";
export type DesignBackground = "primary" | "secondary" | "gradient";
export type DesignAlignment = "left" | "center";
export type DesignElement = "logo" | "divider" | "cta_button";

export type DesignSlide = {
  width: number;
  height: number;
  background: DesignBackground;
  title: string;
  subtitle?: string;
  alignment: DesignAlignment;
  elements: DesignElement[];
};

export type DesignerTheme = {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  titleFont: string;
  bodyFont: string;
};

export type DesignerOutput = {
  template: string;
  style_preset: StylePreset;
  layout_variant: LayoutVariant;
  reference_mode?: boolean;
  reference_image_url?: string;
  reference_template_name?: string;
  theme: DesignerTheme;
  slides_json: DesignSlide[];
  html_templates: string[];
  export: string[];
};

export type DynamicTextBlock = {
  type: "eyebrow" | "title" | "subtitle" | "caption" | "body";
  text?: string;
  color?: string;
  maxWidth?: number | string;
  align?: "left" | "center";
  uppercase?: boolean;
};

export type DynamicShapeBlock = {
  type: "shape";
  shape: "circle" | "square" | "pill" | "line";
  width: number;
  height: number;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  rotate?: number;
  radius?: number;
  color?: string;
  opacity?: number;
};

export type DynamicPanelBlock = {
  type: "panel";
  title?: string;
  body?: string;
  variant?: "glass" | "solid" | "outline";
  align?: "left" | "center";
  minHeight?: number;
};

export type DynamicLogoCloudItem = {
  label: string;
  icon?: string;
  color?: string;
  textColor?: string;
};

export type DynamicLogoCloudBlock = {
  type: "logo-cloud";
  title?: string;
  columns?: number;
  items: DynamicLogoCloudItem[];
};

export type DynamicMediaBlock = {
  type: "media";
  src?: string;
  alt?: string;
  aspectRatio?: string;
  fit?: "cover" | "contain";
  caption?: string;
};

export type DynamicTemplateBlock =
  | DynamicTextBlock
  | DynamicShapeBlock
  | DynamicPanelBlock
  | DynamicLogoCloudBlock
  | DynamicMediaBlock;

export type DynamicTemplateSection = {
  id: string;
  layout?: "stack" | "split" | "hero" | "grid" | "free";
  align?: "left" | "center";
  columns?: string;
  gap?: number;
  padding?: string;
  minHeight?: number;
  blocks: DynamicTemplateBlock[];
};

export type DynamicTemplateSpec = {
  name: string;
  canvas?: {
    background?: string;
    padding?: string;
    borderRadius?: number;
  };
  sections: DynamicTemplateSection[];
};

type BuildHtmlTemplatesParams = {
  brandName: string;
  slides: DesignSlide[];
  template: string;
  stylePreset: StylePreset;
  layoutVariant: LayoutVariant;
  theme: DesignerTheme;
  referenceTemplate?: DynamicTemplateSpec;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getEyebrowLabel(template: string) {
  return template.replace("carousel_", "").replace("_", " ");
}

function getBackgroundStyle(background: DesignBackground, theme: DesignerTheme) {
  if (background === "gradient") {
    return `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`;
  }

  return background === "secondary" ? theme.secondary : theme.primary;
}

function withUnit(value?: number | string) {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

function renderDynamicBlock(params: {
  block: DynamicTemplateBlock;
  theme: DesignerTheme;
  brandName: string;
  slide: DesignSlide;
}) {
  const { block, theme, brandName, slide } = params;

  if (block.type === "shape") {
    const radius =
      block.shape === "circle"
        ? "999px"
        : block.shape === "pill"
          ? "999px"
          : `${block.radius ?? 24}px`;
    return `<div style="position:absolute; ${block.top !== undefined ? `top:${block.top}px;` : ""}${block.right !== undefined ? `right:${block.right}px;` : ""}${block.bottom !== undefined ? `bottom:${block.bottom}px;` : ""}${block.left !== undefined ? `left:${block.left}px;` : ""} width:${block.width}px; height:${block.height}px; background:${block.color || "rgba(255,255,255,0.12)"}; opacity:${block.opacity ?? 1}; border-radius:${radius}; transform:rotate(${block.rotate || 0}deg);"></div>`;
  }

  if (block.type === "panel") {
    const align = block.align || slide.alignment;
    const panelStyles =
      block.variant === "outline"
        ? `background:transparent; border:1px solid rgba(255,255,255,0.22);`
        : block.variant === "solid"
          ? `background:${theme.neutral}; color:${theme.primary};`
          : `background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.16);`;

    return `<div style="display:flex; flex-direction:column; gap:16px; align-items:${align === "center" ? "center" : "flex-start"}; text-align:${align}; padding:28px; border-radius:32px; min-height:${block.minHeight || 0}px; ${panelStyles}">
      ${block.title ? `<div style="font-family:${escapeHtml(theme.titleFont)}, ${escapeHtml(theme.bodyFont)}, sans-serif; font-size:42px; line-height:0.96; font-weight:800;">${escapeHtml(block.title)}</div>` : ""}
      ${block.body ? `<div style="font-size:22px; line-height:1.4; max-width:620px;">${escapeHtml(block.body)}</div>` : ""}
    </div>`;
  }

  if (block.type === "logo-cloud") {
    const columns = block.columns || 4;
    return `<div style="display:flex; flex-direction:column; gap:18px; width:100%;">
      ${block.title ? `<div style="font-size:24px; font-weight:700; letter-spacing:0.04em;">${escapeHtml(block.title)}</div>` : ""}
      <div style="display:grid; grid-template-columns:repeat(${columns}, minmax(0, 1fr)); gap:18px; width:100%;">
        ${block.items.map(item => `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; text-align:center; padding:14px 8px;">
          <div style="width:62px; height:62px; border-radius:999px; background:${item.color || "rgba(255,255,255,0.14)"}; color:${item.textColor || "#fff"}; display:flex; align-items:center; justify-content:center; font-weight:700;">${escapeHtml(item.icon || item.label.slice(0, 1))}</div>
          <div style="font-size:16px; line-height:1.15;">${escapeHtml(item.label)}</div>
        </div>`).join("")}
      </div>
    </div>`;
  }

  if (block.type === "media") {
    const aspectRatio = block.aspectRatio || "4 / 3";
    const src = block.src || "";
    return `<div style="display:flex; flex-direction:column; gap:12px; width:100%;">
      <div style="width:100%; aspect-ratio:${aspectRatio}; border-radius:28px; overflow:hidden; background:rgba(255,255,255,0.10); border:1px solid rgba(255,255,255,0.12); display:flex; align-items:center; justify-content:center;">
        ${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(block.alt || brandName)}" style="width:100%; height:100%; object-fit:${block.fit || "cover"};" />` : `<div style="font-size:18px; opacity:0.72;">Referencia visual</div>`}
      </div>
      ${block.caption ? `<div style="font-size:16px; opacity:0.78;">${escapeHtml(block.caption)}</div>` : ""}
    </div>`;
  }

  const align = block.align || slide.alignment;
  const defaultSize: Record<DynamicTextBlock["type"], number> = {
    eyebrow: 16,
    title: 72,
    subtitle: 34,
    body: 24,
    caption: 16,
  };
  const fontWeight = block.type === "title" ? 800 : block.type === "eyebrow" ? 700 : 500;
  const fontFamily = block.type === "title" ? `${escapeHtml(theme.titleFont)}, ${escapeHtml(theme.bodyFont)}, sans-serif` : `${escapeHtml(theme.bodyFont)}, Inter, sans-serif`;
  const text = block.text || "";
  return `<div style="font-family:${fontFamily}; font-size:${defaultSize[block.type]}px; line-height:${block.type === "title" ? 0.95 : 1.35}; font-weight:${fontWeight}; color:${block.color || "#F8FAFC"}; text-align:${align}; ${block.maxWidth ? `max-width:${withUnit(block.maxWidth)};` : ""} ${block.uppercase ? "text-transform:uppercase; letter-spacing:0.08em;" : ""}">
    ${escapeHtml(text)}
  </div>`;
}

function renderDynamicSection(params: {
  section: DynamicTemplateSection;
  theme: DesignerTheme;
  brandName: string;
  slide: DesignSlide;
}) {
  const { section, theme, brandName, slide } = params;
  const layout = section.layout || "stack";
  const gap = section.gap ?? 20;
  const align = section.align || slide.alignment;
  const baseStyle =
    layout === "split"
      ? `display:grid; grid-template-columns:${section.columns || "minmax(0, 1.1fr) minmax(220px, 320px)"};`
      : layout === "grid"
        ? `display:grid; grid-template-columns:${section.columns || "repeat(2, minmax(0, 1fr))"};`
        : `display:flex; flex-direction:column;`;

  return `<section style="position:relative; ${baseStyle} gap:${gap}px; align-items:${align === "center" ? "center" : "flex-start"}; text-align:${align}; width:100%; ${section.padding ? `padding:${section.padding};` : ""} ${section.minHeight ? `min-height:${section.minHeight}px;` : ""}">
    ${section.blocks.map(block => renderDynamicBlock({ block, theme, brandName, slide })).join("")}
  </section>`;
}

function buildReferenceDrivenHtml(params: {
  brandName: string;
  slide: DesignSlide;
  theme: DesignerTheme;
  referenceTemplate: DynamicTemplateSpec;
}) {
  const { brandName, slide, theme, referenceTemplate } = params;
  const background = referenceTemplate.canvas?.background || getBackgroundStyle(slide.background, theme);
  const padding = referenceTemplate.canvas?.padding || "84px";
  const radius = referenceTemplate.canvas?.borderRadius ?? 0;

  return `<div style="position:relative; width:${slide.width}px; height:${slide.height}px; box-sizing:border-box; overflow:hidden; background:${background}; color:#F8FAFC; padding:${padding}; border-radius:${radius}px; display:flex; flex-direction:column; gap:28px; font-family:${escapeHtml(theme.bodyFont)}, Inter, sans-serif;">
    ${referenceTemplate.sections.map(section => renderDynamicSection({ section, theme, brandName, slide })).join("")}
  </div>`;
}

export function buildReferenceTemplateFromSiteImage(params: {
  imageUrl?: string;
  siteName?: string;
  headline?: string;
  subheadline?: string;
  sections?: Array<{ title: string; body?: string }>;
  logoItems?: DynamicLogoCloudItem[];
}): DynamicTemplateSpec {
  const { imageUrl, siteName, headline, subheadline, sections, logoItems } = params;
  const sectionItems = sections && sections.length > 0
    ? sections
    : [
        { title: headline || "Hero principal", body: subheadline || "Estrutura derivada da referência visual enviada." },
      ];

  return {
    name: `reference_${(siteName || "site").toLowerCase().replace(/\s+/g, "_")}`,
    canvas: {
      background: "linear-gradient(135deg, var(--primary, #161E1F) 0%, var(--secondary, #EA5E0B) 100%)",
      padding: "72px",
      borderRadius: 0,
    },
    sections: [
      {
        id: "hero",
        layout: imageUrl ? "split" : "stack",
        columns: "minmax(0, 1.1fr) minmax(260px, 360px)",
        gap: 28,
        blocks: [
          {
            type: "panel",
            title: sectionItems[0]?.title || headline || "Headline",
            body: sectionItems[0]?.body || subheadline || "",
            variant: "glass",
            align: "left",
            minHeight: 280,
          },
          {
            type: "media",
            src: imageUrl,
            alt: siteName || "Referência do site",
            aspectRatio: "4 / 5",
            fit: "cover",
            caption: siteName ? `Referência visual: ${siteName}` : "Referência visual enviada",
          },
        ],
      },
      ...(sectionItems.slice(1).map((item, index) => ({
        id: `section_${index + 1}`,
        layout: "stack" as const,
        gap: 16,
        blocks: [
          { type: "eyebrow" as const, text: `Bloco ${index + 2}`, uppercase: true, color: "rgba(248,250,252,0.72)" },
          { type: "title" as const, text: item.title, maxWidth: 760 },
          { type: "body" as const, text: item.body || "", maxWidth: 760, color: "rgba(248,250,252,0.88)" },
        ],
      }))),
      ...(logoItems && logoItems.length > 0 ? [{
        id: "logos",
        layout: "stack" as const,
        blocks: [
          {
            type: "logo-cloud" as const,
            title: "Elementos da composição",
            columns: Math.min(logoItems.length, 5),
            items: logoItems,
          },
        ],
      }] : []),
    ],
  };
}

function buildDecorativeLayer(stylePreset: StylePreset, theme: DesignerTheme, outline: string) {
  if (stylePreset === "kinetic") {
    return `
      <div style="position:absolute; inset:0; overflow:hidden;">
        <div style="position:absolute; top:-120px; right:-90px; width:360px; height:360px; border-radius:72px; background:${theme.secondary}; opacity:0.92; transform:rotate(14deg);"></div>
        <div style="position:absolute; left:-120px; bottom:110px; width:320px; height:320px; border-radius:999px; background:${theme.accent}; opacity:0.16;"></div>
        <div style="position:absolute; right:120px; bottom:140px; width:180px; height:180px; border-radius:36px; border:2px solid rgba(255,255,255,0.22); transform:rotate(12deg);"></div>
      </div>`;
  }

  if (stylePreset === "spotlight") {
    return `
      <div style="position:absolute; inset:0; overflow:hidden;">
        <div style="position:absolute; top:120px; right:100px; width:340px; height:340px; border-radius:999px; background:radial-gradient(circle, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 70%);"></div>
        <div style="position:absolute; left:76px; right:76px; bottom:90px; height:1px; background:rgba(255,255,255,0.16);"></div>
      </div>`;
  }

  return `
    <div style="position:absolute; inset:0; overflow:hidden;">
      <div style="position:absolute; top:78px; left:78px; right:78px; bottom:78px; border-radius:48px; border:1px solid ${outline};"></div>
      <div style="position:absolute; top:92px; right:92px; width:220px; height:220px; border-radius:44px; background:rgba(255,255,255,0.08);"></div>
    </div>`;
}

function buildContentShell(template: string, textAlign: "left" | "center", layoutVariant: LayoutVariant) {
  if (layoutVariant === "split") {
    return `display:grid; grid-template-columns:${textAlign === "center" ? "1fr" : "minmax(0,1.1fr) 260px"}; align-items:stretch; gap:28px; width:100%;`;
  }

  if (layoutVariant === "spotlight") {
    return "display:flex; flex-direction:column; align-items:center; justify-content:center; gap:24px; width:100%; max-width:820px; margin:0 auto;";
  }

  if (layoutVariant === "stacked") {
    return "display:flex; flex-direction:column; justify-content:flex-end; gap:24px; width:100%; min-height:70%;";
  }

  if (template === "carousel_lista") {
    return `display:grid; grid-template-columns:${textAlign === "center" ? "1fr" : "minmax(0,1.05fr) 240px"}; align-items:end; gap:32px; width:100%;`;
  }

  if (template === "carousel_autoridade") {
    return "display:flex; flex-direction:column; gap:32px; width:100%; max-width:880px;";
  }

  if (template === "carousel_storytelling") {
    return "display:flex; flex-direction:column; gap:28px; width:100%; max-width:900px;";
  }

  return "display:flex; flex-direction:column; gap:28px; width:100%;";
}

function buildSideStat(params: {
  template: string;
  index: number;
  textAlign: "left" | "center";
  panelBackground: string;
  outline: string;
  theme: DesignerTheme;
  layoutVariant: LayoutVariant;
}) {
  const { template, index, textAlign, panelBackground, outline, theme, layoutVariant } = params;

  if (layoutVariant === "split") {
    return `<div style="display:flex; flex-direction:column; justify-content:space-between; min-height:100%; padding:28px; border-radius:34px; background:${panelBackground}; border:1px solid ${outline};">
      <div style="width:100%; height:140px; border-radius:26px; background:rgba(255,255,255,0.10);"></div>
      <div>
        <div style="font-family:${escapeHtml(theme.titleFont)}, ${escapeHtml(theme.bodyFont)}, sans-serif; font-size:72px; font-weight:800; line-height:0.9;">0${index + 1}</div>
        <div style="margin-top:8px; font-size:16px; line-height:1.45; color:rgba(248,250,252,0.76);">Bloco auxiliar do template.</div>
      </div>
    </div>`;
  }

  if (template !== "carousel_lista" || textAlign === "center") {
    return "";
  }

  return `<div style="display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-end; gap:14px; padding:24px; min-height:220px; border-radius:32px; background:${panelBackground}; border:1px solid ${outline};">
      <div style="font-family:${escapeHtml(theme.titleFont)}, ${escapeHtml(theme.bodyFont)}, sans-serif; font-size:72px; font-weight:800; line-height:0.9;">0${index + 1}</div>
      <div style="font-size:16px; line-height:1.45; color:rgba(248,250,252,0.76);">Passo visual com hierarquia clara e ritmo de leitura.</div>
    </div>`;
}

function buildHeadlineBlock(params: {
  slide: DesignSlide;
  index: number;
  template: string;
  eyebrow: string;
  textAlign: "left" | "center";
  panelBackground: string;
  outline: string;
  titleMaxWidth: string;
  theme: DesignerTheme;
  divider: string;
  layoutVariant: LayoutVariant;
}) {
  const { slide, index, template, eyebrow, textAlign, panelBackground, outline, titleMaxWidth, theme, divider, layoutVariant } = params;
  const subtitle = slide.subtitle
    ? `<p style="margin:0; font-family:${escapeHtml(theme.bodyFont)}, Inter, sans-serif; font-size:34px; line-height:1.35; color:rgba(248,250,252,0.92); max-width:${titleMaxWidth}; text-align:${textAlign};">${escapeHtml(slide.subtitle)}</p>`
    : "";

  if (layoutVariant === "spotlight") {
    return `<div style="display:flex; flex-direction:column; gap:20px; align-items:center; text-align:center; padding:34px; border-radius:38px; background:${panelBackground}; border:1px solid ${outline}; backdrop-filter:blur(8px);">
        <span style="font-size:15px; font-weight:700; letter-spacing:0.16em; text-transform:uppercase; color:rgba(248,250,252,0.72);">${escapeHtml(eyebrow)}</span>
        ${divider}
        <h1 style="margin:0; font-family:${escapeHtml(theme.titleFont)}, ${escapeHtml(theme.bodyFont)}, sans-serif; font-size:${index === 0 ? 84 : 66}px; line-height:0.94; font-weight:800; max-width:${titleMaxWidth}; text-align:center;">${escapeHtml(slide.title)}</h1>
        ${subtitle}
      </div>`;
  }

  if (layoutVariant === "stacked") {
    return `<div style="display:flex; flex-direction:column; gap:18px; margin-top:auto; padding:34px; border-radius:34px; background:${panelBackground}; border:1px solid ${outline}; max-width:860px;">
        <span style="font-size:15px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:rgba(248,250,252,0.72);">${escapeHtml(eyebrow)}</span>
        ${divider}
        <h1 style="margin:0; font-family:${escapeHtml(theme.titleFont)}, ${escapeHtml(theme.bodyFont)}, sans-serif; font-size:${index === 0 ? 82 : 64}px; line-height:0.96; font-weight:800; max-width:${titleMaxWidth}; text-align:${textAlign};">${escapeHtml(slide.title)}</h1>
        ${subtitle}
      </div>`;
  }

  if (template === "carousel_storytelling") {
    return `<div style="display:flex; flex-direction:column; gap:18px; padding:30px; border-radius:34px; background:${panelBackground}; border:1px solid ${outline};">
        <span style="font-size:16px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:rgba(248,250,252,0.72);">${escapeHtml(eyebrow)}</span>
        <h1 style="margin:0; font-family:${escapeHtml(theme.titleFont)}, ${escapeHtml(theme.bodyFont)}, sans-serif; font-size:${index === 0 ? 82 : 64}px; line-height:0.96; font-weight:800; max-width:${titleMaxWidth}; text-align:${textAlign};">${escapeHtml(slide.title)}</h1>
        ${subtitle}
      </div>`;
  }

  return `<div style="display:flex; flex-direction:column; gap:24px; width:100%; align-items:${textAlign === "center" ? "center" : "flex-start"};">
      <div style="display:flex; gap:14px; align-items:center; justify-content:${textAlign === "center" ? "center" : "flex-start"};">
        <span style="display:inline-flex; padding:10px 18px; border-radius:999px; background:${panelBackground}; border:1px solid ${outline}; font-size:18px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">${escapeHtml(eyebrow)}</span>
      </div>
      ${divider}
      <h1 style="margin:0; font-family:${escapeHtml(theme.titleFont)}, ${escapeHtml(theme.bodyFont)}, sans-serif; font-size:${index === 0 ? 82 : 68}px; line-height:0.95; font-weight:800; max-width:${titleMaxWidth}; text-align:${textAlign};">${escapeHtml(slide.title)}</h1>
      ${subtitle}
    </div>`;
}

function buildPyramidInfographicHtml(params: {
  brandName: string;
  slide: DesignSlide;
  theme: DesignerTheme;
}) {
  const { brandName, slide, theme } = params;
  const title = escapeHtml(slide.title.toUpperCase());
  const subtitle = escapeHtml((slide.subtitle || "Ecossistema organizado por camadas de uso prático").toUpperCase());
  const softBg = "#eeeee4";
  const accent = theme.secondary || "#ff5a00";
  const dark = theme.primary || "#111111";

  return `<div style="width:${slide.width}px; height:${slide.height}px; background:${softBg}; color:${dark}; padding:42px 36px 28px; box-sizing:border-box; display:flex; flex-direction:column; font-family:${escapeHtml(theme.bodyFont)}, Arial, sans-serif; position:relative; overflow:hidden;">
  <div style="font-family:${escapeHtml(theme.titleFont)}, ${escapeHtml(theme.bodyFont)}, sans-serif; font-weight:800; font-size:54px; line-height:1.04; text-transform:uppercase; max-width:760px; margin-bottom:24px;">
    <span>${title}</span><br/>
    <span style="color:${accent};">${subtitle}</span>
  </div>

  <div style="position:relative; width:1000px; height:980px; margin:0 auto; transform:scale(0.93); transform-origin:top center;">
    <svg viewBox="0 0 1000 920" xmlns="http://www.w3.org/2000/svg" style="position:absolute; inset:0; width:100%; height:920px;">
      <polygon points="500,20 10,900 990,900" fill="none" stroke="${dark}" stroke-width="2"/>
      <line x1="96" y1="724" x2="904" y2="724" stroke="${dark}" stroke-width="2"/>
      <line x1="197" y1="548" x2="803" y2="548" stroke="${dark}" stroke-width="2"/>
      <line x1="298" y1="372" x2="702" y2="372" stroke="${dark}" stroke-width="2"/>
      <line x1="399" y1="196" x2="601" y2="196" stroke="${dark}" stroke-width="2"/>
    </svg>

    <div style="position:absolute; top:42px; right:254px; font-size:24px;">Desenvolvimento</div>
    <div style="position:absolute; top:322px; right:16px; font-size:24px;">Assistentes gerais</div>
    <div style="position:absolute; top:500px; right:0; font-size:24px;">Criação de Conteúdo</div>
    <div style="position:absolute; top:684px; right:44px; font-size:24px;">Produtividade</div>
    <div style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%); font-size:22px;">Integrações</div>

    <div style="position:absolute; top:146px; left:374px; display:flex; gap:120px;">
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:66px; height:66px; border-radius:999px; background:#d98557; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">✳</div><div style="font-size:18px; text-align:center;">Claude<br/>Code</div></div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:66px; height:66px; border-radius:999px; background:#111; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">◩</div><div style="font-size:18px; text-align:center;">Cursor</div></div>
    </div>

    <div style="position:absolute; top:274px; left:468px; display:flex; flex-direction:column; align-items:center; gap:10px;">
      <div style="width:66px; height:66px; border-radius:999px; background:linear-gradient(135deg,#ff7a00,#9a4dff,#5aa8ff); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">♥</div>
      <div style="font-size:18px;">Lovable</div>
    </div>

    <div style="position:absolute; top:430px; left:150px; right:150px; display:flex; justify-content:space-between;">
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:66px; height:66px; border-radius:999px; background:#7cb6a5; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">◎</div><div style="font-size:18px;">ChatGPT</div></div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:66px; height:66px; border-radius:999px; background:#d98557; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">✳</div><div style="font-size:18px;">Claude</div></div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:66px; height:66px; border-radius:999px; background:#0d7d8d; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">✴</div><div style="font-size:18px;">Perplexity</div></div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:66px; height:66px; border-radius:999px; background:#f7f7fb; color:#5a61ff; display:flex; align-items:center; justify-content:center; font-weight:700;">✦</div><div style="font-size:18px;">Gemini</div></div>
    </div>

    <div style="position:absolute; top:610px; left:100px; right:100px; display:flex; justify-content:space-between;">
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:66px; height:66px; border-radius:999px; background:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">HG</div><div style="font-size:18px;">Heygen</div></div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:66px; height:66px; border-radius:999px; background:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">🤌</div><div style="font-size:18px;">ManusAi</div></div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:66px; height:66px; border-radius:999px; background:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">11</div><div style="font-size:18px; text-align:center;">Eleven<br/>Labs</div></div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:66px; height:66px; border-radius:999px; background:#07143a; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">K</div><div style="font-size:18px;">Klap</div></div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:66px; height:66px; border-radius:999px; background:linear-gradient(135deg,#7fa8ff,#3c63d8); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">▭</div><div style="font-size:18px;">Synthesia</div></div>
    </div>

    <div style="position:absolute; top:804px; left:44px; right:44px; display:flex; justify-content:space-between;">
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:62px; height:62px; border-radius:999px; background:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">⚡</div><div style="font-size:16px; text-align:center;">Claude<br/>Cowork</div></div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:62px; height:62px; border-radius:999px; background:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">◓</div><div style="font-size:16px; text-align:center;">Notebook<br/>LM</div></div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:62px; height:62px; border-radius:999px; background:#244a9f; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">G</div><div style="font-size:16px;">Gamma</div></div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:62px; height:62px; border-radius:999px; background:#98e46f; color:#1a4b1a; display:flex; align-items:center; justify-content:center; font-weight:700;">g</div><div style="font-size:16px;">Granola</div></div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:62px; height:62px; border-radius:999px; background:linear-gradient(135deg,#2c66ff,#7623a6); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">◉</div><div style="font-size:16px;">Superhuman</div></div>
      <div style="display:flex; flex-direction:column; align-items:center; gap:10px;"><div style="width:62px; height:62px; border-radius:999px; background:#0e8a72; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">G</div><div style="font-size:16px;">Grammarly</div></div>
    </div>

    <div style="position:absolute; bottom:-4px; left:0; right:0; display:flex; justify-content:space-between;">
      ${["Make", "n8n", "Zapier", "Levity", "Relay", "LangChain", "HubSpot AI"].map((label, index) => {
        const colors = ["#6c1bff", "#f05a84", "#ff5a00", "#352089", "#4a6bff", "#23443c", "#f5f5f5"];
        const textColors = ["#fff", "#fff", "#fff", "#fff", "#fff", "#fff", "#ef6b43"];
        const icon = ["M", "∞", "✱", "L", "↷", "⛓", "◌"][index];
        return `<div style="display:flex; flex-direction:column; align-items:center; gap:10px; min-width:86px;">
          <div style="width:62px; height:62px; border-radius:999px; background:${colors[index]}; color:${textColors[index]}; display:flex; align-items:center; justify-content:center; font-weight:700;">${icon}</div>
          <div style="font-size:16px; text-align:center;">${label}</div>
        </div>`;
      }).join("")}
    </div>
  </div>

  <div style="position:absolute; right:30px; bottom:18px; font-size:18px; font-weight:700; color:${accent}; text-transform:uppercase;">${escapeHtml(brandName)}</div>
</div>`;
}

export function buildHtmlTemplates(params: BuildHtmlTemplatesParams) {
  const { brandName, slides, template, stylePreset, layoutVariant, theme, referenceTemplate } = params;

  return slides.map((slide, index) => {
    if (referenceTemplate) {
      return buildReferenceDrivenHtml({
        brandName,
        slide,
        theme,
        referenceTemplate,
      });
    }

    if (template === "post_piramide_ia") {
      return buildPyramidInfographicHtml({
        brandName,
        slide,
        theme,
      });
    }

    const textAlign = slide.alignment;
    const backgroundStyle = getBackgroundStyle(slide.background, theme);
    const panelBackground = slide.background === "secondary" ? "rgba(15,23,42,0.18)" : "rgba(255,255,255,0.10)";
    const outline = slide.background === "secondary" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.18)";
    const eyebrow = getEyebrowLabel(template);
    const titleMaxWidth = textAlign === "center" ? "760px" : "820px";
    const justifyContent = index === slides.length - 1 ? "space-between" : "center";
    const divider = slide.elements.includes("divider")
      ? `<div style="width:180px; height:6px; border-radius:999px; background:${theme.accent}; opacity:0.92;"></div>`
      : "";
    const accentText = slide.background === "secondary" ? theme.primary : theme.secondary;
    const ctaButton = slide.elements.includes("cta_button")
      ? `<div style="display:flex; align-items:center; justify-content:center; padding:0 36px; height:88px; border-radius:999px; background:${theme.accent}; color:${accentText}; font-family:${escapeHtml(theme.bodyFont)}, Inter, sans-serif; font-size:28px; font-weight:800;">${escapeHtml(slide.title)}</div>`
      : "";
    const logo = slide.elements.includes("logo")
      ? `<div style="display:flex; align-items:center; justify-content:${textAlign === "center" ? "center" : "flex-start"}; font-family:${escapeHtml(theme.bodyFont)}, Inter, sans-serif; font-size:22px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:rgba(248,250,252,0.86);">${escapeHtml(brandName)}</div>`
      : "";

    return `<div style="position:relative; display:flex; width:${slide.width}px; height:${slide.height}px; padding:84px; box-sizing:border-box; flex-direction:column; justify-content:${justifyContent}; align-items:${textAlign === "center" ? "center" : "flex-start"}; gap:32px; background:${backgroundStyle}; color:#F8FAFC; font-family:${escapeHtml(theme.bodyFont)}, Inter, sans-serif; overflow:hidden;">
  ${buildDecorativeLayer(stylePreset, theme, outline)}
  <div style="position:relative; ${buildContentShell(template, textAlign, layoutVariant)}">
    ${buildHeadlineBlock({
      slide,
      index,
      template,
      eyebrow,
      textAlign,
      panelBackground,
      outline,
      titleMaxWidth,
      theme,
      divider,
      layoutVariant,
    })}
    ${buildSideStat({
      template,
      index,
      textAlign,
      panelBackground,
      outline,
      theme,
      layoutVariant,
    })}
  </div>
  <div style="position:relative; display:flex; width:100%; align-items:${textAlign === "center" ? "center" : "flex-start"}; justify-content:space-between; gap:24px; flex-wrap:wrap;">
    ${ctaButton || "<div></div>"}
    ${logo}
  </div>
</div>`;
  });
}
