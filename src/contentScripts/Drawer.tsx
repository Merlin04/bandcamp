import React, {useCallback, useEffect, useMemo, useState} from "react";
import { Global } from "@emotion/react";
import SwipeableDrawer from "./SwipeableDrawer-patched/SwipeableDrawer";
import { DRAWER_ZI } from "./zIndices";
import { Paper, Box, Typography, styled } from "@mui/material";
import { PlayButton, TrackControls, usePlayerAlbumObj } from "./Player";
import { PlayerState, useStorage, useStore } from "./state";
import {motion} from "framer-motion";
import {Player} from "./PlayerDialog";
import { createState } from "niue";

const drawerBleeding = 75;

export const DrawerSpacer = () => {
    const { playerState } = useStore(["playerState"]);
    return playerState !== PlayerState.INACTIVE ? <Box sx={{ height: drawerBleeding, minHeight: drawerBleeding }} /> : null;
}

const Puller = styled(Box)(({ theme }) => ({
    width: 30,
    height: 6,
    // #e0e0e0 on a white background but transparent
    backgroundColor: "rgba(193, 193, 193, 0.5)",
    borderRadius: 3,
    position: "absolute",
    top: 8,
    left: "calc(50% - 15px)",
    zIndex: 10
}));

let scrollLocked = false;
type Coords = [number, number];
let scrollFirstCoords: Coords | null = null;

const SwipeableDrawerSx = {
    "& .MuiDrawer-paper": {
        height: `calc(calc(100 * var(--dvh)) - ${drawerBleeding + 50}px)`
    },
    zIndex: DRAWER_ZI
};
const SwipeableDrawerSwipeAreaProps = {
    sx: {
        zIndex: DRAWER_ZI - 1
    },
    // TODO
    // onClick: () => setOpen(true)
};
const SwipeableDrawerModalProps = {
    keepMounted: true
};

const [useDrawerState, setDrawerState] = createState({
    percentOpen: 0,
    innerDrawerOpen: false
});

export default function SwipeableEdgeDrawer() {
    const [open, setOpen] = React.useState(false);
    const drawerBoxRef = React.useRef<HTMLDivElement>(null);
    const drawerRef = React.useRef<HTMLDivElement>(null);

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
        if(!newOpen) {
            drawerBoxRef.current?.scrollTo({
                top: 0,
                left: 0,
                behavior: "smooth"
            });
        }
    };

    const [disableBoxScroll, setDisableBoxScroll] = React.useState(false);

    const onPercentOpenUpdate = useCallback((newPercentOpen: number) => {
        setDrawerState({ percentOpen: newPercentOpen });
        // drawerRef.current?.style.setProperty("--drawer-percent-open", `${newPercentOpen}`);
    }, []);
    const onInnerDrawerOpenUpdate = useCallback((newInnerDrawerOpen: boolean) => {
        setDrawerState({ innerDrawerOpen: newInnerDrawerOpen });
    }, []);

    const onClose = useCallback(toggleDrawer(false), []);
    const onOpen = useCallback(toggleDrawer(true), []);

    const DrawerChildren = useMemo(() => (
        <>
            <Global
                styles={{
                    ".MuiDrawer-root > .MuiPaper-root": {
                        height: `calc(50% - ${drawerBleeding}px)`,
                        overflow: "visible"
                    }
                }}
            />
            <Paper
                elevation={6}
                sx={{
                    position: "absolute",
                    top: -drawerBleeding /*+ 1*/ /* no idea why this is necessary but it removes a weird gap */,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    visibility: "visible",
                    right: 0,
                    left: 0,
                    overflow: disableBoxScroll || !open ? "hidden" : "auto",
                    maxHeight: "calc(100 * var(--dvh))",
                    minHeight: `calc(100% + ${drawerBleeding}px)`
                }}
                ref={drawerBoxRef}
                onTouchMove={(e) => {
                    const thisCoords: Coords = [
                        e.touches[0].clientX,
                        e.touches[0].clientY
                    ];

                    if (drawerBoxRef.current?.scrollTop !== 0) {
                        // console.log("Drawer scroll isn't at top, blocking");
                        e.stopPropagation();
                    } else if (!scrollFirstCoords) {
                        // console.log("Setting initial reference coordinates");
                        scrollFirstCoords = thisCoords;
                        e.stopPropagation();
                    } else if (
                        thisCoords[0] === scrollFirstCoords[0] &&
                        thisCoords[1] === scrollFirstCoords[1]
                    ) {
                        // console.log("coordinates same as the reference, blocking");
                        e.stopPropagation();
                    } else if (thisCoords[1] > scrollFirstCoords[1]) {
                        // console.log("Scroll up detected, locking");
                        // We're scrolling "up" (sliding the drawer down)
                        scrollLocked = true;
                        setDisableBoxScroll(true);
                    } else if (
                        (drawerRef.current!.querySelector(".MuiBackdrop-root") as HTMLElement)
                            .style.opacity === "1"
                    ) {
                        // The thing is all the way at the top
                        scrollLocked = false;
                        scrollFirstCoords = null;
                        setDisableBoxScroll(false);
                    } else if (!scrollLocked) {
                        // console.log("Scroll blocking (default case)");
                        e.stopPropagation();
                    }
                }}
                onTouchEnd={() => {
                    scrollLocked = false;
                    scrollFirstCoords = null;
                    setDisableBoxScroll(false);
                }}
            >
                <Puller />

                <DrawerContents open={open} />
            </Paper>
        </>
    ), [open, disableBoxScroll]);

    return (
        <SwipeableDrawer
            anchor="bottom"
            open={open}
            onClose={onClose}
            onOpen={onOpen}
            swipeAreaWidth={drawerBleeding}
            disableSwipeToOpen={false}
            ModalProps={SwipeableDrawerModalProps}
            sx={SwipeableDrawerSx}
            ref={drawerRef}
            SwipeAreaProps={SwipeableDrawerSwipeAreaProps}
            onPercentOpenUpdate={onPercentOpenUpdate}
            onInnerDrawerOpenUpdate={onInnerDrawerOpenUpdate}
        >
            {DrawerChildren}
        </SwipeableDrawer>
    );
}

