# Canvas-based Design Editor - Implementation Plan

## Overview
This plan breaks down the 48-hour project into logical phases, prioritizing core functionality first, then adding collaborative features, and finally polishing with tests.

---

## Phase 1: Project Setup & Infrastructure (2-3 hours)

### 1.1 Project Structure
- [ ] Create monorepo structure or separate frontend/backend folders
- [ ] Initialize Git repository with .gitignore

### 1.2 Frontend Setup
- [ ] Create React app with TypeScript (`create-react-app` or `vite`)
- [ ] Install dependencies:
  - Redux Toolkit + React-Redux
  - Fabric.js (recommended for canvas)
  - React Router
  - Axios for API calls
  - React Toastify for notifications
  - Date-fns for date formatting
- [ ] Configure TypeScript (strict mode)
- [ ] Set up ESLint + Prettier
- [ ] Create basic folder structure:
  ```
  src/
    components/
    features/
    store/
    services/
    types/
    utils/
    hooks/
  ```

### 1.3 Backend Setup
- [ ] Initialize Node.js project with TypeScript
- [ ] Install dependencies:
  - Express + @types/express
  - Mongoose
  - Zod for validation
  - Socket.io for real-time features
  - CORS
  - Dotenv
  - Morgan for logging
- [ ] Set up TypeScript configuration
- [ ] Create folder structure:
  ```
  src/
    models/
    routes/
    controllers/
    middleware/
    validators/
    services/
    types/
    utils/
  ```
- [ ] Set up Express app with middleware (CORS, JSON parsing, error handling)

### 1.4 Database Setup
- [ ] Install MongoDB locally or set up MongoDB Atlas
- [ ] Create connection utility with Mongoose
- [ ] Test database connection

### 1.5 Testing Setup
- [ ] Frontend: Install Jest + React Testing Library
- [ ] Backend: Install Jest + Supertest
- [ ] E2E: Install Playwright (for later)

---

## Phase 2: Backend Core - Data Models & Basic API (3-4 hours)

### 2.1 Database Schema Design
- [ ] **Design Model** (primary collection):
  ```typescript
  {
    _id: ObjectId
    name: string
    width: number (default 1080)
    height: number (default 1080)
    layers: Layer[] // embedded subdocuments
    thumbnail?: string
    createdAt: Date
    updatedAt: Date
  }
  ```
- [ ] **Layer Schema** (embedded in Design):
  ```typescript
  {
    id: string (UUID)
    type: 'text' | 'image' | 'shape'
    name: string
    zIndex: number
    position: { x: number, y: number }
    dimensions: { width: number, height: number }
    rotation: number
    // Type-specific properties:
    text?: { content: string, fontFamily: string, fontSize: number, color: string }
    image?: { url: string, opacity?: number }
    shape?: { shapeType: 'rectangle' | 'circle', fill: string, stroke?: string }
  }
  ```
- [ ] **Comment Model** (separate collection):
  ```typescript
  {
    _id: ObjectId
    designId: ObjectId (ref to Design)
    content: string
    mentions: string[] // array of mentioned names
    author: string
    createdAt: Date
  }
  ```

### 2.2 Mongoose Models
- [ ] Create Design model with Mongoose schema
- [ ] Create Layer subdocument schema
- [ ] Create Comment model
- [ ] Add indexes (designId for comments, updatedAt for designs)

### 2.3 Zod Validators
- [ ] Create Zod schema for layer validation
- [ ] Create Zod schema for design creation/update
- [ ] Create Zod schema for comment creation
- [ ] Create validation middleware

### 2.4 Error Handling Middleware
- [ ] Create error class with `code`, `message`, `details`
- [ ] Create global error handler middleware
- [ ] Create 404 handler
- [ ] Create validation error formatter

### 2.5 Design CRUD API Endpoints
- [ ] `POST /api/designs` - Create new design
- [ ] `GET /api/designs` - List all designs (with pagination, sorting by updatedAt)
- [ ] `GET /api/designs/:id` - Get single design with all layers
- [ ] `PUT /api/designs/:id` - Update design (name, layers)
- [ ] `DELETE /api/designs/:id` - Delete design
- [ ] Write controller functions with try-catch
- [ ] Add Zod validation to routes

