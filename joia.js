import { createInfiniteSpiral } from './cardInfinito.js'


async function PegarURL(url) {

    const API = await fetch(url)

    if (!API.ok) {
        throw new Error(`Erro na requisição: ${API.status}`)
    }

    return await API.json()
}


async function AtivarAPI() {

    try {

        // API principal
        const dado = await PegarURL(
            'https://www.adadiamonds.com/api/v1'
        )

        // Procura o endpoint dos diamantes
        const endpointDiamonds = dado.endpoints.find(
            endpoint => endpoint.operationId === 'listDiamonds'
        )

        if (!endpointDiamonds) {
            throw new Error('Endpoint de diamantes não encontrado')
        }

        console.log('Endpoint:', endpointDiamonds)


        // Busca os diamantes
        const respostaDiamantes = await PegarURL(
            endpointDiamonds.path
        )

        console.log('Resposta dos diamantes:', respostaDiamantes)


        // Algumas APIs colocam os dados dentro de data/results.
        const diamantes = Array.isArray(respostaDiamantes)
            ? respostaDiamantes
            : respostaDiamantes.data ??
            respostaDiamantes.results ??
            respostaDiamantes.diamonds ??
            []


        if (!Array.isArray(diamantes) || diamantes.length === 0) {
            throw new Error('Nenhum diamante encontrado na resposta da API')
        }


        console.log('Lista de diamantes:', diamantes)


        // Procura URLs de imagens dentro de cada objeto
        const imagens = diamantes
            .map(diamante => encontrarImagem(diamante))
            .filter(Boolean)


        console.log('Imagens encontradas:', imagens)


        if (imagens.length === 0) {
            throw new Error(
                'Nenhuma URL de imagem foi encontrada nos dados dos diamantes'
            )
        }


        // =========================
        // SUA ANIMAÇÃO
        // =========================

        createInfiniteSpiral('#spiral', {

            items: imagens,

            speed: .55,

            direction: 'up',

            animationMode: 'all',

            radius: 170,

            cardWidth: 100,

            cardHeight: 100,

            verticalSpacing: 60,

            perspective: 1000,

            cardsPerTurn: 7,

            rotation: 0,

            cardTilt: 0,

            cardRadius: 10,

            centerScale: 1.2,

            edgeFade: 0.3,

            edgeBlur: 6,

            pauseOnHover: false,

            imageFit: 'cover',

            grayscale: 0

        })

    } catch (erro) {

        console.error('Erro:', erro)

    }
}


// Procura uma URL de imagem dentro do objeto
function encontrarImagem(objeto) {

    if (!objeto || typeof objeto !== 'object') {
        return null
    }


    // Propriedades mais comuns
    const propriedades = [
        'image',
        'imageUrl',
        'imageURL',
        'image_url',
        'photo',
        'photoUrl',
        'photo_url',
        'thumbnail',
        'thumbnailUrl',
        'thumbnail_url',
        'url'
    ]


    for (const propriedade of propriedades) {

        const valor = objeto[propriedade]

        if (
            typeof valor === 'string' &&
            (
                valor.startsWith('http://') ||
                valor.startsWith('https://')
            )
        ) {

            return valor
        }
    }


    // Procura também dentro de objetos aninhados
    for (const valor of Object.values(objeto)) {

        if (valor && typeof valor === 'object') {

            const imagem = encontrarImagem(valor)

            if (imagem) {
                return imagem
            }
        }
    }


    return null
}


AtivarAPI()



gsap.registerPlugin(ScrollTrigger);

gsap.fromTo(".fundo__Diamante3D img",
    { yPercent: -20 },
    {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
            trigger: ".Diamante__3D__area",
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    }
);

const area3D = document.querySelector(".Diamante__3D__area")
const diamante3D = document.querySelector(".Diamante__3D")

import * as THREE from "https://unpkg.com/three@0.179.1/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.179.1/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "https://unpkg.com/three@0.179.1/examples/jsm/libs/meshopt_decoder.module.js";

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

const cena = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, diamante3D.clientWidth / diamante3D.clientHeight, 0.01, 1000)
const renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderizador.setSize(diamante3D.clientWidth, diamante3D.clientHeight)
diamante3D.appendChild(renderizador.domElement)
camera.position.z = 4.5
cena.add(new THREE.AmbientLight(0xffffff, 1));
const luzSolar = new THREE.DirectionalLight(0xffffff, 3);
luzSolar.position.set(5, 3, 5);
cena.add(luzSolar);
const ambient = new THREE.AmbientLight(0xffffff, 3);
cena.add(ambient);

const dir1 = new THREE.DirectionalLight(0xffffff, 8);
dir1.position.set(10, 10, 10);
cena.add(dir1);

const dir2 = new THREE.DirectionalLight(0xffffff, 5);
dir2.position.set(-10, 5, -10);
cena.add(dir2);
const luz1 = new THREE.DirectionalLight(0xffffff, 8);
luz1.position.set(10, 10, 10);

const luz2 = new THREE.DirectionalLight(0xffffff, 8);
luz2.position.set(-10, 10, 10);

const luz3 = new THREE.DirectionalLight(0xffffff, 5);
luz3.position.set(10, -10, -10);

const luz4 = new THREE.DirectionalLight(0xffffff, 5);
luz4.position.set(-10, -10, -10);

cena.add(luz1, luz2, luz3, luz4);
let modulo = null;

