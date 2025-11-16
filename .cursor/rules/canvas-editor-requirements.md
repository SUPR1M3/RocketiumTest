# Canvas-based Design Editor - Project Requirements

## Goal
Build a simple canvas-based design editor (think Canva/Figma-lite) where users can add text, images, and shapes on a canvas to create designs. Multiple users should be able to edit the same design at the same time and add comments (with @mentions). Persist designs in MongoDB via a REST API. Users can create multiple designs, list them, open, and edit existing ones.

**Time-box** - 48 hours from when this assignment is shared

## Functional Requirements

1. **Canvas** - At least a fixed size preset (e.g., 1080×1080 px). You can build ability to create any size.

2. **Add & edit** - text, image and shape elements and few key styling options for each. Feel free to choose a 2 - 3 styling options for each type of element like (font, color etc., ) based on your preference

3. **Transformations** - move, resize, rotate. Show selection handles / bounding boxes.

4. **Layer order (z-index)** - bring forward/backward. Layers list with rename and delete.

5. **Undo/Redo** - last 10+ actions.

6. **Export** - current canvas to PNG (client-side export acceptable).

7. **Persistence** - Save design to MongoDB via your REST API and reload it later.

8. **Real-time multi-user editing** - more than one user can edit a design concurrently.

9. **Comments** - users can add comments on the design and view past comments; support @mention.

10. **Create new designs and edit existing designs**. List past designs (name, updated time, optional thumbnail).

## Non-functional Requirements

- **Error handling** - user-friendly toasts; API returns structured error responses with `{ code, message, details }`.
- **Performance** - smooth front-end interactions (avoid unnecessary re-renders; memoize/selectors where needed).
- **Cite AI/codegen assistance if used**
- **Unit and E2E tests**.
- **Don't over-engineer**. We care about decisions and clarity.

## Technical Constraints

- **Frontend** - React (typescript) + Redux for state management, canvas based library ( Fabric.js/Konva/raw Canvas )
- **Backend** - Node.js with Express.
- **Database** - MongoDB (Atlas or local). Use an ODM (Mongoose) and/or runtime validation (Zod).

## UI Expectations

Feel free to vary this layout, but here's a suggested structure -

- **Top bar** - Text / Image (URL) / Shape (Rect, Circle), undo/redo, Download, project name.
- **Right panel** - Styling for selected layer (font, color, rotate, etc.).
- **Left panel** - Layers (reorder, rename, delete).
- **Canvas** - selection handles, bounding boxes during transform.

## Nice-to-haves

- Rulers and guides / snapping
- Autosave (debounced)
- Keyboard shortcuts (⌘/Ctrl+C, V, Z, Y, Delete, arrows)
- Simple auth (JWT or token) and per-user projects
- Thumbnail generation endpoint to identify the design
- CI (tests + lint) and a few E2E tests (e.g., Playwright)

## Testing Requirements

We expect to be able to:

- Create a design, add all three object types (text, image, shape)
- Reorder layers, use undo/redo, export to PNG
- Save and reload designs
- Open two browser windows and observe live edits and presence
- Add comments and see them persist across sessions
- Verify API rejects invalid payloads with clear error messages

