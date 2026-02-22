import { Link, useParams } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import StoryBiblePanel from '../components/StoryBiblePanel'
import { username, password } from '../globals'

function EditorPage() {
  const { projectId } = useParams()
  const [storyBibleEnabled, setStoryBibleEnabled] = useState(true)
  const [showStoryBible, setShowStoryBible] = useState(false)
  const [isBibleEditable, setIsBibleEditable] = useState(true)
  const [activeDocument, setActiveDocument] = useState('Chapter 1')
  const [editorHtml, setEditorHtml] = useState('')
  // Chapter-specific content storage
  const [chapterContents, setChapterContents] = useState({})
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState('next')
  const [storyBible, setStoryBible] = useState({
    braindump: '',
    genre: '',
    styleNotes: '',
    synopsis: '',
    characters: '',
    worldbuilding: '',
    outline: '',
  })
  const [charactersList, setCharactersList] = useState([])
  const [newCharacterName, setNewCharacterName] = useState('')
  const [newCharacterSummary, setNewCharacterSummary] = useState('')
  const [newCharacterRole, setNewCharacterRole] = useState('')
  const [expandedCharacters, setExpandedCharacters] = useState([])
  const [worldElements, setWorldElements] = useState([])
  const [isGeneratingSynopsis, setIsGeneratingSynopsis] = useState(false)
  const [isGeneratingWorldbuilding, setIsGeneratingWorldbuilding] = useState(false)
  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false)
  const [upgradeButtonText, setUpgradeButtonText] = useState('Upgrade')
  const [isPro, setIsPro] = useState(false)
  const [showProToast, setShowProToast] = useState(false)
  const [showSyncToast, setShowSyncToast] = useState(false)
  const [currentIntentId, setCurrentIntentId] = useState(null)
  const [chapters, setChapters] = useState([
    { id: 1, name: 'Chapter 1' }
  ])
  const [selectedChapterId, setSelectedChapterId] = useState(1)
  const [newChapterName, setNewChapterName] = useState('')
  const [editingChapterId, setEditingChapterId] = useState(null)
  const [editingChapterName, setEditingChapterName] = useState('')

  const editorRef = useRef(null)
  const charactersFormRef = useRef(null)
  const hacksFetchedRef = useRef(false)
  const processCurrentChapterRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Fetch hacks data on mount
  useEffect(() => {
    if (hacksFetchedRef.current) return
    hacksFetchedRef.current = true
    const fetchHacksData = async () => {
      try {
        const res = await fetch('http://164.52.218.116/hacks/get_data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login_id: username,
            password: password,
            mode: 'web',
          }),
        })
        const data = await res.json()
        const botText = data.result
          ? `${data.summary}\n\nDo you want to integrate these ideas?`
          : data.summary
        setChatMessages(prev => [{ id: Date.now(), sender: 'assistant', type: 'hacks', result: data.result, text: botText }, ...prev])
      } catch (err) {
        console.error('Failed to fetch hacks data:', err)
      }
    }
    fetchHacksData()
  }, [])
  const [isChatCollapsed, setIsChatCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'assistant', text: 'How can I help?' }
  ])
  const [consistencyToast, setConsistencyToast] = useState({ show: false, message: '' })
  const [feedbackOverlay, setFeedbackOverlay] = useState({ show: false, json: null, loading: false, error: null })
  const [chatInput, setChatInput] = useState('')
  const [chatMode, setChatMode] = useState('💬 Chat mode')
  const chatBodyRef = useRef(null)
  const [selectedGenres, setSelectedGenres] = useState([])
  const [selectedStyle, setSelectedStyle] = useState('featured')
  const [customGenreIdeas, setCustomGenreIdeas] = useState('')
  const [customStyleIdeas, setCustomStyleIdeas] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)
  const [importedOutline, setImportedOutline] = useState('')

  // Auto-resize textarea helper
  const handleTextareaAutoResize = (e) => {
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }

  const formatLabel = (label) => label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const htmlToPlainText = (html) => {
    const temp = document.createElement('div')
    temp.innerHTML = html || ''
    return temp.innerText || ''
  }

  const buildEditorPayload = (contentHtml) => {
    const activeChapter =
      chapters.find((ch) => ch.id === selectedChapterId) || { id: selectedChapterId, name: activeDocument }
    const currentHtml = contentHtml ?? (editorRef.current ? editorRef.current.innerHTML : '')
    const currentText = htmlToPlainText(currentHtml).trim()

    const chaptersPayload = chapters.map((ch) => {
      const chHtml = ch.id === selectedChapterId ? currentHtml : chapterContents[ch.id] || ''
      return {
        id: ch.id,
        name: ch.name,
        contentHtml: chHtml,
        contentText: htmlToPlainText(chHtml).trim(),
      }
    })

    return {
      input: currentText,
      currentChapter: {
        id: activeChapter.id,
        name: activeChapter.name,
        contentHtml: currentHtml,
        contentText: currentText,
      },
      chapters: chaptersPayload,
    }
  }

  

  const buildCouncilInput = () => {
    const currentHtml = editorRef.current ? editorRef.current.innerHTML : ''
    const mergedContents = {
      ...chapterContents,
      [selectedChapterId]: currentHtml,
    }

    const parts = []

    // Story Bible fields
    if (storyBible.braindump) parts.push(`BRAINDUMP:\n${storyBible.braindump}`)

    const genreList = selectedGenres.length > 0 ? selectedGenres.join(', ') : customGenreIdeas
    if (genreList) parts.push(`GENRE: ${genreList}`)

    const styleText = storyBible.styleNotes || customStyleIdeas
    if (styleText) parts.push(`STYLE NOTES:\n${styleText}`)

    if (storyBible.synopsis) parts.push(`SYNOPSIS:\n${storyBible.synopsis}`)

    if (charactersList.length > 0) {
      const charsText = charactersList.map(ch => {
        const lines = [`Name: ${ch.name || 'Unknown'}`]
        if (ch.role) lines.push(`Role: ${ch.role}`)
        if (ch.summary) lines.push(`Summary: ${ch.summary}`)
        if (ch.personality) lines.push(`Personality: ${ch.personality}`)
        if (ch.motivations) lines.push(`Motivations: ${ch.motivations}`)
        if (ch.arc) lines.push(`Arc: ${ch.arc}`)
        if (ch.strengths) lines.push(`Strengths: ${ch.strengths}`)
        if (ch.weaknesses) lines.push(`Weaknesses: ${ch.weaknesses}`)
        if (ch.internalConflict) lines.push(`Internal conflict: ${ch.internalConflict}`)
        return lines.join(' | ')
      }).join('\n')
      parts.push(`CHARACTERS:\n${charsText}`)
    }

    if (storyBible.worldbuilding) parts.push(`WORLDBUILDING:\n${storyBible.worldbuilding}`)

    const outlineValue = useImportedOutline ? (importedOutline || '') : (outlineText || '')
    if (outlineValue) parts.push(`OUTLINE:\n${outlineValue}`)

    // All chapter contents
    const chapterBlocks = chapters.map((ch, idx) => {
      const html = mergedContents[ch.id] || ''
      const text = htmlToPlainText(html).trim()
      return `CHAPTER ${idx + 1} (${ch.name}):\n${text || '[Empty]'}`
    })
    if (chapterBlocks.length > 0) parts.push(chapterBlocks.join('\n\n'))

    return parts.join('\n\n---\n\n')
  }

  const handleFeedbackClick = async () => {
    const input = buildCouncilInput()
    if (!input.trim()) {
      alert('Add some story content before requesting feedback.')
      return
    }

    setFeedbackOverlay({ show: true, json: null, loading: true, error: null })

    try {
      const response = await fetch('http://164.52.218.116/hacks/council', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      })

      if (!response.ok) {
        setFeedbackOverlay({ show: true, json: null, loading: false, error: `Request failed (${response.status})` })
        return
      }

      const data = await response.json().catch(() => null)
      if (!data || typeof data !== 'object') {
        setFeedbackOverlay({ show: true, json: null, loading: false, error: 'Invalid response from server.' })
        return
      }

      setFeedbackOverlay({ show: true, json: data, loading: false, error: null })
    } catch (error) {
      console.error('Error sending feedback:', error)
      setFeedbackOverlay({ show: true, json: null, loading: false, error: 'Failed to connect to feedback service.' })
    }
  }

  const handleEditorKeyDown = (e) => {
    if (e.key !== 'Enter') return

    console.debug('keydown Enter detected in editor')
    // Allow the DOM to apply the newline before capturing content, then validate
    setTimeout(() => {
      const target = e.currentTarget || editorRef.current
      if (!target) return
      const contentHtml = target.innerHTML
      saveCurrentChapterContent(contentHtml)
      processCurrentChapterRef.current?.()
    }, 0)
  }

  const handleEditorInput = (e) => {
    const target = e.currentTarget || editorRef.current
    if (!target) return
    const content = target.innerHTML
    setEditorHtml(content)
    saveCurrentChapterContent(content)

    // Validate chapter when Enter inserts a paragraph (covers cases where keydown may miss)
    if (e.inputType === 'insertParagraph') {
      console.debug('input insertParagraph detected in editor')
      processCurrentChapterRef.current?.()
    }
  }

  // Get current chapter content
  const getCurrentChapterContent = () => {
    return chapterContents[selectedChapterId] || ''
  }

  // Save content for current chapter
  const saveCurrentChapterContent = (content) => {
    setChapterContents(prev => ({
      ...prev,
      [selectedChapterId]: content
    }))
  }

  // Handle chapter switching with smooth transitions
  const handleChapterSwitch = (chapterId, chapterName, direction = 'next') => {
    if (chapterId === selectedChapterId) return

    // Save current content before switching
    if (editorRef.current) {
      const currentContent = editorRef.current.innerHTML
      saveCurrentChapterContent(currentContent)
    }

    setIsTransitioning(true)
    setTransitionDirection(direction)

    setTimeout(() => {
      setActiveDocument(chapterName)
      setSelectedChapterId(chapterId)

      // Load new chapter content after a brief delay to prevent input conflicts
      setTimeout(() => {
        if (editorRef.current) {
          const newContent = chapterContents[chapterId] || ''
          editorRef.current.innerHTML = newContent
          setEditorHtml(newContent)
          // Place cursor at end of content
          const range = document.createRange()
          const selection = window.getSelection()
          range.selectNodeContents(editorRef.current)
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
          editorRef.current.focus()
        }
        setIsTransitioning(false)
      }, 100)
    }, 300)
  }
  const [outlineText, setOutlineText] = useState(storyBible.outline || '')
  const [useImportedOutline, setUseImportedOutline] = useState(false)

  const genreOptions = [
    'Romance',
    'Horror',
    'Fantasy',
    'Cozy mystery',
    'Friends-to-Lovers',
    'Sci-Fi',
    'Thriller',
    'Historical',
  ]

  const styleOptions = [
    { id: 'featured', label: 'Featured Styles', subtitle: 'Tried and true' },
    { id: 'custom', label: 'Custom', subtitle: 'For the most control' },
  ]

  const toggleGenre = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }

  // Placeholder handlers - replace with real backend/API logic later
  const handleSidebarAction = (type) => {
    alert(`${type} creation will be available soon in oscarify.ai.`)
  }

  const handleTrashClick = () => {
    alert('Trash will show deleted documents once the backend is connected.')
  }

  const handleToolbarCommand = (command, value = null) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    // execCommand is fine for this static prototype
    document.execCommand(command, false, value)
  }

  // Initialize editor content when chapter changes (without interfering with typing)
  useEffect(() => {
    if (editorRef.current && !isTransitioning) {
      const content = getCurrentChapterContent()
      const currentContent = editorRef.current.innerHTML

      // Always sync the editor with the selected chapter; clears stale text when switching to a new blank chapter
      if (currentContent !== content) {
        editorRef.current.innerHTML = content
        setEditorHtml(content)
      }
    }
  }, [selectedChapterId, isTransitioning])

  // Auto-resize all textareas when content changes (e.g., from API)
  useEffect(() => {
    const textareas = document.querySelectorAll('.story-bible-textarea.auto-resize')
    textareas.forEach((textarea) => {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    })
  }, [storyBible, outlineText, customGenreIdeas, customStyleIdeas])

  // Call /suggestions every 1 minute (ref ensures latest state is used)
  useEffect(() => {
    const interval = setInterval(() => {
      suggestionsRef.current?.()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleDocMenuClick = () => {
    alert('Document options (rename, duplicate, etc.) will appear here later.')
  }

  const handleChatTabClick = (tab) => {
    setActiveTab(tab.toLowerCase())
  }

  const handleChatHeaderAction = (action) => {
    if (action === 'New chat') {
      setChatMessages([{ id: 1, sender: 'assistant', text: 'How can I help?' }])
      setChatInput('')
    } else if (action === 'Chat settings') {
      alert('Chat settings will be available soon.')
    }
  }

  const sendConvoQuery = async (_userQuery) => {
    // convo endpoint removed
  }

  // Summarize all chapter content and push to nativesummary — fires in background on every send
  const syncChapterSummary = async () => {
    try {
      // Build a single string combining all chapter text
      const currentHtml = editorRef.current ? editorRef.current.innerHTML : ''
      const mergedContents = { ...chapterContents, [selectedChapterId]: currentHtml }
      const chaptersText = chapters
        .map((ch) => {
          const text = htmlToPlainText(mergedContents[ch.id] || '').trim()
          return text ? `${ch.name}: ${text}` : null
        })
        .filter(Boolean)
        .join(' ')

      if (!chaptersText) return

      // Step 1 — summarize
      const summarizeRes = await fetch('http://164.52.218.116/hacks/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapters: chaptersText }),
      })
      if (!summarizeRes.ok) {
        console.warn('summarize request failed:', summarizeRes.status)
        return
      }
      const summarizeData = await summarizeRes.json().catch(() => null)
      const summary =
        summarizeData?.summary ||
        summarizeData?.result ||
        (typeof summarizeData === 'string' ? summarizeData : '')
      if (!summary) {
        console.warn('summarize returned no summary field', summarizeData)
        return
      }

      // Step 2 — push to nativesummary
      const nativeRes = await fetch('http://164.52.218.116/hacks/nativesummary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login_id: username,
          password: password,
          summary,
          mode: 'web',
        }),
      })
      if (!nativeRes.ok) {
        console.warn('nativesummary request failed:', nativeRes.status)
      } else {
        console.debug('nativesummary synced ok')
        setShowSyncToast(true)
        setTimeout(() => setShowSyncToast(false), 3000)
      }
    } catch (err) {
      console.error('syncChapterSummary error:', err)
    }
  }

  // Validate current chapter on Enter — shows report in chat if inconsistent
  const validateCurrentChapter = async () => {
    try {
      const currentHtml = editorRef.current ? editorRef.current.innerHTML : ''
      const text = htmlToPlainText(currentHtml).trim()
      if (!text) return

      const validateRes = await fetch('http://164.52.218.116/hacks/validate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!validateRes.ok) {
        console.warn('validate-chapter request failed:', validateRes.status)
        return
      }
      
      const validateData = await validateRes.json()
      console.log(text, validateData);
      
      console.debug('validate-chapter response:', validateData)

      if (!validateData.consistent) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'assistant',
            type: 'validation-error',
            text: validateData.report || 'Consistency issue detected.',
          },
        ])
      }
    } catch (err) {
      console.error('validateCurrentChapter error:', err)
    }
  }
  // Keep validate ref in sync on every render
  processCurrentChapterRef.current = validateCurrentChapter

  // Fetch suggestions every 5 minutes
  const fetchSuggestions = async () => {
    try {
      const currentHtml = editorRef.current ? editorRef.current.innerHTML : ''
      const text = htmlToPlainText(currentHtml).trim()
      if (!text) return

      const res = await fetch('http://164.52.218.116/hacks/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: text }),
      })
      if (!res.ok) {
        console.warn('suggestions request failed:', res.status)
        return
      }
      const data = await res.json()
      console.log('suggestions response:', data)

      // Parse nested JSON string in response field
      let suggestions = []
      try {
        const inner = typeof data.response === 'string' ? JSON.parse(data.response) : data.response
        if (Array.isArray(inner?.suggestions)) {
          suggestions = inner.suggestions
        } else if (Array.isArray(inner)) {
          suggestions = inner
        }
      } catch {
        // fallback: treat as plain text
      }

      if (suggestions.length === 0) {
        // Fallback plain text path
        const fallback = data?.suggestions || data?.suggestion || data?.response ||
          (typeof data === 'string' ? data : null)
        if (!fallback) return
        suggestions = typeof fallback === 'string' ? [fallback] : fallback
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'assistant',
          type: 'suggestions',
          suggestions,
        },
      ])
    } catch (err) {
      console.error('fetchSuggestions error:', err)
    }
  }
  // Keep suggestions ref in sync on every render
  suggestionsRef.current = fetchSuggestions

  const handleChatSend = async () => {
    console.log('handleChatSend called')

    // Require user input - don't send if empty
    if (!chatInput.trim()) {
      console.log('No input provided, skipping API call')
      return
    }

    const userQuery = chatInput.trim()

    // Fire chapter summary sync and chapter validation in the background (non-blocking)
    syncChapterSummary()
    validateCurrentChapter()

    // Add user message to chat
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: userQuery,
      },
    ])
    setChatInput('')
  }

  const handleDismissConsistencyMessage = (id) => {
    setChatMessages((prev) => prev.filter((msg) => msg.id !== id))
  }

  const handleChatModeClick = () => {
    const modes = ['💬 Chat mode', '🔍 Research mode', '✨ Brainstorm mode']
    const currentIndex = modes.indexOf(chatMode)
    const nextMode = modes[(currentIndex + 1) % modes.length]
    setChatMode(nextMode)
  }

  const handleChatToggle = () => {
    setIsChatCollapsed((prev) => !prev)
  }

  const handleVoiceInput = () => {
    // Stop if already recording
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsRecording(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'assistant', text: '⚠️ Speech recognition is not supported in your browser. Try Chrome or Edge.' },
      ])
      return
    }

    // Always create a fresh instance to avoid InvalidStateError on reuse
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognitionRef.current = recognition

    // Track the stable (final) text accumulated this session
    let finalTranscript = ''

    recognition.onstart = () => {
      setIsRecording(true)
    }

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }
      // Show final + live interim text in the input box
      setChatInput((prev) => {
        // Strip any previous interim text and replace with latest
        const base = finalTranscript
        return (base + interim).trim()
      })
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return // silently ignore
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }

    recognition.start()
  }

  const handleChatAttachment = (type) => {
    alert(`Attaching ${type} will be supported soon.`)
  }

  const handleChatFooterClick = (button) => {
    if (button === 'Support') {
      alert('Support team will help you soon!')
    } else if (button === 'Upgrade') {
      alert('Upgrade to Pro to unlock more features!')
    }
  }

  const handleUpgradeClick = async () => {
    if (isPro) return // Already Pro, do nothing

    // STEP 1: If button says "Upgrade" - create payment intent and open payment gateway
    if (upgradeButtonText === 'Upgrade') {
      try {
        // Call payment-intents API (POST) to create payment intent and get payment URL
        const response = await fetch('http://164.52.213.163/hacks/payment-intents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: '0.01',
            currency: 'USD',
            description: 'oscarify.ai Pro Upgrade',
            settlementDestination: 'bank_account_123'
          })
        })

        const result = await response.json()

        if (!result.success) {
          console.error('Failed to create payment intent:', result.error)
          return
        }

        // Handle nested data structure - paymentUrl can be in result.data or result.data.data
        const responseData = result.data?.data || result.data
        const paymentUrl = responseData?.paymentUrl
        const intentId = responseData?.id || result.data?.id

        if (!paymentUrl) {
          console.error('No payment URL received')
          return
        }

        console.log('Payment Intent Created:', intentId)
        console.log('Payment URL:', paymentUrl)

        // Store the intent ID for later use
        setCurrentIntentId(intentId)

        // Open the payment page in a new tab
        window.open(paymentUrl, '_blank')

        // Change button text to "Check" for manual verification
        setUpgradeButtonText('Check')

      } catch (error) {
        console.error('Error initiating payment:', error)
      }
    }
    // STEP 2: If button says "Check" - submit delivery proof with stored intent ID
    else if (upgradeButtonText === 'Check' && currentIntentId) {
      console.log('Submitting delivery proof for intent:', currentIntentId)

      try {
        const proofResponse = await fetch(
          `https://api.fmm.finternetlab.io/api/v1/payment-intents/${currentIntentId}/escrow/delivery-proof`,
          {
            method: 'POST',
            headers: {
              'x-api-key': 'sk_hackathon_11b37b9f12f130e46d99abba3ee34d9e',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              proofHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
              proofURI: `https://example.com/delivery-proofs/${currentIntentId}`,
              submittedBy: '0x5D478B369769183F05b70bb7a609751c419b4c04'
            })
          }
        )

        const proofData = await proofResponse.json()
        console.log('Delivery proof response:', proofData)

        // Check the response - if we got a response, consider it successful
        const finalStatus = proofData.status || proofData.data?.status || ''
        console.log('Final payment status:', finalStatus)

        // Accept any successful response or known success statuses
        if (proofResponse.ok || finalStatus === 'SETTLED' || finalStatus === 'SUCCESS' || finalStatus === 'PROCESSING' || finalStatus === 'succeeded' || finalStatus === '') {
          setIsPro(true)
          setUpgradeButtonText('Pro')
          setShowProToast(true)
          setCurrentIntentId(null) // Clear the stored intent ID

          console.log('Pro status activated!')

          // Hide toast after 3 seconds
          setTimeout(() => {
            setShowProToast(false)
          }, 3000)
        }
      } catch (proofError) {
        console.error('Error submitting delivery proof:', proofError)
        console.error('Error details:', proofError.message)
      }
    }
  }

  const handleDeleteCharacter = (id) => {
    setCharactersList(charactersList.filter(ch => ch.id !== id))
  }

  const buildStoryRequestBody = (outlineValue) => {
    const primaryGenre = selectedGenres[0] || customGenreIdeas || ''
    const secondaryGenre = selectedGenres[1] || ''
    const currentHtml = editorRef.current ? editorRef.current.innerHTML : ''
    const mergedContents = {
      ...chapterContents,
      [selectedChapterId]: currentHtml,
    }

    const chaptersPayload = chapters.map((ch, idx) => {
      const html = mergedContents[ch.id] || ''
      return {
        number: idx + 1,
        title: ch.name,
        summary: htmlToPlainText(html).trim(),
      }
    })

    const charactersPayload = charactersList.map((ch) => ({
      name: ch.name,
      role: ch.role || 'Character',
      description: ch.summary || ch.personality || '',
    }))

    return {
      braindump: storyBible.braindump,
      genre: {
        primary: primaryGenre,
        secondary: secondaryGenre,
      },
      style: {
        tone: storyBible.styleNotes || customStyleIdeas || '',
        pacing: selectedStyle || '',
        perspective: '',
      },
      characters: charactersPayload,
      synopsis: storyBible.synopsis,
      worldbuilding: storyBible.worldbuilding,
      outline: outlineValue,
      chapters: chaptersPayload,
    }
  }

  const handleSaveAndClose = async () => {
    // Validate required fields
    // if (!storyBible.braindump.trim()) {
    //   alert('Please fill in the Braindump.')
    //   return
    // }
    // if (selectedGenres.length === 0 && !customGenreIdeas.trim()) {
    //   alert('Please select a genre or add custom genre ideas.')
    //   return
    // }
    // if (!storyBible.styleNotes.trim() && selectedStyle === 'custom') {
    //   alert('Please fill in the Style notes.')
    //   return
    // }
    // if (charactersList.length === 0) {
    //   alert('Please add at least one character.')
    //   return
    // }
    // if (!storyBible.synopsis.trim()) {
    //   alert('Please fill in the Synopsis.')
    //   return
    // }
    // if (!storyBible.worldbuilding.trim()) {
    //   alert('Please fill in the Worldbuilding.')
    //   return
    // }
    // const currentOutline = useImportedOutline ? (importedOutline || '').trim() : (outlineText || '').trim()
    // if (!currentOutline) {
    //   alert('Please fill in the Outline.')
    //   return
    // }

    // Save latest editor content for the active chapter
    if (editorRef.current) {
      saveCurrentChapterContent(editorRef.current.innerHTML)
    }

    // Summarize chapters in background (non-blocking)
    syncChapterSummary()

    // Validate current chapter, then insert only if consistent
    ;(async () => {
      try {
        const currentHtml = editorRef.current ? editorRef.current.innerHTML : ''
        const text = htmlToPlainText(currentHtml).trim()
        if (!text) return

        const validateRes = await fetch('http://164.52.218.116/hacks/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: text }),
        })
        if (!validateRes.ok) {
          console.warn('validate-chapter request failed:', validateRes.status)
          return
        }
        const validateData = await validateRes.json()
        console.debug('validate-chapter response (save):', validateData)

        if (!validateData.consistent) {
          // Show consistency error in chat
          setChatMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: 'assistant',
              type: 'validation-error',
              text: validateData.report || 'Consistency issue detected.',
            },
          ])
          return
        }

        // consistent === true → call insert-chapter
        const synopsis = storyBible.synopsis ? `Synopsis: ${storyBible.synopsis}\n\n` : ''
        const insertRes = await fetch('http://164.52.218.116/hacks/insert-chapter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: `${synopsis}${text}` }),
        })
        if (!insertRes.ok) {
          console.warn('insert-chapter request failed:', insertRes.status)
        } else {
          console.debug('insert-chapter synced ok')
        }
      } catch (err) {
        console.error('save validate+insert error:', err)
      }
    })()

    // // Post dynamic story payload
    // const storyBody = buildStoryRequestBody(currentOutline)
    // try {
    //   await fetch('http://164.52.213.163/hacks/story', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(storyBody),
    //   })

    //   setTimeout(async () => {
    //     try {
    //       const summaryResponse = await fetch('http://164.52.213.163/hacks/get_summary', {
    //         method: 'POST',
    //         headers: {
    //           'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify({ user_id: 'yashas', password: 'yashas123' }),
    //       })

    //       if (!summaryResponse.ok) return

    //       const summaryData = await summaryResponse.json().catch(() => null)
    //       if (!summaryData) return

    //       setChatMessages((prev) => {
    //         const memoryId = Date.now()
    //         const summaryId = memoryId + 1
    //         return [
    //           ...prev,
    //           {
    //             id: memoryId,
    //             sender: 'assistant',
    //             type: 'memory',
    //             text: 'Memory Found.',
    //           },
    //           {
    //             id: summaryId,
    //             sender: 'assistant',
    //             type: 'summary',
    //             summary:
    //               summaryData && typeof summaryData === 'object'
    //                 ? summaryData.summary || JSON.stringify(summaryData, null, 2)
    //                 : String(summaryData || ''),
    //             userId:
    //               summaryData && typeof summaryData === 'object' && summaryData.user_id
    //                 ? summaryData.user_id
    //                 : null,
    //           },
    //         ]
    //       })
    //     } catch (err) {
    //       console.error('Error fetching summary:', err)
    //     }
    //   }, 5000)
    // } catch (error) {
    //   console.error('Error posting story payload:', error)
    // }

    // // Save to JSON and download
    // const data = JSON.stringify({
    //   braindump: storyBible.braindump,
    //   genre: {
    //     selectedGenres: selectedGenres,
    //     customGenreIdeas: customGenreIdeas,
    //   },
    //   style: {
    //     styleNotes: storyBible.styleNotes,
    //     selectedStyle: selectedStyle,
    //     customStyleIdeas: customStyleIdeas,
    //   },
    //   characters: charactersList,
    //   synopsis: storyBible.synopsis,
    //   worldbuilding: storyBible.worldbuilding,
    //   outline: useImportedOutline ? importedOutline : outlineText,
    //   chapters: chapters,
    // }, null, 2)
    // const blob = new Blob([data], { type: 'application/json' })
    // const url = URL.createObjectURL(blob)
    // const a = document.createElement('a')
    // a.href = url
    // a.download = 'story-bible.json'
    // document.body.appendChild(a)
    // a.click()
    // document.body.removeChild(a)
    // URL.revokeObjectURL(url)

    // Close story bible and redirect to write mode
    setShowStoryBible(false)
    setTimeout(() => editorRef.current?.focus(), 50)
  }

  const handleDownloadStoryBible = () => {
    const data = JSON.stringify({
      braindump: storyBible.braindump,
      genre: {
        selectedGenres: selectedGenres,
        customGenreIdeas: customGenreIdeas,
      },
      style: {
        styleNotes: storyBible.styleNotes,
        selectedStyle: selectedStyle,
        customStyleIdeas: customStyleIdeas,
      },
      characters: charactersList,
      synopsis: storyBible.synopsis,
      worldbuilding: storyBible.worldbuilding,
      outline: useImportedOutline ? importedOutline : outlineText,
      chapters: chapters,
    }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'story-bible.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleUploadStoryBible = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result || '')
        setStoryBible({
          braindump: parsed.braindump || '',
          genre: '',
          styleNotes: parsed.style?.styleNotes || '',
          synopsis: parsed.synopsis || '',
          characters: '',
          worldbuilding: parsed.worldbuilding || '',
          outline: parsed.outline || '',
        })
        // Load genre selection
        setSelectedGenres(parsed.genre?.selectedGenres || [])
        setCustomGenreIdeas(parsed.genre?.customGenreIdeas || '')

        // Load style selection
        setSelectedStyle(parsed.style?.selectedStyle || 'featured')
        setCustomStyleIdeas(parsed.style?.customStyleIdeas || '')

        if (parsed.characters && Array.isArray(parsed.characters)) {
          setCharactersList(parsed.characters)
          // Auto-expand the first character after import
          if (parsed.characters.length > 0) {
            setExpandedCharacters([parsed.characters[0].id])
          }
        }

        // Load chapters if available
        if (parsed.chapters && Array.isArray(parsed.chapters)) {
          setChapters(parsed.chapters)
          if (parsed.chapters.length > 0) {
            setSelectedChapterId(parsed.chapters[0].id)
          }
        }

        // Store imported outline separately and default to using it
        setImportedOutline(parsed.outline || '')
        setOutlineText(parsed.outline || '')
        setUseImportedOutline(!!parsed.outline)

        alert('Story Bible imported successfully!')
      } catch (err) {
        alert('Failed to import Story Bible. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  const handleAddChapter = () => {
    if (!newChapterName.trim()) return
    const newChapter = { id: Date.now(), name: newChapterName.trim() }
    setChapters((prev) => [...prev, newChapter])
    setNewChapterName('')
  }

  const handleDeleteChapter = (chapterId) => {
    const updatedChapters = chapters.filter((ch) => ch.id !== chapterId)
    setChapters(updatedChapters)
    if (selectedChapterId === chapterId && updatedChapters.length > 0) {
      setSelectedChapterId(updatedChapters[0].id)
    }
  }

  const handleAddCharacter = () => {
    if (!newCharacterName.trim()) return
    const ch = {
      id: Date.now(),
      name: newCharacterName.trim(),
      role: newCharacterRole || 'Character',
      pronouns: '',
      groups: '',
      otherNames: '',
      personality: '',
      motivations: '',
      internalConflict: '',
      strengths: '',
      weaknesses: '',
      arc: '',
      physicalDescription: '',
      dialogueStyle: '',
      summary: newCharacterSummary.trim(),
    }
    setCharactersList([...charactersList, ch])
    setNewCharacterName('')
    setNewCharacterSummary('')
    setNewCharacterRole('')
    setExpandedCharacters((prev) => [...prev, ch.id])
  }

  const handleCharacterKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCharacter()
    }
  }

  const toggleExpandCharacter = (id) => {
    console.log('Toggling character:', id, 'Current expanded:', expandedCharacters)
    setExpandedCharacters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const updateCharacterField = (id, field, value) => {
    setCharactersList((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const handleGenerateAllCharacters = () => {
    if (charactersList.length > 0) return
    const seed = [
      { name: 'Protagonist', summary: 'Main POV character with the biggest growth arc.' },
      { name: 'Best Friend', summary: 'Supports the protagonist but has their own secret.' },
      { name: 'Antagonist', summary: 'Stands in the way of the protagonist’s goal.' },
    ]
    const now = Date.now()
    setCharactersList(
      seed.map((c, index) => ({
        ...c,
        id: now + index,
      })),
    )
  }

  const handleGenerateSynopsis = async () => {
    setIsGeneratingSynopsis(true)
    try {
      const characterNames = charactersList.map((ch) => ch.name).filter(Boolean)

      const genreString = selectedGenres.length > 0
        ? selectedGenres.join(', ')
        : customGenreIdeas || 'General Fiction'

      const styleString = storyBible.styleNotes || customStyleIdeas || 'Standard narrative'

      const requestBody = {
        dump: storyBible.braindump || 'No braindump provided',
        genre: genreString,
        style: styleString,
        characters: characterNames
      }

      const response = await fetch('http://164.52.218.116/hacks/synopsis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      if (data.synopsis) {
        setStoryBible((prev) => ({
          ...prev,
          synopsis: data.synopsis
        }))
      } else {
        alert('No synopsis returned from API')
      }
    } catch (error) {
      console.error('Error generating synopsis:', error)
      alert(`Failed to generate synopsis: ${error.message}`)
    } finally {
      setIsGeneratingSynopsis(false)
    }
  }

  const handleGenerateWorldbuilding = async () => {
    setIsGeneratingWorldbuilding(true)
    try {
      const genreString = selectedGenres.length > 0
        ? selectedGenres.join(', ')
        : customGenreIdeas || 'General Fiction'

      const styleString = storyBible.styleNotes || customStyleIdeas || 'Standard narrative'

      const requestBody = {
        dump: storyBible.braindump || 'No braindump provided',
        genre: genreString,
        style: styleString,
        synopsis: storyBible.synopsis || 'No synopsis provided'
      }

      const response = await fetch('http://164.52.218.116/hacks/worldbuilding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      if (data.worldbuilding) {
        setStoryBible((prev) => ({
          ...prev,
          worldbuilding: data.worldbuilding
        }))
      } else {
        alert('No worldbuilding returned from API')
      }
    } catch (error) {
      console.error('Error generating worldbuilding:', error)
      alert(`Failed to generate worldbuilding: ${error.message}`)
    } finally {
      setIsGeneratingWorldbuilding(false)
    }
  }

  const handleGenerateChapters = async (count) => {
    setIsGeneratingChapters(true)
    try {
      const genreString = selectedGenres.length > 0
        ? selectedGenres.join(', ')
        : customGenreIdeas || 'General Fiction'

      const styleString = storyBible.styleNotes || customStyleIdeas || 'Standard narrative'

      const requestBody = {
        dump: storyBible.braindump || 'No braindump provided',
        genre: genreString,
        style: styleString,
        synopsis: storyBible.synopsis || 'No synopsis provided',
        worldbuilding: storyBible.worldbuilding || 'No worldbuilding provided',
        chapternumber: count || chapters.length || 1
      }

      const response = await fetch('http://164.52.218.116/hacks/chapters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      if (data.chapters && Array.isArray(data.chapters)) {
        const joined = data.chapters.join('\n\n')
        setOutlineText(joined)
        setStoryBible((prev) => ({
          ...prev,
          outline: joined
        }))
        setUseImportedOutline(false)
      } else {
        alert('No chapters returned from API')
      }
    } catch (error) {
      console.error('Error generating chapters:', error)
      alert(`Failed to generate chapters: ${error.message}`)
    } finally {
      setIsGeneratingChapters(false)
    }
  }

  const handleAddWorldElement = () => {
    const nextIndex = worldElements.length + 1
    const label = `Element ${nextIndex}`
    setWorldElements([
      ...worldElements,
      {
        id: Date.now() + nextIndex,
        label,
      },
    ])
  }

  const handleGenerateOutline = () => {
    const template = `Act 1: Setup – introduce characters, world, and central problem.\nAct 2: Confrontation – complications, reversals, and rising stakes.\nAct 3: Resolution – climax, fallout, and new normal.`
    setOutlineText(template)
    setStoryBible({ ...storyBible, outline: template })
    setUseImportedOutline(false)
  }

  const documents = [
    'Chapter 1',
    'Chapter 2',
    'Characters',
    'Outline',
    'Notes'
  ]

  return (
    <div className="editor-page poppins-regular">
      {/* Story Bible Modal Overlay */}
      {showStoryBible && storyBibleEnabled && (
        <div
          className="story-bible-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowStoryBible(false) }}
        >
          <div className="story-bible-modal">
            <StoryBiblePanel
              storyBible={storyBible}
              setStoryBible={setStoryBible}
              onClose={() => setShowStoryBible(false)}
              onBack={() => {
                setShowStoryBible(false)
                setTimeout(() => editorRef.current?.focus(), 50)
              }}
              onSave={handleSaveAndClose}
              onDownload={handleDownloadStoryBible}
              onUpload={handleUploadStoryBible}
              genreOptions={genreOptions}
              selectedGenres={selectedGenres}
              toggleGenre={toggleGenre}
              customGenreIdeas={customGenreIdeas}
              setCustomGenreIdeas={setCustomGenreIdeas}
              styleOptions={styleOptions}
              selectedStyle={selectedStyle}
              setSelectedStyle={setSelectedStyle}
              customStyleIdeas={customStyleIdeas}
              setCustomStyleIdeas={setCustomStyleIdeas}
              charactersList={charactersList}
              newCharacterName={newCharacterName}
              setNewCharacterName={setNewCharacterName}
              newCharacterRole={newCharacterRole}
              setNewCharacterRole={setNewCharacterRole}
              newCharacterSummary={newCharacterSummary}
              setNewCharacterSummary={setNewCharacterSummary}
              expandedCharacters={expandedCharacters}
              handleAddCharacter={handleAddCharacter}
              handleCharacterKeyDown={handleCharacterKeyDown}
              handleDeleteCharacter={handleDeleteCharacter}
              toggleExpandCharacter={toggleExpandCharacter}
              updateCharacterField={updateCharacterField}
              handleGenerateAllCharacters={handleGenerateAllCharacters}
              worldElements={worldElements}
              isGeneratingWorldbuilding={isGeneratingWorldbuilding}
              handleGenerateWorldbuilding={handleGenerateWorldbuilding}
              handleAddWorldElement={handleAddWorldElement}
              isGeneratingChapters={isGeneratingChapters}
              handleGenerateChapters={handleGenerateChapters}
              handleGenerateOutline={handleGenerateOutline}
              handleGenerateSynopsis={handleGenerateSynopsis}
              isGeneratingSynopsis={isGeneratingSynopsis}
              chapters={chapters}
              setChapters={setChapters}
              selectedChapterId={selectedChapterId}
              editingChapterId={editingChapterId}
              setEditingChapterId={setEditingChapterId}
              editingChapterName={editingChapterName}
              setEditingChapterName={setEditingChapterName}
              isBibleEditable={isBibleEditable}
              activeDocument={activeDocument}
              setActiveDocument={setActiveDocument}
              outlineText={outlineText}
              setOutlineText={setOutlineText}
              useImportedOutline={useImportedOutline}
              setUseImportedOutline={setUseImportedOutline}
              importedOutline={importedOutline}
              charactersFormRef={charactersFormRef}
              handleTextareaAutoResize={handleTextareaAutoResize}
            />
          </div>
        </div>
      )}

      {/* Editor layout (blurred when Story Bible modal is open) */}
      <div className={`editor-layout${showStoryBible && storyBibleEnabled ? ' editor-layout--blurred' : ''}`}>
      {/* Left Sidebar */}
      <aside className="editor-sidebar-left">
        <div className="sidebar-header">
          <Link to="/app" className="sidebar-back">
            <svg className="sidebar-back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to projects
          </Link>
          <div className="sidebar-project-title">
            {projectId ? `Project ${projectId}` : 'New Project'}
          </div>
        </div>

        <div className="sidebar-actions">
          <button
            className="sidebar-action-btn"
            onClick={() => handleSidebarAction('Document')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Doc
          </button>
          <button
            className="sidebar-action-btn"
            onClick={() => handleSidebarAction('Folder')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Folder
          </button>
        </div>

        <div className="sidebar-documents">
          {/* Chapters (dynamic) */}
          {chapters.map((ch) => (
            <div key={ch.id} className={`document-item ${activeDocument === ch.name ? 'active' : ''}`}>
              <div className="document-left" onClick={() => {
                const currentIndex = chapters.findIndex(chapter => chapter.id === selectedChapterId)
                const newIndex = chapters.findIndex(chapter => chapter.id === ch.id)
                const direction = newIndex > currentIndex ? 'next' : 'prev'
                handleChapterSwitch(ch.id, ch.name, direction)
              }}>
                <svg className="document-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                {editingChapterId === ch.id ? (
                  <input
                    className="document-title-edit"
                    value={editingChapterName}
                    onChange={(e) => setEditingChapterName(e.target.value)}
                    onBlur={() => {
                      const name = editingChapterName.trim() || ch.name
                      setChapters((prev) => prev.map(p => p.id === ch.id ? { ...p, name } : p))
                      if (activeDocument === ch.name) setActiveDocument(name)
                      setEditingChapterId(null)
                      setEditingChapterName('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur()
                      if (e.key === 'Escape') {
                        setEditingChapterId(null)
                        setEditingChapterName('')
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <span className="document-title">{ch.name}</span>
                )}
              </div>
              <div className="document-actions">
                <button
                  className="doc-edit"
                  title="Edit"
                  onClick={() => {
                    if (!isBibleEditable) return
                    setEditingChapterId(ch.id)
                    setEditingChapterName(ch.name)
                  }}
                >✎</button>
                <button className="doc-delete" title="Delete" onClick={() => {
                  if (!confirm(`Delete ${ch.name}?`)) return
                  handleDeleteChapter(ch.id)
                  if (activeDocument === ch.name) setActiveDocument('Characters')
                }}>✕</button>
              </div>
            </div>
          ))}

          {/* Other static documents */}


          <div className="sidebar-add-chapter">
            <button className="sidebar-action-add" onClick={() => {
              const defaultName = `Chapter ${chapters.length + 1}`
              const newChapter = { id: Date.now(), name: defaultName }
              setChapters((prev) => [...prev, newChapter])
              // enter inline-edit mode immediately
              setEditingChapterId(newChapter.id)
              setEditingChapterName(defaultName)
              setActiveDocument(defaultName)
              setSelectedChapterId(newChapter.id)
            }}> Add Chapter</button>
          </div>
        </div>

        <div className="sidebar-footer">
          <button
            className="sidebar-action-btn"
            onClick={() => fetchSuggestions()}
            style={{ width: '100%', marginBottom: 12 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Suggestions
          </button>
          <div className="sidebar-trash" onClick={handleTrashClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Trash
          </div>
        </div>
      </aside>

      {/* Main Editor Area */}
      <main className="editor-main">
        {/* Toolbar */}
        <div className="editor-toolbar">
          <button
            className="toolbar-btn primary"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleToolbarCommand('insertText', '')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Write
            <span className="toolbar-dropdown">▾</span>
          </button>

          <button
            className="toolbar-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleToolbarCommand('insertText', '')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Brainstorm
            <span className="toolbar-dropdown">▾</span>
          </button>

          <button
            className="toolbar-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleFeedbackClick}
            title="Get feedback on your writing"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Feedback
          </button>

          <div style={{ marginLeft: 'auto' }}>
            <button
              className="quick-action-btn"
              onClick={() => {
                setShowStoryBible(!showStoryBible)
              }}
            >
              <svg
                className="quick-action-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Story Bible
            </button>
          </div>
        </div>

        {/* Editor Canvas */}
        <div className="editor-canvas">
          <div className={`editor-content ${isTransitioning ? 'transitioning' : ''
            } ${isTransitioning ? `transition-${transitionDirection}` : ''
            }`}>

            <div className="editor-content-header">
              <div className="editor-title-row">
                <h1 className="editor-doc-title">{activeDocument}</h1>
                <div className="editor-header-actions">
                  <button
                    className="editor-save-btn"
                    onClick={handleSaveAndClose}
                    title="Save story and chapter content"
                  >
                    💾 Save
                  </button>
                </div>
              </div>

            </div>

            {/* Format Toolbar */}
            <div className="format-toolbar">
              <button
                className="format-btn"
                title="Bold"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleToolbarCommand('bold')}
              >
                <b>B</b>
              </button>
              <button
                className="format-btn"
                title="Italic"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleToolbarCommand('italic')}
              >
                <i>I</i>
              </button>
              <button
                className="format-btn"
                title="Underline"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleToolbarCommand('underline')}
              >
                <u>U</u>
              </button>
              <button
                className="format-btn"
                title="Strikethrough"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleToolbarCommand('strikeThrough')}
              >
                <s>S</s>
              </button>
              <div className="format-separator"></div>
              <button
                className="format-btn"
                title="Heading"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleToolbarCommand('formatBlock', 'h2')}
              >
                H
              </button>
              <button
                className="format-btn"
                title="Quote"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleToolbarCommand('formatBlock', 'blockquote')}
              >
                "
              </button>
              <button
                className="format-btn"
                title="List"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleToolbarCommand('insertUnorderedList')}
              >
                ≡
              </button>
              <div className="format-separator"></div>
              <button
                className="format-btn"
                title="Link"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const url = window.prompt('Enter URL')
                  if (url) handleToolbarCommand('createLink', url)
                }}
              >
                🔗
              </button>
              <button
                className="format-btn"
                title="Image"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const url = window.prompt('Enter image URL')
                  if (url) handleToolbarCommand('insertImage', url)
                }}
              >
                🖼
              </button>
            </div>

            {/* Editor Body */}
            <div className={`editor-body ${isTransitioning ? 'transitioning' : ''
              }`}>
              <div
                ref={editorRef}
                className="editor-textarea"
                contentEditable
                data-placeholder="Start writing your story..."
                onKeyDown={handleEditorKeyDown}
                onInput={handleEditorInput}
                suppressContentEditableWarning={true}
              />
            </div>

            {/* Quick Actions */}
            <div className="editor-quick-actions">
              <button
                className="quick-action-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleToolbarCommand('insertText', '')}
              >
                <svg className="quick-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Write
              </button>

              <button
                className="quick-action-btn"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleToolbarCommand('insertText', '')}
              >
                <svg className="quick-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Brainstorm
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar (Chat) */}
      <aside className={`editor-sidebar-right ${isChatCollapsed ? 'collapsed' : ''}`}>
        <div className="chat-header">
          <div className="chat-toggle">
            <button
              className="chat-toggle-btn"
              onClick={handleChatToggle}
            >
              {isChatCollapsed ? '▶' : '◀'}
            </button>
          </div>
          <div className="chat-tabs">
            <button
              className={`chat-tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => handleChatTabClick('Chat')}
            >
              Chat
            </button>
            <button
              className={`chat-tab ${activeTab === 'learn' ? 'active' : ''}`}
              onClick={() => handleChatTabClick('Learn')}
            >
              Learn
            </button>
          </div>
          <div className="chat-header-actions">
            <button
              className="chat-header-btn"
              onClick={() => handleChatHeaderAction('New chat')}
            >
              +
            </button>
            <button
              className="chat-header-btn"
              onClick={() => handleChatHeaderAction('Chat settings')}
            >
              ⚙
            </button>
          </div>
        </div>

        <div className="chat-body" ref={chatBodyRef}>
          {chatMessages.length === 0 ? (
            <>
              <h3 className="chat-empty-title">How can I help?</h3>
              <p className="chat-empty-text">
                Ask me anything about your story, characters, or get writing suggestions.
              </p>
            </>
          ) : (
            <div className="chat-messages">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.sender}`}>
                  <div className={`chat-message-bubble${msg.type === 'hacks' ? ' hacks-bubble' : ''}`}>
                    {(msg.type === 'consistency') ? (
                      <div className="consistency-message">
                        <button
                          className="consistency-close"
                          aria-label="Dismiss consistency message"
                          onClick={() => handleDismissConsistencyMessage(msg.id)}
                        >
                          ×
                        </button>
                        {msg.notes && (
                          <div className="consistency-notes">
                            <div className="consistency-heading">Notes</div>
                            <div className="consistency-text">{msg.notes}</div>
                          </div>
                        )}
                        {msg.checks && msg.checks.length > 0 && (
                          <div className="consistency-checks">
                            {msg.checks.map((check, idx) => (
                              <span
                                key={idx}
                                className={`consistency-chip ${check.value ? 'true' : 'false'}`}
                              >
                                {check.label}: {check.value ? 'True' : 'False'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : msg.type === 'hacks' ? (
                      msg.text
                    ) : msg.type === 'summary' ? (
                      <div className="summary-message">
                        <div className="summary-title">Story summary</div>
                        {msg.userId && (
                          <div className="summary-meta">User: {msg.userId}</div>
                        )}
                        <div className="summary-text">{msg.summary || msg.text}</div>
                      </div>
                    ) : msg.type === 'convo' ? (
                      <div className="summary-message">
                        <div className="summary-title">{msg.title || 'Story response'}</div>
                        <div className="summary-text">{msg.text}</div>
                      </div>
                    ) : msg.type === 'memory' ? (
                      <div className="memory-message">{msg.text}</div>
                    ) : msg.type === 'suggestions' ? (
                      <div style={{ background: '#fef08a', border: '1px solid #eab308', borderRadius: 10, padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, marginBottom: 8, color: '#713f12', fontSize: '0.85em', letterSpacing: '0.04em' }}>💡 Here are some suggestions</div>
                        <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {msg.suggestions.map((s, i) => (
                            <li key={i} style={{ fontSize: '0.9em', lineHeight: 1.6, color: '#422006' }}>{s}</li>
                          ))}
                        </ol>
                      </div>
                    ) : msg.type === 'validation-error' ? (
                      <div style={{ background: '#ef444422', border: '1px solid #ef4444', borderRadius: 8, padding: '10px 14px', color: '#ef4444' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>⚠ Consistency Issue</div>
                        <div style={{ fontSize: '0.9em', lineHeight: 1.5 }}>{msg.text}</div>
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <input
              type="text"
              className="chat-input"
              placeholder="Ask me anything..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleChatSend()
                }
              }}
            />
            <div className="chat-input-icons">
              <button
                className="chat-input-icon"
                onClick={() => handleChatAttachment('a file')}
              >
                📎
              </button>
              <button
                className={`chat-input-icon ${isRecording ? 'recording' : ''}`}
                onClick={handleVoiceInput}
                title={isRecording ? 'Stop recording' : 'Start voice input'}
              >
                🎤
              </button>
            </div>
          </div>
          <div className="chat-mode-selector">
            <button
              className="chat-mode-dropdown"
              onClick={handleChatModeClick}
            >
              <span>{chatMode}</span>
              <span>▾</span>
            </button>
            <button
              className="chat-send-btn"
              onClick={handleChatSend}
            >
              ➤
            </button>
          </div>
        </div>

        <div className="chat-footer-buttons">
          <button
            className="chat-footer-btn support"
            onClick={() => handleChatFooterClick('Support')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Support
          </button>
          <button
            className="chat-footer-btn upgrade"
            onClick={handleUpgradeClick}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {upgradeButtonText}
          </button>
        </div>
      </aside>

      {/* Consistency Toast */}
      {consistencyToast.show && (
        <div className="consistency-toast">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <circle cx="12" cy="16" r="1" />
          </svg>
          <span>{consistencyToast.message || 'There is some inconsistency'}</span>
        </div>
      )}

      {/* Feedback Report Overlay */}
      {feedbackOverlay.show && (
        <div
          className="feedback-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setFeedbackOverlay({ show: false, json: null, loading: false, error: null }) }}
        >
          <div className="feedback-card">

            {/* ── Premium Header ── */}
            <div className="feedback-card-header">
              <div className="fch-left">
                <svg className="fch-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 2l2.09 6.26L20 9l-5 3.64L16.18 19 12 15.9 7.82 19 9 12.64 4 9l5.91-.74L12 2z"/>
                </svg>
                <div>
                  <div className="fch-title">Multiagent Agentic AI Council Report</div>
                  <div className="fch-sub">Powered by oscarify AI</div>
                </div>
              </div>
              <button className="feedback-close" aria-label="Close feedback"
                onClick={() => setFeedbackOverlay({ show: false, json: null, loading: false, error: null })}>✕</button>
            </div>

            {/* ── Loading ── */}
            {feedbackOverlay.loading && (
              <div className="feedback-loading">
                <div className="fb-orbit">
                  <div className="fb-orbit-ring"></div>
                  <div className="fb-orbit-core"></div>
                </div>
                <p className="fb-loading-text">Analysing your story…</p>
                <p className="fb-loading-sub">Reading characters · Checking structure · Scoring chapters</p>
              </div>
            )}

            {/* ── Error ── */}
            {feedbackOverlay.error && !feedbackOverlay.loading && (
              <div className="feedback-body">
                <div className="feedback-error">{feedbackOverlay.error}</div>
              </div>
            )}

            {/* ── Report ── */}
            {feedbackOverlay.json && !feedbackOverlay.loading && (() => {
              const raw = feedbackOverlay.json
              const verdict = (raw.verdict && typeof raw.verdict === 'object') ? raw.verdict : {}
              const boolEntries = Object.entries(verdict).filter(([k, v]) => typeof v === 'boolean' && k !== 'revival_suggestion')
              const passingCount = boolEntries.filter(([, v]) => !v).length
              const healthScore = boolEntries.length > 0 ? Math.round((passingCount / boolEntries.length) * 100) : null
              const riskFlags = Array.isArray(verdict.risk_flags) ? verdict.risk_flags : []
              const recommended = Array.isArray(verdict.recommended_models) ? verdict.recommended_models : []
              const notes = verdict.notes || ''
              const revivalNote = verdict.revival_note || ''
              const revivalSuggestion = verdict.revival_suggestion

              const director = raw.answer?.director
              const directorVerdict = (director?.verdict && typeof director.verdict === 'object') ? director.verdict : {}
              const directorBoolEntries = Object.entries(directorVerdict).filter(([, v]) => typeof v === 'boolean')
              const directorIssues = Array.isArray(directorVerdict.issues) ? directorVerdict.issues : []

              const audience = raw.answer?.audience
              const audienceAnalysis = Array.isArray(audience?.analysis) ? audience.analysis : []

              // SVG circular gauge helpers
              const GAUGE_R = 44
              const GAUGE_C = 2 * Math.PI * GAUGE_R
              const gaugeColor = healthScore >= 80 ? '#22c55e' : healthScore >= 50 ? '#f59e0b' : '#ef4444'
              const gaugeDash = healthScore !== null ? (healthScore / 100) * GAUGE_C : 0

              const sections = [
                { id: 'verdict', label: 'Verdict' },
                ...(director ? [{ id: 'director', label: 'Structure' }] : []),
                ...(audienceAnalysis.length > 0 ? [{ id: 'audience', label: 'Audience' }] : []),
              ]

              return (
                <div className="feedback-two-pane">

                  {/* ── Left nav sidebar ── */}
                  <nav className="feedback-nav">
                    <div className="fn-label">SECTIONS</div>
                    {sections.map(s => (
                      <a key={s.id} href={`#fb-${s.id}`} className="fn-item">{s.label}</a>
                    ))}
                    {healthScore !== null && (
                      <div className="fn-gauge-wrap">
                        <svg viewBox="0 0 100 100" className="fn-gauge-svg">
                          <circle cx="50" cy="50" r={GAUGE_R} fill="none" stroke="#DDD7F0" strokeWidth="10"/>
                          <circle cx="50" cy="50" r={GAUGE_R} fill="none"
                            stroke={gaugeColor} strokeWidth="10"
                            strokeDasharray={`${gaugeDash} ${GAUGE_C}`}
                            strokeDashoffset={GAUGE_C * 0.25}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dasharray 1s ease' }}
                          />
                          <text x="50" y="46" textAnchor="middle" fill="#1A0A30" fontSize="18" fontWeight="800">{healthScore}</text>
                          <text x="50" y="60" textAnchor="middle" fill="#8878B8" fontSize="9">HEALTH</text>
                        </svg>
                        <div className="fn-gauge-label" style={{ color: gaugeColor }}>
                          {healthScore >= 80 ? 'Strong' : healthScore >= 50 ? 'Needs work' : 'Critical'}
                        </div>
                      </div>
                    )}
                  </nav>

                  {/* ── Main scrollable content ── */}
                  <div className="feedback-main-scroll">

                    {/* ── Verdict section ── */}
                    <section id="fb-verdict" className="fb-section">
                      <div className="fb-section-heading">
                        <span className="fb-section-icon verdict-icon">📋</span>
                        <div>
                          <div className="fb-section-title">Editor Verdict</div>
                          <div className="fb-section-sub">Automated checks across your story's key quality dimensions</div>
                        </div>
                        <span className="feedback-role-badge editor-badge">{(raw.role || 'editor').toUpperCase()}</span>
                      </div>

                      {/* Health bars */}
                      {boolEntries.length > 0 && (
                        <div className="fb-health-bars">
                          {boolEntries.map(([label, value], idx) => (
                            <div key={idx} className="fb-health-row">
                              <span className="fb-health-label">{formatLabel(label)}</span>
                              <div className="fb-health-track">
                                <div
                                  className={`fb-health-fill ${value ? 'hf-fail' : 'hf-pass'}`}
                                  style={{ width: value ? '100%' : '0%' }}
                                />
                              </div>
                              <span className={`fb-health-status ${value ? 'hs-fail' : 'hs-pass'}`}>
                                {value ? '⚠ Issue' : '✓ Clear'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {notes && (
                        <div className="fb-notes-block">
                          <div className="fb-notes-icon">💬</div>
                          <p className="fb-notes-text">{notes}</p>
                        </div>
                      )}

                      {(revivalSuggestion !== undefined || revivalNote) && (
                        <div className="fb-revival-block">
                          <div className="fb-revival-header">
                            <span className="fb-revival-icon">🔁</span>
                            <div className="fb-revival-title">Revival Suggestion</div>
                            {revivalSuggestion !== undefined && (
                              <span className={`fb-revival-chip ${revivalSuggestion ? 'revival-chip-warn' : 'revival-chip-ok'}`}>
                                {revivalSuggestion ? '⚠ Review Needed' : '✓ Clear'}
                              </span>
                            )}
                          </div>
                          {revivalNote && <p className="fb-revival-note">{revivalNote}</p>}
                        </div>
                      )}

                      {/* Risk flags */}
                      {riskFlags.length > 0 && (
                        <div className="fb-risk-wrap">
                          <div className="fb-subsection-label">Risk Flags</div>
                          <div className="fb-risk-grid">
                            {riskFlags.map((flag, idx) => (
                              <div key={idx} className={`fb-risk-card sev-card-${flag.severity || 'medium'}`}>
                                <div className={`fb-risk-sev sev-dot-${flag.severity || 'medium'}`}></div>
                                <div className="fb-risk-body">
                                  <div className="fb-risk-section">{flag.section}</div>
                                  <div className="fb-risk-type">{formatLabel(flag.risk_type || '')}</div>
                                </div>
                                <span className={`fb-risk-pill sev-pill-${flag.severity || 'medium'}`}>{flag.severity || 'medium'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {recommended.length > 0 && (
                        <div className="fb-recommended">
                          <span className="fb-recommended-label">Further analysis:</span>
                          {recommended.map((m, idx) => (
                            <span key={idx} className="fb-recommended-badge">{m}</span>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* ── Director section ── */}
                    {director && (
                      <section id="fb-director" className="fb-section">
                        <div className="fb-section-heading">
                          <span className="fb-section-icon director-icon">🎬</span>
                          <div>
                            <div className="fb-section-title">Structural Analysis</div>
                            <div className="fb-section-sub">Narrative flow, context drift, and structural integrity</div>
                          </div>
                          <span className="feedback-role-badge director-badge">DIRECTOR</span>
                        </div>

                        {directorBoolEntries.length > 0 && (
                          <div className="fb-health-bars">
                            {directorBoolEntries.map(([label, value], idx) => (
                              <div key={idx} className="fb-health-row">
                                <span className="fb-health-label">{formatLabel(label)}</span>
                                <div className="fb-health-track">
                                  <div className={`fb-health-fill ${value ? 'hf-pass' : 'hf-fail'}`}
                                    style={{ width: value ? '100%' : '0%' }} />
                                </div>
                                <span className={`fb-health-status ${value ? 'hs-pass' : 'hs-fail'}`}>
                                  {value ? '✓ Yes' : '✗ No'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {directorIssues.length > 0 && (
                          <div className="fb-issues-list">
                            <div className="fb-subsection-label">Issues to Resolve</div>
                            {directorIssues.map((issue, idx) => (
                              <div key={idx} className="fb-issue-card">
                                <div className="fb-issue-num">{idx + 1}</div>
                                <div className="fb-issue-body">
                                  <div className="fb-issue-section">{issue.section}</div>
                                  <div className="fb-issue-problem">{issue.problem}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>
                    )}

                    {/* ── Audience section ── */}
                    {audienceAnalysis.length > 0 && (
                      <section id="fb-audience" className="fb-section">
                        <div className="fb-section-heading">
                          <span className="fb-section-icon audience-icon">👥</span>
                          <div>
                            <div className="fb-section-title">Reader Reactions</div>
                            <div className="fb-section-sub">How readers experience each chapter</div>
                          </div>
                          <span className="feedback-role-badge audience-badge">AUDIENCE</span>
                        </div>

                        {audienceAnalysis.map((item, idx) => {
                          const likes = Array.isArray(item.why_users_like_it) ? item.why_users_like_it : []
                          const dislikes = Array.isArray(item.why_users_dislike_it) ? item.why_users_dislike_it : []
                          const total = likes.length + dislikes.length
                          const likePct = total > 0 ? Math.round((likes.length / total) * 100) : 50
                          const conf = typeof item.confidence !== 'undefined' ? Math.round(item.confidence * 100) : null
                          const confC = 2 * Math.PI * 28
                          const confDash = conf !== null ? (conf / 100) * confC : 0
                          const confColor = conf >= 70 ? '#22c55e' : conf >= 40 ? '#f59e0b' : '#ef4444'

                          return (
                            <div key={idx} className="fb-audience-card">
                              {item.section && (
                                <div className="fb-audience-header">
                                  <div className="fb-audience-title">{item.section}</div>
                                  {conf !== null && (
                                    <div className="fb-conf-ring">
                                      <svg viewBox="0 0 72 72" width="60" height="60">
                                        <circle cx="36" cy="36" r="28" fill="none" stroke="#DDD7F0" strokeWidth="7"/>
                                        <circle cx="36" cy="36" r="28" fill="none"
                                          stroke={confColor} strokeWidth="7"
                                          strokeDasharray={`${confDash} ${confC}`}
                                          strokeDashoffset={confC * 0.25}
                                          strokeLinecap="round"/>
                                        <text x="36" y="40" textAnchor="middle" fill="#1A0A30" fontSize="13" fontWeight="800">{conf}%</text>
                                      </svg>
                                      <div className="fb-conf-label">confidence</div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Sentiment bar chart */}
                              {total > 0 && (
                                <div className="fb-sentiment-bar-wrap">
                                  <div className="fb-sentiment-bar">
                                    <div className="fb-sent-like" style={{ width: `${likePct}%` }}>
                                      {likePct > 15 && <span>👍 {likePct}%</span>}
                                    </div>
                                    <div className="fb-sent-dislike" style={{ width: `${100 - likePct}%` }}>
                                      {(100 - likePct) > 15 && <span>👎 {100 - likePct}%</span>}
                                    </div>
                                  </div>
                                  <div className="fb-sent-legend">
                                    <span className="fsl-like">● {likes.length} positive signals</span>
                                    <span className="fsl-dislike">● {dislikes.length} negative signals</span>
                                  </div>
                                </div>
                              )}

                              <div className="fb-audience-grid">
                                {likes.length > 0 && (
                                  <div className="fb-aud-col fb-aud-like">
                                    <div className="fb-aud-col-title">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                      What works
                                    </div>
                                    <ul>{likes.map((t, i) => <li key={i}>{t}</li>)}</ul>
                                  </div>
                                )}
                                {dislikes.length > 0 && (
                                  <div className="fb-aud-col fb-aud-dislike">
                                    <div className="fb-aud-col-title">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                      What doesn't work
                                    </div>
                                    <ul>{dislikes.map((t, i) => <li key={i}>{t}</li>)}</ul>
                                  </div>
                                )}
                              </div>

                              {item.net_effect && (
                                <div className="fb-net-effect">
                                  <span className="fb-net-label">Net Effect</span>
                                  <p>{item.net_effect}</p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </section>
                    )}

                  </div>{/* end feedback-main-scroll */}
                </div>
              )
            })()}

          </div>
        </div>
      )}

      {/* Data Synced Toast */}
      {showSyncToast && (
        <div className="sync-toast">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>Data synced</span>
        </div>
      )}

      {/* Pro Activation Toast */}
      {showProToast && (
        <div className="pro-toast">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>Pro is now activated!</span>
        </div>
      )}
      </div>{/* end editor-layout */}
    </div>
  )
}

export default EditorPage
