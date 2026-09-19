import * as THREE from 'three';

export function buildDiorama(scene, renderer) {
  // ==========================================
  // 1. PROCEDURAL TEXTURES
  // ==========================================
  function createCanvasTex(w, h, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    if (renderer) {
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  const concreteTex = createCanvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0,0,w,h); // Lighter floor for shadows
    for(let i=0; i<8000; i++) {
      ctx.fillStyle = `rgba(${180+Math.random()*40},${180+Math.random()*40},${190+Math.random()*40},0.1)`;
      ctx.fillRect(Math.random()*w, Math.random()*h, Math.random()*3, Math.random()*3);
    }
    for(let i=0; i<30; i++) {
      const r = Math.random()*50+20;
      const grad = ctx.createRadialGradient(0,0,0,0,0,r);
      grad.addColorStop(0, 'rgba(50,50,55,0.04)'); grad.addColorStop(1, 'rgba(50,50,55,0)');
      ctx.save(); ctx.translate(Math.random()*w, Math.random()*h);
      ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  });
  concreteTex.repeat.set(4, 4);

  const wallTex = createCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#cbd5e1'; ctx.fillRect(0,0,w,h); // Lighter walls
    for(let y=0; y<h; y+=8) {
      ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(0, y, w, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(0, y+2, w, 1);
    }
  });
  wallTex.repeat.set(8, 2);

  const cardboardTex = createCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d4a373'; ctx.fillRect(0,0,w,h);
    for(let y=0; y<h; y+=2) {
      ctx.fillStyle = 'rgba(0,0,0,0.03)'; ctx.fillRect(0, y, w, 1);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(0, h/2 - 10, w, 20); // tape
    // random print
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(30, 30, 40, 40);
    for(let i=0; i<5; i++) ctx.fillRect(30, 80 + i*10, 80, 5);
  });

  const woodTex = createCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#bb9060'; ctx.fillRect(0,0,w,h);
    for(let x=0; x<w; x+=16) {
      ctx.fillStyle = 'rgba(60,30,10,0.15)'; ctx.fillRect(x, 0, 2, h);
    }
    for(let i=0; i<100; i++) {
      ctx.strokeStyle = `rgba(50,20,0,${Math.random()*0.2})`;
      ctx.beginPath(); ctx.moveTo(0, Math.random()*h); 
      ctx.bezierCurveTo(w/3, Math.random()*h, w*0.66, Math.random()*h, w, Math.random()*h);
      ctx.stroke();
    }
  });

  // ==========================================
  // 2. MATERIALS
  // ==========================================
  const MAT = {
    floor: new THREE.MeshStandardMaterial({ map: concreteTex, roughness: 0.9, metalness: 0.0 }),
    wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: 1.0, metalness: 0.0 }),
    base: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 }),
    steelDark: new THREE.MeshStandardMaterial({ color: 0x3a3835, roughness: 0.8, metalness: 0.5 }),
    steelLight: new THREE.MeshStandardMaterial({ color: 0x7a8088, roughness: 0.6, metalness: 0.6 }),
    rackBlue: new THREE.MeshStandardMaterial({ color: 0x1f3c5d, roughness: 0.7, metalness: 0.4 }),
    rackOrange: new THREE.MeshStandardMaterial({ color: 0xb55a30, roughness: 0.7, metalness: 0.4 }),
    cardboard: new THREE.MeshStandardMaterial({ map: cardboardTex, color: 0xc8b498, roughness: 0.95 }),
    wood: new THREE.MeshStandardMaterial({ map: woodTex, color: 0x9b856e, roughness: 0.9 }),
    barrelBlue: new THREE.MeshStandardMaterial({ color: 0x2a5474, roughness: 0.5, metalness: 0.4 }),
    barrelGreen: new THREE.MeshStandardMaterial({ color: 0x3d6645, roughness: 0.5, metalness: 0.4 }),
    barrelRed: new THREE.MeshStandardMaterial({ color: 0x9a3630, roughness: 0.5, metalness: 0.4 }),
    lineWhite: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -1 })
  };

  // ==========================================
  // 3. DIORAMA BASE & STRUCTURE
  // ==========================================
  const diorama = new THREE.Group();
  scene.add(diorama);

  const dimX = 54;
  const dimZ = 24;
  const wallH = 8;

  // Thick base plate
  const baseGeo = new THREE.BoxGeometry(dimX + 1, 1, dimZ + 1);
  const base = new THREE.Mesh(baseGeo, MAT.base);
  base.position.y = -0.52; // Shifted slightly lower to prevent Z-fighting with floor at y=0
  diorama.add(base);
  
  // Concrete floor
  const floorGeo = new THREE.PlaneGeometry(dimX, dimZ);
  const floor = new THREE.Mesh(floorGeo, MAT.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  diorama.add(floor);

  // Back Wall
  const wallBack = new THREE.Mesh(new THREE.BoxGeometry(dimX, wallH, 0.4), MAT.wall);
  wallBack.position.set(0, wallH/2, -dimZ/2 - 0.2);
  wallBack.receiveShadow = true; wallBack.castShadow = true;
  diorama.add(wallBack);

  // Left Wall
  const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, wallH, dimZ), MAT.wall);
  wallLeft.position.set(-dimX/2 - 0.2, wallH/2, 0);
  wallLeft.receiveShadow = true; wallLeft.castShadow = true;
  diorama.add(wallLeft);

  // Glass Material for enclosing the warehouse
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xaaccff, // Slight architectural blue tint
    metalness: 0.2,
    roughness: 0.1,
    transmission: 0.6, // Not fully transparent so it acts like real glass
    transparent: true,
    opacity: 0.3,
    depthWrite: false, // Fixes messy overlapping artifacts
    side: THREE.DoubleSide
  });

  // Right Wall (Glass)
  const wallRight = new THREE.Mesh(new THREE.BoxGeometry(0.4, wallH, dimZ), glassMat);
  wallRight.position.set(dimX/2 + 0.2, wallH/2, 0);
  wallRight.receiveShadow = true;
  diorama.add(wallRight);

  // Front Wall (Glass)
  const wallFront = new THREE.Mesh(new THREE.BoxGeometry(dimX, wallH, 0.4), glassMat);
  wallFront.position.set(0, wallH/2, dimZ/2 + 0.2);
  wallFront.receiveShadow = true;
  diorama.add(wallFront);

  // Roof (Glass)
  const roofHeight = dimX * (2.5 / 24);
  const roofW = Math.hypot(dimX/2 + 0.4, roofHeight);
  
  const roofL = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.1, dimZ + 0.8), glassMat);
  roofL.position.set(-dimX/4 - 0.1, wallH + roofHeight/2 + 0.1, 0);
  roofL.rotation.z = Math.atan2(roofHeight, dimX/2);
  diorama.add(roofL);

  const roofR = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.1, dimZ + 0.8), glassMat);
  roofR.position.set(dimX/4 + 0.1, wallH + roofHeight/2 + 0.1, 0);
  roofR.rotation.z = -Math.atan2(roofHeight, dimX/2);
  diorama.add(roofR);

  // Roll-up door on left wall
  const doorW = 4, doorH = 5;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.5, doorH, doorW), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.6 }));
  door.position.set(-dimX/2 - 0.15, doorH/2, 4);
  diorama.add(door);
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.6, doorH + 0.2, doorW + 0.4), MAT.steelDark);
  doorFrame.position.set(-dimX/2 - 0.2, doorH/2 + 0.1, 4);
  diorama.add(doorFrame);

  // Roof Trusses
  function createTruss(zPos) {
    const g = new THREE.Group();
    const span = dimX;
    const bottomChord = new THREE.Mesh(new THREE.BoxGeometry(span, 0.2, 0.2), MAT.steelDark);
    bottomChord.position.set(0, wallH, zPos);
    
    const roofHeight = dimX * (2.5 / 24); 
    
    const topChordL = new THREE.Mesh(new THREE.BoxGeometry(span/2 + 0.2, 0.2, 0.2), MAT.steelDark);
    topChordL.position.set(-span/4, wallH + roofHeight/2, zPos);
    topChordL.rotation.z = Math.atan2(roofHeight, span/2);
    
    const topChordR = new THREE.Mesh(new THREE.BoxGeometry(span/2 + 0.2, 0.2, 0.2), MAT.steelDark);
    topChordR.position.set(span/4, wallH + roofHeight/2, zPos);
    topChordR.rotation.z = -Math.atan2(roofHeight, span/2);
    
    const centerVert = new THREE.Mesh(new THREE.BoxGeometry(0.15, roofHeight, 0.15), MAT.steelDark);
    centerVert.position.set(0, wallH + roofHeight/2, zPos);
    
    g.add(bottomChord, topChordL, topChordR, centerVert);
    
    // Columns
    const colL = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallH, 0.3), MAT.steelDark);
    colL.position.set(-span/2, wallH/2, zPos);
    const colR = new THREE.Mesh(new THREE.BoxGeometry(0.3, wallH, 0.3), MAT.steelDark);
    colR.position.set(span/2, wallH/2, zPos);
    g.add(colL, colR);
    
    g.traverse(c => { if(c.isMesh) c.castShadow = true; });
    return g;
  }

  for(let z = -dimZ/2 + 1; z <= dimZ/2 - 1; z += 4.5) {
    diorama.add(createTruss(z));
  }
  // Roof purlins connecting trusses
  for(let x = -dimX/2 + 2; x <= dimX/2 - 2; x += 3) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, dimZ - 2), MAT.steelDark);
    const roofHeight = dimX * (2.5 / 24);
    const yOffset = roofHeight - Math.abs(x) * (roofHeight / (dimX/2));
    p.position.set(x, wallH + yOffset - 0.1, 0);
    p.castShadow = true;
    diorama.add(p);
  }

  // Floor Markings
  function addLine(x, z, w, d) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(w, d), MAT.lineWhite);
    line.rotation.x = -Math.PI/2;
    line.position.set(x, 0, z);
    diorama.add(line);
  }
  // Staging area box
  addLine(-2, 5, 12, 0.1);
  addLine(-2, 9, 12, 0.1);
  addLine(-8, 7, 0.1, 4);
  addLine(4, 7, 0.1, 4);

  // ==========================================
  // 4. PALLET RACKS & INVENTORY
  // ==========================================
  const rng = () => Math.random();
  const rnd = (min, max) => min + rng() * (max - min);
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];

  function createRackRow(startX, startZ, bays, isDouble=false) {
    const group = new THREE.Group();
    const bayW = 2.4;
    const rackD = 1.0;
    const levels = [0.2, 1.8, 3.4, 5.0];
    const postGeo = new THREE.BoxGeometry(0.1, 6.0, 0.1);
    const beamGeo = new THREE.BoxGeometry(bayW - 0.1, 0.15, 0.1);
    
    const depths = isDouble ? [-rackD/2, rackD/2] : [0];
    
    depths.forEach(dz => {
      // Uprights
      for(let i=0; i<=bays; i++) {
        const x = i * bayW;
        const post1 = new THREE.Mesh(postGeo, MAT.rackBlue);
        post1.position.set(x, 3.0, dz - rackD/2);
        const post2 = new THREE.Mesh(postGeo, MAT.rackBlue);
        post2.position.set(x, 3.0, dz + rackD/2);
        
        // cross braces
        for(let j=0; j<4; j++) {
          const brace = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.05), MAT.rackBlue);
          brace.position.set(x, 0.8 + j*1.3, dz);
          brace.rotation.x = (j%2===0) ? 0.7 : -0.7;
          group.add(brace);
        }
        group.add(post1, post2);
      }
      
      // Beams and Inventory
      for(let i=0; i<bays; i++) {
        const x = i * bayW + bayW/2;
        levels.forEach(y => {
          const beam1 = new THREE.Mesh(beamGeo, MAT.rackOrange);
          beam1.position.set(x, y, dz - rackD/2);
          const beam2 = new THREE.Mesh(beamGeo, MAT.rackOrange);
          beam2.position.set(x, y, dz + rackD/2);
          group.add(beam1, beam2);
          
          // Populate slot
          populateSlot(group, x, y + 0.08, dz, bayW - 0.2, rackD);
        });
      }
    });
    
    group.position.set(startX, 0, startZ);
    group.traverse(c => { if(c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    diorama.add(group);
  }

  // Reusable geometries
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const barrelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.9, 16);
  const palletGeo = new THREE.BoxGeometry(1.2, 0.15, 1.0);

  function populateSlot(parent, x, y, z, width, depth) {
    const r = rng();
    if (r < 0.1) return; // 10% empty
    
    // Always add a wood pallet base
    const pallet = new THREE.Mesh(palletGeo, MAT.wood);
    pallet.position.set(x, y + 0.075, z);
    parent.add(pallet);
    const baseY = y + 0.15;
    
    if (r < 0.5) {
      // Boxes
      const boxCount = Math.floor(rnd(2, 6));
      let curY = baseY;
      for(let i=0; i<boxCount; i++) {
        const bh = rnd(0.3, 0.6);
        const box = new THREE.Mesh(boxGeo, MAT.cardboard);
        box.scale.set(rnd(0.6, 1.0), bh, rnd(0.6, 0.9));
        box.position.set(x + rnd(-0.1, 0.1), curY + bh/2, z + rnd(-0.05, 0.05));
        box.rotation.y = rnd(-0.1, 0.1);
        parent.add(box);
        curY += bh;
      }
    } else if (r < 0.8) {
      // Barrels (2x2 grid)
      const barrelMats = [MAT.barrelBlue, MAT.barrelGreen, MAT.barrelRed];
      const mat = pick(barrelMats);
      const offsets = [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]];
      offsets.forEach(off => {
        if(rng() < 0.2) return; // sometimes missing a barrel
        const barrel = new THREE.Mesh(barrelGeo, mat);
        barrel.position.set(x + off[0], baseY + 0.45, z + off[1]);
        parent.add(barrel);
      });
    } else {
      // Large wooden crate
      const crate = new THREE.Mesh(boxGeo, MAT.wood);
      const ch = rnd(0.8, 1.2);
      crate.scale.set(1.1, ch, 0.9);
      crate.position.set(x, baseY + ch/2, z);
      parent.add(crate);
    }
  }

  // Create 2 longer rows of racks (each is 20 bays = 48m long)
  // Removing half the racks to create a large open staging area in the front
  createRackRow(-24, -8, 20, true); // Double deep
  createRackRow(-24, -0.5, 20, true); // Double deep

  // ==========================================
  // 5. FLOOR DETAILS (Staging area, props)
  // ==========================================

  // Stack of empty pallets
  for(let i=0; i<8; i++) {
    const p = new THREE.Mesh(palletGeo, MAT.wood);
    p.position.set(-15, 0.075 + i*0.15, 8);
    p.rotation.y = 0.1;
    p.castShadow = true; p.receiveShadow = true;
    diorama.add(p);
  }
  for(let i=0; i<6; i++) {
    const p = new THREE.Mesh(palletGeo, MAT.wood);
    p.position.set(-13.5, 0.075 + i*0.15, 8.5);
    p.rotation.y = -0.15;
    p.castShadow = true; p.receiveShadow = true;
    diorama.add(p);
  }

  // Electrical / Utility box on back wall
  const utilBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.4), MAT.steelLight);
  utilBox.position.set(-4, 1.5, -9.8);
  utilBox.castShadow = true;
  diorama.add(utilBox);
  const utilPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6), MAT.steelLight);
  utilPipe.position.set(-3.7, 4, -9.8);
  diorama.add(utilPipe);

  // Add a ladder leaning on rack
  const ladder = new THREE.Group();
  const railG = new THREE.BoxGeometry(0.05, 3.5, 0.05);
  const lRail = new THREE.Mesh(railG, MAT.steelDark); lRail.position.x = -0.25;
  const rRail = new THREE.Mesh(railG, MAT.steelDark); rRail.position.x = 0.25;
  ladder.add(lRail, rRail);
  for(let i=-1.5; i<=1.5; i+=0.4) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.03), MAT.steelDark);
    step.position.y = i;
    ladder.add(step);
  }
  ladder.position.set(3, 1.6, -3.2);
  ladder.rotation.x = -0.3;
  ladder.rotation.y = -0.2;
  ladder.traverse(c => { if(c.isMesh) c.castShadow = true; });
  diorama.add(ladder);

  return diorama;
}
