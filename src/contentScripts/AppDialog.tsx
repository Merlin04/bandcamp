import {
    AppBar,
    Dialog,
    DialogContent,
    Fade,
    IconButton,
    Menu,
    MenuItem,
    Slide,
    Toolbar,
    Typography
} from "@mui/material";
import type {TransitionProps} from "@mui/material/transitions";
import React, {useState} from "react";
import {Album, defaultStorageValue, PlayerState, setState, setStorage, useStorage, useStore} from "./state";
import {setOpen} from "./App";
import AddThisAlbum from "./AddThisAlbum";
import {AlbumData, PageType, pageType, scrapeUnknownUrl, thisData} from "./scraper";
import Albums from "./Albums";
import {Close as CloseIcon, Delete, MoreVert, PlaylistRemove} from "@mui/icons-material";
import PlayerDialog from "./PlayerDialog";
import SwipeableEdgeDrawer, {DrawerSpacer} from "./Drawer";
import {BASE_ZI} from "./zIndices";
import {Portal} from "@mui/base";
import ErrorBoundary from "./ErrorBoundary";
import {alert, confirm, load, prompt} from "./DialogProvider";

export const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

export default function AppDialog() {
    const { open, deleteAlbumsMode, selectedAlbums, playerState, playerAlbum, playerDialogOpen, playerDialogAlbum } = useStore([
        "open",
        "deleteAlbumsMode",
        "selectedAlbums",
        "playerState",
        "playerAlbum",
        "playerDialogOpen",
        "playerDialogOpen"
    ]);

    return (
        <>
            <Dialog
                fullScreen
                disablePortal
                container={null}
                open={open}
                onClose={() => setOpen(false)}
                TransitionComponent={Transition}
                sx={{
                    overscrollBehavior: "contain",
                    "& *": {
                        overscrollBehavior: "contain"
                    },
                    zIndex: BASE_ZI,
                    // "& > .MuiDialog-container > .MuiDialog-paper": {
                    //     overflowX: "hidden"
                    // }
                }}
            >
                <ErrorBoundary>
                    <AppBar
                        sx={{
                            position: "relative",
                            transition:
                                "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, background-color 0.2s ease-in-out",
                            "& > *:nth-child(2)": {
                                position: "absolute"
                            },
                            "& > *": {
                                minWidth: {
                                    xs: "calc(100% - 32px)",
                                    sm: "calc(100% - 48px)"
                                }
                            }
                        }}
                        color={
                            deleteAlbumsMode ? ("warning" as "primary") : "primary"
                        }
                    >
                        {/* <Toolbar> */}
                        <Fade in={deleteAlbumsMode} unmountOnExit>
                            <Toolbar>
                                <IconButton
                                    edge="start"
                                    color="inherit"
                                    onClick={() => {
                                        setState({
                                            deleteAlbumsMode: false,
                                            selectedAlbums: []
                                        });
                                    }}
                                    aria-label="exit remove albums mode"
                                >
                                    <CloseIcon />
                                </IconButton>
                                <Typography
                                    sx={{ ml: 2, flex: 1 }}
                                    variant="h6"
                                    component="div"
                                >
                                    {selectedAlbums.length}
                                </Typography>
                                <DeleteSelectedItemsButton />
                            </Toolbar>
                        </Fade>
                        <Fade in={!deleteAlbumsMode} unmountOnExit>
                            <Toolbar>
                                <IconButton
                                    edge="start"
                                    color="inherit"
                                    onClick={() => setOpen(false)}
                                    aria-label="close"
                                >
                                    <CloseIcon />
                                </IconButton>
                                <Typography
                                    sx={{ ml: 2, flex: 1 }}
                                    variant="h6"
                                    component="div"
                                >
                                    Bandcamp Collector
                                </Typography>
                                <ActionsMenu />
                                <IconButton
                                    edge="end"
                                    color="inherit"
                                    onClick={() =>
                                        setState({ deleteAlbumsMode: true })
                                    }
                                    aria-label="remove albums"
                                >
                                    <PlaylistRemove />
                                </IconButton>
                            </Toolbar>
                        </Fade>
                        {/* </Toolbar> */}
                    </AppBar>
                    <DialogContent sx={{
                        position: "relative"
                    }}>
                        {pageType === PageType.Album && <AddThisAlbum />}
                        <Albums />
                        <DrawerSpacer />
                    </DialogContent>
                    {/* <MiniPlayer /> */}
                    <PlayerDialog />
                    {(playerState !== PlayerState.INACTIVE) && !(playerDialogOpen && playerAlbum === playerDialogAlbum) && (
                        <Portal
                            container={() =>
                                window._BANDCAMP_COLLECTOR_SHADOW_DOM.children[0]
                            }
                        >
                            <SwipeableEdgeDrawer />
                        </Portal>
                    )}
                </ErrorBoundary>
            </Dialog>
        </>
    );
}

