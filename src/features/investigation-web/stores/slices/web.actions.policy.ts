import type { UIMode } from "../../types/mode";

export const policyActions = {
  setCurrentEditState(this:any, s:
    "none"|"add-free-node"|"add-link"|"place-stashed-node"|
    "drag-free-node"|"edit-selected-node"|"add-snap-node"|
    "place-stashed-snap-node"|"drag-snap-node"|"add-track"|
    "drag-track"|"drag-track-end"|"add-calc-group"
  ){
    this.currentEditState = s;
  },
  setCanEditStructure(this:any, on: boolean) {
    this.policy.canEditStructure = on;
    if (!on) { this.resetTools(); this.setCurrentEditState("none"); }
  },
  updatePolicy(this:any, p: Partial<{ canEditStructure:boolean; canDiscover:boolean; canInteract:boolean }>) {
    if (p.canEditStructure !== undefined) this.setCanEditStructure(p.canEditStructure);
    if (p.canDiscover !== undefined) this.policy.canDiscover = p.canDiscover;
    if (p.canInteract !== undefined) this.policy.canInteract = p.canInteract;
  },
  setAddFreeNode(this:any, on: boolean) {
    this.tools.addFreeNode = on;
    if (on) {
      this.tools.addSnapNode = false;
      this.tools.placeStagedSnapId = null;
      this.tools.placeStagedId = null;
      this.tools.editDefaults = false;
      this.tools.addLink = false;
      this.tools.addTrack = false;
      this.setCurrentEditState("add-free-node");
    } else if (!this.tools.addSnapNode && !this.tools.placeStagedId && !this.tools.placeStagedSnapId && !this.tools.addLink && !this.tools.addTrack) {
      this.setCurrentEditState("none");
    }
  },
  setAddSnapNode(this:any, on:boolean){
    this.tools.addSnapNode = on;
    if (on){
      this.tools.addFreeNode = false;
      this.tools.placeStagedId = null;
      this.tools.placeStagedSnapId = null;
      this.tools.editDefaults = false;
      this.tools.addLink = false;
      this.tools.addTrack = false;
      this.setCurrentEditState("add-snap-node");
    } else if (!this.tools.addFreeNode && !this.tools.placeStagedId && !this.tools.placeStagedSnapId && !this.tools.addLink && !this.tools.addTrack){
      this.setCurrentEditState("none");
    }
  },
  setPlaceStaged(this:any, id: string | null) {
    this.tools.placeStagedId = id;
    if (id) {
      this.tools.addFreeNode = false;
      this.tools.addSnapNode = false;
      this.tools.placeStagedSnapId = null;
      this.tools.editDefaults = false;
      this.tools.addLink = false;
      this.tools.addTrack = false;
      this.setCurrentEditState("place-stashed-node");
    } else if (!this.tools.addFreeNode && !this.tools.addSnapNode && !this.tools.placeStagedSnapId && !this.tools.addLink && !this.tools.addTrack) {
      this.setCurrentEditState("none");
    }
  },
  setPlaceStagedSnap(this:any, id:string|null){
    this.tools.placeStagedSnapId = id;
    if (id){
      this.tools.placeStagedId = null;
      this.tools.addFreeNode = false;
      this.tools.addSnapNode = false;
      this.tools.addLink = false;
      this.tools.addTrack = false;
      this.setCurrentEditState("place-stashed-snap-node");
    } else if (!this.tools.addFreeNode && !this.tools.addSnapNode && !this.tools.placeStagedId && !this.tools.addLink && !this.tools.addTrack){
      this.setCurrentEditState("none");
    }
  },
  setEditDefaults(this:any, on: boolean) {
    this.tools.editDefaults = on;
    if (on) { this.tools.addFreeNode = false; this.tools.placeStagedId = null; this.tools.addLink = false; this.setCurrentEditState("none"); }
  },
  setAddLink(this:any, on:boolean){
    this.tools.addLink = on;
    if (on) {
      this.tools.addFreeNode = false;
      this.tools.addSnapNode = false;
      this.tools.placeStagedId = null;
      this.tools.placeStagedSnapId = null;
      this.tools.editDefaults = false;
      this.tools.addTrack = false;
      this.setCurrentEditState("add-link");
    } else if (!this.tools.addFreeNode && !this.tools.addSnapNode && !this.tools.placeStagedId && !this.tools.placeStagedSnapId && !this.tools.addTrack) {
      this.setCurrentEditState("none");
    }
  },
  setAddTrack(this:any, on:boolean){
    this.tools.addTrack = on;
    if (on) {
      this.tools.addFreeNode = false;
      this.tools.addSnapNode = false;
      this.tools.placeStagedId = null;
      this.tools.placeStagedSnapId = null;
      this.tools.editDefaults = false;
      this.tools.addLink = false;
      this.setCurrentEditState("add-track");
    } else if (!this.tools.addFreeNode && !this.tools.addSnapNode && !this.tools.placeStagedId && !this.tools.placeStagedSnapId && !this.tools.addLink){
      this.setCurrentEditState("none");
    }
  },
  setAddCalcGroup(this:any, on:boolean){
    this.tools.addCalcGroup = on;
    if (on){
      this.tools.addFreeNode = false;
      this.tools.addSnapNode = false;
      this.tools.placeStagedId = null;
      this.tools.placeStagedSnapId = null;
      this.tools.addLink = false;
      this.tools.addTrack = false;
      this.setCurrentEditState("add-calc-group");
      this.startCalcGroupPlacement?.(this.groupDraft?.type || "horizontal-lines");
    } else {
      this.cancelCalcGroupPlacement?.();
      if (!this.tools.addFreeNode && !this.tools.addSnapNode && !this.tools.placeStagedId && !this.tools.placeStagedSnapId && !this.tools.addLink && !this.tools.addTrack){
        this.setCurrentEditState("none");
      }
    }
  },
  closeAddPanel(this:any){ this.resetTools(); },
  setLinkLasso(this:any, on:boolean){
    this.tools.linkLasso = on;
    if (on){
      // turn off other mutually exclusive tools
      this.setAddLink(false);
      this.setAddFreeNode(false);
      this.setAddSimNode?.(false);
      this.setAddSnapNode(false);
      this.setAddTrack(false);
      this.setAddCalcGroup(false);
      this.setPlaceStaged(null);
      this.setPlaceStagedSnap(null);
    }
  },
  setLinkCutter(this:any, on:boolean){             // NEW
    this.tools.linkCutter = on;
    if (on){
      // turn off other mutually exclusive tools
      this.setAddLink(false);
      this.setAddFreeNode(false);
      this.setAddSimNode?.(false);
      this.setAddSnapNode(false);
      this.setAddTrack(false);
      this.setAddCalcGroup(false);
      this.setPlaceStaged(null);
      this.setPlaceStagedSnap(null);
      this.tools.linkLasso = false; // mutually exclusive
    }
  },
  resetTools(this:any){
    this.tools.addFreeNode = false;
    this.tools.addSimNode = false;
    this.tools.addSnapNode = false;
    this.tools.addLink = false;
    this.tools.linkLasso = false;
    this.tools.linkCutter = false;                 // NEW
    this.tools.addTrack = false;
    this.tools.addCalcGroup = false;
    this.tools.placeStaged = null;
    this.tools.placeStagedSnap = null;
    this.currentEditState = "none";
  },
  setPanelOpen(this:any, key: "settings", on: boolean) {
    if (!this.panels) this.panels = { settingsOpen: false };
    if (key === "settings") this.panels.settingsOpen = !!on;
  },

  setMode(this:any, mode: UIMode) {
    this.currentMode = mode;
    this.setCanEditStructure(mode === "edit");
    // Allow discovery interactions when discovery drawer active
    this.policy.canDiscover = (mode === "discovery");
  },
  setAddSimNode(this:any, on:boolean){
    this.setAddFreeNode(on);
    this.tools.addSimNode = on;
  },
};