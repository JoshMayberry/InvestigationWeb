export const simulationActions = {
  updateSimSettings(this:any, p:any){
    this.simulation = { ...this.simulation, ...p };
    if (!this.simulation.running) this.simulation.alpha = Math.min(1, Math.max(0, this.simulation.alpha));
  },
  startSimulation(this:any){
    if (this.simulation.running) return;
    this.simulation.running = true;
    this._kickSim();
  },
  stopSimulation(this:any){
    this.simulation.running = false;
  },
  toggleSimulation(this:any){
    this.simulation.running ? this.stopSimulation() : this.startSimulation();
  },
  _kickSim(this:any){
    if (!this.simulation.running) return;
    requestAnimationFrame(()=> {
      this._simTick();
      this._kickSim();
    });
  },
  _simTick(this:any){
    const S = this.simulation;
    if (!S.running) return;
    if (S.alpha < 0.005){ S.running=false; return; }

    const sims = this.nodes.filter((n:any)=> n.kind==='free' && n.sim?.enabled);
    if (!sims.length){ S.running=false; return; }

    // Prep velocities / zero forces
    for (let i=0;i<sims.length;i++){
      const n = sims[i];
      n._simIdx = i; // temp index for neighbor filtering
      n.sim.vx = n.sim.vx || 0;
      n.sim.vy = n.sim.vy || 0;
      n.sim.fx = 0; n.sim.fy = 0;
    }

    // ---- Spatial grid (broad-phase) ----
    const cellSize = S.cellSize || 180;
    const grid = new Map<string, any[]>();
    for (const n of sims){
      const ix = Math.floor(n.x / cellSize);
      const iy = Math.floor(n.y / cellSize);
      const k = ix + "," + iy;
      let bucket = grid.get(k);
      if (!bucket){ bucket = []; grid.set(k, bucket); }
      bucket.push(n);
    }

    // ---- Node attraction / repulsion (localized) ----
    for (const n of sims){
      const ix = Math.floor(n.x / cellSize);
      const iy = Math.floor(n.y / cellSize);

      for (let gx = ix-1; gx <= ix+1; gx++){
        for (let gy = iy-1; gy <= iy+1; gy++){
          const bucket = grid.get(gx + "," + gy);
            if (!bucket) continue;
          for (const m of bucket){
            if (m._simIdx <= n._simIdx) continue; // avoid duplicates

            // Early skip if both neutral
            const aNeutral = (n.sim.attraction ?? 0) === 0 && !(n.sim.colorAttractions && n.sim.colorAttractions.length);
            const bNeutral = (m.sim.attraction ?? 0) === 0 && !(m.sim.colorAttractions && m.sim.colorAttractions.length);
            if (aNeutral && bNeutral) continue;

            let dx = m.x - n.x;
            let dy = m.y - n.y;
            let d2 = dx*dx + dy*dy;
            if (d2 < 1) d2 = 1;
            const d = Math.sqrt(d2);
            dx /= d; dy /= d;

            const aAttr = this.resolveAttraction(n, m);
            const bAttr = this.resolveAttraction(m, n);

            if (aAttr){
              const f = aAttr / Math.max(40, d);
              n.sim.fx += f * dx;
              n.sim.fy += f * dy;
              m.sim.fx -= f * dx;
              m.sim.fy -= f * dy;
            }
            if (bAttr){
              const f2 = bAttr / Math.max(40, d);
              m.sim.fx -= f2 * dx;
              m.sim.fy -= f2 * dy;
              n.sim.fx += f2 * dx;
              n.sim.fy += f2 * dy;
            }
          }
        }
      }
    }

    // ---- Link forces (straight-line, map lookup) ----
    const nodeById:any = Object.create(null);
    for (const n of sims) nodeById[n.id] = n;

    for (const l of this.links){
      if (!l.sim?.enabled) continue;
      const a = nodeById[l.from];
      const b = nodeById[l.to];
      if (!a || !b) continue;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist2 = dx*dx + dy*dy;
      if (dist2 < 0.0001) dist2 = 0.0001;
      const dist = Math.sqrt(dist2);
      dx /= dist; dy /= dist;
      const rest = l.sim.restLength ?? 160;
      const diff = dist - rest;
      const stiff = diff >= 0 ? (l.sim.tension ?? 0.05) : (l.sim.compression ?? 0.05);
      let force = stiff * diff;
      const maxF = l.sim.maxForce ?? 10;
      if (force > maxF) force = maxF;
      else if (force < -maxF) force = -maxF;
      a.sim.fx += force * dx;
      a.sim.fy += force * dy;
      b.sim.fx -= force * dx;
      b.sim.fy -= force * dy;
    }

    // ---- Clamp per-node net force ----
    for (const n of sims){
      const mF = n.sim?.maxForce ?? 50;
      const fx = n.sim.fx, fy = n.sim.fy;
      const fmag = Math.hypot(fx, fy);
      if (fmag > mF){
        const s = mF / fmag;
        n.sim.fx = fx * s;
        n.sim.fy = fy * s;
      }
    }

    // ---- Gravity / center ----
    if (S.center){
      let cx=0, cy=0;
      for (const n of sims){ cx += n.x; cy += n.y; }
      cx /= sims.length; cy /= sims.length;
      const gX = (S.gravityX||0);
      const gY = (S.gravityY||0);
      for (const n of sims){
        n.sim.fx += ( gX - (cx - n.x) * 0.001 );
        n.sim.fy += ( gY - (cy - n.y) * 0.001 );
      }
    } else {
      const gX = (S.gravityX||0);
      const gY = (S.gravityY||0);
      for (const n of sims){
        n.sim.fx += gX;
        n.sim.fy += gY;
      }
    }

    // ---- Integrate ----
    const vd = 1 - S.velocityDecay;
    const alpha = S.alpha;
    for (const n of sims){
      if (n.sim.dragging){
        // While dragging, freeze forces & velocity
        n.sim.fx = 0; n.sim.fy = 0;
        n.sim.vx = 0; n.sim.vy = 0;
        delete n._simIdx;
        continue;
      }
      // In integration loop replace velocity update with mass-aware:
      const mass = (()=> {
        if (n.sim.useRadiusMass){
          const scale = n.sim.massScale ?? 1;
          const r = n.r || 12;
            return Math.max( (r*r) * scale * 0.02, 0.001);
        }
        return Math.max(n.sim.mass ?? 1, 0.001);
      })();
      n.sim.vx = (n.sim.vx + (n.sim.fx / mass) * alpha) * vd;
      n.sim.vy = (n.sim.vy + (n.sim.fy / mass) * alpha) * vd;
      n.x += n.sim.vx;
      n.y += n.sim.vy;
      delete n._simIdx;
    }

    S.alpha = Math.max(0, S.alpha - S.alphaDecay);

    if (sims.some((n:any)=> n.sim?.dragging)){
      S.alpha = Math.max(S.alpha, S.minAlphaOnInteract || 0.25);
    }
  },
  resolveAttraction(src:any, other:any){
    const base = src.sim?.attraction ?? 0;
    const list = src.sim?.colorAttractions || [];
    if (!other || !other.color || !list.length) return base;
    const ent = list.find((c:any)=> c.color?.toLowerCase() === other.color?.toLowerCase());
    return ent ? ent.force : base;
  }
};