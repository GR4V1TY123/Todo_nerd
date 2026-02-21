import { Link, useParams } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import StoryBiblePanel from '../components/StoryBiblePanel'

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
  const [isChatCollapsed, setIsChatCollapsed] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'assistant', text: 'How can I help?' }
  ])
  const [consistencyToast, setConsistencyToast] = useState({ show: false, message: '' })
  const [feedbackOverlay, setFeedbackOverlay] = useState({ show: false, json: null })
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

  const postEditorSnapshot = async (contentHtml) => {
    const payload = buildEditorPayload(contentHtml)
    console.debug('editor snapshot payload', payload)
    if (!payload.input) return

    try {
      console.debug('posting editor snapshot to /hacks/editor')
      const response = await fetch('http://164.52.213.163/hacks/editor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        console.warn('editor snapshot response not ok', response.status)
        return
      }

      const data = await response.json().catch(() => null)
      console.debug('editor snapshot response', data)
      if (!data || typeof data !== 'object') return

      const verdict = data.verdict && typeof data.verdict === 'object' ? data.verdict : data
      const notes = typeof verdict.notes === 'string' ? verdict.notes : ''
      const boolEntries = Object.entries(verdict).filter(([, v]) => typeof v === 'boolean')
      const hasFalse = boolEntries.some(([, v]) => v === false)

      if (hasFalse) {
        setConsistencyToast({ show: true, message: 'Inconsistency detected' })
        setTimeout(() => setConsistencyToast({ show: false, message: '' }), 10000)
      }

      if (notes || boolEntries.length) {
        const formatLabel = (label) => label.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        const checks = boolEntries.map(([label, value]) => ({ label: formatLabel(label), value }))
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender: 'assistant',
            type: 'consistency',
            notes,
            checks,
          },
        ])
      }

      console.debug('posted editor snapshot ok')
    } catch (error) {
      console.error('Error posting editor snapshot:', error)
    }
  }

  const buildCouncilInput = () => {
    const currentHtml = editorRef.current ? editorRef.current.innerHTML : ''
    const mergedContents = {
      ...chapterContents,
      [selectedChapterId]: currentHtml,
    }

    const chapterBlocks = chapters.map((ch, idx) => {
      const html = mergedContents[ch.id] || ''
      const text = htmlToPlainText(html).trim()
      return `Chapter ${idx + 1} (${ch.name}):\n${text || '[Empty]'}`
    })

    return chapterBlocks.join('\n\n')
  }

  const handleFeedbackClick = async () => {
    if (!isPro) {
      alert('Upgrade to Pro to access Feedback.')
      return
    }

    const input = buildCouncilInput()
    if (!input.trim()) return

    try {
      const response = await fetch('http://164.52.213.163/hacks/council', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      })

      if (!response.ok) return

      const data = await response.json().catch(() => null)
      if (!data || typeof data !== 'object') return

      const verdict = data.verdict && typeof data.verdict === 'object' ? data.verdict : data
      const notes = typeof verdict.notes === 'string' ? verdict.notes : ''
      const checks = Object.entries(verdict)
        .filter(([, v]) => typeof v === 'boolean')
        .map(([label, value]) => ({ label: formatLabel(label), value }))

      setFeedbackOverlay({ show: true, json: data, notes, checks })
    } catch (error) {
      console.error('Error sending feedback:', error)
    }
  }

  const getFeedbackOverlayData = () => {
    const payload = feedbackOverlay.json
    if (!payload || typeof payload !== 'object') return null

    const verdict = payload.verdict && typeof payload.verdict === 'object' ? payload.verdict : {}
    const role = payload.role || verdict.role || 'Response'
    const notes = typeof verdict.notes === 'string' ? verdict.notes : feedbackOverlay.notes || ''
    const recommendedModels = Array.isArray(verdict.recommended_models) ? verdict.recommended_models : []
    const verdictChips = Object.entries(verdict)
      .filter(([, v]) => typeof v === 'boolean')
      .map(([label, value]) => ({ label: formatLabel(label), value }))

    const answers = []
    if (payload.answer && typeof payload.answer === 'object') {
      Object.entries(payload.answer).forEach(([key, section]) => {
        if (!section || typeof section !== 'object') return
        const sectionVerdict = section.verdict && typeof section.verdict === 'object' ? section.verdict : {}
        const sectionChips = Object.entries(sectionVerdict)
          .filter(([, v]) => typeof v === 'boolean')
          .map(([label, value]) => ({ label: formatLabel(label), value }))
        const analysis = Array.isArray(section.analysis) ? section.analysis : []

        answers.push({
          key,
          role: section.role || formatLabel(key),
          chips: sectionChips,
          analysis,
        })
      })
    }

    return {
      role,
      notes,
      recommendedModels,
      verdictChips,
      answers,
    }
  }

  const handleEditorKeyDown = (e) => {
    if (e.key !== 'Enter') return

    console.debug('keydown Enter detected in editor')
    // Allow the DOM to apply the newline before capturing content
    setTimeout(() => {
      const target = e.currentTarget || editorRef.current
      if (!target) return
      const contentHtml = target.innerHTML
      saveCurrentChapterContent(contentHtml)
      postEditorSnapshot(contentHtml)
    }, 0)
  }

  const handleEditorInput = (e) => {
    const target = e.currentTarget || editorRef.current
    if (!target) return
    const content = target.innerHTML
    setEditorHtml(content)
    saveCurrentChapterContent(content)

    // Fire snapshot when Enter inserts a paragraph (covers cases where keydown may miss)
    if (e.inputType === 'insertParagraph') {
      console.debug('input insertParagraph detected in editor')
      postEditorSnapshot(content)
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

  const buildConvoPayload = (userQuery) => {
    const primaryGenre = selectedGenres[0] || customGenreIdeas || ''
    const secondaryGenre = selectedGenres[1] || ''
    const outlineValue = useImportedOutline ? (importedOutline || '') : (outlineText || '')

    const chaptersPayload = chapters.map((ch, idx) => `Chapter ${idx + 1}: ${ch.name}`)
    const charactersPayload = charactersList
      .map((ch) => {
        if (!ch.name && !ch.role && !ch.summary) return null
        const role = ch.role ? ` – ${ch.role}` : ''
        const desc = ch.summary ? ` (${ch.summary})` : ''
        return `${ch.name || 'Character'}${role}${desc}`
      })
      .filter(Boolean)

    const recentMessages = [...chatMessages].reverse()
    const lastUser = recentMessages.find((m) => m.sender === 'user')
    const lastAssistant = recentMessages.find((m) => m.sender === 'assistant')

    const previousContext = lastUser || lastAssistant
      ? {
        user_query: lastUser?.text || '',
        ai_response: lastAssistant?.summary || lastAssistant?.text || '',
      }
      : undefined

    return {
      user_qry: userQuery,
      braindump: storyBible.braindump || '',
      genre: {
        primary: primaryGenre,
        secondary: secondaryGenre,
      },
      style: {
        tone: storyBible.styleNotes || customStyleIdeas || '',
        pacing: selectedStyle || '',
      },
      characters: charactersPayload,
      synopsis: storyBible.synopsis || '',
      worldbuilding: storyBible.worldbuilding || '',
      outline: outlineValue,
      chapters: chaptersPayload,
      previous_context: previousContext,
    }
  }

  const sendConvoQuery = async (userQuery) => {
    console.log("sendConvoQuery called")
    console.debug('sendConvoQuery called with:', userQuery)
    const payload = buildConvoPayload(userQuery)
    console.debug('convo payload:', payload)

    try {
      console.debug('posting to /hacks/convo')
      const response = await fetch('http://164.52.213.163/hacks/convo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.debug('convo response status:', response.status)
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = await response.json().catch(() => null)
      console.debug('convo response data:', data)
      const responseText =
        data && typeof data === 'object' && data.response
          ? data.response
          : data
            ? JSON.stringify(data, null, 2)
            : 'No response received.'

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'assistant',
          type: 'convo',
          title: 'Story response',
          text: responseText,
        },
      ])

      setTimeout(() => {
        chatBodyRef.current?.scrollTo({
          top: chatBodyRef.current.scrollHeight,
          behavior: 'smooth',
        })
      }, 100)
    } catch (error) {
      console.error('Error sending convo:', error)
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'assistant',
          text: 'Sorry, I could not fetch the response right now.',
        },
      ])
    }
  }

  const handleChatSend = async () => {
    console.log('handleChatSend called')

    // Require user input - don't send if empty
    if (!chatInput.trim()) {
      console.log('No input provided, skipping API call')
      return
    }

    const userQuery = chatInput.trim()

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

    // Build payload with user_qry from textbox and dynamic story data
    const payload = buildConvoPayload(userQuery)
    console.log('Sending to /hacks/convo with user_qry:', userQuery)
    console.log('Full payload:', payload)

    try {
      const response = await fetch('http://164.52.213.163/hacks/convo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log('Response data:', data)

      const responseText =
        data && typeof data === 'object' && data.response
          ? data.response
          : data
            ? JSON.stringify(data, null, 2)
            : 'No response received.'

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'assistant',
          type: 'convo',
          title: 'Story response',
          text: responseText,
        },
      ])

      setTimeout(() => {
        chatBodyRef.current?.scrollTo({
          top: chatBodyRef.current.scrollHeight,
          behavior: 'smooth',
        })
      }, 100)
    } catch (error) {
      console.error('Error hitting convo API:', error)
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'assistant',
          text: `Error: ${error.message}`,
        },
      ])
    }
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
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        alert('Speech Recognition is not supported in your browser. Use Chrome, Edge, or Safari.')
        return
      }

      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onstart = () => {
        setIsRecording(true)
      }

      recognitionRef.current.onresult = (event) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        setChatInput((prev) => (prev + (prev ? ' ' : '') + transcript).trim())
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        alert('Error recording voice: ' + event.error)
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
    }
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
    if (!storyBible.braindump.trim()) {
      alert('Please fill in the Braindump.')
      return
    }
    if (selectedGenres.length === 0 && !customGenreIdeas.trim()) {
      alert('Please select a genre or add custom genre ideas.')
      return
    }
    if (!storyBible.styleNotes.trim() && selectedStyle === 'custom') {
      alert('Please fill in the Style notes.')
      return
    }
    if (charactersList.length === 0) {
      alert('Please add at least one character.')
      return
    }
    if (!storyBible.synopsis.trim()) {
      alert('Please fill in the Synopsis.')
      return
    }
    if (!storyBible.worldbuilding.trim()) {
      alert('Please fill in the Worldbuilding.')
      return
    }
    const currentOutline = useImportedOutline ? (importedOutline || '').trim() : (outlineText || '').trim()
    if (!currentOutline) {
      alert('Please fill in the Outline.')
      return
    }

    // Save latest editor content for the active chapter
    if (editorRef.current) {
      saveCurrentChapterContent(editorRef.current.innerHTML)
    }

    // Post dynamic story payload
    const storyBody = buildStoryRequestBody(currentOutline)
    try {
      await fetch('http://164.52.213.163/hacks/story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyBody),
      })

      setTimeout(async () => {
        try {
          const summaryResponse = await fetch('http://164.52.213.163/hacks/get_summary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: 'yashas', password: 'yashas123' }),
          })

          if (!summaryResponse.ok) return

          const summaryData = await summaryResponse.json().catch(() => null)
          if (!summaryData) return

          setChatMessages((prev) => {
            const memoryId = Date.now()
            const summaryId = memoryId + 1
            return [
              ...prev,
              {
                id: memoryId,
                sender: 'assistant',
                type: 'memory',
                text: 'Memory Found.',
              },
              {
                id: summaryId,
                sender: 'assistant',
                type: 'summary',
                summary:
                  summaryData && typeof summaryData === 'object'
                    ? summaryData.summary || JSON.stringify(summaryData, null, 2)
                    : String(summaryData || ''),
                userId:
                  summaryData && typeof summaryData === 'object' && summaryData.user_id
                    ? summaryData.user_id
                    : null,
              },
            ]
          })
        } catch (err) {
          console.error('Error fetching summary:', err)
        }
      }, 5000)
    } catch (error) {
      console.error('Error posting story payload:', error)
    }

    // Save to JSON and download
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

  const handleGenerateChapters = async () => {
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
        chapternumber: chapters.length || 1
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
            onClick={() => handleSidebarAction('AI Helper')}
            style={{ width: '100%', marginBottom: 12 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l2.09 6.26L20 9l-5 3.64L16.18 19 12 15.9 7.82 19 9 12.64 4 9l5.91-.74L12 2z" />
            </svg>
            AI Helper
          </button>
          <div className="story-bible-toggle" onClick={() => setStoryBibleEnabled(!storyBibleEnabled)}>
            <svg className="story-bible-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="story-bible-label">Story Bible</span>
            <div className={`toggle-switch ${storyBibleEnabled ? '' : 'off'}`}></div>
          </div>
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
            className={`toolbar-btn ${!isPro ? 'toolbar-btn-disabled' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleFeedbackClick}
            title={!isPro ? 'Pro feature - Upgrade to unlock' : 'Get feedback on your writing'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Feedback
            {!isPro && <span className="pro-badge">PRO</span>}
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
                  <div className="chat-message-bubble">
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

      {/* Feedback JSON Overlay */}
      {feedbackOverlay.show && (() => {
        const data = getFeedbackOverlayData()
        if (!data) return null
        const director = data.answers.find((ans) => ans.role.toLowerCase() === 'director')
        const audienceAnswers = data.answers.filter((ans) => ans.role.toLowerCase() !== 'director')
        const directorIssues = director?.analysis?.flatMap((item) =>
          Array.isArray(item.issues)
            ? item.issues.map((issue) => ({
              section: issue.section || item.section || 'Issue',
              text: issue.problem || issue.description || '',
            }))
            : []
        ) || []
        return (
          <div className="feedback-overlay">
            <div className="feedback-card">
              <div className="feedback-card-header">
                <span>Feedback Response</span>
                <button
                  className="feedback-close"
                  aria-label="Close feedback"
                  onClick={() => setFeedbackOverlay({ show: false, json: null })}
                >
                  ×
                </button>
              </div>
              <div className="feedback-body">
                <div className="feedback-meta">
                  <div className="feedback-meta-row">
                    <span className="meta-label">Role</span>
                    <span className="meta-value">{data.role}</span>
                  </div>
                  {data.recommendedModels.length > 0 && (
                    <div className="feedback-meta-row">
                      <span className="meta-label">Recommended Models</span>
                      <span className="meta-value">{data.recommendedModels.join(', ')}</span>
                    </div>
                  )}
                </div>

                <div className="feedback-section">
                  <div className="feedback-section-title">Verdict (at a glance)</div>
                  <p className="feedback-notes">Scan key risks in 5 seconds.</p>
                  {data.verdictChips.length > 0 && (
                    <div className="feedback-chips">
                      {data.verdictChips.map((chip, idx) => (
                        <span key={idx} className={`feedback-chip ${chip.value ? 'true' : 'false'}`}>
                          {chip.label}: {chip.value ? 'True' : 'False'}
                        </span>
                      ))}
                    </div>
                  )}
                  {data.notes && <p className="feedback-notes">{data.notes}</p>}
                </div>

                {director && (
                  <div className="feedback-section">
                    <div className="feedback-section-title">Director — fix structure first</div>
                    <p className="feedback-notes">Resolve structural blockers before polishing prose.</p>
                    {director.chips && director.chips.length > 0 && (
                      <div className="feedback-chips">
                        {director.chips.map((chip, cIdx) => (
                          <span key={cIdx} className={`feedback-chip ${chip.value ? 'true' : 'false'}`}>
                            {chip.label}: {chip.value ? 'True' : 'False'}
                          </span>
                        ))}
                      </div>
                    )}
                    {directorIssues.length > 0 && (
                      <div className="feedback-analysis">
                        <div className="feedback-analysis-card">
                          <div className="analysis-label">Issues to resolve</div>
                          <ul className="analysis-list">
                            {directorIssues.map((issue, iIdx) => (
                              <li key={iIdx}>
                                {issue.section ? `${issue.section}: ` : ''}{issue.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {audienceAnswers.length > 0 && (
                  <div className="feedback-section">
                    <div className="feedback-section-title">Audience — reader reactions</div>
                    <p className="feedback-notes">Trace how each chapter lands with readers.</p>
                    <div className="feedback-analysis">
                      {audienceAnswers.flatMap((ans, idx) => (
                        ans.analysis?.map((item, aIdx) => (
                          <div key={`${idx}-${aIdx}`} className="feedback-analysis-card">
                            {item.section && <div className="analysis-section">{item.section}</div>}
                            {Array.isArray(item.why_users_like_it) && item.why_users_like_it.length > 0 && (
                              <div className="analysis-block">
                                <div className="analysis-label">Why readers like it</div>
                                <ul>
                                  {item.why_users_like_it.map((entry, eIdx) => (
                                    <li key={eIdx}>{entry}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {Array.isArray(item.why_users_dislike_it) && item.why_users_dislike_it.length > 0 && (
                              <div className="analysis-block">
                                <div className="analysis-label">Why readers dislike it</div>
                                <ul>
                                  {item.why_users_dislike_it.map((entry, eIdx) => (
                                    <li key={eIdx}>{entry}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {item.net_effect && (
                              <div className="analysis-block">
                                <div className="analysis-label">Net effect</div>
                                <p>{item.net_effect}</p>
                              </div>
                            )}
                            {typeof item.confidence !== 'undefined' && (
                              <div className="analysis-block confidence">Confidence: {item.confidence}</div>
                            )}
                          </div>
                        )) || []
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

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