enum DrawerState {
    Closed,
    Opening,
    Open,
    Closing
}

let evenOlderState: DrawerState | undefined = undefined;
let oldPercent = 0;

function DrawerContents({ open }: {
    open: boolean
}) {
    const { percentOpen: rawPercent, innerDrawerOpen } = useDrawerState(["percentOpen", "innerDrawerOpen"]);
    const [drawerState, setDrawerState] = useState<DrawerState>(DrawerState.Closed);

    // Sometimes this gets confused between open and closing but it's fine, percentage should still be accurate enough
    useEffect(() => {
        const newState =
            // Fully closed
            !open && !innerDrawerOpen ? DrawerState.Closed :
            // Dragging the drawer up (opening)
            !open && innerDrawerOpen ? DrawerState.Opening :
            // For some reason it sets it to this before fully open
            open && !innerDrawerOpen ? DrawerState.Opening :
            // Fully open
            // This is a bit weird because the only way we can tell between open and closing is that the first time open
            // and innerDrawerOpen are both true, it will be fully open, then as soon as the percent changes again it means the user is dragging it
            open && innerDrawerOpen && drawerState !== DrawerState.Open && drawerState !== DrawerState.Closing ? DrawerState.Open
            // Dragging the drawer down (closing)
            : DrawerState.Closing;

        // console.table({
        //     open,
        //     innerDrawerOpen,
        //     rawPercent,
        //     evenOlderState: evenOlderState && DrawerState[evenOlderState],
        //     drawerState: DrawerState[drawerState],
        //     newState: DrawerState[newState]
        // });

        if((
            // This is a weird edge case where it flips to closed before fully opening after the user stops the gesture
            newState === DrawerState.Closed && drawerState === DrawerState.Opening
                // make sure that it's not in this case from clicking to close the drawer
                && evenOlderState !== DrawerState.Open ||
            // And this is a weird one where it flips to opening before fully closing afer the user stops the gesture
            newState === DrawerState.Opening && drawerState === DrawerState.Closing
        ) && rawPercent === oldPercent) {
            // So don't actually update the state
            // console.log("Skipping state update");
            return;
        }

        if(newState !== drawerState) {
            evenOlderState = drawerState;
            // console.log("Set evenOlderState to ", DrawerState[evenOlderState]);
            setDrawerState(newState);
        }
        oldPercent = rawPercent;
    }, [open, innerDrawerOpen, rawPercent]);

    const percentOpen = {
        [DrawerState.Closed]: 0,
        [DrawerState.Opening]: rawPercent,
        [DrawerState.Open]: 1,
        [DrawerState.Closing]: rawPercent
    }[drawerState];

    const {
        playerAlbum,
        playerTrack
    } = useStore(["playerState", "playerAlbum", "playerTrack"]);

    const { albums } = useStorage(["albums"]);

    const playerAlbumObj = usePlayerAlbumObj({ playerAlbum, albums });

    return (playerAlbumObj && playerTrack !== null) ? (
        <Box>
            <motion.div style={{
                position: "relative"
            }} animate={{
                bottom: percentOpen * drawerBleeding
            }}>
                <MiniPlayer />
            </motion.div>
            <motion.div style={{
                position: "relative",
                padding: "20px 24px"
            }} animate={{
                top: -percentOpen * drawerBleeding
            }}>
                <Player playerAlbum={playerAlbum!} />
            </motion.div>
        </Box>
    ) : null;
}

function MiniPlayer() {
    const {
        playerAlbum,
        playerTrack
    } = useStore(["playerState", "playerAlbum", "playerTrack"]);

    const { albums } = useStorage(["albums"]);

    const playerAlbumObj = usePlayerAlbumObj({ playerAlbum, albums });

    return (
        <Box sx={{
            width: "100%",
            height: drawerBleeding,
            display: "flex",
            justifyContent: "center"
        }}>
            <Box
                component="img"
                src={playerAlbumObj!.data.imageUrl}
                sx={{
                    width: drawerBleeding
                }}
            />
            <Box sx={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                flex: 1
            }}>
                <Box sx={{
                    flex: 1,
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    marginLeft: "0.5rem"
                }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                        {playerAlbumObj!.data.artist}
                    </Typography>
                    <Typography sx={{ fontWeight: "bold" }}>
                        {playerAlbumObj!.data.title}
                    </Typography>
                    <Typography letterSpacing={-0.25}>
                        {playerAlbumObj!.data.tracks[playerTrack!].title}
                    </Typography>
                </Box>
                <PlayButton sx={{
                    pointerEvents: "auto"
                }}/>
                <TrackControls sx={{
                    pointerEvents: "auto"
                }} />
            </Box>
        </Box>
    )
}