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
import { TransitionProps } from "@mui/material/transitions";
import CloseIcon from "@mui/icons-material/Close";
import React, { useState } from "react";
import {
    defaultStorageValue,
    PlayerState,
    setState,
    setStorage,
    useStorage,
    useStore
} from "./state";
import { setOpen } from "./App";
import AddThisAlbum from "./AddThisAlbum";
import { PageType, pageType } from "./scraper";
import Albums from "./Albums";
import { Delete, MoreVert, PlaylistRemove } from "@mui/icons-material";
import MiniPlayer from "./MiniPlayer";
import PlayerDialog from "./PlayerDialog";
import SwipeableEdgeDrawer, { DrawerSpacer } from "./Drawer";
import { BASE_ZI } from "./zIndices";
import { Portal } from "@mui/base";

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
                    zIndex: BASE_ZI
                }}
            >
                <AppBar
                    sx={{
                        position: "relative",
                        transition:
                            "box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, background-color 0.2s ease-in-out",
                        "& > *:nth-child(2)": {
                            position: "absolute"
                        },
                        "& > *": {
                            minWidth: "calc(100% - 32px)"
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
                <DialogContent>
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

    console.log(open);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
        console.log(event.currentTarget);
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
                    onClick={() => {
                        // Copy the data to clipboard
                        navigator.clipboard.writeText(JSON.stringify(data));
                        alert("Copied to clipboard!");
                        handleClose();
                    }}
                >
                    Export data
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        const newData = prompt("Paste the data here");
                        if (newData) {
                            try {
                                const parsed = JSON.parse(newData);
                                setStorage(parsed);
                            } catch (e) {
                                alert("Failed to parse input");
                                return;
                            }
                        }
                        handleClose();
                    }}
                >
                    Import data
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        if (
                            confirm(
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
