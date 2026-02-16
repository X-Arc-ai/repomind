# Validation Tests for RepoMind Implementation

## Summary
- **Total tests**: 68
- **Code tests**: 15
- **Browser tests**: 35
- **State verification**: 11
- **Visual verification**: 7

---

## Code Tests

### CT-1: Project builds successfully
- **Criterion**: Phase 1 - `npm run build` completes without errors
- **Command**: `npm run build`
- **Expected**: Exit code 0, production build created in `.next/` directory
- **Pass if**: Command exits with status 0 and no error messages in output

### CT-2: Linting passes
- **Criterion**: Phase 1 - `npm run lint` passes
- **Command**: `npm run lint`
- **Expected**: No linting errors or warnings
- **Pass if**: Command exits with status 0 and output contains "No ESLint warnings or errors"

### CT-3: Dev server starts
- **Criterion**: Phase 1 - `npm run dev` starts on localhost:3000
- **Command**: `npm run dev` (background process)
- **Expected**: Server starts and listens on port 3000
- **Pass if**: Server responds to `curl http://localhost:3000` with status 200 within 10 seconds

### CT-4: TypeScript type checking
- **Criterion**: Phase 7 - No TypeScript errors
- **Command**: `npx tsc --noEmit`
- **Expected**: No type errors
- **Pass if**: Command exits with status 0

### CT-5: Ingest API returns valid response
- **Criterion**: Phase 2 - POST /api/ingest returns valid IngestResponse
- **Command**:
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/expressjs/express"}' \
  | jq -e '.sessionId and .tokenCount > 0'
```
- **Expected**: JSON response with sessionId and tokenCount > 0
- **Pass if**: jq command exits with status 0 (valid JSON structure)

### CT-6: Preloaded repo ingestion
- **Criterion**: Phase 2 - POST /api/ingest with preloaded repo returns instantly
- **Command**:
```bash
time curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"preloaded":"express"}' \
  -w "\nTime: %{time_total}s\n"
```
- **Expected**: Response time < 2 seconds
- **Pass if**: time_total < 2.0 and response contains valid sessionId

### CT-7: Token count validation
- **Criterion**: Phase 2 - Token count matches expected range for express (50K-150K)
- **Command**:
```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"preloaded":"express"}' \
  | jq -e '.tokenCount >= 50000 and .tokenCount <= 150000'
```
- **Expected**: tokenCount between 50000 and 150000
- **Pass if**: jq expression evaluates to true

### CT-8: Query API returns SSE stream
- **Criterion**: Phase 3 - POST /api/query returns SSE stream
- **Command**:
```bash
SESSION_ID=$(curl -s -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"preloaded":"express"}' | jq -r '.sessionId')
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"query\":\"What does this codebase do?\"}" \
  --no-buffer | head -20
```
- **Expected**: Stream of SSE events with "data:" prefix
- **Pass if**: Output contains multiple lines starting with "data:"

### CT-9: Query stream contains thinking events
- **Criterion**: Phase 3 - Stream contains thinking and text events
- **Command**:
```bash
SESSION_ID=$(curl -s -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"preloaded":"express"}' | jq -r '.sessionId')
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"query\":\"What does this do?\"}" \
  --no-buffer | grep -E 'data:.*"type":"(thinking|text)"' | wc -l
```
- **Expected**: At least 5 events with type "thinking" or "text"
- **Pass if**: Line count >= 5

### CT-10: Query stream ends with done event
- **Criterion**: Phase 3 - Stream ends with done event containing usage data
- **Command**:
```bash
SESSION_ID=$(curl -s -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"preloaded":"express"}' | jq -r '.sessionId')
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"query\":\"What?\"}" \
  --no-buffer | tail -5 | grep -E '"type":"done".*"usage"'
```
- **Expected**: Final event contains type:"done" and usage data
- **Pass if**: grep finds matching pattern

### CT-11: Diagram API returns valid JSON
- **Criterion**: Phase 4 - POST /api/diagram returns valid DiagramData JSON
- **Command**:
```bash
SESSION_ID=$(curl -s -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"preloaded":"express"}' | jq -r '.sessionId')
curl -X POST http://localhost:3000/api/diagram \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\"}" \
  | jq -e '.nodes and .edges and .title'