function DeleteSelectedItemsButton() {
    const { albums } = useStorage(["albums"]);
    const { selectedAlbums } = useStore(["deleteAlbumsMode", "selectedAlbums"]);

    return (
        <IconButton
            edge="end"
            color="inherit"
            onClick={() => {
                setStorage({
                    albums: albums.filter(
                        (a) => !selectedAlbums.includes(a.data.url)
                    )
                });
                setState({
                    deleteAlbumsMode: false,
                    selectedAlbums: []
                });
            }}
            aria-label="remove selected albums"
        >
            <Delete />
        </IconButton>
    );
}

function ActionsMenu() {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const data = useStorage();

    return (
        <>
            <IconButton
                id="actions-menu-button"
                color="inherit"
                aria-controls={open ? "actions-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
            >
                <MoreVert />
            </IconButton>
            <Menu
                id="actions-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    "aria-labelledby": "actions-menu-button"
                }}
                container={
                    anchorEl?.parentElement?.parentElement?.parentElement
                }
            >
                <MenuItem
                    onClick={async () => {
                        const sd = {
                            title: "Bandcamp Collector data",
                            //text: JSON.stringify(data),
                            files: [
                                new File(
                                    [JSON.stringify(data)],
                                    "bc-collector-data.json",
                                    {
                                        type: "application/json"
                                    }
                                )
                            ]
                        };
                        if(navigator.share && navigator.canShare(sd)) {
                            await navigator.share(sd);
                        } else {
                            // Copy the data to clipboard
                            await navigator.clipboard.writeText(JSON.stringify(data));
                            await alert("Copied to clipboard!");
                        }
                        handleClose();
                    }}
                >
                    Export data
                </MenuItem>
                <MenuItem
                    onClick={async () => {
                        const newData = await prompt("Paste the data here");
                        if (newData) {
                            try {
                                const parsed = JSON.parse(newData);
                                setStorage(parsed);
                            } catch (e) {
                                await alert("Failed to parse input");
                                return;
                            }
                        }
                        handleClose();
                    }}
                >
                    Import data
                </MenuItem>
                <MenuItem
                    onClick={async () => {
                        const urls = (await prompt({
                            title: "Import URLs",
                            text: "Paste a list of Bandcamp artist or album URLs here (one per line, an artist URL will import all of their albums)"
                        }, { multiline: true }))?.split("\n");

                        if(!urls) return;

                        const done = load();

                        const albums = (await (async function scrapeUrls(urls: string[]): Promise<AlbumData[]> {
                            return await urls.reduce(async (prev, url) => {
                                const a = await prev;
                                const o = await scrapeUnknownUrl(url);

                                await new Promise(resolve => setTimeout(resolve, 250));
                                return [...a, ...(o.type === PageType.Artist ? await scrapeUrls(o.albums.map(a => url + a.relUrl)) : [o])];
                            }, Promise.resolve([] as AlbumData[]));
                        })(urls)).map<Album>(data => ({
                            data,
                            tags: [...data.tags],
                            lastUpdated: new Date().getTime()
                        }));

                        setStorage({
                            ...data,
                            albums: [...data.albums, ...albums]
                        });
                        done();
                    }}
                >
                    Import URLs
                </MenuItem>
                <MenuItem
                    onClick={async () => {
                        if (
                            await confirm(
                                "Are you sure you want to delete all your data?"
                            )
                        ) {
                            setStorage({ ...defaultStorageValue });
                        }
                        handleClose();
                    }}
                >
                    {" "}
                    Reset extension
                </MenuItem>
            </Menu>
        </>
    );
}
