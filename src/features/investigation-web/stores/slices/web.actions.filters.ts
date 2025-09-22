export const filterActions = {
  setFilterQuery(this:any, q: string) { this.filters.query = q ?? ""; },

  toggleFilterColor(this:any, c: string) {
    const arr: string[] = this.filters.colors;
    const i = arr.indexOf(c);
    if (i === -1) arr.push(c); else arr.splice(i, 1);
  },

  setAllFilterColors(this:any, on:boolean, allColors:string[]) {
    this.filters.colors = on ? allColors.slice() : [];
  },

  toggleFilterExtraValue(this:any, key:string, value:string) {
    if (!key) return;
    const map: Record<string, string[]> = this.filters.extra;
    const sel = map[key] || (map[key] = []);
    const i = sel.indexOf(value);
    if (i === -1) sel.push(value); else sel.splice(i, 1);
    // prune empty arrays to keep state tidy (optional)
    if (sel.length === 0) delete map[key];
  },

  setAllFilterExtraValues(this:any, key:string, on:boolean, allValues:string[]) {
    if (!key) return;
    if (on) this.filters.extra[key] = allValues.slice();
    else delete this.filters.extra[key];
  },

  toggleSearchTarget(this:any, name:'label'|'description'|'bonus') {
    this.filters.searchTargets[name] = !this.filters.searchTargets[name];
  },

  toggleSearchTargetExtra(this:any, key:string) {
    const ex = this.filters.searchTargets.extras;
    ex[key] = !ex[key];
  },

  clearFilters(this:any) {
    this.filters.query = "";
    this.filters.colors = [];
    this.filters.extra = {};
    // leave searchTargets as-is so user prefs persist
  },
};