# Rules
    - Always use the options api.
    - Keep components small. Once something has like 10 complex methods- it should probably be broken up.
    - Style colors should use the css variables defined in src/app/styles/style.css.
    - Use GSAP for animation and Popper for tooltips.

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

## Discovery model
- Keep discovery in a separate set keyed by node id (not on the node struct)
- GM toggles entries; Player view receives the same set but cannot change it
- Export/import snapshot keeps nodes + discovery set + layout config

# Roadmap
0. Foundation
    - Remove all unecissary files that have altready been atempted. It is ok to scrap what has been done in favor of doign it better.
    - Get any needed scafolding/stubs in place or key interfaces solidified.
    - Get core files working
        - components/ReactiveSvg.vue
        - components/InvestigationWeb.vue
        - pages/InvestigationWebPage.vue
        - types/index.ts
    - Import / Export works
    - Persistance Works (saved using our api as json instead of inside local storage)
    - Get basic unit tests working
1. Free Nodes Only
    - No tracks, just nodes that can be freely placed anywhere.
    - No discovery or links yet- all nodes are shown.
    - Editing works
    - Tool tips work
    - Unlocked Bonuses work (all will be unlocked)
    - Filters work
2. Links and Discovery
    - Add links to nodes
    - Editing links works
    - Discovery works
    - Unlocked Bonuses work (only for discovered are shown)
3. Snap Nodes and Free Tracks
    - Add vertical and horizontal bar tracks
    - Add an angled bar track that the user can draw using the mouse; it creates a straight lien between 2 points- and holding shift will make it "snap" to being at some pre-defined list of angles
    - Tracks are `free` and can be drag/dropped to be anywhere
    - Tracks are optionally only visible in edit mode
    - Edit mode only "staging" drawer (another drawer on the right side of the page that only shows up during edit mode) (a drawer that nodes can be placed into (instead of staging tracks))
    - Snap Nodes "snap" onto a track or can be placed in the staging drawer. Snap behavior is the same as in the PoC
4. Calculated Tracks
    - Add verical/horizontal tracks that are automatically spaced out and sized based on parameters
    - Add spiral tracks that the number of spirals, spiral revolutions, spiral style, direction, etc. can be customized
    - Add svg tracks that follow the lines in an SVG to lay out a track
5. GM/Player Sync
    - Work on making the Player view (another tab) sync with the GM view.