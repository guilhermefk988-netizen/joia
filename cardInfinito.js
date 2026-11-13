    const clamp = (value, min, max) =>
    Math.min(Math.max(value, min), max);

const modulo = (value, divisor) =>
    ((value % divisor) + divisor) % divisor;

const smoothstep = (min, max, value) => {
    const x = clamp(
        (value - min) / (max - min || 1),
        0,
        1
    );

    return x * x * (3 - 2 * x);
};


export function createInfiniteSpiral(target, options = {}) {

    const root =
        typeof target === 'string'
            ? document.querySelector(target)
            : target;

    if (!root) {
        throw new Error('InfiniteSpiral: elemento não encontrado');
    }


    const {
        items = [],
        speed = 0.55,
        direction = 'up',
        animationMode = 'auto',

        radius = 170,

        cardWidth = 100,
        cardHeight = 100,

        verticalSpacing = 60,

        perspective = 1000,

        cardsPerTurn = 7,

        rotation = 0,

        cardTilt = 0,

        cardRadius = 10,

        centerScale = 1.2,

        edgeFade = 0.3,

        edgeBlur = 6,

        pauseOnHover = true,

        imageFit = 'cover',

        grayscale = 0,

        className = ''
    } = options;


    // --------------------------------
    // CONFIGURAÇÃO
    // --------------------------------

    const normalizedItems = items.map((item, index) => {

        if (typeof item === 'string') {

            return {
                src: item,
                alt: `Spiral image ${index + 1}`
            };

        }

        return {
            alt: `Spiral image ${index + 1}`,
            ...item
        };
    });


    if (normalizedItems.length === 0) {
        return {
            destroy() {},
            update() {}
        };
    }


    // --------------------------------
    // ESTADO
    // --------------------------------

    let progress = 0;
    let targetProgress = 0;

    let autoSpeed = 0;

    let hovered = false;
    let visible = true;

    let dragging = false;

    let lastPointerY = 0;

    let dragMoved = false;

    let animationFrame;

    let previousTime = performance.now();

    let bounds = root.getBoundingClientRect();


    // --------------------------------
    // CLASSES
    // --------------------------------

    root.classList.add(
        'infinite-spiral',
        ...className.split(' ').filter(Boolean)
    );


    // --------------------------------
    // ESTILOS
    // --------------------------------

    root.style.perspective = `${perspective}px`;

    root.style.setProperty(
        '--infinite-spiral-card-width',
        `${cardWidth}px`
    );

    root.style.setProperty(
        '--infinite-spiral-card-height',
        `${cardHeight}px`
    );

    root.style.setProperty(
        '--infinite-spiral-card-radius',
        `${cardRadius}px`
    );


    const dragEnabled =
        animationMode === 'drag' ||
        animationMode === 'all';


    root.style.cursor =
        dragEnabled
            ? 'grab'
            : 'default';

    root.style.touchAction =
        dragEnabled
            ? 'pan-x'
            : 'auto';

    root.style.userSelect =
        dragEnabled
            ? 'none'
            : 'auto';


    // --------------------------------
    // STAGE
    // --------------------------------

    const stage = document.createElement('div');

    stage.className =
        'infinite-spiral__stage';

    stage.setAttribute(
        'role',
        'list'
    );

    stage.setAttribute(
        'aria-label',
        'Infinite spiral gallery'
    );

    root.appendChild(stage);


    // --------------------------------
    // CARDS
    // --------------------------------

    const cardRefs = [];


    normalizedItems.forEach((item, index) => {

        const card =
            item.href
                ? document.createElement('a')
                : document.createElement('div');


        card.className =
            'infinite-spiral__item';


        card.style.width =
            `${cardWidth}px`;

        card.style.height =
            `${cardHeight}px`;

        card.style.borderRadius =
            `${cardRadius}px`;


        if (item.href) {

            card.href = item.href;

            if (item.target) {
                card.target = item.target;
            }

            if (item.target === '_blank') {
                card.rel = 'noreferrer';
    }
        }


        card.setAttribute(
            'role',
            'listitem'
        );


        card.setAttribute(
            'aria-label',
            item.label || item.alt
        );


        // -----------------------------
        // IMAGEM
        // -----------------------------

        const image =
            document.createElement('img');


        image.className =
            'infinite-spiral__image';


        image.src = item.src;

        image.alt = item.alt;


        image.loading =
            index < 6
                ? 'eager'
                : 'lazy';


        image.draggable = false;


        image.style.width =
            `${cardWidth}px`;

        image.style.height =
            `${cardHeight}px`;


        image.style.maxWidth =
            'none';

        image.style.maxHeight =
            'none';


        image.style.objectFit =
            imageFit;


        image.style.filter =
            `grayscale(${Math.min(
                1,
                Math.max(0, grayscale)
            )})`;


        card.appendChild(image);

        stage.appendChild(card);


        cardRefs.push(card);
    });


    // --------------------------------
    // RESIZE
    // --------------------------------

    const resizeObserver =
        new ResizeObserver(() => {

            bounds =
                root.getBoundingClientRect();

        });


    resizeObserver.observe(root);


    // --------------------------------
    // VISIBILIDADE
    // --------------------------------

    const intersectionObserver =
        new IntersectionObserver(
            ([entry]) => {

                visible =
                    entry.isIntersecting;

            },
            {
                threshold: 0.02
            }
        );


    intersectionObserver.observe(root);


    // --------------------------------
    // SCROLL
    // --------------------------------

    const scrollEnabled =
        animationMode === 'scroll' ||
        animationMode === 'all';


    const scrollSpeedMultiplier =
        Math.max(speed, 0) / 0.55;


    let lastScrollY =
        window.scrollY;


    const handleScroll = () => {

        const nextScrollY =
            window.scrollY;


        const scrollDelta =
            nextScrollY - lastScrollY;


        lastScrollY =
            nextScrollY;


        if (
            !scrollEnabled ||
            !visible ||
            scrollDelta === 0
        ) {
            return;
        }


        targetProgress += clamp(

            (scrollDelta * scrollSpeedMultiplier) /
            Math.max(verticalSpacing * 2, 1),

            -1.5,
            1.5
        );
    };


    window.addEventListener(
        'scroll',
        handleScroll,
        {
            passive: true
        }
    );


    // --------------------------------
    // MOUSE
    // --------------------------------

    root.addEventListener(
        'mouseenter',
        () => {

            hovered = true;

        }
    );


    root.addEventListener(
        'mouseleave',
        () => {

            hovered = false;

        }
    );


    // --------------------------------
    // DRAG
    // --------------------------------

    const stopDragging = event => {

        if (!dragging) {
            return;
        }


        dragging = false;


        if (
            event &&
            root.hasPointerCapture(event.pointerId)
        ) {

            root.releasePointerCapture(
                event.pointerId
            );
        }


        root.style.cursor =
            dragEnabled
                ? 'grab'
                : 'default';
    };


    root.addEventListener(
        'pointerdown',
        event => {

            if (
                !dragEnabled ||
                event.button !== 0
            ) {
                return;
            }


            dragging = true;

            dragMoved = false;


            lastPointerY =
                event.clientY;


            targetProgress =
                progress;


            root.setPointerCapture(
                event.pointerId
            );


            root.style.cursor =
                'grabbing';
        }
    );


    root.addEventListener(
        'pointermove',
        event => {

            if (!dragging) {
                return;
            }


            const pointerDelta =
                event.clientY -
                lastPointerY;


            lastPointerY =
                event.clientY;


            if (
                Math.abs(pointerDelta) > 0.5
            ) {

                dragMoved = true;

            }


            targetProgress -=
                pointerDelta /
                Math.max(verticalSpacing, 1);
        }
    );


    root.addEventListener(
        'pointerup',
        stopDragging
    );


    root.addEventListener(
        'pointercancel',
        stopDragging
    );


    root.addEventListener(
        'click',
        event => {

            if (!dragMoved) {
                return;
            }


            event.preventDefault();

            event.stopPropagation();


            dragMoved = false;

        },
        true
    );


    // --------------------------------
    // ANIMAÇÃO
    // --------------------------------

    const reducedMotion =
        window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        );


    const render = time => {

        const delta =
            Math.min(
                (time - previousTime) / 1000,
                0.05
            );


        previousTime = time;


        const autoEnabled =
            animationMode === 'auto' ||
            animationMode === 'all';


        const motionPaused =
            dragging ||
            (
                pauseOnHover &&
                hovered
            );


        const directionMultiplier =
            direction === 'down'
                ? -1
                : 1;


        const desiredAutoSpeed =

            autoEnabled &&
            visible &&
            !reducedMotion.matches &&
            !motionPaused

                ? speed * directionMultiplier

                : 0;


        const speedBlend =
            1 - Math.exp(-delta * 7);


        autoSpeed +=
            (
                desiredAutoSpeed -
                autoSpeed
            ) *
            speedBlend;


        targetProgress +=
            autoSpeed * delta;


        const followBlend =
            1 -
            Math.exp(
                -delta *
                (
                    dragging
                        ? 22
                        : 11
                )
            );


        progress +=
            (
                targetProgress -
                progress
            ) *
            followBlend;


        // --------------------------------
        // DIMENSÕES
        // --------------------------------

        const count =
            normalizedItems.length;


        const half =
            count / 2;


        const width =
            Math.max(
                bounds.width,
                1
            );


        const height =
            Math.max(
                bounds.height,
                1
            );


        const fit =
            Math.min(
                1,
                width /
                    (cardWidth * 2.8),

                height /
                    (cardHeight * 2.35)
            );


        const responsiveRadius =
            Math.min(
                radius,
                Math.max(
                    72,
                    width * 0.36
                )
            ) * fit;


        const fadeStart =
            clamp(
                1 - edgeFade,
                0,
                0.98
            );


        const turnSize =
            Math.max(
                cardsPerTurn,
                1
            );


        // --------------------------------
        // POSICIONAR CARDS
        // --------------------------------

        cardRefs.forEach(
            (card, index) => {

                if (!card) {
                    return;
                }


                let offset =
                    index - progress;


                offset =
                    modulo(
                        offset + half,
                        count
                    ) - half;


                const edge =
                    Math.min(
                        Math.abs(offset) /
                        Math.max(half, 1),
                        1
                    );


                const opacity =
                    1 -
                    smoothstep(
                        fadeStart,
                        1,
                        edge
                    );


                const focus =
                    1 -
                    Math.min(
                        Math.abs(offset) /
                        Math.max(
                            turnSize * 0.65,
                            1
                        ),
                        1
                    );


                const scale =
                    (
                        1 +
                        (
                            centerScale - 1
                        ) *
                        focus
                    ) *
                    fit;


                const angle =
                    offset *
                    (
                        360 /
                        turnSize
                    ) +
                    rotation;


                const angleRadians =
                    (
                        angle *
                        Math.PI
                    ) / 180;


                const x =
                    Math.sin(
                        angleRadians
                    ) *
                    responsiveRadius;


                const z =
                    Math.cos(
                        angleRadians
                    ) *
                    responsiveRadius;


                const depthScale =
                    clamp(
                        perspective /
                        Math.max(
                            perspective - z,
                            1
                        ),
                        0.72,
                        1.45
                    );


                const visualScale =
                    scale *
                    depthScale;


                const depth =
                    (
                        z /
                        Math.max(
                            responsiveRadius,
                            1
                        ) +
                        1
                    ) / 2;


                const blur =
                    edgeBlur *
                    smoothstep(
                        0.35,
                        1,
                        edge
                    );


                card.style.transform =

                    `translate(-50%, -50%) ` +
                    `translate3d(` +
                    `${x}px, ` +
                    `${offset * verticalSpacing * fit}px, 0) ` +
                    `rotateZ(${cardTilt}deg) ` +
                    `scale(${visualScale})`;


                card.style.opacity =
                    opacity.toFixed(3);


                card.style.filter =
                    blur > 0.01
                        ? `blur(${blur.toFixed(2)}px)`
                        : 'none';


                card.style.zIndex =
                    String(
                        Math.round(
                            depth * 100000
                        ) + index
                    );


                card.style.pointerEvents =
                    opacity > 0.25
                        ? 'auto'
                        : 'none';

            }
        );


        animationFrame =
            requestAnimationFrame(
                render
            );
    };


    animationFrame =
        requestAnimationFrame(
            render
        );


    // --------------------------------
    // DESTROY
    // --------------------------------

    const destroy = () => {

        cancelAnimationFrame(
            animationFrame
        );


        resizeObserver.disconnect();

        intersectionObserver.disconnect();


        window.removeEventListener(
            'scroll',
            handleScroll
        );


        root.replaceChildren();

        root.classList.remove(
            'infinite-spiral'
        );

    };


    // --------------------------------
    // UPDATE
    // --------------------------------

    return {

        update(newOptions = {}) {

            console.warn(
                'Para atualizar opções dinamicamente, recrie o InfiniteSpiral.'
            );

        },


        destroy

    };
}


export default createInfiniteSpiral;