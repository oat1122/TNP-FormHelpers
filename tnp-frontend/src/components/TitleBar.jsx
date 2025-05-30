import { 
    AppBar, 
    Container,
    Toolbar,
    Typography,
} from '@mui/material'
import React from 'react'

function TitleBar(props) {
  return (
    <AppBar position="static" sx={{ bgcolor: "#444444" }}>
        <Container maxWidth="xxl">
          <Toolbar
            disableGutters
            sx={{ display: "flex", justifyContent: "flex-end" }}
          >
            <Typography
              variant="h3"
              component="div"
              sx={{ fontFamily: "PSL KittithadaBold", letterSpacing: "0.1rem", textTransform: "uppercase" }}
            >
              {props.title}
            </Typography>
          </Toolbar>
        </Container>
      </AppBar>
  )
}

export default TitleBar