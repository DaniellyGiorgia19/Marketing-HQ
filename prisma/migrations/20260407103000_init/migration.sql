-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "nome_marca" TEXT NOT NULL,
    "nome_interno" TEXT NOT NULL,
    "segmento" TEXT,
    "descricao" TEXT,
    "site_url" TEXT,
    "redes_sociais" JSONB,
    "idioma_principal" TEXT,
    "publico_alvo" TEXT,
    "objetivo_marketing" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandProfile" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "tom_de_voz" TEXT,
    "estilo_comunicacao" TEXT,
    "palavras_usadas" TEXT[],
    "palavras_evitar" TEXT[],
    "publico_alvo" TEXT,
    "temas_prioritarios" TEXT[],
    "proposta_valor" TEXT,
    "diferenciais" TEXT[],
    "estilo_visual" TEXT,
    "tipos_conteudo" TEXT[],
    "exemplos_abordagem" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "objetivo" TEXT NOT NULL,
    "descricao" TEXT,
    "publico_alvo" TEXT,
    "mensagem_central" TEXT,
    "cta_principal" TEXT,
    "canais" TEXT[],
    "data_inicio" TIMESTAMP(3),
    "data_fim" TIMESTAMP(3),
    "tipo_midia" TEXT NOT NULL DEFAULT 'ORGANICO',
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "data" TIMESTAMP(3),
    "tipo_conteudo" TEXT,
    "tema" TEXT,
    "objetivo_post" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "agente_atual" TEXT,
    "texto_gerado" TEXT,
    "resultados_agentes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BrandProfile" ADD CONSTRAINT "BrandProfile_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
