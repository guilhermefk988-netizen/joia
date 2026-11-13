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