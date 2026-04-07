import { Prisma, PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

type SocialLinks = Record<string, string>;

type AgentResults = {
  pesquisa?: string;
  copy?: string;
  design?: string;
  design_images?: string[];
  _retryCount?: number;
};

type BrandData = {
  nomeMarca: string;
  site: string;
  redes: SocialLinks;
  segmento: string;
  estiloVisual: string;
  tomDeVoz: string;
};

type ApiRequest = {
  method?: string;
  url?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

let prisma: PrismaClient | null = null;

function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient();
  }

  return prisma;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Erro desconhecido";
}

function sendApiError(
  res: ApiResponse,
  statusCode: number,
  message: string,
  error: unknown
) {
  const detail = getErrorMessage(error);
  console.error(message, detail);
  res.status(statusCode).json({ error: message, detail });
}

function toAgentResults(value: Prisma.JsonValue | null | undefined): AgentResults {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as unknown as AgentResults;
}

function toSocialLinks(value: Prisma.JsonValue | null | undefined): SocialLinks {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => typeof entryValue === "string")
  ) as SocialLinks;
}

function parseBody(body: unknown) {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  if (typeof body === "object") {
    return body as Record<string, unknown>;
  }

  return {};
}

function gerarPesquisa(tema: string, objetivo: string, versao: number) {
  const blocos = [
    `O tema "${tema}" está em alta nas redes sociais. Análise de tendências mostra crescimento de 45% em buscas relacionadas nos últimos 3 meses.\n\nContexto: ${objetivo || "Engajamento e alcance orgânico"}\n\nPalavras-chave: ${tema.split(" ").slice(0, 3).join(", ")}, Estratégia Digital, Resultados.\n\n🔗 **Fontes de Inteligência Utilizadas:**\n1. [Google Trends - "${tema}"](https://trends.google.com/trends/explore?q=${encodeURIComponent(tema)})\n2. [Análise de Mercado - Semrush](https://semrush.com/analytics)\n3. Benchmark de Concorrentes (Base Interna)`,
    `Pesquisa aprofundada sobre "${tema}": Identificamos que o público-alvo responde melhor a conteúdos que combinam dados concretos com storytelling pessoal.\n\nObjetivo alinhado: ${objetivo || "Gerar autoridade e conversões"}\n\nPalavras-chave: ${tema.split(" ").slice(0, 3).join(", ")}, Autoridade, Conversão.\n\n🔗 **Fontes de Inteligência Utilizadas:**\n1. [Content Marketing Institute - Report 2026](https://contentmarketinginstitute.com/report)\n2. [HubSpot State of Marketing](https://hubspot.com/state-of-marketing)\n3. Análise de Engajamento dos últimos 30 dias (Base Interna)`,
    `Mapeamento competitivo sobre "${tema}": Os 3 principais concorrentes estão abordando este assunto com foco em educação e prova social. Oportunidade de diferenciação usando tom mais direto e dados exclusivos.\n\nObjetivo: ${objetivo || "Posicionamento de marca"}\n\nPalavras-chave: ${tema.split(" ").slice(0, 3).join(", ")}, Diferenciação, Prova Social.\n\n🔗 **Fontes de Inteligência Utilizadas:**\n1. [Panorama do Marketing Digital - RD Station](https://resultadosdigitais.com.br/panorama)\n2. [Relatório de Redes Sociais - mLabs](https://mlabs.com.br/relatorio)\n3. Monitoramento de Concorrentes (Base Interna)`
  ];
  return blocos[versao % blocos.length];
}

