import { useRef, useState } from 'react'

function StoryBiblePanel({
  storyBible,
  setStoryBible,
  onClose,
  onBack,
  onSave,
  onDownload,
  onUpload,
  genreOptions,
  selectedGenres,
  toggleGenre,
  customGenreIdeas,
  setCustomGenreIdeas,
  styleOptions,
  selectedStyle,
  setSelectedStyle,
  customStyleIdeas,
  setCustomStyleIdeas,
  charactersList,
  newCharacterName,
  setNewCharacterName,
  newCharacterRole,
  setNewCharacterRole,
  newCharacterSummary,
  setNewCharacterSummary,
  expandedCharacters,
  handleAddCharacter,
  handleCharacterKeyDown,
  handleDeleteCharacter,
  toggleExpandCharacter,
  updateCharacterField,
  handleGenerateAllCharacters,
  worldElements,
  isGeneratingWorldbuilding,
  handleGenerateWorldbuilding,
  handleAddWorldElement,
  isGeneratingChapters,
  handleGenerateChapters,
  handleGenerateOutline,
  handleGenerateSynopsis,
  isGeneratingSynopsis,
  chapters,
  setChapters,
  selectedChapterId,
  editingChapterId,
  setEditingChapterId,
  editingChapterName,
  setEditingChapterName,
  isBibleEditable,
  activeDocument,
  setActiveDocument,
  outlineText,
  setOutlineText,
  useImportedOutline,
  setUseImportedOutline,
  importedOutline,
  charactersFormRef,
  handleTextareaAutoResize,
}) {
  const sectionRefs = {
    braindump: useRef(null),
    genre: useRef(null),
    style: useRef(null),
    characters: useRef(null),
    synopsis: useRef(null),
    worldbuilding: useRef(null),
    outline: useRef(null),
  }

  const scrollToSection = (key) => {
    sectionRefs[key]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="story-bible-panel">
      <div className="story-bible-header">
        <div>
          <h2 className="story-bible-title">Story Bible</h2>
          <p className="story-bible-description">
            Track the key details of your story&apos;s world so oscarify.ai can give better suggestions.
          </p>
        </div>
        <div className="story-bible-header-actions">
          <button
            type="button"
            className="story-bible-write-btn"
            onClick={onBack}
          >
            Back
          </button>

          <button
            type="button"
            className="story-bible-action-btn download"
            onClick={onDownload}
            title="Download Story Bible sample JSON"
          >
            Download
          </button>

          <label className="story-bible-action-btn upload" title="Upload Story Bible JSON">
            Upload
            <input
              type="file"
              accept=".json"
              onChange={onUpload}
              style={{ display: 'none' }}
            />
          </label>

          <button
            type="button"
            className="story-bible-action-btn save"
            onClick={onSave}
            title="Save Story Bible and go to write mode"
          >
            Save
          </button>

          <button
            type="button"
            className="story-bible-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>

      {/* Braindump */}
      <div className="story-bible-section" ref={sectionRefs.braindump}>
        <div className="section-header">
          <div className="section-header-left">
            <span className="section-badge">1</span>
            <span className="section-title">Braindump</span>
          </div>
        </div>
        <p className="section-description">
          Start with a quick braindump about your story idea, themes, or anything that&apos;s on your mind.
        </p>
        <div className="section-content">
          <textarea
            className="story-bible-textarea"
            placeholder="it's about a group of friends trying to win an impossible competition..."
            value={storyBible.braindump}
            onChange={(e) => setStoryBible({ ...storyBible, braindump: e.target.value })}
          />
        </div>
        <button type="button" className="next-section-btn" onClick={() => scrollToSection('genre')}>
          Next <span className="next-arrow">↓</span>
        </button>
      </div>

      {/* Genre */}
      <div className="story-bible-section" ref={sectionRefs.genre}>
        <div className="section-header">
          <div className="section-header-left">
            <span className="section-badge">2</span>
            <span className="section-title">Genre</span>
          </div>
        </div>
        <p className="section-description">
          What genre are you writing in? Feel free to include sub‑genres and tropes.
        </p>
        <div className="section-content">
          <div className="genre-buttons">
            {genreOptions.map((genre) => (
              <button
                key={genre}
                type="button"
                className={`genre-btn ${selectedGenres.includes(genre) ? 'selected' : ''}`}
                onClick={() => toggleGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
          <div className="story-bible-field-label">Custom genre ideas</div>
          <textarea
            className="story-bible-textarea auto-resize"
            placeholder="Add any additional genres or tropes not listed above..."
            value={customGenreIdeas}
            onChange={(e) => setCustomGenreIdeas(e.target.value)}
            onInput={handleTextareaAutoResize}
          />
          <p className="section-examples">
            Examples: Romance, Horror, Fantasy, Cozy mystery, Friends‑to‑Lovers, Gumshoe
          </p>
        </div>
        <button type="button" className="next-section-btn" onClick={() => scrollToSection('style')}>
          Next <span className="next-arrow">↓</span>
        </button>
      </div>

      {/* Style */}
      <div className="story-bible-section" ref={sectionRefs.style}>
        <div className="section-header">
          <div className="section-header-left">
            <span className="section-badge">3</span>
            <span className="section-title">Style</span>
          </div>
        </div>
        <p className="section-description">
          Choose how you want this story to feel. You can describe your own style or pick from presets later.
        </p>
        <div className="section-content">
          <div className="style-buttons">
            {styleOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`style-btn ${selectedStyle === option.id ? 'selected' : ''}`}
                onClick={() => setSelectedStyle(option.id)}
              >
                <div className="style-btn-title">{option.label}</div>
                <div className="style-btn-subtitle">{option.subtitle}</div>
              </button>
            ))}
          </div>
          <div className="story-bible-field-label">Style notes</div>
          <textarea
            className="story-bible-textarea auto-resize"
            placeholder="Warm, witty, intimate 1st person; light humor with occasional serious moments."
            value={storyBible.styleNotes}
            onChange={(e) => setStoryBible({ ...storyBible, styleNotes: e.target.value })}
            onInput={handleTextareaAutoResize}
          />
          <div className="story-bible-field-label">Custom style ideas</div>
          <textarea
            className="story-bible-textarea auto-resize"
            placeholder="Describe any unique style preferences not covered by the preset options..."
            value={customStyleIdeas}
            onChange={(e) => setCustomStyleIdeas(e.target.value)}
            onInput={handleTextareaAutoResize}
          />
        </div>
        <button type="button" className="next-section-btn" onClick={() => scrollToSection('characters')}>
          Next <span className="next-arrow">↓</span>
        </button>
      </div>

      {/* Characters */}
      <div className="story-bible-section" ref={sectionRefs.characters}>
        <div className="section-header">
          <div className="section-header-left">
            <span className="section-badge">4</span>
            <span className="section-title">Characters</span>
          </div>
          <div className="section-actions">
            <button
              type="button"
              className="secondary-link-btn"
              onClick={() =>
                charactersFormRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }
            >
              + Add Character
            </button>
            <button
              type="button"
              className="secondary-pill-btn"
              onClick={handleGenerateAllCharacters}
            >
              Generate All Characters
            </button>
          </div>
        </div>
        <p className="section-description">
          Generate your characters one at a time or all at once. Keep quick notes and a list for fast reference.
        </p>
        <div className="section-content">
          <div className="characters-add-form" ref={charactersFormRef}>
            <div className="story-bible-field-label">Add new character</div>
            <input
              className="characters-input"
              type="text"
              placeholder="Character name"
              value={newCharacterName}
              onChange={(e) => setNewCharacterName(e.target.value)}
              onKeyDown={handleCharacterKeyDown}
            />
            <input
              className="characters-input"
              type="text"
              placeholder="Role (e.g., Protagonist)"
              value={newCharacterRole}
              onChange={(e) => setNewCharacterRole(e.target.value)}
              onKeyDown={handleCharacterKeyDown}
            />
            <input
              className="characters-input"
              type="text"
              placeholder="Short description (optional)"
              value={newCharacterSummary}
              onChange={(e) => setNewCharacterSummary(e.target.value)}
              onKeyDown={handleCharacterKeyDown}
            />
            <button
              className="characters-add-btn"
              type="button"
              onClick={handleAddCharacter}
            >
              + Add character
            </button>
          </div>
          {charactersList.length > 0 && (
            <div className="characters-display">
              <div className="story-bible-field-label">Character list ({charactersList.length})</div>
              <div className="characters-list">
                {charactersList.map((ch) => (
                  <div key={ch.id} className="character-card">
                    <div className="character-header">
                      <div className="character-info">
                        <div className="character-name">{ch.name}</div>
                        <div className="character-role">{ch.role || 'Character'}</div>
                      </div>
                      <div className="character-actions">
                        <button
                          type="button"
                          className="expand-btn"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleExpandCharacter(ch.id)
                          }}
                          aria-expanded={expandedCharacters.includes(ch.id)}
                          title="Show details"
                        >
                          {expandedCharacters.includes(ch.id) ? '▾' : '▸'}
                        </button>
                        <button
                          type="button"
                          className="character-delete-btn"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDeleteCharacter(ch.id)
                          }}
                          title="Delete character"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {expandedCharacters.includes(ch.id) && (
                      <div className="character-details">
                        <div className="detail-row">
                          <label>Pronouns</label>
                          <input value={ch.pronouns || ''} onChange={(e) => updateCharacterField(ch.id, 'pronouns', e.target.value)} />
                          <label>Groups</label>
                          <input value={ch.groups || ''} onChange={(e) => updateCharacterField(ch.id, 'groups', e.target.value)} />
                          <label>Other names</label>
                          <input value={ch.otherNames || ''} onChange={(e) => updateCharacterField(ch.id, 'otherNames', e.target.value)} />
                        </div>

                        <div className="detail-block">
                          <label>Personality</label>
                          <textarea value={ch.personality || ''} onChange={(e) => updateCharacterField(ch.id, 'personality', e.target.value)} />
                        </div>

                        <div className="detail-block">
                          <label>Motivations</label>
                          <textarea value={ch.motivations || ''} onChange={(e) => updateCharacterField(ch.id, 'motivations', e.target.value)} />
                        </div>

                        <div className="detail-block">
                          <label>Internal Conflict</label>
                          <textarea value={ch.internalConflict || ''} onChange={(e) => updateCharacterField(ch.id, 'internalConflict', e.target.value)} />
                        </div>

                        <div className="detail-row">
                          <div>
                            <label>Strengths</label>
                            <textarea value={ch.strengths || ''} onChange={(e) => updateCharacterField(ch.id, 'strengths', e.target.value)} />
                          </div>
                          <div>
                            <label>Weaknesses</label>
                            <textarea value={ch.weaknesses || ''} onChange={(e) => updateCharacterField(ch.id, 'weaknesses', e.target.value)} />
                          </div>
                        </div>

                        <div className="detail-block">
                          <label>Character Arc</label>
                          <textarea value={ch.arc || ''} onChange={(e) => updateCharacterField(ch.id, 'arc', e.target.value)} />
                        </div>

                        <div className="detail-block">
                          <label>Physical Description</label>
                          <textarea value={ch.physicalDescription || ''} onChange={(e) => updateCharacterField(ch.id, 'physicalDescription', e.target.value)} />
                        </div>

                        <div className="detail-block">
                          <label>Dialogue Style</label>
                          <textarea value={ch.dialogueStyle || ''} onChange={(e) => updateCharacterField(ch.id, 'dialogueStyle', e.target.value)} />
                        </div>

                        <div className="detail-block">
                          <label>Short summary</label>
                          <textarea value={ch.summary || ''} onChange={(e) => updateCharacterField(ch.id, 'summary', e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <button type="button" className="next-section-btn" onClick={() => scrollToSection('synopsis')}>
          Next <span className="next-arrow">↓</span>
        </button>
      </div>

      {/* Synopsis */}
      <div className="story-bible-section" ref={sectionRefs.synopsis}>
        <div className="section-header">
          <div className="section-header-left">
            <span className="section-badge">5</span>
            <span className="section-title">Synopsis</span>
          </div>
          <div className="section-actions">
            <button
              type="button"
              className="secondary-pill-btn"
              onClick={handleGenerateSynopsis}
              disabled={isGeneratingSynopsis}
            >
              {isGeneratingSynopsis ? 'Generating...' : 'Generate Synopsis'}
            </button>
          </div>
        </div>
        <p className="section-description">
          Introduce the characters, their goals, and the central conflict, while conveying the story&apos;s tone.
        </p>
        <div className="section-content">
          <textarea
            className="story-bible-textarea auto-resize"
            placeholder="In a last‑chance hackathon, a mismatched team must overcome bias and burnout to ship a wild idea..."
            value={storyBible.synopsis}
            onChange={(e) => setStoryBible({ ...storyBible, synopsis: e.target.value })}
            onInput={handleTextareaAutoResize}
          />
        </div>
        <button type="button" className="next-section-btn" onClick={() => scrollToSection('worldbuilding')}>
          Next <span className="next-arrow">↓</span>
        </button>
      </div>

      {/* Worldbuilding */}
      <div className="story-bible-section" ref={sectionRefs.worldbuilding}>
        <div className="section-header">
          <div className="section-header-left">
            <span className="section-badge">6</span>
            <span className="section-title">Worldbuilding</span>
          </div>
          <div className="section-actions">
            <button
              type="button"
              className="secondary-pill-btn"
              onClick={handleGenerateWorldbuilding}
              disabled={isGeneratingWorldbuilding}
            >
              {isGeneratingWorldbuilding ? 'Generating...' : 'Generate Worldbuilding'}
            </button>
            <button
              type="button"
              className="secondary-link-btn"
              onClick={handleAddWorldElement}
            >
              + Add Element
            </button>
          </div>
        </div>
        <p className="section-description">
          Bring your world to life with locations, lore, magic systems, technology, and more.
        </p>
        <div className="section-content">
          <textarea
            className="story-bible-textarea auto-resize"
            placeholder="Key locations, factions, rules of magic or technology..."
            value={storyBible.worldbuilding}
            onChange={(e) => setStoryBible({ ...storyBible, worldbuilding: e.target.value })}
            onInput={handleTextareaAutoResize}
          />
          {worldElements.length > 0 && (
            <div className="characters-list" style={{ marginTop: 8 }}>
              {worldElements.map((w) => (
                <div key={w.id} className="character-pill">
                  <span className="character-name">{w.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="button" className="next-section-btn" onClick={() => scrollToSection('outline')}>
          Next <span className="next-arrow">↓</span>
        </button>
      </div>

      {/* Outline & Chapter Details */}
      <div className="story-bible-section" ref={sectionRefs.outline}>
        <div className="section-header">
          <div className="section-header-left">
            <span className="section-badge">7</span>
            <span className="section-title">Outline &amp; Chapter Details</span>
          </div>
          <div className="section-actions">
            <button
              type="button"
              className="secondary-pill-btn"
              onClick={handleGenerateChapters}
              disabled={isGeneratingChapters}
            >
              {isGeneratingChapters ? 'Generating...' : 'Generate Chapters'}
            </button>
            <button
              type="button"
              className="secondary-pill-btn"
              onClick={handleGenerateOutline}
            >
              Generate Outline
            </button>
          </div>
        </div>
        <p className="section-description">
          View and edit chapter details and story outline. Select a chapter above to see its details.
        </p>

        <div className="chapter-details-container">
          {chapters.find((ch) => ch.id === selectedChapterId) && (
            <div className="chapter-content-display" key={selectedChapterId}>
              <div className="chapter-display-header">
                {editingChapterId === selectedChapterId ? (
                  <div className="chapter-edit-inline">
                    <input
                      className="chapter-display-title-edit"
                      value={editingChapterName}
                      onChange={(e) => setEditingChapterName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const ch = chapters.find((c) => c.id === selectedChapterId)
                          const oldName = ch?.name || ''
                          const name = (editingChapterName || oldName).trim()
                          setChapters((prev) => prev.map((p) => p.id === selectedChapterId ? { ...p, name } : p))
                          if (activeDocument === oldName) setActiveDocument(name)
                          setEditingChapterId(null)
                          setEditingChapterName('')
                        }
                        if (e.key === 'Escape') {
                          setEditingChapterId(null)
                          setEditingChapterName('')
                        }
                      }}
                      onBlur={() => {
                        const ch = chapters.find((c) => c.id === selectedChapterId)
                        const oldName = ch?.name || ''
                        const name = (editingChapterName || oldName).trim()
                        setChapters((prev) => prev.map((p) => p.id === selectedChapterId ? { ...p, name } : p))
                        if (activeDocument === oldName) setActiveDocument(name)
                        setEditingChapterId(null)
                        setEditingChapterName('')
                      }}
                      autoFocus
                    />
                    <div className="chapter-edit-controls">
                      <button
                        className="chapter-edit-save"
                        title="Save"
                        onClick={() => {
                          const ch = chapters.find((c) => c.id === selectedChapterId)
                          const oldName = ch?.name || ''
                          const name = (editingChapterName || oldName).trim()
                          setChapters((prev) => prev.map((p) => p.id === selectedChapterId ? { ...p, name } : p))
                          if (activeDocument === oldName) setActiveDocument(name)
                          setEditingChapterId(null)
                          setEditingChapterName('')
                        }}
                      >✓</button>
                      <button
                        className="chapter-edit-cancel"
                        title="Cancel"
                        onClick={() => {
                          setEditingChapterId(null)
                          setEditingChapterName('')
                        }}
                      >✕</button>
                    </div>
                  </div>
                ) : (
                  <h3
                    className="chapter-display-title"
                    title={isBibleEditable ? 'Click to rename' : undefined}
                    onClick={() => {
                      if (!isBibleEditable) return
                      const ch = chapters.find((c) => c.id === selectedChapterId)
                      if (!ch) return
                      setEditingChapterId(ch.id)
                      setEditingChapterName(ch.name || `Chapter ${ch.id}`)
                    }}
                  >
                    {chapters.find((ch) => ch.id === selectedChapterId)?.name}
                  </h3>
                )}
                {isBibleEditable && editingChapterId !== selectedChapterId && (
                  <button
                    className="inline-edit-btn"
                    type="button"
                    title="Edit chapter name"
                    onClick={() => {
                      const ch = chapters.find((c) => c.id === selectedChapterId)
                      if (!ch) return
                      setEditingChapterId(ch.id)
                      setEditingChapterName(ch.name || `Chapter ${ch.id}`)
                    }}
                  >✎</button>
                )}
              </div>

              <div className="chapter-outline-edit">
                {!useImportedOutline ? (
                  <div>
                    <div className="story-bible-field-label">Outline</div>
                    <textarea
                      className="story-bible-textarea auto-resize"
                      placeholder="Chapter breakdowns, major turning points, and endings..."
                      value={outlineText}
                      onChange={(e) => {
                        setOutlineText(e.target.value)
                        setStoryBible({ ...storyBible, outline: e.target.value })
                      }}
                      onInput={handleTextareaAutoResize}
                    />
                  </div>
                ) : (
                  <div>
                    <textarea className="story-bible-textarea auto-resize" value={importedOutline} readOnly />
                    {isBibleEditable && (
                      <div style={{ marginTop: 8 }}>
                        <button className="secondary-link-btn" onClick={() => setUseImportedOutline(false)}>
                          Edit locally
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button Section */}
      <div className="story-bible-save-section">
        <button
          type="button"
          className="story-bible-save-btn"
          onClick={onSave}
          title="Save all story details and go to writing interface"
        >
          💾 Save &amp; Continue to Writing
        </button>
        <p className="save-section-hint">
          All fields will be validated and saved to JSON before redirecting to your writing interface.
        </p>
      </div>
    </div>
  )
}

export default StoryBiblePanel