### 2.6 Comments API Endpoints
- [ ] `POST /api/designs/:id/comments` - Add comment
- [ ] `GET /api/designs/:id/comments` - Get all comments for a design
- [ ] Add validation for @mentions format

### 2.7 Basic API Tests
- [ ] Write tests for design CRUD operations
- [ ] Write tests for validation errors
- [ ] Write tests for error responses format

---

## Phase 3: Frontend Foundation - Layout & Routing (2-3 hours)

### 3.1 Redux Store Setup
- [ ] Configure Redux Toolkit store
- [ ] Create `designSlice` with initial state:
  ```typescript
  {
    currentDesign: Design | null
    layers: Layer[]
    selectedLayerId: string | null
    history: DesignState[] // for undo/redo
    historyIndex: number
  }
  ```
- [ ] Create `uiSlice` for UI state (loading, errors)
- [ ] Create `commentsSlice` for comments

### 3.2 API Service Layer
- [ ] Create axios instance with base URL
- [ ] Create `designsApi.ts` with CRUD methods
- [ ] Create `commentsApi.ts` with comment methods
- [ ] Add error interceptors

### 3.3 Basic Routing
- [ ] Create routes:
  - `/` - Design list page
  - `/designs/:id` - Canvas editor page
  - `/designs/new` - Create new design (redirects to editor)
- [ ] Set up React Router

### 3.4 Layout Components
- [ ] Create `EditorLayout` component:
  - Top bar (toolbar)
  - Left sidebar (layers panel)
  - Center canvas area
  - Right sidebar (properties panel)
- [ ] Create `TopBar` component (empty for now)
- [ ] Create `LayersPanel` component (empty for now)
- [ ] Create `PropertiesPanel` component (empty for now)
- [ ] Add basic CSS/styling (flexbox layout)

### 3.5 Design List Page
- [ ] Create `DesignList` component
- [ ] Fetch designs on mount
- [ ] Display designs in grid/list with:
  - Name
  - Last updated time
  - Thumbnail placeholder
- [ ] Add "New Design" button
- [ ] Handle loading and error states

---

## Phase 4: Core Canvas Features (5-6 hours)

### 4.1 Canvas Setup
- [ ] Choose canvas library: **Fabric.js** (recommended for ease of use)
- [ ] Create `Canvas` component
- [ ] Initialize Fabric.js canvas with 1080x1080 size
- [ ] Set up canvas background
- [ ] Make canvas responsive (fit to container, maintain aspect ratio)

### 4.2 Add Text Element
- [ ] Create "Add Text" button in toolbar
- [ ] Implement add text handler:
  - Create Fabric.IText object
  - Default: "Text", center position, font: Arial, size: 24, color: black
- [ ] Add to canvas and Redux state
- [ ] Generate unique layer ID (uuid)

### 4.3 Add Image Element
- [ ] Create "Add Image" button with URL input
- [ ] Implement add image handler:
  - Load image from URL using Fabric.Image.fromURL
  - Handle loading states and errors
  - Default size: 200x200 or maintain aspect ratio
- [ ] Add to canvas and Redux state

### 4.4 Add Shape Elements
- [ ] Create "Add Rectangle" button
- [ ] Create "Add Circle" button
- [ ] Implement add shape handlers:
  - Rectangle: Fabric.Rect (width: 150, height: 150)
  - Circle: Fabric.Circle (radius: 75)
  - Default fill: blue, stroke: none
- [ ] Add to canvas and Redux state

### 4.5 Selection & Bounding Boxes
- [ ] Configure Fabric.js selection controls (enabled by default)
- [ ] Style selection handles/bounding box
- [ ] Implement selection handler:
  - On canvas object selection, update Redux `selectedLayerId`
- [ ] Highlight selected layer in layers panel

### 4.6 Transform Operations
- [ ] **Move**: Enable object dragging (Fabric.js default)
  - Sync position to Redux on `object:modified` event
