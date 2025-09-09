# Rules
    - Always use the options api.
    - Keep components small. Once something has like 10 complex methods- it should probably be broken up.
    - Style colors should use the css variables defined in src/app/styles/style.css.
    - Use GSAP for animation, Popper for tooltips, D3 for SVG drawing and manipulation.

# Goals
    - Generalize: page provides layout, color rules, tooltips, discovery policy.
    - Modes: Edit (structure), GM (discover + manage), Player (read-only view).
    - Incremental: start with lines and dots; add rings/spirals/links later.

# Notes
## Modes and permissions
- Represent as a "policy" object (instead of hard-coded modes within components):
    - canEditStructure: add/remove tracks/nodes, change layout, drag nodes
    - canDiscover: toggle discovered
    - canInteract: hover/click for tooltip only

## Color and tooltip strategy
- Node color is provided by nodeColor(node, {discovered, mode, zoomK, tracks})
- Track color optional: trackColor(track, ctx)
- Tooltips: slot or function prop so pages fully control content

## Links model
- New Link model (straight, curved, spiral). Curved stores midpoints; spiral stores param set (placeholder).
- Store gains links[], addLink / patchLink / deleteLink; tools.addLink flag & linkDraft settings (type, color, stroke).
- LinkPlacementController: 2 steps (pick source, pick target). Ghost shows provisional line/path from source to pointer (or to target). Commit on second click. Shift keeps tool active for next link; otherwise tool auto clears and selects new link.
- Selection: keep node selection unchanged now; after link commit we just log (TODO select link). (Can extend SelectionController later to handle link selection.)
- Tooltip suppression: if link placement active AND Shift held, hide tooltips.
- Node placement: Shift while clicking keeps Add Free mode active (same UX as links).
- Validation: forbid duplicate link (same from/to irrespective of order unless you want directional). Self-link disallowed initially.
- Undo not yet wired for links (add easily by wrapping addLink in undo.push later).

## Discovery model
- Keep discovery in a separate set keyed by node id (not on the node struct)
- GM toggles entries; Player view receives the same set but cannot change it
- Export/import snapshot keeps nodes + discovery set + layout config

# Roadmap
0. Foundation
    1. Remove all unecissary files that have altready been atempted. It is ok to scrap what has been done in favor of doign it better.
    2. Get any needed scafolding/stubs in place or key interfaces solidified.
    3. Get core files working
        1. types/index.ts
        2. components/ReactiveSvg.vue
        3. components/InvestigationWeb.vue
        4. pages/InvestigationWebPage.vue
    4. Persistance Works (saved using our api as json instead of inside local storage)
    5. Import / Export works
1. Free Nodes Only
    1. No tracks, just nodes that can be freely placed anywhere.
        - No discovery or links yet- all nodes are shown.
    2. Editing works
    3. Tool tips work
    4. Unlocked Bonuses work (all will be unlocked)
    5. Filters work
2. Links and Discovery
    1. Add links to nodes
    2. Editing links works
    3. Discovery works
    4. Unlocked Bonuses work (only for discovered are shown)
3. Snap Nodes and Free Tracks
    1. Add vertical and horizontal bar tracks
    2. Add an angled bar track that the user can draw using the mouse; it creates a straight lien between 2 points- and holding shift will make it "snap" to being at some pre-defined list of angles
    3. Tracks are `free` and can be drag/dropped to be anywhere
    4. Tracks are optionally only visible in edit mode
    5. Edit mode only "staging" drawer (another drawer on the right side of the page that only shows up during edit mode) (a drawer that nodes can be placed into (instead of staging tracks))
    6. Snap Nodes "snap" onto a track or can be placed in the staging drawer. Snap behavior is the same as in the PoC
4. Calculated Tracks
    1. Add verical/horizontal tracks that are automatically spaced out and sized based on parameters
    2. Add spiral tracks that the number of spirals, spiral revolutions, spiral style, direction, etc. can be customized
    3. Add svg tracks that follow the lines in an SVG to lay out a track
5. GM/Player Sync
    1. Work on making the Player view (another tab) sync with the GM view.
