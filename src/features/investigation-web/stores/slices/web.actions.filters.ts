export const filterActions = {
  setFilterQuery(this:any, q: string) { this.filters.query = q; },
  toggleFilterColor(this:any, c: string) {
    const i = this.filters.colors.indexOf(c);
    if (i === -1) this.filters.colors.push(c); else this.filters.colors.splice(i, 1);
  },
  clearFilters(this:any) { this.filters.query = ""; this.filters.colors = []; },
};