- [ ] **Resize**: Enable scaling controls (Fabric.js default)
  - Sync dimensions on `object:scaled` event
- [ ] **Rotate**: Enable rotation control (Fabric.js default)
  - Sync rotation angle on `object:rotated` event
- [ ] Update Redux state after each transformation
- [ ] Debounce Redux updates to avoid excessive re-renders

### 4.7 Canvas-Redux Synchronization
- [ ] Create utility to convert Fabric objects to Layer state
- [ ] Create utility to convert Layer state to Fabric objects
- [ ] Implement two-way sync:
  - Canvas changes → Redux
  - Redux changes → Canvas (for undo/redo, remote changes)

---

## Phase 5: Layer Management (2-3 hours)

### 5.1 Layers Panel UI
- [ ] Display list of layers (sorted by zIndex)
- [ ] Show layer type icon (T for text, I for image, S for shape)
- [ ] Show layer name
- [ ] Highlight selected layer
- [ ] Click layer to select it on canvas

### 5.2 Layer Reordering (Z-Index)
- [ ] Add "Bring Forward" button for selected layer
- [ ] Add "Send Backward" button for selected layer
- [ ] Implement z-index logic:
  - Increase/decrease zIndex value
  - Re-sort layers array
  - Update Fabric.js canvas object z-index
- [ ] Update Redux state

### 5.3 Rename Layer
- [ ] Add inline edit or modal for renaming
- [ ] Double-click layer name to edit
- [ ] Update layer name in Redux
- [ ] Validate name (non-empty)

### 5.4 Delete Layer
- [ ] Add delete button (X icon) per layer
- [ ] Remove from canvas
- [ ] Remove from Redux state
- [ ] Show confirmation toast

### 5.5 Layer Management in Redux
- [ ] Create actions: `addLayer`, `updateLayer`, `deleteLayer`, `reorderLayer`, `selectLayer`
- [ ] Add reducers for each action
- [ ] Ensure layer IDs are unique

---

## Phase 6: Undo/Redo System (2-3 hours)

### 6.1 History State Management
- [ ] Store canvas state snapshots in Redux:
  ```typescript
  history: DesignState[] // max 50 states
  historyIndex: number
  ```
- [ ] Capture state on every meaningful action:
  - Add layer
  - Delete layer
  - Modify layer (position, size, rotation, style)
  - Reorder layer

### 6.2 Undo/Redo Actions
- [ ] Create `undo` action:
  - Decrement `historyIndex`
  - Load state from `history[historyIndex - 1]`
  - Update canvas
- [ ] Create `redo` action:
  - Increment `historyIndex`
  - Load state from `history[historyIndex + 1]`
  - Update canvas
- [ ] Clear future history when new action is performed

### 6.3 Undo/Redo UI
- [ ] Add Undo button in toolbar
- [ ] Add Redo button in toolbar
- [ ] Disable buttons when at history boundaries
- [ ] Show keyboard shortcuts hint (Ctrl+Z, Ctrl+Y)

### 6.4 History Optimization
- [ ] Limit history to last 10-20 actions (configurable)
- [ ] Use deep cloning for state snapshots
- [ ] Consider using Immer for immutability

---

## Phase 7: Properties Panel - Styling (2-3 hours)

### 7.1 Properties Panel Structure
- [ ] Show panel only when a layer is selected
- [ ] Display different controls based on layer type
- [ ] Create reusable input components (ColorPicker, NumberInput, Select)

### 7.2 Text Styling
- [ ] Font family dropdown (Arial, Helvetica, Times New Roman, Courier)
- [ ] Font size input (number)
- [ ] Text color picker
- [ ] Update Fabric.js text object on change
- [ ] Update Redux state

### 7.3 Image Styling
- [ ] Opacity slider (0-1)
- [ ] Optional: Filters dropdown (grayscale, sepia, etc.)
- [ ] Update Fabric.js image object
- [ ] Update Redux state