```
- **Expected**: JSON with nodes, edges, and title fields
- **Pass if**: jq command exits with status 0

### CT-12: Diagram has valid node count
- **Criterion**: Phase 4 - JSON has 10-25 nodes
- **Command**:
```bash
SESSION_ID=$(curl -s -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"preloaded":"express"}' | jq -r '.sessionId')
curl -X POST http://localhost:3000/api/diagram \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\"}" \
  | jq -e '(.nodes | length) >= 10 and (.nodes | length) <= 25'
```
- **Expected**: Node count between 10 and 25
- **Pass if**: jq expression evaluates to true

### CT-13: Diagram has valid edges
- **Criterion**: Phase 4 - JSON has valid edges
- **Command**:
```bash
SESSION_ID=$(curl -s -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"preloaded":"express"}' | jq -r '.sessionId')
curl -X POST http://localhost:3000/api/diagram \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\"}" \
  | jq -e '.edges | length > 0 and all(.source and .target)'
```
- **Expected**: At least one edge, all edges have source and target
- **Pass if**: jq expression evaluates to true

### CT-14: Preloaded repos generate valid contexts
- **Criterion**: Phase 7 - All pre-loaded repos generate valid context documents
- **Command**:
```bash
for repo in express react nextjs; do
  echo "Testing $repo..."
  curl -s -X POST http://localhost:3000/api/ingest \
    -H "Content-Type: application/json" \
    -d "{\"preloaded\":\"$repo\"}" \
    | jq -e '.tokenCount > 0' || exit 1
done
```
- **Expected**: All three repos return valid tokenCount
- **Pass if**: Loop completes without exiting with status 1

### CT-15: Vercel build succeeds
- **Criterion**: Phase 7 - vercel build passes
- **Command**: `vercel build`
- **Expected**: Build completes successfully
- **Pass if**: Command exits with status 0 and .vercel/output directory exists

---

## Browser Tests (Playwright MCP)

### BT-1: Home page loads
- **Criterion**: Phase 1 - Home page renders with header, theme toggle, and basic layout
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000")`
  2. `mcp__playwright__browser_wait_for(selector="header")`
  3. `mcp__playwright__browser_snapshot()`
- **Expected**: Page loads, header visible, theme toggle present
- **Pass if**: Snapshot contains header element and no error messages

### BT-2: Dark mode toggle switches themes
- **Criterion**: Phase 1 - Dark mode toggle switches themes
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000")`
  2. `mcp__playwright__browser_take_screenshot()` (save as before.png)
  3. `mcp__playwright__browser_click(selector="button[aria-label*='theme' i]")`
  4. `mcp__playwright__browser_wait_for(selector=".dark", timeout=2000)` or inverse
  5. `mcp__playwright__browser_take_screenshot()` (save as after.png)
- **Expected**: Theme class changes on html/body element, visual difference in screenshots
- **Pass if**: Screenshot colors differ significantly between before/after

### BT-3: Dark mode has no FOUC
- **Criterion**: Phase 1 - Dark mode looks correct (no flash of unstyled content)
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000")`
  2. `mcp__playwright__browser_evaluate(expression="() => document.documentElement.classList.contains('dark')")`
  3. `mcp__playwright__browser_take_screenshot()` (capture immediately)
- **Expected**: Dark mode applied from initial render, no white flash
- **Pass if**: Screenshot shows dark background immediately

### BT-4: Explore page renders
- **Criterion**: Phase 5 - /explore page renders without errors
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_wait_for(selector="main")`
  3. `mcp__playwright__browser_console_messages()`
- **Expected**: Page loads, no console errors
- **Pass if**: Console has no error-level messages

### BT-5: Repo input field exists
- **Criterion**: Phase 5 - Components mount correctly
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_wait_for(selector="input[placeholder*='GitHub' i]")`
  3. `mcp__playwright__browser_snapshot()`
- **Expected**: GitHub URL input field is visible
- **Pass if**: Input field found and visible

