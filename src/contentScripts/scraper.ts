export interface ArtistPageAlbum {
    name: string,
    relUrl: string | undefined,
    artistOverrideName: string | undefined,
    imageUrl: string | undefined
}

export interface ArtistData {
    name: string,
    bgColor: string,
    albums: ArtistPageAlbum[]
}

export interface AlbumData {
    artist: string,
    realArtist: string,
    title: string,
    description: string,
    releaseDate: string,
    url: string,
    imageUrl: string | undefined,
    tracks: {
        duration: number,
        url: string,
        title: string,
        pageUrl: string
    }[]
}

interface BCDataBand {
    design: {
        bg_file_name: string,
        text_color: string,
        bg_color: string,
        body_color: string,
        [key: string]: any
    },
    name: string,
    sites: {
        title: string,
        url: string,
        nav_type: unknown
    }[],
    [key: string]: any
}

interface BCDataTralbum {
    trackinfo: {
        duration: number,
        file: {
            "mp3-128": string
        },
        title: string,
        title_link: string
    }[],
    artist: string,
    current: {
        title: string,
        about: string,
        release_date: string
    },
    url: string
}

export function scrapeArtist(): ArtistData {
    const bandDataJson = document.querySelector("[data-band]")?.getAttribute("data-band");
    if (!bandDataJson) {
        throw new Error("Could not find band data");
    }
    const bandData = JSON.parse(bandDataJson) as BCDataBand;

    const musicGrid = document.getElementById("music-grid")?.children;
    if (!musicGrid) throw new Error("Music grid or its children is/are undefined");

    return {
        name: bandData.name,
        bgColor: bandData.design.bg_color,
        albums: Array.from(musicGrid).map(gridItem => {
            const artistOverrideName = gridItem.children[0].getElementsByClassName("artist-override")[0]?.textContent?.trim() ?? undefined;
            // Remove inner elements so textContent works as expected
            gridItem.children[0].querySelectorAll("span").forEach(e => e.remove());

            const imageTag = gridItem.children[0].getElementsByTagName("img")[0];

            return {
                name: gridItem.getElementsByClassName("title")[0].textContent?.trim() ?? "",
                relUrl: gridItem.getElementsByTagName("a")[0].getAttribute("href") ?? undefined,
                artistOverrideName,
                imageUrl: (imageTag.classList.contains("lazy") ? imageTag.getAttribute("data-original") : imageTag.getAttribute("src")) ?? undefined
            };
        })
    }
}

export function scrapeAlbum(): AlbumData {
    const tralbumDataJson = document.querySelector("[data-tralbum]")?.getAttribute("data-tralbum");
    if (!tralbumDataJson) {
        throw new Error("Could not find tralbum data");
    }
    const tralbumData = JSON.parse(tralbumDataJson) as BCDataTralbum;

    console.log(tralbumData);

    return {
        artist: tralbumData.artist,
        realArtist: (document.querySelector("#band-name-location > .title") as HTMLElement).innerText,
        title: tralbumData.current.title,
        description: tralbumData.current.about,
        releaseDate: tralbumData.current.release_date,
        url: tralbumData.url,
        imageUrl: document.getElementById("tralbumArt")?.children[0].getAttribute("href") ?? undefined,
        tracks: tralbumData.trackinfo.map(t => ({
            duration: t.duration,
            url: t.file['mp3-128'],
            title: t.title,
            pageUrl: t.title_link
        }))
    }
}

export enum PageType {
    Artist,
    Album,
    Unknown
}

function getPageType() {
    return document.getElementById("music-grid") ? PageType.Artist
        : document.getElementById("tralbumArt") ? PageType.Album
        : PageType.Unknown;
}

export const pageType = getPageType();

export const thisData = pageType === PageType.Artist ? scrapeArtist() : pageType === PageType.Album ? scrapeAlbum() : null;