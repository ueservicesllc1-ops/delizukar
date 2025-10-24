import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Typography,
  Paper,
  Divider,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered
} from '@mui/icons-material';

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Escribe tu contenido aquí...",
  minHeight = 200,
  showToolbar = true 
}) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const getSelection = () => {
    return window.getSelection();
  };

  const isCommandActive = (command) => {
    return document.queryCommandState(command);
  };

  const handleKeyDown = (e) => {
    // Ctrl+B para negrita
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      execCommand('bold');
    }
    // Ctrl+I para cursiva
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      execCommand('italic');
    }
    // Ctrl+U para subrayado
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      execCommand('underline');
    }
  };

  const ToolbarButton = ({ command, icon, tooltip, value = null }) => (
    <Tooltip title={tooltip}>
      <IconButton
        size="small"
        onClick={() => execCommand(command, value)}
        sx={{
          backgroundColor: isCommandActive(command) ? '#c8626d' : 'transparent',
          color: isCommandActive(command) ? 'white' : '#666',
          '&:hover': {
            backgroundColor: isCommandActive(command) ? '#b5555a' : '#f5f5f5'
          }
        }}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );

  return (
    <Box>
      {showToolbar && (
        <Paper
          elevation={1}
          sx={{
            p: 1,
            mb: 1,
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            backgroundColor: '#fafafa'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {/* Alineación de texto */}
            <Typography variant="caption" sx={{ color: '#666', mr: 1, fontWeight: 600 }}>
              Alineación:
            </Typography>
            <ButtonGroup size="small" variant="outlined">
              <ToolbarButton
                command="justifyLeft"
                icon={<FormatAlignLeft />}
                tooltip="Alinear a la izquierda"
              />
              <ToolbarButton
                command="justifyCenter"
                icon={<FormatAlignCenter />}
                tooltip="Centrar"
              />
              <ToolbarButton
                command="justifyRight"
                icon={<FormatAlignRight />}
                tooltip="Alinear a la derecha"
              />
              <ToolbarButton
                command="justifyFull"
                icon={<FormatAlignJustify />}
                tooltip="Justificar texto"
              />
            </ButtonGroup>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Formato de texto */}
            <Typography variant="caption" sx={{ color: '#666', mr: 1, fontWeight: 600 }}>
              Formato:
            </Typography>
            <ToolbarButton
              command="bold"
              icon={<FormatBold />}
              tooltip="Negrita (Ctrl+B)"
            />
            <ToolbarButton
              command="italic"
              icon={<FormatItalic />}
              tooltip="Cursiva (Ctrl+I)"
            />
            <ToolbarButton
              command="underline"
              icon={<FormatUnderlined />}
              tooltip="Subrayado (Ctrl+U)"
            />

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Listas */}
            <Typography variant="caption" sx={{ color: '#666', mr: 1, fontWeight: 600 }}>
              Listas:
            </Typography>
            <ToolbarButton
              command="insertUnorderedList"
              icon={<FormatListBulleted />}
              tooltip="Lista con viñetas"
            />
            <ToolbarButton
              command="insertOrderedList"
              icon={<FormatListNumbered />}
              tooltip="Lista numerada"
            />
          </Box>
        </Paper>
      )}

      <Box
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        sx={{
          minHeight: `${minHeight}px`,
          padding: 2,
          border: `2px solid ${isFocused ? '#c8626d' : '#e0e0e0'}`,
          borderRadius: '8px',
          backgroundColor: 'white',
          outline: 'none',
          '&:empty:before': {
            content: `"${placeholder}"`,
            color: '#999',
            fontStyle: 'italic'
          },
          '&:focus': {
            borderColor: '#c8626d',
            boxShadow: '0 0 0 2px rgba(200, 98, 109, 0.1)'
          },
          '& p': {
            margin: '0 0 8px 0',
            '&:last-child': {
              marginBottom: 0
            }
          },
          '& ul, & ol': {
            margin: '8px 0',
            paddingLeft: '20px'
          },
          '& li': {
            margin: '4px 0'
          }
        }}
        dangerouslySetInnerHTML={{ __html: value || '' }}
      />

      <Typography variant="caption" sx={{ color: '#666', mt: 1, display: 'block' }}>
        💡 Tip: Usa Ctrl+B para negrita, Ctrl+I para cursiva, Ctrl+U para subrayado
      </Typography>
    </Box>
  );
};

export default RichTextEditor;