### 7.4 Shape Styling
- [ ] Fill color picker
- [ ] Stroke color picker (optional)
- [ ] Stroke width input (optional)
- [ ] Update Fabric.js shape object
- [ ] Update Redux state

### 7.5 Common Transformations
- [ ] Rotation input (degrees, 0-360)
- [ ] Position inputs (X, Y)
- [ ] Size inputs (Width, Height)
- [ ] Lock aspect ratio checkbox (optional)

### 7.6 Real-time Updates
- [ ] Debounce input changes to avoid performance issues
- [ ] Update canvas immediately on change
- [ ] Add to history stack after debounce

---

## Phase 8: Persistence - Save/Load (2 hours)

### 8.1 Save Design
- [ ] Add "Save" button in toolbar
- [ ] Implement save handler:
  - Serialize canvas state (layers array)
  - Call `PUT /api/designs/:id` with updated design
  - Show success toast
  - Handle errors with toast
- [ ] Show loading indicator during save
- [ ] Update design name (editable in toolbar)

### 8.2 Load Design
- [ ] On editor mount, fetch design by ID from URL params
- [ ] Call `GET /api/designs/:id`
- [ ] Deserialize layers and render on canvas
- [ ] Load into Redux state
- [ ] Initialize history with loaded state
- [ ] Handle loading and error states

### 8.3 Create New Design
- [ ] Implement "New Design" button on list page
- [ ] Call `POST /api/designs` with default name and empty layers
- [ ] Redirect to editor with new design ID
- [ ] Show success toast

### 8.4 Auto-save (Nice-to-have)
- [ ] Implement debounced auto-save (5 seconds after last change)
- [ ] Show "Saving..." indicator
- [ ] Show "Saved" indicator when complete
- [ ] Handle conflicts gracefully

---

## Phase 9: Export to PNG (1 hour)

### 9.1 Export Functionality
- [ ] Add "Download PNG" button in toolbar
- [ ] Implement export handler using Fabric.js:
  ```typescript
  canvas.toDataURL({ format: 'png', quality: 1 })
  ```
- [ ] Create download link and trigger download
- [ ] Set filename as `{designName}.png`
- [ ] Show success toast

### 9.2 Export Options (Optional)
- [ ] Add quality selector
- [ ] Add format selector (PNG/JPG)
- [ ] Export specific layers only

---

## Phase 10: Real-time Collaboration (4-5 hours)

### 10.1 Backend - WebSocket Setup
- [ ] Install Socket.io on backend
- [ ] Integrate Socket.io with Express server
- [ ] Create Socket.io event handlers:
  - `join-design` - User joins a design room
  - `leave-design` - User leaves a design room
  - `design-update` - Broadcast changes to room
  - `cursor-position` - Optional: Show user cursors

### 10.2 Frontend - Socket.io Client
- [ ] Install Socket.io client
- [ ] Create `useSocket` hook or service
- [ ] Connect to WebSocket server
- [ ] Emit `join-design` event when editor loads
- [ ] Emit `leave-design` event when editor unmounts

### 10.3 Broadcast Changes
- [ ] On any layer modification, emit `design-update` event with:
  - designId
  - updated layer data
  - action type (add, update, delete, reorder)
  - userId (temporary identifier)
- [ ] Throttle emissions to avoid flooding

### 10.4 Receive Remote Changes
- [ ] Listen for `design-update` events
- [ ] Ignore updates from self (check userId)
- [ ] Apply updates to Redux state
- [ ] Update canvas with remote changes
- [ ] DO NOT add remote changes to undo history

### 10.5 Conflict Resolution
- [ ] Use last-write-wins strategy
- [ ] Consider operational transformation for advanced cases (optional)
- [ ] Show user presence indicators (optional)
  - List of active users
  - Different cursor colors

### 10.6 Testing Real-time
- [ ] Open two browser windows
- [ ] Verify changes appear in both
- [ ] Test with multiple actions (add, move, delete)
- [ ] Test disconnection/reconnection

---

## Phase 11: Comments System (3-4 hours)

### 11.1 Comments Data Model (Already in Phase 2)
- [ ] Verify Comment model is working
- [ ] Test comments API endpoints

