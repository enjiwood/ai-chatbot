'use client'
import { Stack, Box, TextField, Button, Typography } from "@mui/material"
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { useState, useEffect, useRef } from 'react'

const theme = createTheme({
  palette: {
    primary: {
      main: '#999799'
    },
    secondary: {
      main: '#E5625E',
    },
    success: {
      main: '#A34946'
    }
  }
});

export default function Home() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Hello! How can I assist you today?`,
  }])

  const [message, setMessage] = useState('')
  const bottomScroll = useRef(null)

  useEffect(() => {
    if (bottomScroll.current) {
      bottomScroll.current.scrollIntoView({behavior: 'smooth'})
    }
  }, [messages])

  const sendMessage = async() => {
    setMessage('')
    setMessages((messages) => [
      ...messages,
      {role: 'user', content: message},
      {role: 'assistant', content: ''},
    ])
    const response = fetch('/api/chat', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: message }),
    })
    .then(async (res) => {
      if (!res.ok) {
        console.log("Response not ok", await res.text());  // Log the error response
        throw new Error('Network response was not ok');
      }
      
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      
      function processText({ done, value }) {
        if (done) {
          return;
        }
        const text = decoder.decode(value || new Int8Array(), {stream: true})
        setMessages((messages) => {
          let lastMessage = messages[messages.length - 1]
          let otherMessages = messages.slice(0, messages.length - 1)
          return [
            ...otherMessages,
            {
              ...lastMessage,
              content: lastMessage.content + text
            },
          ]
        })
        return reader.read().then(processText)
      }
    
      return reader.read().then(processText)
    })
    .catch(error => {
      console.error('There was a problem with the fetch operation:', error);
    });
  }

  return (
    <ThemeProvider theme={theme}>
      <Box 
        width="100vw" 
        height="100vh" 
        display="flex" 
        flexDirection="column" 
        justifyContent="center" 
        alignItems="center"
        >
          <Stack
            direction="column"
            width="600px"
            height="700px"
            border="1px solid black"
            p={2}
            spacing={3}
            bgcolor="#272727"
            borderRadius="15px"
            boxShadow="0px 0px 50px #E5625E"
          >
            <Stack
              direction="column"
              spacing={2}
              flexGrow={1}
              overflow="auto"
              maxHeight="100%"
            >
              {
                messages.map((message, index) => (
                  <Box 
                    key={index}
                    display="flex"
                    justifyContent={
                      message.role === 'assistant' ? 'flex-start' : 'flex-end'
                  }
                  >
                    <Box bgcolor={
                        message.role === 'assistant' ? 'primary.main' : 'secondary.main'
                      }
                      color="white"
                      borderRadius= {
                        message.role === 'assistant' ? "15px 15px 15px 0px" : "15px 15px 0px 15px"
                      }
                      p={3}
                      maxWidth="75%"
                    >
                      {message.content}
                    </Box>
                  </Box>
                ))
              }
              <div ref={bottomScroll}></div>
            </Stack>
            <Stack
              direction="row"
              spacing={2}
            >
              <Box
                bgcolor="white"
                width="100%"
                height="100%"
                border="2px solid #000"
                borderRadius="15px"
              >
                <TextField
                  hiddenLabel
                  fullWidth
                  value={message}
                  InputProps={{
                    style: {
                      borderRadius: "15px",
                      disableUnderline: true,
                    }
                  }}
                  sx={{
                    "& fieldset": { border: 'none' }
                  }}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(ev) => {
                    console.log(`Pressed keyCode ${ev.key}`);
                    if (ev.key === 'Enter') {
                      sendMessage()
                      ev.preventDefault()
                    }
                  }}
                />
              </Box>
              <Button
                variant="contained"
                color="success"
                sx={
                  {borderRadius: "15px"}
                }
                onClick={sendMessage}
              >
                <Typography
                  color="white"
                >
                  Send
                </Typography>
              </Button>
            </Stack>
          </Stack>
      </Box>
    </ThemeProvider>
  )
}
