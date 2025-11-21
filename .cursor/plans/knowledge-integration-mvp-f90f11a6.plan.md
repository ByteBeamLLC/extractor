<!-- f90f11a6-5ab5-4622-a1d8-e3f27edb282e e35dfe70-c03e-42de-b2a6-7234942e6f17 -->
# Knowledge Hub Integration for Transformations

## Context

After evaluating RAG, agentic (Cline), and simple approaches, we're implementing an MVP with direct content inclusion. Users can @ mention knowledge documents/folders in transformation prompts, and content is included in the LLM context.

## Implementation Strategy

### Phase 1: MVP Direct Inclusion (This Plan)

- @ mentions include both fields AND knowledge items
- Tagged knowledge content is directly injected into prompt
- Single LLM call (existing transform API pattern)
- Size warnings for large content
- Validates user demand and use cases

### Future Upgrade Paths

- **Phase 2:** Multi-step agentic reasoning (if complex workflows emerge)
- **Phase 3:** RAG with embeddings (if scaling to 100+ documents)

## Core Changes

### 1. Knowledge Content Fetching

Create utility function to fetch knowledge content by ID or folder path:

- `lib/knowledge-actions.ts`: Add `getKnowledgeContentForTransformation(ref)`
- Handle both individual documents and folders (include all docs in folder)
- Return markdown content from `knowledge_documents.content`
- Add size calculation and warnings

### 2. Mention System Extension

Extend `MentionTextarea` to support knowledge items:

- `components/ui/mention-textarea.tsx`: Add optional `knowledgeItems` prop
- Distinguish visually: 📄 for docs, 📁 for folders, existing styling for fields
- Tag format: `{kb:folder-name}` or `{doc:document-name}` (or simpler `{knowledge-name}`)

### 3. Transform Builder Updates

Update `components/transform-builder.tsx`:

- Fetch user's knowledge bases and documents via existing actions
- Merge knowledge options with field options in dropdown
- Pass knowledge items to MentionTextarea
- Show visual distinction (icons, colors) between fields and knowledge

### 4. Transform API Enhancement

Update `app/api/transform/route.ts`:

- Parse prompt for knowledge references (regex: `\{kb:([^}]+)\}` or similar)
- Fetch knowledge content via new utility function
- Inject knowledge content into prompt before LLM call
- Add to existing context-building logic (before line 282 substitution)
- Keep single-call pattern (no agentic loop for MVP)

### 5. Safeguards & UX

- Calculate total token count (prompt + knowledge + fields)
- Warn/reject if > 100k tokens (well under Gemini 2M limit but safe MVP threshold)
- Show which knowledge items are being used in UI
- Log knowledge usage for analytics

## Key Files to Modify

- `lib/knowledge-actions.ts` - Add content fetching function
- `components/ui/mention-textarea.tsx` - Support knowledge items in dropdown
- `components/transform-builder.tsx` - Fetch and display knowledge options
- `app/api/transform/route.ts` - Parse and inject knowledge content
- `lib/dependency-resolver.ts` - Update to handle knowledge refs (optional)

## Testing Scenarios

1. Tag single document in transformation
2. Tag entire folder (multiple docs)
3. Mix field references and knowledge references
4. Large document warning/handling
5. Non-existent knowledge reference

## Success Criteria

- Users can @ mention knowledge items in transformations
- Knowledge content is successfully included in LLM context
- Transformations produce accurate results grounded in knowledge
- System handles typical policy/guideline documents (5-50 pages)
- Clear path to upgrade if more sophistication neededok

### To-dos

- [ ] Add getKnowledgeContentForTransformation to knowledge-actions
- [ ] Extend MentionTextarea to support knowledge items with icons
- [ ] Update TransformBuilder to fetch and display knowledge options
- [ ] Parse knowledge references from transformation prompts
- [ ] Inject knowledge content into LLM prompt context
- [ ] Add token counting and size warnings for large knowledge
- [ ] Test with real knowledge documents and transformations