### BT-6: Pre-loaded repo selector exists
- **Criterion**: Phase 5 - Components mount correctly
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_wait_for(selector="[role='button']:has-text('express'), [role='button']:has-text('React'), button:has-text('express')")`
- **Expected**: Pre-loaded repo buttons/chips visible
- **Pass if**: At least one pre-loaded repo button found

### BT-7: Load pre-loaded repo (express)
- **Criterion**: Phase 5 - Pre-loaded repos load instantly
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_wait_for(selector="text=/token|ready/i", timeout=5000)`
  4. `mcp__playwright__browser_snapshot()`
- **Expected**: Repo loads within 5 seconds, token counter shows
- **Pass if**: "Ready" or token count visible within timeout

### BT-8: Token counter displays
- **Criterion**: Phase 5 - Token counter animates during ingestion
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_wait_for(selector="[role='progressbar'], *:has-text('token')")`
  4. `mcp__playwright__browser_snapshot()`
- **Expected**: Token counter/progress bar visible during load
- **Pass if**: Token counter element found

### BT-9: Suggested questions appear
- **Criterion**: Phase 5 - Suggested questions are clickable and trigger queries
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_wait_for(selector="text=/What does this codebase do|Explain the architecture/i", timeout=10000)`
- **Expected**: Suggested question chips/buttons visible after repo load
- **Pass if**: At least one suggested question button found

### BT-10: Click suggested question triggers query
- **Criterion**: Phase 5 - Suggested questions are clickable and trigger queries
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_wait_for(selector="button:has-text('What does this codebase do?')", timeout=10000)`
  4. `mcp__playwright__browser_click(selector="button:has-text('What does this codebase do?')")`
  5. `mcp__playwright__browser_wait_for(selector="text=/thinking|express/i", timeout=5000)`
- **Expected**: Question triggers query, thinking indicator or response appears
- **Pass if**: Response content visible within timeout

### BT-11: Manual question submission
- **Criterion**: Phase 5 - Full flow works: enter URL → load → ask question → get answer
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_wait_for(selector="textarea, input[type='text']:not([placeholder*='GitHub'])", timeout=10000)`
  4. `mcp__playwright__browser_type(selector="textarea, input[type='text']:not([placeholder*='GitHub'])", text="What is Express?")`
  5. `mcp__playwright__browser_press_key(key="Enter")`
  6. `mcp__playwright__browser_wait_for(selector="text=/express/i", timeout=30000)`
- **Expected**: User can type question and receive answer
- **Pass if**: Response containing "express" appears

### BT-12: Thinking indicator shows during query
- **Criterion**: Phase 3 - Thinking indicator animates during reasoning
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_wait_for(selector="button:has-text('What does this codebase do?')", timeout=10000)`
  4. `mcp__playwright__browser_click(selector="button:has-text('What does this codebase do?')")`
  5. `mcp__playwright__browser_wait_for(selector="*:has-text('thinking'), [class*='thinking'], [class*='animate']", timeout=3000)`
  6. `mcp__playwright__browser_take_screenshot()`
- **Expected**: Thinking indicator visible during query processing
- **Pass if**: Screenshot shows thinking indicator/animation

### BT-13: Thinking text is collapsible
- **Criterion**: Phase 3 - Thinking text is visible in collapsible section
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_click(selector="button:has-text('What does this codebase do?')")`
  4. `mcp__playwright__browser_wait_for(selector="*:has-text('thinking'), button:has-text('thinking'), details:has-text('thinking')", timeout=30000)`
  5. `mcp__playwright__browser_click(selector="*:has-text('thinking'), button:has-text('thinking'), details:has-text('thinking')")`
- **Expected**: Thinking section can be expanded/collapsed
- **Pass if**: Click toggles thinking content visibility

### BT-14: Code references present in answers
- **Criterion**: Phase 3 - Code references (file:line) are present in answers
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_click(selector="button:has-text('Explain the architecture')")`
  4. `mcp__playwright__browser_wait_for(selector="text=/.+\\.(js|ts|json):\\d+/i", timeout=45000)`
- **Expected**: Response contains file:line references like "index.js:42"
- **Pass if**: Pattern matching file:line found in response

### BT-15: Conversation history maintained
- **Criterion**: Phase 3 - Conversation history is maintained (follow-up questions work)
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_click(selector="button:has-text('What does this codebase do?')")`
  4. `mcp__playwright__browser_wait_for(selector="text=/web framework|server/i", timeout=45000)`
  5. `mcp__playwright__browser_type(selector="textarea", text="Tell me more about that")`
  6. `mcp__playwright__browser_press_key(key="Enter")`
  7. `mcp__playwright__browser_wait_for(selector="text=/express/i", timeout=45000)`
