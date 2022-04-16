export default function install() {
    // We listen to the resize event
    const onResize = () => {
        // We execute the same script as before
        const dvh = window.innerHeight * 0.01;
        if(!window._BANDCAMP_COLLECTOR_SHADOW_DOM) throw new Error('Shadow DOM not found');
        (window._BANDCAMP_COLLECTOR_SHADOW_DOM.children[0] as HTMLElement).style.setProperty('--dvh', `${dvh}px`);
    };
    onResize();
    window.addEventListener('resize', onResize);
}

