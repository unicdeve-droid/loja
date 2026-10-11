import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Admin user
  const senhaHash = await bcrypt.hash('admin123', 10)
  await prisma.usuario.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: { nome: 'Administrador', email: 'admin@admin.com', senha: senhaHash, role: Role.ADMIN },
  })
  console.log('  ✓ Admin criado: admin@admin.com / admin123')

  // Site configs
  const configs = [
    { key: 'prazo_entrega_dias', value: '7' },
    { key: 'frete_gratis_acima', value: '299' },
    { key: 'asaas_env', value: 'sandbox' },
    { key: 'asaas_api_key', value: '' },
    { key: 'correios_cep_origem', value: '87013060' },
    { key: 'site_nome', value: 'Minha Loja' },
    { key: 'site_descricao', value: 'Loja Online' },
    { key: 'logo_url', value: '/uploads/logo.png' },
  ]
  for (const config of configs) {
    await prisma.siteConfig.upsert({ where: { key: config.key }, update: {}, create: config })
  }
  console.log('  ✓ Configurações padrão criadas')

  // Categories
  const categoriasData = [
    { nome: 'Ar e Ventilação', slug: 'ar-e-ventilacao', ordem: 1 },
    { nome: 'Beleza e Saúde', slug: 'beleza-e-saude', ordem: 2 },
    { nome: 'Celulares e Smartphones', slug: 'celulares-e-smartphones', ordem: 3 },
    { nome: 'Colchões e Acessórios', slug: 'colchoes-e-acessorios', ordem: 4 },
    { nome: 'Eletrodomésticos', slug: 'eletrodomesticos', ordem: 5 },
    { nome: 'Eletrônicos', slug: 'eletronicos', ordem: 6 },
    { nome: 'Eletroportáteis', slug: 'eletroportateis', ordem: 7 },
    { nome: 'TV e Vídeo', slug: 'tv-e-video', ordem: 8 },
    { nome: 'Informática', slug: 'informatica', ordem: 9 },
    { nome: 'Móveis', slug: 'moveis', ordem: 10 },
  ]

  const cats: Record<string, string> = {}
  for (const cat of categoriasData) {
    const c = await prisma.categoria.upsert({
      where: { slug: cat.slug }, update: {}, create: { ...cat, ativo: true },
    })
    cats[cat.slug] = c.id
  }
  console.log('  ✓ 10 categorias criadas')

  // Sample products (3 per category)
  const produtos = [
    { nome: 'Ar Condicionado Split 9000 BTUs', slug: 'ar-condicionado-split-9000', categoriaId: cats['ar-e-ventilacao'], preco: 1299.90, precoOriginal: 1599.90, descricao: 'Ar Condicionado Split Inverter 9000 BTUs com alta eficiência energética.', fotos: ['/uploads/placeholder.jpg'], temVoltagem: true, mediaEstrelas: 4.5, totalAvaliacoes: 12 },
    { nome: 'Ventilador de Mesa 40cm', slug: 'ventilador-mesa-40cm', categoriaId: cats['ar-e-ventilacao'], preco: 149.90, precoOriginal: 199.90, descricao: 'Ventilador de Mesa 40cm com 3 velocidades e timer.', fotos: ['/uploads/placeholder.jpg'], temVoltagem: true, mediaEstrelas: 4.2, totalAvaliacoes: 8 },
    { nome: 'Purificador de Ar HEPA', slug: 'purificador-ar-hepa', categoriaId: cats['ar-e-ventilacao'], preco: 899.90, descricao: 'Purificador de Ar com Filtro HEPA H13, remove 99.97% das partículas.', fotos: ['/uploads/placeholder.jpg'], mediaEstrelas: 4.8, totalAvaliacoes: 25 },
    { nome: 'Secador de Cabelo 2200W', slug: 'secador-cabelo-2200w', categoriaId: cats['beleza-e-saude'], preco: 189.90, precoOriginal: 249.90, descricao: 'Secador de Cabelo Profissional 2200W com difusor e concentrador.', fotos: ['/uploads/placeholder.jpg'], temVoltagem: true, mediaEstrelas: 4.6, totalAvaliacoes: 34 },
    { nome: 'Prancha Alisadora Bivolt', slug: 'prancha-alisadora-bivolt', categoriaId: cats['beleza-e-saude'], preco: 129.90, precoOriginal: 179.90, descricao: 'Prancha Alisadora com temperatura ajustável e tecnologia de íons.', fotos: ['/uploads/placeholder.jpg'], temVoltagem: true, mediaEstrelas: 4.3, totalAvaliacoes: 19 },
    { nome: 'Aparelho de Depilação', slug: 'aparelho-depilacao-eletrica', categoriaId: cats['beleza-e-saude'], preco: 299.90, descricao: 'Aparelho de Depilação Elétrica sem fio com 4 cabeças intercambiáveis.', fotos: ['/uploads/placeholder.jpg'], mediaEstrelas: 4.1, totalAvaliacoes: 7 },
    { nome: 'Smartphone Android 128GB', slug: 'smartphone-android-128gb', categoriaId: cats['celulares-e-smartphones'], preco: 1499.90, precoOriginal: 1899.90, descricao: 'Smartphone com tela 6.5", câmera 64MP, bateria 5000mAh.', fotos: ['/uploads/placeholder.jpg'], temCor: true, mediaEstrelas: 4.7, totalAvaliacoes: 56 },
    { nome: 'Fone Bluetooth ANC', slug: 'fone-bluetooth-anc', categoriaId: cats['celulares-e-smartphones'], preco: 199.90, precoOriginal: 299.90, descricao: 'Fone de Ouvido Bluetooth 5.0 com cancelamento de ruído ativo.', fotos: ['/uploads/placeholder.jpg'], temCor: true, mediaEstrelas: 4.4, totalAvaliacoes: 42 },
    { nome: 'Carregador Turbo 65W', slug: 'carregador-turbo-65w', categoriaId: cats['celulares-e-smartphones'], preco: 89.90, descricao: 'Carregador Turbo 65W com cabo USB-C incluso.', fotos: ['/uploads/placeholder.jpg'], mediaEstrelas: 4.5, totalAvaliacoes: 28 },
    { nome: 'Colchão Casal Molas', slug: 'colchao-casal-molas', categoriaId: cats['colchoes-e-acessorios'], preco: 2499.90, precoOriginal: 3299.90, descricao: 'Colchão Casal com Molas Ensacadas, espuma viscoelástica e pillow top.', fotos: ['/uploads/placeholder.jpg'], mediaEstrelas: 4.9, totalAvaliacoes: 21 },
    { nome: 'Travesseiro NASA', slug: 'travesseiro-nasa', categoriaId: cats['colchoes-e-acessorios'], preco: 89.90, precoOriginal: 129.90, descricao: 'Travesseiro com espuma NASA anti-alérgico com capa lavável.', fotos: ['/uploads/placeholder.jpg'], mediaEstrelas: 4.5, totalAvaliacoes: 33 },
    { nome: 'Protetor de Colchão', slug: 'protetor-colchao-casal', categoriaId: cats['colchoes-e-acessorios'], preco: 79.90, descricao: 'Protetor de Colchão Impermeável Casal com elástico.', fotos: ['/uploads/placeholder.jpg'], temTamanho: true, mediaEstrelas: 4.3, totalAvaliacoes: 16 },
    { nome: 'Geladeira Frost Free 375L', slug: 'geladeira-frost-free-375l', categoriaId: cats['eletrodomesticos'], preco: 3299.90, precoOriginal: 3999.90, descricao: 'Geladeira Frost Free 375L com painel eletrônico e dispenser.', fotos: ['/uploads/placeholder.jpg'], temVoltagem: true, mediaEstrelas: 4.6, totalAvaliacoes: 28 },
    { nome: 'Máquina de Lavar 11kg', slug: 'maquina-lavar-11kg', categoriaId: cats['eletrodomesticos'], preco: 1999.90, precoOriginal: 2499.90, descricao: 'Máquina de Lavar 11kg com 17 programas e tecnologia inverter.', fotos: ['/uploads/placeholder.jpg'], temVoltagem: true, mediaEstrelas: 4.5, totalAvaliacoes: 19 },
    { nome: 'Fogão 5 Bocas Inox', slug: 'fogao-5-bocas-inox', categoriaId: cats['eletrodomesticos'], preco: 1499.90, precoOriginal: 1799.90, descricao: 'Fogão 5 Bocas com mesa em inox e acendimento automático.', fotos: ['/uploads/placeholder.jpg'], mediaEstrelas: 4.4, totalAvaliacoes: 37 },
    { nome: 'Smart TV 55" 4K', slug: 'smart-tv-55-4k', categoriaId: cats['eletronicos'], preco: 2799.90, precoOriginal: 3499.90, descricao: 'Smart TV 55" 4K LED HDR com Android TV.', fotos: ['/uploads/placeholder.jpg'], mediaEstrelas: 4.8, totalAvaliacoes: 64 },
    { nome: 'Caixa de Som 30W', slug: 'caixa-som-bluetooth-30w', categoriaId: cats['eletronicos'], preco: 349.90, precoOriginal: 449.90, descricao: 'Caixa de Som Bluetooth 30W com 10h de bateria.', fotos: ['/uploads/placeholder.jpg'], temCor: true, mediaEstrelas: 4.5, totalAvaliacoes: 52 },
    { nome: 'Home Theater 5.1', slug: 'home-theater-51-1000w', categoriaId: cats['eletronicos'], preco: 999.90, precoOriginal: 1299.90, descricao: 'Home Theater 5.1 1000W com subwoofer ativo e HDMI.', fotos: ['/uploads/placeholder.jpg'], mediaEstrelas: 4.3, totalAvaliacoes: 11 },
    { nome: 'Cafeteira Expresso', slug: 'cafeteira-expresso-automatica', categoriaId: cats['eletroportateis'], preco: 1199.90, precoOriginal: 1499.90, descricao: 'Cafeteira Expresso Automática com moedor integrado.', fotos: ['/uploads/placeholder.jpg'], temVoltagem: true, mediaEstrelas: 4.7, totalAvaliacoes: 23 },
    { nome: 'Fritadeira Air Fryer 5L', slug: 'fritadeira-air-fryer-5l', categoriaId: cats['eletroportateis'], preco: 449.90, precoOriginal: 599.90, descricao: 'Fritadeira Air Fryer 5L Digital com 8 funções.', fotos: ['/uploads/placeholder.jpg'], temVoltagem: true, mediaEstrelas: 4.6, totalAvaliacoes: 78 },
    { nome: 'Liquidificador 1000W', slug: 'liquidificador-1000w-3l', categoriaId: cats['eletroportateis'], preco: 199.90, precoOriginal: 269.90, descricao: 'Liquidificador 1000W com jarra 3L e 10 velocidades.', fotos: ['/uploads/placeholder.jpg'], temVoltagem: true, mediaEstrelas: 4.4, totalAvaliacoes: 45 },
    { nome: 'Suporte TV 32"-75"', slug: 'suporte-tv-articulado', categoriaId: cats['tv-e-video'], preco: 149.90, precoOriginal: 199.90, descricao: 'Suporte Articulado para TV de 32" a 75".', fotos: ['/uploads/placeholder.jpg'], mediaEstrelas: 4.5, totalAvaliacoes: 31 },
    { nome: 'Cabo HDMI 4K 2m', slug: 'cabo-hdmi-4k-2m', categoriaId: cats['tv-e-video'], preco: 49.90, descricao: 'Cabo HDMI 2.1 4K Ultra HD 2 metros.', fotos: ['/uploads/placeholder.jpg'], mediaEstrelas: 4.2, totalAvaliacoes: 18 },
    { nome: 'Antena Digital Interna', slug: 'antena-digital-interna', categoriaId: cats['tv-e-video'], preco: 79.90, precoOriginal: 99.90, descricao: 'Antena Digital Interna Amplificada alcance 50km.', fotos: ['/uploads/placeholder.jpg'], mediaEstrelas: 4.0, totalAvaliacoes: 22 },
    { nome: 'Notebook i5 8GB SSD', slug: 'notebook-i5-8gb-256ssd', categoriaId: cats['informatica'], preco: 2999.90, precoOriginal: 3599.90, descricao: 'Notebook Intel Core i5 8GB RAM 256GB SSD tela 15.6".', fotos: ['/uploads/placeholder.jpg'], mediaEstrelas: 4.6, totalAvaliacoes: 42 },
    { nome: 'Mouse Sem Fio', slug: 'mouse-sem-fio-ergonomico', categoriaId: cats['informatica'], preco: 89.90, precoOriginal: 129.90, descricao: 'Mouse Sem Fio Ergonômico com DPI ajustável.', fotos: ['/uploads/placeholder.jpg'], temCor: true, mediaEstrelas: 4.3, totalAvaliacoes: 67 },
    { nome: 'Teclado Mecânico RGB', slug: 'teclado-mecanico-rgb', categoriaId: cats['informatica'], preco: 299.90, precoOriginal: 399.90, descricao: 'Teclado Mecânico RGB com switches azuis.', fotos: ['/uploads/placeholder.jpg'], temCor: true, mediaEstrelas: 4.7, totalAvaliacoes: 38 },
    { nome: 'Sofá 3 Lugares Suede', slug: 'sofa-3-lugares-suede', categoriaId: cats['moveis'], preco: 1899.90, precoOriginal: 2399.90, descricao: 'Sofá 3 Lugares em tecido Suede com espuma D33.', fotos: ['/uploads/placeholder.jpg'], temCor: true, mediaEstrelas: 4.5, totalAvaliacoes: 29 },
    { nome: 'Mesa de Jantar 6 Lugares', slug: 'mesa-jantar-6-cadeiras', categoriaId: cats['moveis'], preco: 2299.90, precoOriginal: 2999.90, descricao: 'Mesa de Jantar com 6 Cadeiras em madeira maciça.', fotos: ['/uploads/placeholder.jpg'], mediaEstrelas: 4.6, totalAvaliacoes: 15 },
    { nome: 'Guarda-Roupa 6 Portas', slug: 'guarda-roupa-6-portas', categoriaId: cats['moveis'], preco: 1599.90, precoOriginal: 1999.90, descricao: 'Guarda-Roupa 6 Portas com espelho e prateleiras.', fotos: ['/uploads/placeholder.jpg'], mediaEstrelas: 4.4, totalAvaliacoes: 11 },
  ]

  for (const p of produtos) {
    await prisma.produto.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, ativo: true },
    })
  }
  console.log(`  ✓ ${produtos.length} produtos criados`)
  console.log('\\n✅ Seed concluído!')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