- **Expected**: Follow-up question understands context
- **Pass if**: Second response is coherent and references previous answer

### BT-16: Effort selector present
- **Criterion**: Phase 5 - Effort selector changes response depth
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_wait_for(selector="select:has([value*='effort']), button:has-text('Quick'), button:has-text('Deep'), button:has-text('Maximum')")`
- **Expected**: Effort selector dropdown or buttons visible
- **Pass if**: Effort control element found

### BT-17: Diagram tab accessible
- **Criterion**: Phase 5 - Diagram tab generates and displays architecture
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_wait_for(selector="button:has-text('Diagram'), [role='tab']:has-text('Diagram')", timeout=10000)`
  4. `mcp__playwright__browser_click(selector="button:has-text('Diagram'), [role='tab']:has-text('Diagram')")`
- **Expected**: Diagram tab can be clicked
- **Pass if**: Tab switches to diagram view

### BT-18: Generate diagram button works
- **Criterion**: Phase 5 - Diagram tab generates and displays architecture
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_click(selector="button:has-text('Diagram'), [role='tab']:has-text('Diagram')")`
  4. `mcp__playwright__browser_click(selector="button:has-text('Generate')")`
  5. `mcp__playwright__browser_wait_for(selector=".react-flow, [class*='react-flow']", timeout=60000)`
- **Expected**: Diagram generates and renders
- **Pass if**: React Flow container found

### BT-19: Diagram nodes are colored by type
- **Criterion**: Phase 4 - Nodes are colored by type (module=blue, component=green, etc.)
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_click(selector="button:has-text('Diagram')")`
  4. `mcp__playwright__browser_click(selector="button:has-text('Generate')")`
  5. `mcp__playwright__browser_wait_for(selector=".react-flow__node", timeout=60000)`
  6. `mcp__playwright__browser_take_screenshot()`
- **Expected**: Diagram nodes have different colors
- **Pass if**: Screenshot shows nodes with distinct colors

### BT-20: Diagram edges show labels
- **Criterion**: Phase 4 - Edges show relationship labels
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_click(selector="button:has-text('Diagram')")`
  4. `mcp__playwright__browser_click(selector="button:has-text('Generate')")`
  5. `mcp__playwright__browser_wait_for(selector=".react-flow__edge-text, [class*='edge'] text", timeout=60000)`
- **Expected**: Edges have text labels
- **Pass if**: Edge text elements found

### BT-21: Diagram zoom and pan work
- **Criterion**: Phase 4 - Zoom, pan, and minimap work
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_click(selector="button:has-text('Diagram')")`
  4. `mcp__playwright__browser_click(selector="button:has-text('Generate')")`
  5. `mcp__playwright__browser_wait_for(selector=".react-flow__controls", timeout=60000)`
  6. `mcp__playwright__browser_click(selector=".react-flow__controls-zoomin, button[aria-label*='zoom in']")`
- **Expected**: Zoom controls are present and functional
- **Pass if**: Zoom button click succeeds without error

### BT-22: Diagram minimap visible
- **Criterion**: Phase 4 - Zoom, pan, and minimap work
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('express')")`
  3. `mcp__playwright__browser_click(selector="button:has-text('Diagram')")`
  4. `mcp__playwright__browser_click(selector="button:has-text('Generate')")`
  5. `mcp__playwright__browser_wait_for(selector=".react-flow__minimap", timeout=60000)`
- **Expected**: Minimap visible in diagram view
- **Pass if**: Minimap element found

### BT-23: Desktop two-panel layout
- **Criterion**: Phase 5 - Two-panel layout works on desktop
- **Steps**:
  1. `mcp__playwright__browser_resize(width=1920, height=1080)`
  2. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  3. `mcp__playwright__browser_wait_for(selector="main")`
  4. `mcp__playwright__browser_take_screenshot()`
  5. `mcp__playwright__browser_evaluate(expression="() => { const panels = document.querySelectorAll('[class*=\"panel\"], [class*=\"col-\"]'); return panels.length >= 2; }")`