loader.load("./Os__Meus__3D/anel.glb", (gltf) => {

    modulo = gltf.scene;
    modulo.scale.set(50, 50, 50);

    // posição inicial
    modulo.rotation.set(1.5, 1.01, 0);

    cena.add(modulo);
    /* 
        gsap.to(modulo.rotation, {
            y: Math.PI / 10,
            x: 2.5,
    
            scrollTrigger: {
                trigger: area3D,
                start: "20% 40%",
                end: "50% center",
                scrub: true,
                markers: true,
    
            }
        });*/
        
    gsap.to(modulo.rotation, {
        x: 1.5,
        y: 5,
        z: 0.01,
        scrollTrigger: {
            trigger: area3D,
            start: "20% 40%",
            end: "30% 20%",
            scrub: 3,

        }
    });
    gsap.to(diamante3D, {
        y: 0,
        x: 0,

        scrollTrigger: {
            trigger: area3D,
            start: "20% 40%",
            end: "65% 40%",
            scrub: 2,

        }
    });
});

ScrollSmoother.create({
    smooth: 1,
    smootherTouch: 0,
    effects: true,
})


function ativar3D() {
    requestAnimationFrame(ativar3D)

    renderizador.render(cena, camera)

}
ativar3D()
window.addEventListener('resize', function () {
    camera.aspect = diamante3D.clientWidth / diamante3D.clientHeight
    camera.updateProjectionMatrix()
    renderizador.setSize(diamante3D.clientWidth, diamante3D.clientHeight)
})


/*
PEDRA VIRADA
if (modulo) {
        modulo.rotation.y = 1.01;
        modulo.rotation.x = 1.5;
    }

/////////////////////////////////////////

*/







// ===============================
// PESQUISA DE JOIAS
// ===============================


const AreaPesquisa = document.querySelector(".pesquisa")
const AtivarPesquisa = document.querySelector(".input button")
const gridCards = document.querySelector(".area__dasPesquisas");
const ERRo = document.querySelector(".ERRO");
const pesquisa = document.querySelector(".Input__pesquisa");

let todasJoias = [];
let carregou = false;

// Abrir / fechar a área de pesquisa
AtivarPesquisa.addEventListener("click", () => {
    const aberta = AreaPesquisa.classList.toggle("aberta");
    document.body.style.overflow = aberta ? "" : "hidden";
    AreaPesquisa.style.display = aberta ? "none" : "flex";

    if (aberta && !carregou) {
        carregarJoias();
    }
});

// Busca uma URL e devolve o JSON
async function pegarInformações(url) {
    const resposta = await fetch(url);
    if (!resposta.ok) {
        throw new Error(`Erro de requisição ${resposta.status}`);
    }
    return await resposta.json();
}

// Carrega todas as joias (a API devolve 25 por vez)
async function carregarJoias() {
    ERRo.style.display = "none";
    gridCards.innerHTML = "<p>Carregando...</p>";

    try {
        let offset = 0;
        let tudo = [];

        while (true) {
            const r = await pegarInformações(
                `https://www.adadiamonds.com/api/v1/jewelry?offset=${offset}`
            );
            tudo.push(...r.data);

            if (!r.pagination.has_more) break;
            offset += r.pagination.limit;
        }

        todasJoias = tudo;
        carregou = true;
        console.log("Joias carregadas:", todasJoias.length);
        cards(todasJoias);
    } catch (erro) {
        console.error(erro);
        mostrarErro("ERRO AO CARREGAR AS JOIAS.");
    }
}

// Monta os cards
function cards(lista) {
    gridCards.innerHTML = lista.map((item) => {
        const img =
            item.images?.find((i) => i.view === "primary") ?? item.images?.[0];

        return `
            <div class="card__pesquisa">
             <a  href="${item.url}" target="_blank" rel="noopener">
                <img src="${img?.url ?? ""}" alt="${img?.alt ?? item.title}">
                <h3>${item.title}</h3>
                <p>From $${item.priceFrom}</p>
             </a>  
            </div>
        `;
    }).join("");
}

function mostrarErro(texto) {
    gridCards.innerHTML = "";
    ERRo.style.display = "flex";
    ERRo.innerHTML = `<h2>${texto}</h2>`;
}

// Dicionário opcional português -> inglês
const traducoes = {
    anel: "ring",
    aneis: "ring",
    anéis: "ring",
    noivado: "engagement",
    casamento: "wedding",
    alianca: "wedding",
    aliança: "wedding",
    colar: "necklace",
    brinco: "earring",
    brincos: "earring",
    pulseira: "bracelet",
    redondo: "round",
    oval: "oval",
    esmeralda: "emerald",
    pera: "pear",
    pêra: "pear"
};

// Filtra as joias já carregadas
function pesquisar() {
    ERRo.style.display = "none";

    let valor = pesquisa.value.trim().toLowerCase();
    valor = traducoes[valor] ?? valor;

    const resultado = valor === ""
        ? todasJoias
        : todasJoias.filter((j) =>
            [j.title, j.category, j.type, j.subtype, ...(j.shapes ?? [])]
                .join(" ")
                .toLowerCase()
                .includes(valor)
        );

    if (resultado.length === 0) {
        mostrarErro("ERRO ITEM NÃO ENCONTRADO.");
        return;
    }

    cards(resultado);
}

// Pesquisar com Enter
pesquisa.addEventListener("keydown", (event) => {
    if (event.key === "Enter") pesquisar();
});