import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rota básica para testes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Marketing HQ API is running' });
});

// Cadastro de Negócios (Módulo 1)
app.get('/api/businesses', async (req, res) => {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        brand_profiles: {
          where: { is_active: true },
          take: 1
        }
      }
    });
    res.json(businesses);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar negócios' });
  }
});

app.post('/api/businesses', async (req, res) => {
  try {
    const data = req.body;
    const business = await prisma.business.create({
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
    res.status(500).json({ error: 'Erro ao criar negócio' });
  }
});

app.put('/api/businesses/:id', async (req, res) => {
  try {
    const data = req.body;
    const business = await prisma.business.update({
      where: { id: req.params.id },
      data: {
        nome_marca: data.nome_marca,
        nome_interno: data.nome_interno,
        segmento: data.segmento
      }
    });
    res.json(business);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar negócio' });
  }
});

app.delete('/api/businesses/:id', async (req, res) => {
  try {
    await prisma.business.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir negócio' });
  }
});

// Inteligência da Marca (Módulo 2 e 3)
app.post('/api/brand-profiles', async (req, res) => {
  try {
    const data = req.body;
    // Invalida outros perfis ativos do mesmo negócio
    await prisma.brandProfile.updateMany({
      where: { business_id: data.business_id },
      data: { is_active: false }
    });

    const profile = await prisma.brandProfile.create({
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

    // Salva site_url e redes_sociais no cadastro do Negócio
    if (data.site_url !== undefined || data.redes_sociais !== undefined) {
      const businessUpdate: any = {};
      if (data.site_url !== undefined) businessUpdate.site_url = data.site_url;
      if (data.redes_sociais !== undefined) businessUpdate.redes_sociais = data.redes_sociais;
      await prisma.business.update({
        where: { id: data.business_id },
        data: businessUpdate
      });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar Brand Profile' });
  }
});

// Campanhas (Módulo 4)
app.get('/api/campaigns', async (req, res) => {
  try {
    const businessId = req.query.business_id as string;
    const where = businessId ? { business_id: businessId } : {};
    const campaigns = await prisma.campaign.findMany({
      where,
      include: { _count: { select: { contents: true } } },
      orderBy: { created_at: 'desc' }
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar campanhas' });
  }
});

app.post('/api/campaigns', async (req, res) => {
  try {
    const data = req.body;
    const campaign = await prisma.campaign.create({
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
    res.status(500).json({ error: 'Erro ao criar campanha' });
  }
});

// Calendário de Conteúdo (Módulo 5)
app.get('/api/contents', async (req, res) => {
  try {
    const campaignId = req.query.campaign_id as string;
    const where = campaignId ? { campaign_id: campaignId } : {};
    const contents = await prisma.content.findMany({
      where,
      include: { campaign: { select: { nome: true } } },
      orderBy: { data: 'asc' }
    });
    res.json(contents);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar conteúdos' });
  }
});

app.post('/api/contents', async (req, res) => {
  try {
    const data = req.body;
    const content = await prisma.content.create({
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
    res.status(500).json({ error: 'Erro ao criar conteúdo' });
  }
});

app.patch('/api/contents/:id', async (req, res) => {
  try {
    const content = await prisma.content.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar conteúdo' });
  }
});

// Simulação de Execução do Squad (Integração Fase 4)
// Funções auxiliares para gerar mock baseado no briefing real
function gerarPesquisa(tema: string, objetivo: string, versao: number) {
  const blocos = [
    `O tema "${tema}" está em alta nas redes sociais. Análise de tendências mostra crescimento de 45% em buscas relacionadas nos últimos 3 meses.\n\nContexto: ${objetivo || 'Engajamento e alcance orgânico'}\n\nPalavras-chave: ${tema.split(' ').slice(0, 3).join(', ')}, Estratégia Digital, Resultados.\n\n🔗 **Fontes de Inteligência Utilizadas:**\n1. [Google Trends - "${tema}"](https://trends.google.com/trends/explore?q=${encodeURIComponent(tema)})\n2. [Análise de Mercado - Semrush](https://semrush.com/analytics)\n3. Benchmark de Concorrentes (Base Interna)`,
    `Pesquisa aprofundada sobre "${tema}": Identificamos que o público-alvo responde melhor a conteúdos que combinam dados concretos com storytelling pessoal.\n\nObjetivo alinhado: ${objetivo || 'Gerar autoridade e conversões'}\n\nPalavras-chave: ${tema.split(' ').slice(0, 3).join(', ')}, Autoridade, Conversão.\n\n🔗 **Fontes de Inteligência Utilizadas:**\n1. [Content Marketing Institute - Report 2026](https://contentmarketinginstitute.com/report)\n2. [HubSpot State of Marketing](https://hubspot.com/state-of-marketing)\n3. Análise de Engajamento dos últimos 30 dias (Base Interna)`,
    `Mapeamento competitivo sobre "${tema}": Os 3 principais concorrentes estão abordando este assunto com foco em educação e prova social. Oportunidade de diferenciação usando tom mais direto e dados exclusivos.\n\nObjetivo: ${objetivo || 'Posicionamento de marca'}\n\nPalavras-chave: ${tema.split(' ').slice(0, 3).join(', ')}, Diferenciação, Prova Social.\n\n🔗 **Fontes de Inteligência Utilizadas:**\n1. [Panorama do Marketing Digital - RD Station](https://resultadosdigitais.com.br/panorama)\n2. [Relatório de Redes Sociais - mLabs](https://mlabs.com.br/relatorio)\n3. Monitoramento de Concorrentes (Base Interna)`
  ];
  return blocos[versao % blocos.length];
}

function gerarCopy(tema: string, objetivo: string, versao: number, pesquisa?: string, obs?: string) {
  // Extrai frases completas com dados da pesquisa (não apenas o número)
  const linhas = pesquisa?.split('\n').filter(l => l.trim().length > 0) || [];
  const fraseDado1 = linhas.find(l => /\d+%/.test(l)) || `O tema "${tema}" apresenta crescimento expressivo em buscas e engajamento nas redes`;
  const fraseDado2 = linhas.find((l, i) => /\d+%/.test(l) && i !== linhas.indexOf(fraseDado1)) || 'Marcas que abordam esse assunto com dados reais conquistam mais autoridade e confiança';
  
  // Extrai palavras-chave
  const kwMatch = pesquisa?.match(/Palavras-chave:\s*(.+)/);
  const palavrasChave = kwMatch ? kwMatch[1].split(',').map(k => k.trim()).slice(0, 4) : [tema.split(' ')[0], 'Estratégia', 'Resultados'];
  const hashtags = palavrasChave.map(k => `#${k.replace(/\s+/g, '')}`).join(' ') + ` #${tema.replace(/\s+/g, '')} #MarketingDigital`;

  const instrucaoUsuario = obs 
    ? `\n\n💬 *Ajuste aplicado conforme orientação do usuário: "${obs}"*` 
    : '';

  // Bloco interno (só para o revisor, não vai na publicação)
  const blocoInterno = objetivo 
    ? `\n\n---\n\n📋 **NOTA INTERNA (não publicar):**\nObjetivo estratégico: ${objetivo}` 
    : '';

  const blocos = [
    `✏️ **TEXTO DA ARTE:**\n"${tema}"\nSubtítulo: "${fraseDado1.replace(/^.*?(\d+%)/, '$1').trim()}"\n\n---\n\n📝 **LEGENDA:**\n${fraseDado1.trim()}\n\nE isso muda completamente o jogo para quem atua nesse mercado.\n\nAlém disso: ${fraseDado2.trim().toLowerCase()}\n\nO cenário é claro — quem entende e aplica ${tema.toLowerCase()} agora está construindo uma vantagem competitiva real.\n\nA dúvida não é mais se vale a pena, mas o que você está esperando para começar.\n\n👉 Salve este post e envie para alguém que precisa ver esses dados.\n\n---\n\n🏷️ **HASHTAGS:**\n${hashtags}${blocoInterno}${instrucaoUsuario}`,

    `✏️ **TEXTO DA ARTE:**\n"Você já parou para olhar os dados sobre ${tema.toLowerCase()}?"\nDestaque visual: "${fraseDado1.replace(/^.*?(\d+%)/, '$1').trim()}"\n\n---\n\n📝 **LEGENDA:**\nOs dados sobre ${tema.toLowerCase()} estão surpreendendo o mercado:\n\n📊 ${fraseDado1.trim()}\n📈 ${fraseDado2.trim()}\n\nIsso não é achismo — são números reais de pesquisas recentes.\n\nE o mais importante: quem está atento a esses dados já está tomando decisões melhores, mais rápido.\n\nNão espere o mercado te dizer o que já está acontecendo. Antecipe-se.\n\nQual desses dados mais chamou sua atenção? Me conta nos comentários 👇\n\n---\n\n🏷️ **HASHTAGS:**\n${hashtags}${blocoInterno}${instrucaoUsuario}`,

    `✏️ **TEXTO DA ARTE:**\nPágina 1: "${tema}"\nPágina 2: "${fraseDado1.replace(/^.*?(\d+%)/, '$1').trim()}"\nPágina 3: "Quem entende os dados, lidera o mercado"\nPágina 4: "Seu próximo passo começa aqui →"\n\n---\n\n📝 **LEGENDA:**\nVamos colocar os dados na mesa sobre ${tema.toLowerCase()}? 📊\n\n${fraseDado1.trim()}\n\nMas não para por aí:\n${fraseDado2.trim()}\n\nEsses números mostram uma direção clara: ${tema.toLowerCase()} não é mais opcional para quem quer crescer de verdade.\n\nE a boa notícia? Você está lendo isso agora. Ainda dá tempo de agir.\n\nArrasta pro lado e veja como aplicar isso no seu negócio →\n\n---\n\n🏷️ **HASHTAGS:**\n${hashtags}${blocoInterno}${instrucaoUsuario}`
  ];
  return blocos[versao % blocos.length];
}

// Busca dados da marca a partir de um Content
async function fetchBrandData(contentId: string) {
  const content = await prisma.content.findUnique({
    where: { id: contentId },
    include: { campaign: { include: { business: { include: { brand_profiles: { where: { is_active: true } } } } } } }
  });
  const biz = content?.campaign?.business;
  const brand = biz?.brand_profiles?.[0];
  return {
    nomeMarca: biz?.nome_marca || 'Marca',
    site: biz?.site_url || '',
    redes: biz?.redes_sociais as any || {},
    segmento: biz?.segmento || '',
    estiloVisual: brand?.estilo_visual || '',
    tomDeVoz: brand?.tom_de_voz || '',
  };
}

function gerarDesign(tema: string, tipo: string, versao: number, brand: { nomeMarca: string; site: string; redes: any; segmento: string; estiloVisual: string }, obs?: string) {
  // Extrai redes sociais
  const redesList = Object.entries(brand.redes || {})
    .filter(([_, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ') || 'Sem redes cadastradas';

  const instrucao = obs
    ? `\n\n💬 *Ajuste aplicado conforme orientação do usuário: "${obs}"*`
    : '';

  const identidadeBloco = `📋 **IDENTIDADE VISUAL DA MARCA:**\n• Marca: ${brand.nomeMarca}\n• Segmento: ${brand.segmento || 'Não definido'}\n• Estilo visual: ${brand.estiloVisual || 'Seguir padrão do site e redes sociais da marca'}\n• Site: ${brand.site || 'Não informado'}\n• Redes: ${redesList}`;

  // Dimensões padrão redes sociais 2026
  const dimensoes = tipo?.toLowerCase().includes('carrossel') || tipo?.toLowerCase().includes('post')
    ? '1080 x 1350px (4:5 — padrão Feed/Carrossel Instagram)'
    : tipo?.toLowerCase().includes('stories') || tipo?.toLowerCase().includes('reels')
      ? '1080 x 1920px (9:16 — padrão Stories/Reels)'
      : '1080 x 1350px (4:5 — padrão Feed)';

  const blocos = [
    `🎨 **BRIEFING DE DESIGN — ${tipo || 'Post'}**\n\n${identidadeBloco}\n\n---\n\n🖼️ **SUGESTÃO DE ARTE:**\nFormato: ${tipo || 'Post'} | Dimensão: ${dimensoes}\nTítulo principal: "${tema}"\nSubtítulo: Frase de impacto extraída da copy\n\n📐 **Diretrizes:**\n• Usar as cores da identidade visual da marca (conforme site: ${brand.site || 'referência do perfil'})\n• Tipografia alinhada com o padrão das redes sociais da ${brand.nomeMarca}\n• Logo da ${brand.nomeMarca} no rodapé\n• Ícones minimalistas e modernos para reforçar o tema\n• Manter consistência visual com posts anteriores das redes da marca\n\n🎯 **Referência visual:** Analisar o estilo dos últimos posts publicados nas redes (${redesList}) e manter a mesma linha estética.${instrucao}`,

    `🎨 **BRIEFING DE DESIGN — ${tipo || 'Post'}**\n\n${identidadeBloco}\n\n---\n\n🖼️ **SUGESTÃO DE ARTE:**\nFormato: ${tipo || 'Post'} — Layout 2 colunas | Dimensão: ${dimensoes}\nLado esquerdo: Texto impactante sobre "${tema}" com fundo nas cores da marca\nLado direito: Imagem profissional relacionada ao tema\nRodapé: Logo ${brand.nomeMarca} + @handle das redes\n\n📐 **Diretrizes:**\n• Paleta de cores: extraída do site ${brand.site || 'e perfis sociais'} da marca\n• Fontes: seguir o padrão tipográfico usado nas comunicações da ${brand.nomeMarca}\n• CTA visual no canto inferior direito\n• Elementos gráficos sutis conectando com o segmento (${brand.segmento || 'geral'})\n\n🎯 **Referência visual:** Usar como base a linguagem visual das redes (${redesList}).${instrucao}`,

    `🎨 **BRIEFING DE DESIGN — Carrossel ${tipo || 'Post'}**\n\n${identidadeBloco}\n\n---\n\n🖼️ **SUGESTÃO DE ARTE (Carrossel 4 páginas):**\nDimensão por página: ${dimensoes}\n\n**Página 1 (Capa):** "${tema}" em tipografia bold, cores da marca, logo ${brand.nomeMarca} discreto no topo\n**Página 2:** Dado de impacto em destaque (número grande + contexto), fundo com cor primária da marca\n**Página 3:** Conteúdo educativo com ícones e bullets, fundo com cor secundária\n**Página 4 (CTA):** "Seu próximo passo começa aqui →", botão visual, @handle e link do site\n\n📐 **Diretrizes:**\n• Cores: seguir a paleta da marca conforme site (${brand.site || 'não informado'}) e redes\n• Transição visual suave entre páginas (manter a mesma família de cores)\n• Tipografia consistente com o branding da ${brand.nomeMarca}\n• Cada página deve funcionar isoladamente e em sequência\n\n🎯 **Referência visual:** Posts recentes nas redes (${redesList}).${instrucao}`
  ];
  
  const images = [
    '/generated-arts/carousel_cover.png',
    '/generated-arts/carousel_data.png',
    '/generated-arts/carousel_cta.png'
  ];

  return { text: blocos[versao % blocos.length], images };
}

app.post('/api/contents/:id/generate', async (req, res) => {
  try {
    const contentId = req.params.id;
    const existing = await prisma.content.findUnique({ where: { id: contentId } });
    if (!existing) return res.status(404).json({ error: 'Conteúdo não encontrado' });

    const tema = existing.tema || 'Tema não definido';
    const objetivo = existing.objetivo_post || '';
    const pesquisa = gerarPesquisa(tema, objetivo, 0);

    let content = await prisma.content.update({
      where: { id: contentId },
      data: { 
        status: 'EM_PRODUCAO', 
        agente_atual: 'Pesquisador',
        resultados_agentes: { pesquisa, _retryCount: 0 }
      }
    });

    res.json({ message: 'Squad iniciado com sucesso', content });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao iniciar geração' });
  }
});

app.post('/api/contents/:id/advance', async (req, res) => {
  try {
    const contentId = req.params.id;
    const { current_agent, observacao } = req.body;

    const current = await prisma.content.findUnique({ where: { id: contentId } });
    if (!current) return res.status(404).json({ error: 'Conteúdo não encontrado' });
    
    const antigos = (current.resultados_agentes as any) || {};
    const tema = current.tema || 'Tema não definido';
    const objetivo = current.objetivo_post || '';

    let obsText = "";
    if (observacao && observacao.trim().length > 0) {
      obsText = `\n\n📌 **Observação do Usuário aplicada:**\n"${observacao}"`;
    }

    if (current_agent === 'Pesquisador') {
      const mockCopy = gerarCopy(tema, objetivo, 0, antigos.pesquisa, observacao);
      const content = await prisma.content.update({
        where: { id: contentId },
        data: {
          agente_atual: 'Copywriter',
          texto_gerado: mockCopy,
          resultados_agentes: { ...antigos, copy: mockCopy, _retryCount: 0 }
        }
      });
      return res.json(content);
    }
    
    if (current_agent === 'Copywriter') {
      const brandData = await fetchBrandData(contentId);
      const designResult = gerarDesign(tema, current.tipo_conteudo || '', 0, brandData, observacao);
      const content = await prisma.content.update({
        where: { id: contentId },
        data: {
          agente_atual: 'Designer',
          resultados_agentes: { ...antigos, design: designResult.text, design_images: designResult.images, _retryCount: 0 }
        }
      });
      return res.json(content);
    }

    if (current_agent === 'Designer') {
      const content = await prisma.content.update({
        where: { id: contentId },
        data: {
          status: 'REVISAO',
          agente_atual: 'Aguardando Aprovação'
        }
      });
      return res.json(content);
    }

    res.status(400).json({ error: 'Agente não reconhecido' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao avançar pipeline' });
  }
});

app.post('/api/contents/:id/retry', async (req, res) => {
  try {
    const contentId = req.params.id;
    const { observacao, target_agent } = req.body;
    const current = await prisma.content.findUnique({ where: { id: contentId } });
    if (!current) return res.status(404).json({ error: 'Conteúdo não encontrado' });
    
    const antigos = (current.resultados_agentes as any) || {};
    const version = (antigos._retryCount || 0) + 1;
    const tema = current.tema || 'Tema não definido';
    const objetivo = current.objetivo_post || '';

    // Use target_agent from frontend (based on active tab), fallback to agente_atual
    const agent = target_agent || current.agente_atual;

    let obsBlock = "";
    if (observacao && observacao.trim().length > 0) {
      obsBlock = `\n\n✅ **Ajuste aplicado conforme orientação do usuário:**\n"${observacao}"`;
    }

    if (agent === 'Pesquisador') {
      const novoTexto = gerarPesquisa(tema, objetivo, version) + obsBlock;
      const updated = await prisma.content.update({
        where: { id: contentId },
        data: { 
          agente_atual: 'Pesquisador',
          status: 'EM_PRODUCAO',
          resultados_agentes: { ...antigos, pesquisa: novoTexto, _retryCount: version } 
        }
      });
      return res.json(updated);
    }
    
    if (agent === 'Copywriter') {
      const novoTexto = gerarCopy(tema, objetivo, version, antigos.pesquisa, observacao);
      const updated = await prisma.content.update({
        where: { id: contentId },
        data: { 
          agente_atual: 'Copywriter',
          status: 'EM_PRODUCAO',
          texto_gerado: novoTexto,
          resultados_agentes: { ...antigos, copy: novoTexto, _retryCount: version } 
        }
      });
      return res.json(updated);
    }

    if (agent === 'Designer') {
      const brandData = await fetchBrandData(contentId);
      const designResult = gerarDesign(tema, current.tipo_conteudo || '', version, brandData, observacao);
      const updated = await prisma.content.update({
        where: { id: contentId },
        data: { 
          agente_atual: 'Designer',
          status: 'EM_PRODUCAO',
          resultados_agentes: { ...antigos, design: designResult.text, design_images: designResult.images, _retryCount: version } 
        }
      });
      return res.json(updated);
    }

    res.json(current);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao refazer etapa' });
  }
});

app.post('/api/contents/:id/publish', async (req, res) => {
  try {
    const contentId = req.params.id;
    let content = await prisma.content.update({
      where: { id: contentId },
      data: { status: 'PUBLICADO', agente_atual: 'Publicador' }
    });
    
    setTimeout(async () => {
      await prisma.content.update({ where: { id: contentId }, data: { agente_atual: 'Analista' }});
    }, 2000);
    
    setTimeout(async () => {
      await prisma.content.update({ where: { id: contentId }, data: { agente_atual: 'Análise Concluída' }});
    }, 5000);

    res.json({ message: 'Publicado com sucesso', content });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao publicar' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Backend server is running on http://localhost:${port}`);
});