function gerarCopy(tema: string, objetivo: string, versao: number, pesquisa?: string, obs?: string) {
  const linhas = pesquisa?.split("\n").filter(l => l.trim().length > 0) || [];
  const fraseDado1 = linhas.find(l => /\d+%/.test(l)) || `O tema "${tema}" apresenta crescimento expressivo em buscas e engajamento nas redes`;
  const fraseDado2 = linhas.find((l, i) => /\d+%/.test(l) && i !== linhas.indexOf(fraseDado1)) || "Marcas que abordam esse assunto com dados reais conquistam mais autoridade e confiança";
  const kwMatch = pesquisa?.match(/Palavras-chave:\s*(.+)/);
  const palavrasChave = kwMatch ? kwMatch[1].split(",").map(k => k.trim()).slice(0, 4) : [tema.split(" ")[0], "Estratégia", "Resultados"];
  const hashtags = palavrasChave.map(k => `#${k.replace(/\s+/g, "")}`).join(" ") + ` #${tema.replace(/\s+/g, "")} #MarketingDigital`;
  const instrucaoUsuario = obs ? `\n\n💬 *Ajuste aplicado conforme orientação do usuário: "${obs}"*` : "";
  const blocoInterno = objetivo ? `\n\n---\n\n📋 **NOTA INTERNA (não publicar):**\nObjetivo estratégico: ${objetivo}` : "";

  const blocos = [
    `✏️ **TEXTO DA ARTE:**\n"${tema}"\nSubtítulo: "${fraseDado1.replace(/^.*?(\d+%)/, "$1").trim()}"\n\n---\n\n📝 **LEGENDA:**\n${fraseDado1.trim()}\n\nE isso muda completamente o jogo para quem atua nesse mercado.\n\nAlém disso: ${fraseDado2.trim().toLowerCase()}\n\nO cenário é claro — quem entende e aplica ${tema.toLowerCase()} agora está construindo uma vantagem competitiva real.\n\nA dúvida não é mais se vale a pena, mas o que você está esperando para começar.\n\n👉 Salve este post e envie para alguém que precisa ver esses dados.\n\n---\n\n🏷️ **HASHTAGS:**\n${hashtags}${blocoInterno}${instrucaoUsuario}`,
    `✏️ **TEXTO DA ARTE:**\n"Você já parou para olhar os dados sobre ${tema.toLowerCase()}?"\nDestaque visual: "${fraseDado1.replace(/^.*?(\d+%)/, "$1").trim()}"\n\n---\n\n📝 **LEGENDA:**\nOs dados sobre ${tema.toLowerCase()} estão surpreendendo o mercado:\n\n📊 ${fraseDado1.trim()}\n📈 ${fraseDado2.trim()}\n\nIsso não é achismo — são números reais de pesquisas recentes.\n\nE o mais importante: quem está atento a esses dados já está tomando decisões melhores, mais rápido.\n\nNão espere o mercado te dizer o que já está acontecendo. Antecipe-se.\n\nQual desses dados mais chamou sua atenção? Me conta nos comentários 👇\n\n---\n\n🏷️ **HASHTAGS:**\n${hashtags}${blocoInterno}${instrucaoUsuario}`,
    `✏️ **TEXTO DA ARTE:**\nPágina 1: "${tema}"\nPágina 2: "${fraseDado1.replace(/^.*?(\d+%)/, "$1").trim()}"\nPágina 3: "Quem entende os dados, lidera o mercado"\nPágina 4: "Seu próximo passo começa aqui →"\n\n---\n\n📝 **LEGENDA:**\nVamos colocar os dados na mesa sobre ${tema.toLowerCase()}? 📊\n\n${fraseDado1.trim()}\n\nMas não para por aí:\n${fraseDado2.trim()}\n\nEsses números mostram uma direção clara: ${tema.toLowerCase()} não é mais opcional para quem quer crescer de verdade.\n\nE a boa notícia? Você está lendo isso agora. Ainda dá tempo de agir.\n\nArrasta pro lado e veja como aplicar isso no seu negócio →\n\n---\n\n🏷️ **HASHTAGS:**\n${hashtags}${blocoInterno}${instrucaoUsuario}`
  ];

  return blocos[versao % blocos.length];
}

async function fetchBrandData(contentId: string) {
  const content = await getPrisma().content.findUnique({
    where: { id: contentId },
    include: { campaign: { include: { business: { include: { brand_profiles: { where: { is_active: true } } } } } } }
  });
  const biz = content?.campaign?.business;
  const brand = biz?.brand_profiles?.[0];
  return {
    nomeMarca: biz?.nome_marca || "Marca",
    site: biz?.site_url || "",
    redes: toSocialLinks(biz?.redes_sociais),
    segmento: biz?.segmento || "",
    estiloVisual: brand?.estilo_visual || "",
    tomDeVoz: brand?.tom_de_voz || "",
  };
}