### 11.2 Comments UI Component
- [ ] Create `CommentsPanel` component (right side or overlay)
- [ ] Toggle button to show/hide comments
- [ ] List all comments with:
  - Author name
  - Comment content
  - Timestamp
  - Highlighted @mentions

### 11.3 Add Comment
- [ ] Create "Add Comment" form:
  - Text input/textarea
  - Author name input (simple text field since no auth)
  - Submit button
- [ ] Parse @mentions from input:
  - Detect `@username` pattern
  - Store mentions in array
  - Highlight mentions in display
- [ ] Call `POST /api/designs/:id/comments`
- [ ] Add new comment to UI
- [ ] Show success toast

### 11.4 Display Comments
- [ ] Fetch comments on editor load
- [ ] Display in chronological order
- [ ] Format timestamps (e.g., "2 hours ago")
- [ ] Highlight @mentions in different color
- [ ] Make comments scrollable

### 11.5 Real-time Comments (Optional)
- [ ] Emit Socket.io event when comment is added
- [ ] Broadcast to all users in design room
- [ ] Update comments list in real-time

### 11.6 @Mention Autocomplete (Nice-to-have)
- [ ] Show dropdown with active users when typing `@`
- [ ] Filter users as typing continues
- [ ] Select user from dropdown

---

## Phase 12: Error Handling & UI Polish (2 hours)

### 12.1 Toast Notifications
- [ ] Set up React Toastify
- [ ] Create toast utility functions (success, error, info, warning)
- [ ] Add toasts for:
  - Save success/failure
  - Load errors
  - Add/delete layer
  - Export success
  - API errors (network, validation)

### 12.2 Error Boundaries
- [ ] Create React Error Boundary component
- [ ] Wrap main app with error boundary
- [ ] Show user-friendly error page
- [ ] Log errors to console (or external service)

### 12.3 Loading States
- [ ] Add loading spinners for:
  - Design list page
  - Canvas loading
  - Image loading
  - Save operation
- [ ] Add skeleton screens where appropriate

### 12.4 Form Validation
- [ ] Validate design name (non-empty)
- [ ] Validate image URLs (valid URL format)
- [ ] Validate comment content (non-empty)
- [ ] Show validation errors inline

### 12.5 Responsive Design
- [ ] Ensure layout works on different screen sizes
- [ ] Hide panels on mobile, show toggle buttons
- [ ] Test on tablet and desktop

---

## Phase 13: Testing (4-5 hours)

### 13.1 Backend Unit Tests
- [ ] Test Design model CRUD operations
- [ ] Test Comment model CRUD operations
- [ ] Test Zod validators
- [ ] Test error handling middleware
- [ ] Test API endpoints with Supertest:
  - Valid requests return correct data
  - Invalid requests return error with `{ code, message, details }`
  - Test all validation scenarios
- [ ] Aim for 70%+ coverage on critical paths

### 13.2 Frontend Unit Tests
- [ ] Test Redux reducers:
  - addLayer, updateLayer, deleteLayer
  - undo/redo logic
  - selectLayer
- [ ] Test utility functions:
  - Canvas-Redux conversion
  - Layer ID generation
- [ ] Test React components (key ones):
  - LayersPanel rendering
  - PropertiesPanel updates
  - DesignList

### 13.3 Integration Tests
- [ ] Test API service layer with mock axios
- [ ] Test Canvas-Redux synchronization
- [ ] Test real-time updates with mock Socket.io

### 13.4 E2E Tests with Playwright
- [ ] Install and configure Playwright
- [ ] Write E2E test: Create design and add elements
  ```
  - Navigate to home
  - Click "New Design"
  - Add text element
  - Add image element (use placeholder image URL)
  - Add rectangle shape
  - Verify all three appear on canvas
  ```
- [ ] Write E2E test: Reorder layers and undo/redo
  ```
  - Create design with 2 elements
  - Bring one forward
  - Verify layer order changed
  - Click undo
  - Verify layer order restored
  ```
