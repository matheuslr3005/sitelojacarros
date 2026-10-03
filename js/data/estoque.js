/*
 * DADOS DE DEMONSTRACAO
 * ---------------------------------------------------------------
 * Este arquivo e o unico ponto onde o site "enxerga" a loja e o estoque.
 * Na integracao real, js/api.js troca a leitura deste arquivo por uma
 * chamada ao sistema que a loja ja usa (API, planilha, XML/JSON de feed).
 * O formato de cada veiculo abaixo e o contrato que o conector precisa entregar.
 *
 * Todos os veiculos, precos, quilometragens e textos sao ficticios.
 * FOTOS: cada veiculo tem uma lista "fotos". O site usa a primeira que carregar e mostra as demais na galeria.
 * Nesta demonstracao as fotos vem do Wikimedia Commons (licencas Creative Commons) e sao de modelos parecidos,
 * nao do carro exato. Na loja real, troque por caminhos locais (ex.: "assets/carros/<id>/1.jpg") ou URLs do sistema de estoque.
 */
function commons(files) {
  return files.map(function (f) { return "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(f.replace(/ /g, "_")); });
}

window.LOJA = {
  nome: "Preguinho Veículos",
  slogan: "Seminovos revisados",
  cidade: "Porto Alegre, RS",
  endereco: "Av. Ipiranga, 4120, Jardim Botânico",
  cep: "90610-000",
  telefone: "(51) 3028-4417",
  whatsapp: "5551999990000",
  email: "contato@preguinhoveiculos.example",
  instagram: "@preguinhoveiculos",
  fundacao: 2009,
  mapa: { lat: -30.0527, lon: -51.1969 },
  horarios: [
    { dias: [1, 2, 3, 4, 5], abre: "08:30", fecha: "18:30", rotulo: "Segunda a sexta", texto: "08h30 às 18h30" },
    { dias: [6], abre: "09:00", fecha: "16:00", rotulo: "Sábado", texto: "09h às 16h" },
    { dias: [0], abre: null, fecha: null, rotulo: "Domingo", texto: "Fechado" }
  ],
  jurosMensal: 1.89 // usado apenas na simulacao ilustrativa de financiamento
};

window.ESTOQUE = [
  {
    id: "tcross-highline-22", marca: "Volkswagen", modelo: "T-Cross", versao: "Highline 1.4 TSI",
    ano: 2022, anoModelo: 2022, km: 38412, preco: 119900, combustivel: "Flex", cambio: "Automático",
    carroceria: "SUV", cor: { nome: "Cinza Platinum", hex: "#6f7378" }, motor: "1.4 turbo", potencia: "150 cv", portas: 4,
    opcionais: ["Teto solar panorâmico", "Central multimídia 10\"", "Painel digital", "Sensor de estacionamento", "Faróis full LED", "Piloto automático adaptativo"],
    descricao: "SUV compacto na versão topo de linha, com único dono e revisões feitas na concessionária. O motor turbo responde bem na cidade e na estrada, e o pacote de tecnologia completa o conjunto.",
    selo: "Único dono", destaque: true, vendido: false, fotos: commons(["Volkswagen T-Cross 1X7A0363.jpg", "Volkswagen T-Cross (2023) 1X7A2499.jpg", "Volkswagen T-Cross (2023) 1X7A1967.jpg", "Volkswagen T-Cross IMG 4873.jpg"])
  },
  {
    id: "corolla-xei-21", marca: "Toyota", modelo: "Corolla", versao: "XEi 2.0 Dynamic Force",
    ano: 2021, anoModelo: 2022, km: 46870, preco: 124900, combustivel: "Flex", cambio: "Automático",
    carroceria: "Sedã", cor: { nome: "Branco Lunar", hex: "#e9e9e6" }, motor: "2.0 aspirado", potencia: "177 cv", portas: 4,
    opcionais: ["Banco em couro", "Câmera de ré", "Ar-condicionado digital dual", "Controle de estabilidade", "Partida por botão"],
    descricao: "O sedã mais procurado da categoria, com histórico de manutenção completo e pneus novos. Conforto de rodagem, baixo custo de revisão e ótima liquidez na hora da revenda.",
    destaque: true, vendido: false, fotos: commons(["Toyota Corolla 2.0 XEi 2021 (51550744527).jpg", "2019 Toyota Corolla Altis (front).jpg", "Toyota Corolla Altis 1.8 HEV 2020 (1).jpg"])
  },
  {
    id: "civic-touring-20", marca: "Honda", modelo: "Civic", versao: "Touring 1.5 Turbo",
    ano: 2020, anoModelo: 2020, km: 52230, preco: 129900, combustivel: "Gasolina", cambio: "CVT",
    carroceria: "Sedã", cor: { nome: "Azul Cosmic", hex: "#1f3a5f" }, motor: "1.5 turbo", potencia: "173 cv", portas: 4,
    opcionais: ["Honda Sensing", "Teto solar elétrico", "Bancos em couro aquecidos", "Som premium 10 alto-falantes", "Rodas aro 17\""],
    descricao: "Versão mais completa do Civic, com o pacote de assistências à condução e acabamento de carro de outra categoria. Laudo cautelar aprovado e manual com chave reserva.",
    destaque: false, vendido: false, fotos: commons(["Honda Civic Limousine 1.5 VTEC Turbo Executive CVT (X) – f 26122020.jpg"])
  },
  {
    id: "compass-limited-21", marca: "Jeep", modelo: "Compass", versao: "Limited 2.0 Turbodiesel 4x4",
    ano: 2021, anoModelo: 2021, km: 61540, preco: 139900, combustivel: "Diesel", cambio: "Automático",
    carroceria: "SUV", cor: { nome: "Preto Carbon", hex: "#17181a" }, motor: "2.0 turbodiesel", potencia: "170 cv", portas: 4,
    opcionais: ["Tração 4x4", "Teto solar duplo", "Bancos em couro elétricos", "Alerta de ponto cego", "Rack de teto"],
    descricao: "Tração integral e torque de sobra para quem viaja ou enfrenta estrada de chão. Revisões em dia na rede Jeep e consumo surpreendente para o tamanho do carro.",
    destaque: true, vendido: false, fotos: commons(["2021 Jeep Compass Limited 4WD in Billet Silver Metallic, front left.jpg", "2019 Jeep Compass Limited 2.4L, front 7.6.19.jpg"])
  },
  {
    id: "onix-premier-23", marca: "Chevrolet", modelo: "Onix", versao: "Premier 1.0 Turbo",
    ano: 2023, anoModelo: 2023, km: 17905, preco: 89900, combustivel: "Flex", cambio: "Automático",
    carroceria: "Hatch", cor: { nome: "Vermelho Chili", hex: "#b3202a" }, motor: "1.0 turbo", potencia: "116 cv", portas: 4,
    opcionais: ["Wi-Fi nativo", "Carregador por indução", "Sensor de chuva", "Câmera de ré", "Rodas aro 16\""],
    descricao: "Praticamente zero, com garantia de fábrica ainda válida. Ideal para o dia a dia: econômico, ágil e com tecnologia de sobra para um hatch.",
    selo: "Garantia de fábrica", destaque: false, vendido: false, fotos: commons(["Chevrolet Onix Turbo Premier 2023 (53298952614).jpg", "Chevrolet Onix (second generation, front view).jpg"])
  },
  {
    id: "creta-ultimate-23", marca: "Hyundai", modelo: "Creta", versao: "Ultimate 1.0 Turbo",
    ano: 2023, anoModelo: 2023, km: 22318, preco: 129900, combustivel: "Flex", cambio: "Automático",
    carroceria: "SUV", cor: { nome: "Branco Polar", hex: "#f1f1ef" }, motor: "1.0 turbo", potencia: "120 cv", portas: 4,
    opcionais: ["Teto solar", "Hyundai SmartSense", "Painel digital 10,25\"", "Bancos ventilados", "Carregador sem fio"],
    descricao: "SUV equipado como poucos na faixa de preço, com assistências de segurança completas e garantia de fábrica. Único dono, nunca batido.",
    selo: "Garantia de fábrica", destaque: false, vendido: false, fotos: commons(["2023 Hyundai Creta Black Edition.jpg", "Hyundai Creta 1.5 GL 2023 (1).jpg", "2021 Hyundai Creta 2.0 Ultimate (Brazil) front view.png"])
  },
  {
    id: "toro-volcano-22", marca: "Fiat", modelo: "Toro", versao: "Volcano 2.0 Turbodiesel 4x4",
    ano: 2022, anoModelo: 2022, km: 41760, preco: 139900, combustivel: "Diesel", cambio: "Automático",
    carroceria: "Picape", cor: { nome: "Cinza Graphite", hex: "#4b4f55" }, motor: "2.0 turbodiesel", potencia: "170 cv", portas: 4,
    opcionais: ["Tração 4x4", "Capota marítima", "Bancos em couro", "Multimídia 10,1\"", "Estribos laterais"],
    descricao: "Picape média com conforto de SUV. Acompanha capota marítima e protetor de caçamba, e passou por revisão completa antes de entrar no estoque.",
    destaque: false, vendido: false, fotos: commons(["2022 Fiat Toro 2.0 Multijet Volcano.jpg", "Fiat Toro Volcano front.jpg", "Fiat Toro Volcano.jpg"])
  },
  {
    id: "hilux-srx-21", marca: "Toyota", modelo: "Hilux", versao: "SRX 2.8 Diesel 4x4",
    ano: 2021, anoModelo: 2021, km: 68420, preco: 244900, combustivel: "Diesel", cambio: "Automático",
    carroceria: "Picape", cor: { nome: "Prata Metálico", hex: "#a9adb2" }, motor: "2.8 turbodiesel", potencia: "204 cv", portas: 4,
    opcionais: ["Tração 4x4 com reduzida", "Bancos em couro", "Câmera 360", "Controle de descida", "Santo Antônio"],
    descricao: "A picape que quase não desvaloriza. Rodou em estrada, não em lavoura, e tem todas as revisões na concessionária com nota fiscal.",
    destaque: false, vendido: false, fotos: commons(["2021 Toyota Hilux Revo Prerunner Double-Cab 2.4 Mid.jpg", "Toyota Hilux (facelift) front.jpg", "Toyota Hilux SRX.jpg"])
  },
  {
    id: "hrv-exl-22", marca: "Honda", modelo: "HR-V", versao: "EXL 1.5 CVT",
    ano: 2022, anoModelo: 2022, km: 33105, preco: 134900, combustivel: "Flex", cambio: "CVT",
    carroceria: "SUV", cor: { nome: "Prata Lunar", hex: "#b8bbbf" }, motor: "1.5 aspirado", potencia: "126 cv", portas: 4,
    opcionais: ["Banco em couro", "Câmera lateral LaneWatch", "Ar digital", "Rodas aro 17\"", "Chave presencial"],
    descricao: "SUV espaçoso e muito bem cuidado, com porta-malas de verdade e acabamento acima da média. Manual, chave reserva e revisões comprovadas.",
    destaque: false, vendido: false, fotos: commons(["2022 Honda HR-V 1.8 EX (Brazil).jpg", "2023 Honda HR-V EX-L in Nordic Forest Pearl, Front Right, 10-15-2022.jpg", "2023 Honda HR-V EX-L in Nordic Forest Pearl, Rear Right, 10-15-2022.jpg"])
  },
  {
    id: "argo-drive-22", marca: "Fiat", modelo: "Argo", versao: "Drive 1.3",
    ano: 2022, anoModelo: 2022, km: 36890, preco: 69900, combustivel: "Flex", cambio: "Manual",
    carroceria: "Hatch", cor: { nome: "Cinza Silverstone", hex: "#8a8d91" }, motor: "1.3 Firefly", potencia: "109 cv", portas: 4,
    opcionais: ["Multimídia com Apple CarPlay", "Direção elétrica", "Vidros elétricos", "Ar-condicionado", "Sensor de ré"],
    descricao: "Opção econômica para o primeiro carro ou para a família que precisa de um segundo veículo. Manutenção barata e documentação 100% em dia.",
    destaque: false, vendido: false, fotos: commons(["2023 Fiat Argo 1.3 Drive (facelift, Brazil).jpg", "Fiat Argo 1.3 Trekking 2020.jpg", "FIAT Argo.jpg"])
  },
  {
    id: "yaris-xls-21", marca: "Toyota", modelo: "Yaris Sedan", versao: "XLS Connect 1.5",
    ano: 2021, anoModelo: 2021, km: 44210, preco: 84900, combustivel: "Flex", cambio: "CVT",
    carroceria: "Sedã", cor: { nome: "Vermelho Garnet", hex: "#8f1d27" }, motor: "1.5 aspirado", potencia: "110 cv", portas: 4,
    opcionais: ["Multimídia 7\"", "Câmera de ré", "Controle de tração", "Ar digital", "Rodas de liga"],
    descricao: "Confiabilidade Toyota num sedã compacto, econômico e barato de manter. Revisões feitas na marca e histórico limpo.",
    destaque: false, vendido: false, fotos: commons(["Toyota Yaris 1.5E Sedan 2021 (52677028712).jpg"])
  },
  {
    id: "kicks-exclusive-22", marca: "Nissan", modelo: "Kicks", versao: "Exclusive 1.6 CVT",
    ano: 2022, anoModelo: 2022, km: 39580, preco: 109900, combustivel: "Flex", cambio: "CVT",
    carroceria: "SUV", cor: { nome: "Laranja Âmbar", hex: "#c75a1d" }, motor: "1.6 aspirado", potencia: "114 cv", portas: 4,
    opcionais: ["Teto bicolor", "Câmera 360", "Bancos em couro", "Som Bose", "Frenagem autônoma de emergência"],
    descricao: "SUV urbano de personalidade, com teto bicolor e som Bose de série. Carro de uma só dona, sempre guardado em garagem.",
    destaque: false, vendido: false, fotos: commons(["Nissan Kicks 1.6 Exclusive 2022.jpg", "0 Nissan Kicks (P15) 1.jpg", "Nissan Kicks B0 (front).jpg"])
  },
  {
    id: "c180-avantgarde-20", marca: "Mercedes-Benz", modelo: "C 180", versao: "Avantgarde 1.6 Turbo",
    ano: 2020, anoModelo: 2020, km: 47650, preco: 189900, combustivel: "Gasolina", cambio: "Automático",
    carroceria: "Sedã", cor: { nome: "Preto Obsidiana", hex: "#101114" }, motor: "1.6 turbo", potencia: "156 cv", portas: 4,
    opcionais: ["Iluminação ambiente", "Bancos elétricos", "Pacote AMG Line", "Teto solar", "Multimídia MBUX"],
    descricao: "Sedã de luxo com cabine silenciosa e acabamento refinado. Todas as revisões na rede autorizada e laudo cautelar aprovado sem ressalvas.",
    selo: "Blindado", destaque: false, vendido: false, fotos: commons(["Mercedes-Benz C180 AVANTGARDE (W205) front.JPG", "Mercedes-Benz C 180 Laureus Edition (W205) front.jpg", "Mercedes-Benz C180 AVANTGARDE (W205) interior.JPG"])
  },
  {
    id: "x1-sdrive-21", marca: "BMW", modelo: "X1", versao: "sDrive20i X-Line",
    ano: 2021, anoModelo: 2021, km: 38120, preco: 209900, combustivel: "Gasolina", cambio: "Automático",
    carroceria: "SUV", cor: { nome: "Branco Alpino", hex: "#ececea" }, motor: "2.0 turbo", potencia: "192 cv", portas: 4,
    opcionais: ["Teto solar panorâmico", "Banco elétrico com memória", "Head-up display", "Câmera de ré", "Chave por aproximação"],
    descricao: "SUV premium com dirigibilidade de esportivo e interior caprichado. Uma proprietária, revisões em dia e pneus novos.",
    selo: "Único dono", destaque: true, vendido: false, fotos: commons(["BMW X1 xDrive20i xLine (F48) front.JPG", "The frontview of BMW X1 xDrive20i xLine (F48).jpg", "BMW X1 xDrive20i xLine (F48) rear.JPG", "BMW X1 facelift (F48) (48805322468).jpg"])
  },
  {
    id: "ranger-limited-22", marca: "Ford", modelo: "Ranger", versao: "Limited 3.0 V6 Diesel 4x4",
    ano: 2022, anoModelo: 2023, km: 31870, preco: 229900, combustivel: "Diesel", cambio: "Automático",
    carroceria: "Picape", cor: { nome: "Azul Lightning", hex: "#2b5d86" }, motor: "3.0 V6 turbodiesel", potencia: "250 cv", portas: 4,
    opcionais: ["Câmera 360", "Piloto automático adaptativo", "Bancos em couro ventilados", "Tampa rígida da caçamba", "Som B&O"],
    descricao: "Motor V6 e tecnologia de ponta numa picape grande para trabalho e lazer. Pouca quilometragem e garantia de fábrica remanescente.",
    destaque: false, vendido: false, fotos: commons(["2022 Ford Ranger Wildtrak Double-Cab 2.0L Bi-Turbo 4x4.jpg", "2022 Ford Ranger Raptor Double-Cab 3.0L V6 Twin-Turbo EcoBoost 4x4.jpg"])
  },
  {
    id: "a3-sedan-21", marca: "Audi", modelo: "A3 Sedan", versao: "Prestige Plus 1.4 TFSI",
    ano: 2021, anoModelo: 2021, km: 35240, preco: 154900, combustivel: "Gasolina", cambio: "Automático",
    carroceria: "Sedã", cor: { nome: "Cinza Daytona", hex: "#55595e" }, motor: "1.4 turbo", potencia: "150 cv", portas: 4,
    opcionais: ["Virtual Cockpit", "Bancos em couro", "Faróis Matrix LED", "Sistema de som Bang & Olufsen", "Rodas aro 18\""],
    descricao: "Sedã compacto premium, silencioso e bem equipado. Revisões na rede Audi, sem nenhum registro de sinistro.",
    destaque: false, vendido: false, fotos: commons(["2017 Audi A3 (8V) 1.4 TFSI Attraction sedan (2018-08-31) 02.jpg", "Audi A3 SEDAN 1.4 TFSI (DBA-8VCXSL) front.JPG", "Audi A3 Limousine (8V) – h 18052025.jpg"])
  },
  {
    id: "corolla-cross-xrx-23", marca: "Toyota", modelo: "Corolla Cross", versao: "XRX 1.8 Hybrid",
    ano: 2023, anoModelo: 2023, km: 21480, preco: 179900, combustivel: "Híbrido", cambio: "CVT",
    carroceria: "SUV", cor: { nome: "Branco Lunar", hex: "#ececea" }, motor: "1.8 híbrido flex", potencia: "122 cv", portas: 4,
    opcionais: ["Toyota Safety Sense", "Teto solar", "Bancos em couro", "Central multimídia 10,1\"", "Carregador sem fio", "Câmera 360"],
    descricao: "SUV híbrido com consumo de compacto e espaço de carro grande. Pouca quilometragem, garantia de fábrica e todas as revisões feitas na Toyota.",
    destaque: true, vendido: false, fotos: commons(["Toyota Corolla Cross Hybrid 1X7A6357.jpg", "Toyota Corolla Cross Hybrid 1X7A6348.jpg", "Toyota Corolla Cross Hybrid 1X7A1861.jpg", "2021 Toyota Corolla Cross Hybrid GR Sport.jpg"])
  }
];

/* Fotos de apoio para as paginas (nao pertencem a um veiculo) */
window.MIDIA = {
  promessa: commons(["2022 Fiat Toro 2.0 Multijet Volcano.jpg"]),
  sobre: commons(["2021 Jeep Compass Limited 4WD in Billet Silver Metallic, front left.jpg"])
};