function gerarDesign(tema: string, tipo: string, versao: number, brand: BrandData, obs?: string, copyText?: string) {
  const redesList = Object.entries(brand.redes || {})
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => `${k}: ${v}`)
    .join(" | ") || "Sem redes cadastradas";

  const instrucao = obs ? `\n\n💬 *Ajuste aplicado conforme orientação do usuário: "${obs}"*` : "";
  let tituloSugerido = tema;
  let subtituloSugerido = "Frase de impacto extraída da copy";
  const sourceText = obs || copyText || "";

  if (sourceText) {
    const capaMatch = sourceText.match(/(?:Slide 1|Capa|Página 1|P1)[:\s-]+(.*?)(?=\n|Slide 2|Página 2|P2|$)/i);
    if (capaMatch) tituloSugerido = capaMatch[1].trim().replace(/^"(.*)"$/, "$1");

    const subMatch = sourceText.match(/(?:Slide 2|Página 2|P2)[:\s-]+(.*?)(?=\n|Slide 3|Página 3|P3|$)/i);
    if (subMatch) subtituloSugerido = `${subMatch[1].trim().replace(/^"(.*)"$/, "$1").substring(0, 100)}...`;
  }

  const identidadeBloco = `📋 **IDENTIDADE VISUAL DA MARCA:**\n• Marca: ${brand.nomeMarca}\n• Segmento: ${brand.segmento || "Não definido"}\n• Estilo visual: ${brand.estiloVisual || "Seguir padrão do site e redes sociais da marca"}\n• Site: ${brand.site || "Não informado"}\n• Redes: ${redesList}`;
  const dimensoes = tipo?.toLowerCase().includes("carrossel") || tipo?.toLowerCase().includes("post")
    ? "1080 x 1350px (4:5 — padrão Feed/Carrossel Instagram)"
    : tipo?.toLowerCase().includes("stories") || tipo?.toLowerCase().includes("reels")
      ? "1080 x 1920px (9:16 — padrão Stories/Reels)"
      : "1080 x 1350px (4:5 — padrão Feed)";

  const isGaio = brand.nomeMarca.toLowerCase().includes("gaio");
  const setIndex = isGaio ? 2 : (versao % 3) + 1;
  const suffix = setIndex === 1 ? "" : `_v${setIndex}`;
  const timestamp = Date.now();

  const blocos = [
    `🎨 **BRIEFING DE DESIGN (Versão ${versao + 1}) — ${tipo || "Post"}**\n\n${identidadeBloco}\n\n---\n\n🖼️ **SUGESTÃO DE ARTE:**\nFormato: ${tipo || "Post"} | Dimensão: ${dimensoes}\nTítulo principal: "${tituloSugerido}"\nSubtítulo: ${subtituloSugerido}\n\n📐 **Diretrizes Atualizadas:**\n• Usar as cores da identidade visual da marca (conforme site: ${brand.site || "referência do perfil"})\n• Tipografia alinhada com o padrão das redes sociais da ${brand.nomeMarca}\n• Logo da ${brand.nomeMarca} no rodapé\n• Ícones minimalistas e modernos para reforçar o tema\n• Manter consistência visual com posts anteriores das redes da marca\n\n🎯 **Referência visual:** Analisar o estilo dos últimos posts publicados nas redes (${redesList}) e manter a mesma linha estética.${instrucao}`,
    `🎨 **BRIEFING DE DESIGN (Versão ${versao + 1}) — ${tipo || "Post"}**\n\n${identidadeBloco}\n\n---\n\n🖼️ **SUGESTÃO DE ARTE:**\nFormato: ${tipo || "Post"} — Layout 2 colunas | Dimensão: ${dimensoes}\nLado esquerdo: Texto impactante sobre "${tituloSugerido}" com fundo nas cores da marca\nLado direito: Imagem profissional relacionada ao tema\nRodapé: Logo ${brand.nomeMarca} + @handle das redes\n\n📐 **Diretrizes Atualizadas:**\n• Paleta de cores: extraída do site ${brand.site || "e perfis sociais"} da marca\n• Fontes: seguir o padrão tipográfico usado nas comunicações da ${brand.nomeMarca}\n• CTA visual no canto inferior direito\n• Elementos gráficos sutis conectando com o segmento (${brand.segmento || "geral"})\n\n🎯 **Referência visual:** Usar como base a linguagem visual das redes (${redesList}).${instrucao}`,
    `🎨 **BRIEFING DE DESIGN (Versão ${versao + 1}) — Carrossel ${tipo || "Post"}**\n\n${identidadeBloco}\n\n---\n\n🖼️ **SUGESTÃO DE ARTE (Carrossel 4+ páginas):**\nDimensão por página: ${dimensoes}\n\n**Página 1 (Capa):** "${tituloSugerido}" em tipografia bold, cores da marca, logo ${brand.nomeMarca} discreto no topo\n**Página 2 (Conteúdo):** "${subtituloSugerido}" em destaque.\n**Páginas seguintes:** Continuar o roteiro de slides conforme a copy aprovada.\n**Última Página (CTA):** "Seu próximo passo começa aqui →", botão visual, @handle e link do site\n\n📐 **Diretrizes Atualizadas:**\n• Cores: seguir a paleta da marca conforme site (${brand.site || "não informado"}) e redes\n• Transição visual suave entre páginas (manter a mesma família de cores)\n• Tipografia consistente com o branding da ${brand.nomeMarca}\n• Cada página deve funcionar isoladamente e em sequência\n\n🎯 **Referência visual:** Posts recentes nas redes (${redesList}).${instrucao}`
  ];

  const images = [
    `/generated-arts/carousel_cover${suffix}.png?t=${timestamp}`,
    `/generated-arts/carousel_data${suffix}.png?t=${timestamp}`,
    `/generated-arts/carousel_cta${suffix}.png?t=${timestamp}`
  ];

  return { text: blocos[versao % blocos.length], images };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const method = req.method || "GET";
  const url = new URL(req.url || "http://localhost/api", "http://localhost");
  const pathname = url.pathname.replace(/\/+$/, "");
  const body = parseBody(req.body);
  const segments = pathname.split("/").filter(Boolean);

  try {
    if (segments.length === 2 && segments[0] === "api" && segments[1] === "businesses") {
      if (method === "GET") {
        const businesses = await getPrisma().business.findMany({
          include: {
            brand_profiles: {
              where: { is_active: true },
              take: 1
            }
          }
        });
        return res.json(businesses);
      }

      if (method === "POST") {
        const business = await getPrisma().business.create({
          data: {
            nome_marca: String(body.nome_marca || ""),
            nome_interno: String(body.nome_interno || ""),
            segmento: body.segmento ? String(body.segmento) : null,
            descricao: body.descricao ? String(body.descricao) : null,
            site_url: body.site_url ? String(body.site_url) : null,
            idioma_principal: body.idioma_principal ? String(body.idioma_principal) : null,
            publico_alvo: body.publico_alvo ? String(body.publico_alvo) : null,
            objetivo_marketing: body.objetivo_marketing ? String(body.objetivo_marketing) : null,
            redes_sociais: typeof body.redes_sociais === "object" && body.redes_sociais ? body.redes_sociais : {}
          }
        });
        return res.json(business);
      }
    }

    if (segments.length === 3 && segments[0] === "api" && segments[1] === "businesses") {
      const id = segments[2];

      if (method === "PUT") {
        const business = await getPrisma().business.update({
          where: { id },
          data: {
            nome_marca: String(body.nome_marca || ""),
            nome_interno: String(body.nome_interno || ""),
            segmento: body.segmento ? String(body.segmento) : null
          }
        });
        return res.json(business);
      }

      if (method === "DELETE") {
        await getPrisma().business.delete({ where: { id } });
        return res.json({ success: true });
      }
    }

    if (segments.length === 2 && segments[0] === "api" && segments[1] === "brand-profiles" && method === "POST") {
      await getPrisma().brandProfile.updateMany({
        where: { business_id: String(body.business_id || "") },
        data: { is_active: false }
      });

      const profile = await getPrisma().brandProfile.create({
        data: {
          business_id: String(body.business_id || ""),
          is_active: true,
          tom_de_voz: body.tom_de_voz ? String(body.tom_de_voz) : null,
          estilo_comunicacao: body.estilo_comunicacao ? String(body.estilo_comunicacao) : null,
          palavras_usadas: Array.isArray(body.palavras_usadas) ? body.palavras_usadas.map(String) : [],
          palavras_evitar: Array.isArray(body.palavras_evitar) ? body.palavras_evitar.map(String) : [],
          publico_alvo: body.publico_alvo ? String(body.publico_alvo) : null,
          proposta_valor: body.proposta_valor ? String(body.proposta_valor) : null,
          diferenciais: Array.isArray(body.diferenciais) ? body.diferenciais.map(String) : [],
          estilo_visual: body.estilo_visual ? String(body.estilo_visual) : null,
          tipos_conteudo: Array.isArray(body.tipos_conteudo) ? body.tipos_conteudo.map(String) : [],
          exemplos_abordagem: Array.isArray(body.exemplos_abordagem) ? body.exemplos_abordagem.map(String) : []
        }
      });

      if (body.site_url !== undefined || body.redes_sociais !== undefined) {
        const businessUpdate: Prisma.BusinessUpdateInput = {};
        if (body.site_url !== undefined) businessUpdate.site_url = body.site_url ? String(body.site_url) : null;
        if (body.redes_sociais !== undefined && typeof body.redes_sociais === "object" && body.redes_sociais) {
          businessUpdate.redes_sociais = body.redes_sociais;
        }

        await getPrisma().business.update({
          where: { id: String(body.business_id || "") },
          data: businessUpdate
        });
      }

      return res.json(profile);
    }

    if (segments.length === 2 && segments[0] === "api" && segments[1] === "campaigns") {
      if (method === "GET") {
        const businessId = url.searchParams.get("business_id");
        const where = businessId ? { business_id: businessId } : {};
        const campaigns = await getPrisma().campaign.findMany({
          where,
          include: { _count: { select: { contents: true } } },
          orderBy: { created_at: "desc" }
        });
        return res.json(campaigns);
      }

      if (method === "POST") {
        const campaign = await getPrisma().campaign.create({
          data: {
            business_id: String(body.business_id || ""),
            nome: String(body.nome || ""),
            objetivo: String(body.objetivo || ""),
            descricao: body.descricao ? String(body.descricao) : null,
            publico_alvo: body.publico_alvo ? String(body.publico_alvo) : null,
            mensagem_central: body.mensagem_central ? String(body.mensagem_central) : null,
            cta_principal: body.cta_principal ? String(body.cta_principal) : null,
            canais: Array.isArray(body.canais) ? body.canais.map(String) : [],
            data_inicio: body.data_inicio ? new Date(String(body.data_inicio)) : null,
            data_fim: body.data_fim ? new Date(String(body.data_fim)) : null,
            tipo_midia: body.tipo_midia ? String(body.tipo_midia) : "ORGANICO",
            status: body.status ? String(body.status) : "RASCUNHO"
          }
        });
        return res.json(campaign);
      }
    }

    if (segments.length === 2 && segments[0] === "api" && segments[1] === "contents") {
      if (method === "GET") {
        const campaignId = url.searchParams.get("campaign_id");
        const where = campaignId ? { campaign_id: campaignId } : {};
        const contents = await getPrisma().content.findMany({
          where,
          include: { campaign: { select: { nome: true } } },
          orderBy: { data: "asc" }
        });
        return res.json(contents);
      }

      if (method === "POST") {
        const content = await getPrisma().content.create({
          data: {
            campaign_id: String(body.campaign_id || ""),
            data: body.data ? new Date(String(body.data)) : null,
            tipo_conteudo: body.tipo_conteudo ? String(body.tipo_conteudo) : null,
            tema: body.tema ? String(body.tema) : null,
            objetivo_post: body.objetivo_post ? String(body.objetivo_post) : null,
            status: "PENDENTE"
          }
        });
        return res.json(content);
      }
    }

    if (segments.length === 3 && segments[0] === "api" && segments[1] === "contents" && method === "PATCH") {
      const id = segments[2];
      const content = await getPrisma().content.update({
        where: { id },
        data: body
      });
      return res.json(content);
    }

    if (segments.length === 4 && segments[0] === "api" && segments[1] === "contents" && segments[3] === "generate" && method === "POST") {
      const id = segments[2];
      const existing = await getPrisma().content.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: "Conteúdo não encontrado" });

      const pesquisa = gerarPesquisa(existing.tema || "Tema", existing.objetivo_post || "", 0);
      const content = await getPrisma().content.update({
        where: { id },
        data: { status: "EM_PRODUCAO", agente_atual: "Pesquisador", resultados_agentes: { pesquisa, _retryCount: 0 } }
      });
      return res.json({ message: "Squad iniciado", content });
    }

    if (segments.length === 4 && segments[0] === "api" && segments[1] === "contents" && segments[3] === "advance" && method === "POST") {
      const id = segments[2];
      const current = await getPrisma().content.findUnique({ where: { id } });
      if (!current) return res.status(404).json({ error: "Conteúdo não encontrado" });

      const antigos = toAgentResults(current.resultados_agentes);
      const currentAgent = body.current_agent ? String(body.current_agent) : "";
      const observacao = body.observacao ? String(body.observacao) : undefined;

      if (currentAgent === "Pesquisador") {
        const mockCopy = gerarCopy(current.tema || "Tema", current.objetivo_post || "", 0, antigos.pesquisa, observacao);
        const content = await getPrisma().content.update({
          where: { id },
          data: { agente_atual: "Copywriter", texto_gerado: mockCopy, resultados_agentes: { ...antigos, copy: mockCopy, _retryCount: 0 } }
        });
        return res.json(content);
      }

      if (currentAgent === "Copywriter") {
        const brandData = await fetchBrandData(id);
        const designResult = gerarDesign(current.tema || "Tema", current.tipo_conteudo || "", 0, brandData, observacao, current.texto_gerado || undefined);
        const content = await getPrisma().content.update({
          where: { id },
          data: { agente_atual: "Designer", resultados_agentes: { ...antigos, design: designResult.text, design_images: designResult.images, _retryCount: 0 } }
        });
        return res.json(content);
      }

      if (currentAgent === "Designer") {
        const content = await getPrisma().content.update({
          where: { id },
          data: { status: "REVISAO", agente_atual: "Aguardando Aprovação" }
        });
        return res.json(content);
      }

      return res.status(400).json({ error: "Agente não reconhecido" });
    }

    if (segments.length === 4 && segments[0] === "api" && segments[1] === "contents" && segments[3] === "retry" && method === "POST") {
      const id = segments[2];
      const current = await getPrisma().content.findUnique({ where: { id } });
      if (!current) return res.status(404).json({ error: "Conteúdo não encontrado" });

      const antigos = toAgentResults(current.resultados_agentes);
      const version = (antigos._retryCount || 0) + 1;
      const observacao = body.observacao ? String(body.observacao) : undefined;
      const agent = body.target_agent ? String(body.target_agent) : current.agente_atual;

      if (agent === "Pesquisador") {
        const pesquisa = gerarPesquisa(current.tema || "Tema", current.objetivo_post || "", version);
        const updated = await getPrisma().content.update({
          where: { id },
          data: { status: "EM_PRODUCAO", agente_atual: "Pesquisador", resultados_agentes: { ...antigos, pesquisa, _retryCount: version } }
        });
        return res.json(updated);
      }

      if (agent === "Copywriter") {
        const copy = gerarCopy(current.tema || "Tema", current.objetivo_post || "", version, antigos.pesquisa, observacao);
        const updated = await getPrisma().content.update({
          where: { id },
          data: { status: "EM_PRODUCAO", agente_atual: "Copywriter", texto_gerado: copy, resultados_agentes: { ...antigos, copy, _retryCount: version } }
        });
        return res.json(updated);
      }

      if (agent === "Designer") {
        const brandData = await fetchBrandData(id);
        const designResult = gerarDesign(current.tema || "Tema", current.tipo_conteudo || "", version, brandData, observacao, antigos.copy || undefined);
        const updated = await getPrisma().content.update({
          where: { id },
          data: { status: "EM_PRODUCAO", agente_atual: "Designer", resultados_agentes: { ...antigos, design: designResult.text, design_images: designResult.images, _retryCount: version } }
        });
        return res.json(updated);
      }

      return res.json(current);
    }

    if (segments.length === 4 && segments[0] === "api" && segments[1] === "contents" && segments[3] === "publish" && method === "POST") {
      const id = segments[2];
      const content = await getPrisma().content.update({
        where: { id },
        data: { status: "PUBLICADO", agente_atual: "Publicador" }
      });
      return res.json({ message: "Publicado", content });
    }

    return res.status(404).json({ error: "Rota não encontrada" });
  } catch (error) {
    return sendApiError(res, 500, "Erro interno da API", error);
  }
}