- [ ] Write E2E test: Save and reload design
  ```
  - Create design with elements
  - Click save
  - Navigate away to home
  - Open design again
  - Verify all elements are restored
  ```
- [ ] Write E2E test: Real-time collaboration
  ```
  - Open design in two browser contexts
  - Add element in first context
  - Verify element appears in second context
  ```
- [ ] Write E2E test: Comments
  ```
  - Open design
  - Add comment with @mention
  - Verify comment appears
  - Reload page
  - Verify comment persists
  ```
- [ ] Write E2E test: Export PNG
  ```
  - Create design
  - Click export
  - Verify PNG file is downloaded
  ```

### 13.5 Manual Testing Checklist
- [ ] Test all three object types (text, image, shape)
- [ ] Test transformations (move, resize, rotate)
- [ ] Test layer reordering
- [ ] Test rename and delete
- [ ] Test undo/redo (10+ actions)
- [ ] Test export PNG
- [ ] Test save and reload
- [ ] Test two browser windows with live edits
- [ ] Test comments with @mentions
- [ ] Test API error responses
- [ ] Test offline behavior (graceful errors)

---

## Phase 14: Nice-to-haves (If Time Permits)

### 14.1 Keyboard Shortcuts
- [ ] Implement shortcuts:
  - Ctrl/Cmd+Z: Undo
  - Ctrl/Cmd+Y: Redo
  - Ctrl/Cmd+C: Copy (selected layer)
  - Ctrl/Cmd+V: Paste
  - Delete/Backspace: Delete selected layer
  - Arrow keys: Move selected layer by 1px
  - Shift+Arrow: Move by 10px
- [ ] Show keyboard shortcuts help (? key or Help button)

### 14.2 Thumbnail Generation
- [ ] Add thumbnail generation on save:
  - Generate small PNG (200x200) from canvas
  - Save as base64 or upload to storage
  - Store thumbnail URL in Design model
- [ ] Display thumbnails on design list page

### 14.3 Canvas Size Options
- [ ] Add preset selector (1080x1080, 1920x1080, etc.)
- [ ] Add custom size input
- [ ] Update canvas size dynamically

### 14.4 Guides and Snapping
- [ ] Add ruler guides
- [ ] Implement snap-to-grid
- [ ] Implement snap-to-object alignment

### 14.5 Simple Authentication (JWT)
- [ ] Add User model
- [ ] Add registration/login endpoints
- [ ] Add JWT middleware
- [ ] Associate designs with users
- [ ] Filter designs by logged-in user

### 14.6 CI/CD Pipeline
- [ ] Set up GitHub Actions or similar
- [ ] Run linter on PR
- [ ] Run tests on PR
- [ ] Auto-deploy to staging (optional)

---

## Phase 15: Final Review & Documentation (2 hours)

### 15.1 Code Review
- [ ] Review all code for clarity and best practices
- [ ] Remove console.logs and debug code
- [ ] Add comments for complex logic
- [ ] Ensure consistent code style

### 15.2 Documentation
- [ ] Create comprehensive README.md:
  - Project overview
  - Features implemented
  - Tech stack
  - Setup instructions (frontend, backend, database)
  - Environment variables
  - How to run tests
  - How to run the app
  - API documentation (endpoints)
  - Known limitations
  - Future improvements
- [ ] Document AI assistance used (if any)
- [ ] Add inline code comments for complex logic

### 15.3 Final Testing
- [ ] Run all tests and ensure they pass
- [ ] Perform full manual test of all features
- [ ] Test error scenarios
- [ ] Test on different browsers
- [ ] Fix any remaining bugs

### 15.4 Deployment Preparation (Optional)
- [ ] Set up environment variables for production
- [ ] Configure CORS for production domains
- [ ] Set up MongoDB Atlas (if using local)
- [ ] Deploy backend to Heroku/Railway/Render
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Test production deployment

---

## Priority Summary

