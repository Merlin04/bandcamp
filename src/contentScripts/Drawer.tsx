import * as React from "react";
import { Global } from "@emotion/react";
import { styled } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { grey } from "@mui/material/colors";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
// import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import SwipeableDrawer from "./SwipeableDrawer-patched";
import { DRAWER_ZI } from "./zIndices";

const drawerBleeding = 56;

const StyledBox = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.mode === "light" ? "#fff" : grey[800]
}));

const Puller = styled(Box)(({ theme }) => ({
    width: 30,
    height: 6,
    backgroundColor: theme.palette.mode === "light" ? grey[300] : grey[900],
    borderRadius: 3,
    position: "absolute",
    top: 8,
    left: "calc(50% - 15px)"
}));

let scrollLocked = false;
type Coords = [number, number];
let scrollFirstCoords: Coords | null = null;

export default function SwipeableEdgeDrawer() {
    const [open, setOpen] = React.useState(true);

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
    };

    const drawerBoxRef = React.useRef<HTMLDivElement>(null);
    const drawerRef = React.useRef<HTMLDivElement>(null);

    const [disableBoxScroll, setDisableBoxScroll] = React.useState(false);

    return (
        // <Root>
        /*  */
        <SwipeableDrawer
            // disablePortal
            // container={() => window._BANDCAMP_COLLECTOR_SHADOW_DOM as unknown as HTMLElement}
            anchor="bottom"
            open={open}
            onClose={toggleDrawer(false)}
            onOpen={toggleDrawer(true)}
            swipeAreaWidth={drawerBleeding}
            disableSwipeToOpen={false}
            ModalProps={{
                keepMounted: true
                //   disablePortal: true
            }}
            sx={{
                "& .MuiDrawer-paper": {
                    height: `calc(100vh - ${drawerBleeding}px)`
                    // overflow: "auto"
                },
                zIndex: DRAWER_ZI
            }}
            ref={drawerRef}
            SwipeAreaProps={{
                sx: {
                    zIndex: DRAWER_ZI - 1
                }
            }}
        >
            <Global
                styles={{
                    ".MuiDrawer-root > .MuiPaper-root": {
                        height: `calc(50% - ${drawerBleeding}px)`,
                        overflow: "visible"
                    }
                }}
            />
            <StyledBox
                sx={{
                    position: "absolute",
                    top: -drawerBleeding,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    visibility: "visible",
                    right: 0,
                    left: 0,
                    overflow: disableBoxScroll || !open ? "hidden" : "auto",
                    maxHeight: "100vh"
                }}
                ref={drawerBoxRef}
                onTouchMove={(e) => {
                    // console.log("Touch move", e);
                    // console.log(drawerBoxRef.current.scrollTop);
                    // console.log(drawerRef);

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
                        drawerRef.current!.querySelector(".MuiBackdrop-root")
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
                <Typography sx={{ p: 2, color: "text.secondary" }}>
                    51 resultstsratrs
                </Typography>
                <Skeleton variant="rectangular" height="200vh" />
            </StyledBox>
        </SwipeableDrawer>
        // </Root>
    );
}
