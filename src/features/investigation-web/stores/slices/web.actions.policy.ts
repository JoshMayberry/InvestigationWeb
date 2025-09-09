export const policyActions = {
  setCurrentEditState(this:any, s: "none" | "add-free-node" | "add-link" | "place-stashed-node" | "drag-free-node" | "edit-selected-node") {
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
    if (on) { this.tools.placeStagedId = null; this.tools.editDefaults = false; this.tools.addLink = false; this.setCurrentEditState("add-free-node"); }
    else if (!this.tools.placeStagedId && !this.tools.addLink) this.setCurrentEditState("none");
  },
  setPlaceStaged(this:any, id: string | null) {
    this.tools.placeStagedId = id;
    if (id) { this.tools.addFreeNode = false; this.tools.editDefaults = false; this.tools.addLink = false; this.setCurrentEditState("place-stashed-node"); }
    else if (!this.tools.addFreeNode && !this.tools.addLink) this.setCurrentEditState("none");
  },
  setEditDefaults(this:any, on: boolean) {
    this.tools.editDefaults = on;
    if (on) { this.tools.addFreeNode = false; this.tools.placeStagedId = null; this.tools.addLink = false; this.setCurrentEditState("none"); }
  },
  setAddLink(this:any, on:boolean){
    this.tools.addLink = on;
    if (on) { this.tools.addFreeNode = false; this.tools.placeStagedId = null; this.tools.editDefaults = false; this.setCurrentEditState("add-link"); }
    else if (!this.tools.addFreeNode && !this.tools.placeStagedId) this.setCurrentEditState("none");
  },
  closeAddPanel(this:any){ this.resetTools(); },
  resetTools(this:any){
    this.tools.addFreeNode = false;
    this.tools.placeStagedId = null;
    this.tools.editDefaults = false;
    this.tools.addLink = false;
    this.setCurrentEditState("none");
  },
};