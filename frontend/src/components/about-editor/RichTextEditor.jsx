'use client';
import { memo, useEffect, useRef, useState } from 'react';
import {
  Box, Button, Divider, IconButton, MenuItem, Popover, Select, TextField, Tooltip, Typography, useTheme,
} from '@mui/material';
import {
  FormatBold, FormatItalic, FormatUnderlined, FormatListBulleted, FormatListNumbered,
  InsertLink, LinkOff, Undo, Redo,
} from '@mui/icons-material';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import { toEditorHtml, normalizeLink } from '@/lib/richText';

const RED = '#c62828';
const NAVY = '#1f2937';
const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const mod = isMac ? '⌘' : 'Ctrl+';

function ToolButton({ label, shortcut, active, disabled, onClick, children }) {
  return (
    // describeChild: the button already has its own aria-label, so the tooltip only describes it
    <Tooltip describeChild title={shortcut ? `${label} (${shortcut})` : label}>
      <span>
        <IconButton
          size="small" aria-label={label} aria-pressed={active === undefined ? undefined : active} disabled={disabled}
          disableRipple // the round ripple ignores the 8px corners; focus is shown by the outline below
          onMouseDown={(e) => e.preventDefault()} // keep the editor's selection
          onClick={onClick}
          sx={{
            width: 34, height: 34, borderRadius: '8px', color: active ? RED : 'text.secondary',
            bgcolor: active ? 'rgba(198,40,40,0.1)' : 'transparent',
            transition: 'background-color 0.15s, color 0.15s',
            '&:hover': { bgcolor: active ? 'rgba(198,40,40,0.16)' : 'action.hover', color: active ? RED : 'text.primary' },
            '&.Mui-focusVisible': { outline: `2px solid ${RED}`, outlineOffset: 1 },
            '& svg': { fontSize: 20 },
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

const Sep = () => <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />;

/**
 * Rich-text field (TipTap). `value` is HTML or legacy plain text; `onChange` receives HTML,
 * or '' when the editor is empty. `max` limits visible characters — typing and pasting past it
 * is blocked. Output is limited to p, h2, h3, strong, em, u, ul, ol, li, a and br, which the
 * backend enforces again before saving.
 */
function RichTextEditor({ id, label, helper, value, onChange, max, placeholder }) {
  const isDark = useTheme().palette.mode === 'dark';
  const lastEmitted = useRef(value);
  const [notice, setNotice] = useState('');
  const [linkAnchor, setLinkAnchor] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState('');
  const toolbarRef = useRef(null);
  // The editor keeps the callbacks it was created with; these refs always point at the latest ones.
  const onChangeRef = useRef(onChange);
  const openLinkRef = useRef(() => {});
  onChangeRef.current = onChange;

  const editor = useEditor({
    immediatelyRender: false, // Next.js renders on the server first; build the editor client-side
    // Re-render on every change so the toolbar state and counter are always current — including
    // after content is loaded from the server, which useEditorState's snapshot can miss.
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false, codeBlock: false, blockquote: false, strike: false, horizontalRule: false,
        link: {
          openOnClick: false, autolink: true, defaultProtocol: 'https',
          protocols: ['http', 'https', 'mailto'],
          isAllowedUri: (url) => !!normalizeLink(url), // only ever yields http(s) or mailto
          HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' },
        },
      }),
      CharacterCount.configure({ limit: max }),
      Placeholder.configure({ placeholder: placeholder || '' }),
    ],
    content: toEditorHtml(value),
    editorProps: {
      attributes: {
        id, role: 'textbox', 'aria-multiline': 'true', 'aria-label': label,
        ...(helper ? { 'aria-describedby': `${id}-helper` } : {}),
      },
      // Refuse a paste that would go over the limit (rather than silently cutting it) and say why.
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain') || '';
        const { from, to } = view.state.selection;
        const current = view.state.doc.textBetween(0, view.state.doc.content.size, undefined, ' ').length;
        const selected = view.state.doc.textBetween(from, to, undefined, ' ').length;
        if (current - selected + text.length > max) {
          setNotice(`That paste would go over the ${max.toLocaleString()}-character limit, so it wasn't added.`);
          return true;
        }
        setNotice('');
        return false;
      },
      handleKeyDown: (view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          openLinkRef.current();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.isEmpty ? '' : ed.getHTML();
      lastEmitted.current = html;
      onChangeRef.current(html);
    },
  });

  // Content changed from outside (loaded, discarded, saved): load it without counting as an edit.
  useEffect(() => {
    if (!editor || value === lastEmitted.current) return;
    lastEmitted.current = value;
    editor.commands.setContent(toEditorHtml(value), { emitUpdate: false });
  }, [editor, value]);

  // Toolbar state, read fresh on each render (the editor re-renders on every transaction).
  const s = editor && !editor.isDestroyed ? {
    bold: editor.isActive('bold'), italic: editor.isActive('italic'), underline: editor.isActive('underline'),
    bullet: editor.isActive('bulletList'), ordered: editor.isActive('orderedList'), link: editor.isActive('link'),
    block: editor.isActive('heading', { level: 2 }) ? 'h2' : editor.isActive('heading', { level: 3 }) ? 'h3' : 'p',
    canUndo: editor.can().undo(), canRedo: editor.can().redo(),
    count: editor.storage.characterCount.characters(),
    focused: editor.isFocused,
  } : {};

  function openLink() {
    if (!editor) return;
    setLinkUrl(editor.getAttributes('link').href || '');
    setLinkError('');
    setLinkAnchor(toolbarRef.current);
  }
  openLinkRef.current = openLink;
  const closeLink = () => { setLinkAnchor(null); editor?.commands.focus(); };
  const applyLink = (e) => {
    e?.preventDefault();
    const href = normalizeLink(linkUrl);
    if (!href) { setLinkError('Enter a web address (https://…) or an email address.'); return; }
    const chain = editor.chain().focus().extendMarkRange('link');
    if (editor.state.selection.empty && !editor.isActive('link')) {
      chain.insertContent({ type: 'text', text: linkUrl.trim(), marks: [{ type: 'link', attrs: { href } }] }).run();
    } else {
      chain.setLink({ href }).run();
    }
    setLinkAnchor(null);
  };
  const removeLink = () => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); setLinkAnchor(null); };

  const setBlock = (block) => {
    const chain = editor.chain().focus();
    if (block === 'p') chain.setParagraph().run();
    else chain.setHeading({ level: block === 'h2' ? 2 : 3 }).run();
  };

  const count = s.count ?? 0;
  const ready = !!editor;

  return (
    <Box>
      <Typography component="label" htmlFor={id} sx={{ display: 'block', fontWeight: 600, fontSize: '0.86rem' }}
        onClick={() => editor?.commands.focus()}>
        {label}
      </Typography>
      {helper && <Typography id={`${id}-helper`} sx={{ color: 'text.secondary', fontSize: '0.78rem', mb: 0.75 }}>{helper}</Typography>}

      <Box sx={{
        borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
        border: `1px solid ${s.focused ? RED : isDark ? '#3a3a3a' : '#dcdfe4'}`,
        boxShadow: s.focused ? '0 0 0 4px rgba(198,40,40,0.12)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': { borderColor: s.focused ? RED : isDark ? '#555' : '#b8bec7' },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}>
        {/* Toolbar */}
        <Box ref={toolbarRef} role="toolbar" aria-label={`${label} formatting`} sx={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.25, px: 1, py: 0.75,
          borderBottom: 1, borderColor: 'divider',
        }}>
          <ToolButton label="Bold" shortcut={`${mod}B`} active={!!s.bold} disabled={!ready} onClick={() => editor.chain().focus().toggleBold().run()}><FormatBold /></ToolButton>
          <ToolButton label="Italic" shortcut={`${mod}I`} active={!!s.italic} disabled={!ready} onClick={() => editor.chain().focus().toggleItalic().run()}><FormatItalic /></ToolButton>
          <ToolButton label="Underline" shortcut={`${mod}U`} active={!!s.underline} disabled={!ready} onClick={() => editor.chain().focus().toggleUnderline().run()}><FormatUnderlined /></ToolButton>
          <Sep />
          <ToolButton label="Bulleted list" active={!!s.bullet} disabled={!ready} onClick={() => editor.chain().focus().toggleBulletList().run()}><FormatListBulleted /></ToolButton>
          <ToolButton label="Numbered list" active={!!s.ordered} disabled={!ready} onClick={() => editor.chain().focus().toggleOrderedList().run()}><FormatListNumbered /></ToolButton>
          <Sep />
          <ToolButton label={s.link ? 'Edit link' : 'Insert link'} shortcut={`${mod}K`} active={!!s.link} disabled={!ready} onClick={openLink}><InsertLink /></ToolButton>
          {s.link && <ToolButton label="Remove link" disabled={!ready} onClick={removeLink}><LinkOff /></ToolButton>}
          <Sep />
          <Select
            size="small" value={s.block || 'p'} disabled={!ready} onChange={(e) => setBlock(e.target.value)}
            inputProps={{ 'aria-label': 'Text style' }}
            MenuProps={{ disableAutoFocusItem: true, slotProps: { paper: { sx: { borderRadius: '10px', mt: 0.5 } } } }}
            onClose={() => setTimeout(() => editor?.commands.focus(), 0)}
            sx={{
              minWidth: 136, height: 34, fontSize: '0.85rem', fontWeight: 600, borderRadius: '8px', color: 'text.primary',
              '& fieldset': { border: 'none' }, '&:hover': { bgcolor: 'action.hover' },
              '&.Mui-focused': { outline: `2px solid ${RED}`, outlineOffset: 1 },
            }}
          >
            <MenuItem value="p" sx={{ fontSize: '0.9rem' }}>Normal text</MenuItem>
            <MenuItem value="h2" sx={{ fontSize: '1.05rem', fontWeight: 800 }}>Heading 2</MenuItem>
            <MenuItem value="h3" sx={{ fontSize: '0.95rem', fontWeight: 800 }}>Heading 3</MenuItem>
          </Select>
          <Box sx={{ flex: 1 }} />
          <ToolButton label="Undo" shortcut={`${mod}Z`} disabled={!ready || !s.canUndo} onClick={() => editor.chain().focus().undo().run()}><Undo /></ToolButton>
          <ToolButton label="Redo" shortcut={isMac ? '⇧⌘Z' : 'Ctrl+Y'} disabled={!ready || !s.canRedo} onClick={() => editor.chain().focus().redo().run()}><Redo /></ToolButton>
        </Box>

        {/* Content */}
        <Box sx={{
          px: 2, py: 1.5, color: isDark ? 'grey.100' : NAVY, fontSize: '0.95rem', lineHeight: 1.65,
          '& .ProseMirror': { minHeight: 150, outline: 'none' },
          '& .ProseMirror > :first-of-type': { mt: 0 },
          '& .ProseMirror p': { my: 0.75 },
          '& .ProseMirror h2': { fontSize: '1.3rem', fontWeight: 800, mt: 1.5, mb: 0.5, lineHeight: 1.3 },
          '& .ProseMirror h3': { fontSize: '1.1rem', fontWeight: 800, mt: 1.25, mb: 0.5, lineHeight: 1.3 },
          '& .ProseMirror ul, & .ProseMirror ol': { pl: 3, my: 0.75 },
          '& .ProseMirror li > p': { my: 0.25 },
          '& .ProseMirror ul li::marker': { color: RED },
          '& .ProseMirror ol li::marker': { color: RED, fontWeight: 700 },
          '& .ProseMirror a': { color: RED, fontWeight: 600, textUnderlineOffset: '2px', cursor: 'text' },
          '& .ProseMirror strong': { fontWeight: 700 },
          '& .ProseMirror p.is-editor-empty:first-of-type::before': {
            content: 'attr(data-placeholder)', color: 'text.disabled', float: 'left', height: 0, pointerEvents: 'none',
          },
        }}>
          {ready ? <EditorContent editor={editor} /> : <Box sx={{ minHeight: 150 }} />}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 0.5 }}>
        <Typography role="status" sx={{ fontSize: '0.75rem', color: RED }}>{notice}</Typography>
        <Typography aria-live="polite" sx={{ fontSize: '0.72rem', whiteSpace: 'nowrap', color: count >= max ? RED : count > max * 0.9 ? '#b45309' : 'text.disabled', fontWeight: count >= max ? 700 : 400 }}>
          {count}/{max}
        </Typography>
      </Box>

      <Popover
        open={!!linkAnchor} anchorEl={linkAnchor} onClose={closeLink}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ paper: { sx: { borderRadius: '12px', p: 2, width: 340, maxWidth: 'calc(100vw - 32px)' } } }}
      >
        <Box component="form" onSubmit={applyLink} noValidate>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 1 }}>{s.link ? 'Edit link' : 'Insert link'}</Typography>
          <TextField
            autoFocus fullWidth size="small" placeholder="https://example.org" value={linkUrl}
            onChange={(e) => { setLinkUrl(e.target.value); setLinkError(''); }}
            error={!!linkError} helperText={linkError || 'Web or email address. Opens in a new tab.'}
            slotProps={{ htmlInput: { 'aria-label': 'Link address' } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1.5 }}>
            {s.link && <Button onClick={removeLink} color="inherit" sx={{ textTransform: 'none', mr: 'auto' }}>Remove</Button>}
            <Button onClick={closeLink} color="inherit" sx={{ textTransform: 'none' }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ textTransform: 'none', fontWeight: 700, bgcolor: RED, '&:hover': { bgcolor: '#b71c1c' } }}>Apply</Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
}

// Memoised: with a stable onChange from the parent, typing elsewhere doesn't re-render it.
export default memo(RichTextEditor);