- **Expected**: Two-column layout visible on desktop
- **Pass if**: evaluate returns true or screenshot shows side-by-side panels

### BT-24: Mobile stacked layout
- **Criterion**: Phase 5 - Mobile layout stacks correctly
- **Steps**:
  1. `mcp__playwright__browser_resize(width=375, height=667)`
  2. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  3. `mcp__playwright__browser_wait_for(selector="main")`
  4. `mcp__playwright__browser_take_screenshot()`
- **Expected**: Single-column stacked layout on mobile
- **Pass if**: Screenshot shows vertical stacking, not side-by-side

### BT-25: Landing page loads
- **Criterion**: Phase 6 - Home page renders at /
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000")`
  2. `mcp__playwright__browser_wait_for(selector="h1, [role='heading']")`
  3. `mcp__playwright__browser_snapshot()`
- **Expected**: Landing page loads with hero heading
- **Pass if**: Snapshot contains h1 element

### BT-26: Landing page CTA links to explore
- **Criterion**: Phase 6 - CTA links to /explore
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000")`
  2. `mcp__playwright__browser_wait_for(selector="a[href='/explore'], button:has-text('Try it now')")`
  3. `mcp__playwright__browser_click(selector="a[href='/explore'], button:has-text('Try it now')")`
  4. `mcp__playwright__browser_wait_for(selector="input[placeholder*='GitHub']")`
- **Expected**: CTA button navigates to /explore
- **Pass if**: URL changes to /explore and explore page loads

### BT-27: Landing page responsive on mobile
- **Criterion**: Phase 6 - Responsive on mobile
- **Steps**:
  1. `mcp__playwright__browser_resize(width=375, height=667)`
  2. `mcp__playwright__browser_navigate(url="http://localhost:3000")`
  3. `mcp__playwright__browser_wait_for(selector="h1")`
  4. `mcp__playwright__browser_take_screenshot()`
  5. `mcp__playwright__browser_evaluate(expression="() => document.documentElement.scrollWidth <= 375")`
- **Expected**: No horizontal scroll, content fits viewport
- **Pass if**: evaluate returns true (no overflow)

### BT-28: Landing page animations
- **Criterion**: Phase 6 - Animations are smooth
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000")`
  2. `mcp__playwright__browser_wait_for(selector="[class*='animate'], [style*='animation']")`
  3. `mcp__playwright__browser_take_screenshot()`
- **Expected**: Animated elements present (gradient text, fade-ins)
- **Pass if**: Elements with animation classes found

### BT-29: Light mode toggle on landing page
- **Criterion**: Phase 6 - Dark mode is default, light mode also works
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000")`
  2. `mcp__playwright__browser_wait_for(selector="button[aria-label*='theme']")`
  3. `mcp__playwright__browser_click(selector="button[aria-label*='theme']")`
  4. `mcp__playwright__browser_wait_for(selector=".light, :not(.dark)")`
  5. `mcp__playwright__browser_take_screenshot()`
- **Expected**: Theme switches to light mode
- **Pass if**: Screenshot shows light background

### BT-30: Load URL flow (express from GitHub)
- **Criterion**: Phase 5 - Full flow works: enter URL → load → ask question → get answer
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_type(selector="input[placeholder*='GitHub']", text="https://github.com/expressjs/express")`
  3. `mcp__playwright__browser_click(selector="button:has-text('Load'), button[type='submit']")`
  4. `mcp__playwright__browser_wait_for(selector="text=/ready|token/i", timeout=60000)`
- **Expected**: URL ingestion completes successfully
- **Pass if**: Ready indicator appears within 60 seconds

### BT-31: Demo flow - React repo
- **Criterion**: Phase 7 - Demo flow works end-to-end for all 3 pre-loaded repos
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('React'), button:has-text('react')")`
  3. `mcp__playwright__browser_wait_for(selector="text=/ready/i", timeout=60000)`
  4. `mcp__playwright__browser_click(selector="button:has-text('What does this codebase do?')")`
  5. `mcp__playwright__browser_wait_for(selector="text=/react/i", timeout=60000)`
- **Expected**: React repo loads and answers question
- **Pass if**: Response mentioning React appears