### **MUST HAVE** (Core Requirements)
1. Canvas with text, image, shape elements
2. Transformations (move, resize, rotate)
3. Layer management (reorder, rename, delete)
4. Undo/Redo (10+ actions)
5. Export to PNG
6. Save/Load designs via MongoDB
7. Real-time multi-user editing
8. Comments with @mentions
9. Design list page
10. Error handling with toasts
11. Basic tests (unit + E2E for key flows)

### **SHOULD HAVE** (Important for Polish)
1. Auto-save
2. Keyboard shortcuts
3. Thumbnail generation
4. Comprehensive tests
5. Good documentation

### **NICE TO HAVE** (If Time Permits)
1. Authentication
2. Rulers and guides
3. Multiple canvas sizes
4. CI/CD pipeline
5. Advanced styling options

---

## Time Allocation (48 hours total)

- **Phase 1**: Setup (2-3h)
- **Phase 2**: Backend Core (3-4h)
- **Phase 3**: Frontend Foundation (2-3h)
- **Phase 4**: Canvas Features (5-6h)
- **Phase 5**: Layer Management (2-3h)
- **Phase 6**: Undo/Redo (2-3h)
- **Phase 7**: Properties Panel (2-3h)
- **Phase 8**: Persistence (2h)
- **Phase 9**: Export (1h)
- **Phase 10**: Real-time Collaboration (4-5h)
- **Phase 11**: Comments (3-4h)
- **Phase 12**: Error Handling & Polish (2h)
- **Phase 13**: Testing (4-5h)
- **Phase 14**: Nice-to-haves (if time)
- **Phase 15**: Final Review (2h)

**Total Core: ~38-42 hours** (leaves buffer for debugging and nice-to-haves)

---

## Key Technical Decisions

### Canvas Library: Fabric.js
- **Why**: Easy to use, well-documented, handles transformations and selections out of the box
- **Alternative**: Konva (similar but React-specific bindings with react-konva)

### State Management: Redux Toolkit
- **Why**: Requirement specified Redux; RTK simplifies setup and includes Immer for immutability
- **Key slices**: design (layers, current design), ui (loading, errors), comments

### Real-time: Socket.io
- **Why**: Simple, widely used, good for broadcasting changes to rooms
- **Strategy**: Last-write-wins for conflict resolution (simple but effective for MVP)

### Database: MongoDB with Mongoose
- **Why**: Requirement specified; flexible schema for layers, easy to store nested objects
- **Validation**: Zod for runtime validation + Mongoose schemas for DB validation

### Testing:
- **Unit**: Jest for both frontend and backend
- **E2E**: Playwright (modern, reliable, good DX)
- **Coverage goal**: 70%+ on critical paths

---

## Risk Mitigation

### Potential Challenges:
1. **Canvas-Redux sync complexity**: Keep sync logic isolated in utility functions; test thoroughly
2. **Real-time conflicts**: Start with simple last-write-wins; add operational transformation only if needed
3. **Performance**: Debounce state updates, use React.memo, avoid full canvas re-renders
4. **Undo/Redo with real-time**: Don't add remote changes to history; only local changes
5. **Time management**: Prioritize MUST HAVE features first; skip nice-to-haves if running short

### Debugging Strategies:
- Add extensive logging for Socket.io events
- Use Redux DevTools for state debugging
- Use Fabric.js inspect mode for canvas debugging
- Test real-time features with network throttling

---

## Success Criteria

The implementation will be considered successful when:

✅ All 10 functional requirements are implemented and working
✅ API returns structured error responses with `{ code, message, details }`
✅ Can create a design, add all three object types, and save
✅ Can reorder layers, use undo/redo (10+ actions), and export to PNG
✅ Can save and reload designs from MongoDB
✅ Two browser windows show live edits in real-time
✅ Comments with @mentions persist across sessions
✅ API rejects invalid payloads with clear error messages
✅ Unit and E2E tests cover key functionality and pass
✅ Code is clean, documented, and follows best practices

---

## Notes
- This plan is comprehensive but flexible; adjust based on actual progress
- Focus on correctness over speed
- Test continuously, not just at the end
- Document decisions and trade-offs
- Ask for clarification if requirements are unclear

