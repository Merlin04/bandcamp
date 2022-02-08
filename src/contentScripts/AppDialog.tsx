import { AppBar, Dialog, IconButton, Slide, Toolbar, Typography } from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import CloseIcon from "@mui/icons-material/Close";
import React from "react";
import { setState, useStore } from "./state";
import { setOpen } from "./App";

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
      children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
  ) {
    return <Slide direction="up" ref={ref} {...props} />;
  });
  
export default function AppDialog() {
    const { open } = useStore(["open"]);

    return (
        <Dialog
            fullScreen
            disablePortal
            open={open}
            onClose={() => setOpen(false)}
            TransitionComponent={Transition}
        >
            <AppBar sx={{ position: "relative" }}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => setOpen(false)}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                    <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                        Bandcamp Collector
                    </Typography>
                </Toolbar>
            </AppBar>
        </Dialog>
    );
}