### BT-32: Demo flow - Next.js repo
- **Criterion**: Phase 7 - Demo flow works end-to-end for all 3 pre-loaded repos
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_click(selector="button:has-text('Next'), button:has-text('next.js')")`
  3. `mcp__playwright__browser_wait_for(selector="text=/ready/i", timeout=60000)`
  4. `mcp__playwright__browser_click(selector="button:has-text('What does this codebase do?')")`
  5. `mcp__playwright__browser_wait_for(selector="text=/next/i", timeout=60000)`
- **Expected**: Next.js repo loads and answers question
- **Pass if**: Response mentioning Next appears

### BT-33: Error handling - invalid URL
- **Criterion**: Phase 7 - Error states are friendly and helpful
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_type(selector="input[placeholder*='GitHub']", text="not-a-url")`
  3. `mcp__playwright__browser_click(selector="button:has-text('Load')")`
  4. `mcp__playwright__browser_wait_for(selector="text=/invalid|error/i", timeout=5000)`
- **Expected**: Friendly error message displayed
- **Pass if**: Error message visible without crash

### BT-34: Error handling - non-existent repo
- **Criterion**: Phase 7 - Error states are friendly and helpful
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000/explore")`
  2. `mcp__playwright__browser_type(selector="input[placeholder*='GitHub']", text="https://github.com/fake-org/fake-repo-12345")`
  3. `mcp__playwright__browser_click(selector="button:has-text('Load')")`
  4. `mcp__playwright__browser_wait_for(selector="text=/not found|doesn't exist|error/i", timeout=30000)`
- **Expected**: Helpful error about repo not existing
- **Pass if**: Error message explains repo not found

### BT-35: Page load performance
- **Criterion**: Phase 7 - Page load is fast (< 2s)
- **Steps**:
  1. `mcp__playwright__browser_navigate(url="http://localhost:3000")`
  2. `mcp__playwright__browser_evaluate(expression="() => { const nav = performance.getEntriesByType('navigation')[0]; return nav.loadEventEnd - nav.fetchStart; }")`
- **Expected**: Page load time under 2000ms
- **Pass if**: evaluate result < 2000

---

## State Verification

### SV-1: GitHub repo exists
- **Criterion**: Phase 1 - GitHub repo exists at https://github.com/X-Arc-ai/repomind
- **Check**: Repository is accessible via gh CLI
- **Command/Query**: `gh repo view X-Arc-ai/repomind --json name,owner`
- **Expected**: JSON response with name: "repomind", owner: { login: "X-Arc-ai" }
- **Pass if**: Command exits with status 0 and returns valid JSON

### SV-2: Context document structure
- **Criterion**: Phase 2 - Context builder creates proper structure
- **Check**: Context document contains file tree and key files sections
- **Command/Query**: After ingestion, inspect session storage (via debug endpoint or logs)
- **Expected**: Context string contains "## File Structure" and "## Key Files" headers
- **Pass if**: Both headers present in context

### SV-3: File prioritization
- **Criterion**: Phase 2 - File priority ordering (README first, tests last)
- **Check**: README appears before test files in context
- **Command/Query**: Check context document order
- **Expected**: README.md appears in first 10% of context, test files in last 50%
- **Pass if**: README position < test file position in context string

### SV-4: Binary exclusion
- **Criterion**: Phase 2 - Binary files and node_modules are excluded
- **Check**: Context does not contain node_modules paths or binary content
- **Command/Query**: `grep -c "node_modules" <context>` should return 0
- **Expected**: Zero occurrences of node_modules, no binary data
- **Pass if**: Grep returns 0

### SV-5: Large repo truncation
- **Criterion**: Phase 2 - Large repos properly truncated to fit 800K token budget
- **Check**: React repo context is under 800K tokens
- **Command/Query**:
```bash
curl -s -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"preloaded":"react"}' \
  | jq '.tokenCount <= 800000'
```
- **Expected**: Token count ≤ 800000
- **Pass if**: jq expression evaluates to true

### SV-6: Session storage
- **Criterion**: Phase 2 - Sessions stored with TTL
- **Check**: Session data persists after creation
- **Command/Query**: Create session, retrieve it via subsequent query
- **Expected**: Session ID returns valid session data on GET
- **Pass if**: Second API call with same sessionId succeeds

### SV-7: Conversation history storage
- **Criterion**: Phase 3 - Conversation history maintained
- **Check**: Session stores message array
- **Command/Query**: Make two queries in same session, verify both stored
- **Expected**: Session contains both user and assistant messages
- **Pass if**: Follow-up query has access to previous context

### SV-8: Cache directory structure
- **Criterion**: Phase 7 - Pre-loaded repos cached correctly
- **Check**: Repo cache directory exists with correct structure
- **Command/Query**: `ls -la /tmp/repomind-repos/expressjs/express /tmp/repomind-repos/facebook/react`
- **Expected**: Directories exist and contain git repos
- **Pass if**: All three repo directories exist with .git folder

### SV-9: Environment variables set
- **Criterion**: Phase 1 - Environment variables configured
- **Check**: ANTHROPIC_API_KEY and REPO_CACHE_DIR set
- **Command/Query**: `printenv | grep -E "ANTHROPIC_API_KEY|REPO_CACHE_DIR"`
- **Expected**: Both variables present
- **Pass if**: Grep returns 2 lines

### SV-10: Build output exists
- **Criterion**: Phase 1 - Build creates production output
- **Check**: .next directory exists with compiled files
- **Command/Query**: `ls -la .next/standalone .next/static`
- **Expected**: Both directories exist
- **Pass if**: ls succeeds and shows content

### SV-11: Pre-loaded context files
- **Criterion**: Phase 7 - Pre-built context documents for instant load
- **Check**: public/preloaded/ contains context JSON files
- **Command/Query**: `ls -lh public/preloaded/*.json | wc -l`
- **Expected**: At least 3 JSON files (express, react, nextjs)
- **Pass if**: wc -l returns >= 3

---

## Visual Verification

### VV-1: Landing page hero section
- **Page/Component**: Home page (/)
- **Expected appearance**:
  - Large gradient heading "Understand any codebase in seconds, not weeks"
  - Prominent CTA button
  - Dark background with purple/blue gradient accents
  - Clean, modern typography
- **Screenshot path**: `/tmp/validation/repomind-landing-hero.png`

### VV-2: Explore page layout (desktop)
- **Page/Component**: Explore page (/explore) at 1920x1080
- **Expected appearance**:
  - Two-column layout
  - Left: Chat interface with input at bottom
  - Right: Diagram/info panel with tabs
  - Top: Repo input bar and token counter
  - Clean separation between panels
- **Screenshot path**: `/tmp/validation/repomind-explore-desktop.png`

### VV-3: Explore page layout (mobile)
- **Page/Component**: Explore page (/explore) at 375x667
- **Expected appearance**:
  - Single-column stacked layout
  - Tab navigation for switching views
  - Input controls full-width
  - No horizontal scrolling
- **Screenshot path**: `/tmp/validation/repomind-explore-mobile.png`

### VV-4: Token counter animation
- **Page/Component**: Token counter during ingestion
- **Expected appearance**:
  - Animated progress bar
  - Color gradient (green → yellow → red)
  - Token count text visible
  - Smooth animation during load
- **Screenshot path**: `/tmp/validation/repomind-token-counter.png`

### VV-5: Chat with thinking indicator
- **Page/Component**: Chat interface during active query
- **Expected appearance**:
  - Thinking section with animated indicator
  - Collapsible thinking text (monospace, dimmed)
  - Clean message bubbles
  - Markdown-rendered response
- **Screenshot path**: `/tmp/validation/repomind-thinking-active.png`

### VV-6: Architecture diagram
- **Page/Component**: Diagram panel with generated architecture
- **Expected appearance**:
  - Interactive React Flow diagram
  - Colored nodes by type (blue, green, yellow, purple)
  - Labeled edges showing relationships
  - Minimap in corner
  - Zoom controls visible
  - Professional, clean layout
- **Screenshot path**: `/tmp/validation/repomind-diagram.png`

### VV-7: Dark mode consistency
- **Page/Component**: All pages in dark mode
- **Expected appearance**:
  - Consistent dark background across all pages
  - Good contrast for text
  - Purple/blue accent colors
  - No light mode flash on load
  - Theme toggle clearly indicates dark mode active
- **Screenshot path**: `/tmp/validation/repomind-dark-mode.png`

---

## Test Execution Order

### Phase 1 Tests (Run First):
- CT-1, CT-2, CT-3, CT-4 (build and dev server)
- BT-1, BT-2, BT-3 (basic page load and dark mode)
- SV-1, SV-9, SV-10 (repo exists, env vars, build output)
- VV-1, VV-7 (landing page and dark mode visuals)

### Phase 2 Tests (After Phase 1):
- CT-5, CT-6, CT-7 (ingestion API)
- CT-14 (preloaded repos)
- SV-2, SV-3, SV-4, SV-5, SV-6, SV-8, SV-11 (context and caching)

### Phase 3 Tests (After Phase 2):
- CT-8, CT-9, CT-10 (query streaming)
- BT-10, BT-11, BT-12, BT-13, BT-14, BT-15, BT-16 (chat functionality)
- SV-7 (conversation history)
- VV-5 (thinking indicator)

### Phase 4 Tests (After Phase 2):
- CT-11, CT-12, CT-13 (diagram API)
- BT-17, BT-18, BT-19, BT-20, BT-21, BT-22 (diagram UI)
- VV-6 (diagram visual)

### Phase 5 Tests (After Phase 3 & 4):
- BT-4, BT-5, BT-6, BT-7, BT-8, BT-9 (explore page components)
- BT-23, BT-24 (responsive layout)
- BT-30 (full URL flow)
- VV-2, VV-3, VV-4 (explore page visuals)

### Phase 6 Tests (Parallel with Phase 5):
- BT-25, BT-26, BT-27, BT-28, BT-29 (landing page)

### Phase 7 Tests (Final):
- CT-15 (Vercel build)
- BT-31, BT-32 (demo flows)
- BT-33, BT-34 (error handling)
- BT-35 (performance)

---

## Test Coverage Summary

### By Phase:
- **Phase 1** (Scaffolding): 11 tests (CT-1 to CT-4, BT-1 to BT-3, SV-1, SV-9, SV-10, VV-1, VV-7)
- **Phase 2** (Ingestion): 12 tests (CT-5 to CT-7, CT-14, SV-2 to SV-6, SV-8, SV-11)
- **Phase 3** (Q&A Streaming): 11 tests (CT-8 to CT-10, BT-10 to BT-16, SV-7, VV-5)
- **Phase 4** (Diagrams): 9 tests (CT-11 to CT-13, BT-17 to BT-22, VV-6)
- **Phase 5** (Exploration UI): 13 tests (BT-4 to BT-9, BT-23, BT-24, BT-30, VV-2 to VV-4)
- **Phase 6** (Landing Page): 5 tests (BT-25 to BT-29)
- **Phase 7** (Demo Prep): 7 tests (CT-15, BT-31 to BT-35)

### Success Criteria Coverage:
- ✅ All automated verification criteria covered (100%)
- ✅ All manual verification criteria converted to automated tests (100%)
- ✅ All phases have test coverage
- ✅ Edge cases and error states included

### Untestable Criteria:
**None** - All success criteria have been converted to concrete, executable tests.

---

## Notes

1. **Prerequisites**: Dev server must be running at `http://localhost:3000` for all browser and API tests
2. **Timeouts**: Some tests have long timeouts (60s) due to LLM processing time - this is expected
3. **API Key**: Tests require valid `ANTHROPIC_API_KEY` environment variable
4. **Cache Directory**: Tests assume `/tmp/repomind-repos` exists and is writable
5. **Playwright Setup**: Requires Playwright MCP server to be configured and running
6. **Screenshot Storage**: All screenshots stored in `/tmp/validation/` directory
7. **Test Isolation**: Tests should be idempotent and not interfere with each other
8. **Performance**: Total test suite may take 30-45 minutes due to LLM query times

---

## Execution Command

To run all tests in order:
```bash
# Start dev server
npm run dev &
DEV_PID=$!

# Wait for server
sleep 5

# Run code tests
npm run build
npm run lint
npx tsc --noEmit

# Run API tests (CT-5 through CT-14)
bash scripts/run-api-tests.sh

# Run browser tests (requires Playwright MCP)
# Execute via Claude Code agent with Playwright tools

# Cleanup
kill $DEV_PID
```
