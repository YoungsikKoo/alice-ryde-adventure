/* ================================================================
   MapTiles — 8-bit Pixel Art Map Decoration System
   Pre-rendered tile sprites for side-scroll and top-down stages.
   All art uses limited palette, 2x2 pixel grid for authentic 8-bit feel.
   ================================================================ */
var MapTiles={
_cache:{},
_inited:false,

init(){
  if(this._inited)return;
  this._inited=true;
  this._buildAll();
},

/* ===== GET pre-rendered canvas ===== */
get(name){return this._cache[name]||null},

/* ===== DRAW helpers ===== */
px(ctx,x,y,s,c){ctx.fillStyle=c;ctx.fillRect(x,y,s,s)},

/* ===== 8-BIT SKY — banded horizontal stripes with dithering ===== */
drawSky(ctx,type,w,h){
  const bands={
    street:[
      [0,0.15,"#5080c0"],[0.15,0.35,"#6090d0"],[0.35,0.55,"#70a0e0"],
      [0.55,0.75,"#87ceeb"],[0.75,0.9,"#a0d8f0"],[0.9,1.0,"#b8e0f8"]
    ],
    overpass:[
      [0,0.1,"#4070b0"],[0.1,0.3,"#5080c0"],[0.3,0.5,"#6898d0"],
      [0.5,0.7,"#87ceeb"],[0.7,0.85,"#a0d0e8"],[0.85,1.0,"#b8d8f0"]
    ],
    park:[
      [0,0.15,"#6098d0"],[0.15,0.35,"#78b0e0"],[0.35,0.55,"#87ceeb"],
      [0.55,0.7,"#a0d8b0"],[0.7,0.85,"#b8e4a0"],[0.85,1.0,"#7acc6f"]
    ]
  };
  const b=bands[type]||bands.street;
  for(const[t,bt,c]of b){
    ctx.fillStyle=c;
    ctx.fillRect(0,Math.floor(t*h),w,Math.ceil((bt-t)*h)+1);
  }
  /* dithering between bands */
  for(let i=0;i<b.length-1;i++){
    const y=Math.floor(b[i][1]*h);
    const c1=b[i][2],c2=b[i+1][2];
    for(let dy=-2;dy<=2;dy++){
      for(let dx=0;dx<w;dx+=4){
        if((dx+dy)%8<4){
          ctx.fillStyle=c1;
        }else{
          ctx.fillStyle=c2;
        }
        ctx.fillRect(dx,y+dy,2,2);
      }
    }
  }
},

/* ===== 8-BIT CLOUD ===== */
drawCloud(ctx,x,y,w,h){
  const c1="#f0f0f0",c2="#e0e0e8",c3="#ffffff";
  /* main body */
  ctx.fillStyle=c1;
  ctx.fillRect(x+4,y,w-8,h);
  ctx.fillRect(x,y+4,w,h-4);
  /* top puff */
  ctx.fillStyle=c3;
  ctx.fillRect(x+8,y-4,w-16,6);
  ctx.fillRect(x+4,y,w-8,4);
  /* shadow bottom */
  ctx.fillStyle=c2;
  ctx.fillRect(x+2,y+h-4,w-4,4);
  /* pixel detail */
  ctx.fillStyle=c3;
  ctx.fillRect(x+6,y+2,4,2);
  ctx.fillRect(x+w-12,y+2,4,2);
},

/* ===== BUILDING FACADE (side-scroll) ===== */
_buildBuilding(w,h,brickColor,roofColor,winColor){
  const cv=document.createElement("canvas");
  cv.width=w;cv.height=h;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  /* base bricks */
  c.fillStyle=brickColor;
  c.fillRect(0,0,w,h);
  /* brick pattern */
  const bc2=this._darken(brickColor,20);
  c.fillStyle=bc2;
  for(let by=0;by<h;by+=8){
    const off=(by%16===0)?0:4;
    for(let bx=off;bx<w;bx+=8){
      c.fillRect(bx,by+7,8,1);
    }
    for(let bx=0;bx<w;bx+=8){
      const gx=bx+((by%16===0)?0:4);
      c.fillRect(gx,by,1,8);
    }
  }
  /* roof trim */
  c.fillStyle=roofColor;
  c.fillRect(0,0,w,6);
  c.fillRect(-2,4,w+4,4);
  /* windows */
  for(let wy=12;wy<h-16;wy+=20){
    for(let wx=6;wx<w-10;wx+=16){
      /* window frame */
      c.fillStyle="#555";
      c.fillRect(wx-1,wy-1,12,14);
      /* glass */
      c.fillStyle=winColor;
      c.fillRect(wx,wy,10,12);
      /* cross bar */
      c.fillStyle="#777";
      c.fillRect(wx,wy+5,10,2);
      c.fillRect(wx+4,wy,2,12);
      /* highlight */
      c.fillStyle="rgba(255,255,255,0.3)";
      c.fillRect(wx+1,wy+1,4,4);
    }
  }
  return cv;
},

/* ===== TREE (side-scroll) ===== */
_buildTreeSide(){
  const cv=document.createElement("canvas");
  cv.width=32;cv.height=48;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  /* trunk */
  c.fillStyle="#6b4a14";
  c.fillRect(12,28,8,20);
  c.fillStyle="#5a3a0a";
  c.fillRect(14,28,2,20);
  /* canopy layers */
  c.fillStyle="#2a6a1a";
  c.fillRect(2,8,28,22);
  c.fillStyle="#3a8a2a";
  c.fillRect(4,4,24,20);
  c.fillStyle="#4a9a3a";
  c.fillRect(8,0,16,12);
  /* leaf detail pixels */
  c.fillStyle="#5aaa4a";
  c.fillRect(6,6,2,2);c.fillRect(14,2,2,2);c.fillRect(22,8,2,2);
  c.fillRect(10,14,2,2);c.fillRect(18,12,2,2);c.fillRect(8,20,2,2);
  /* shadow on trunk */
  c.fillStyle="rgba(0,0,0,0.15)";
  c.fillRect(12,28,3,18);
  return cv;
},

/* ===== TREE (top-down) ===== */
_buildTreeTop(){
  const cv=document.createElement("canvas");
  cv.width=24;cv.height=24;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  /* shadow */
  c.fillStyle="rgba(0,0,0,0.15)";
  c.fillRect(4,14,18,8);
  /* trunk peek */
  c.fillStyle="#6b4a14";
  c.fillRect(10,12,4,6);
  /* canopy layers */
  c.fillStyle="#2a6a1a";
  c.fillRect(2,2,20,16);
  c.fillStyle="#3a8a2a";
  c.fillRect(4,0,16,14);
  c.fillStyle="#4a9a3a";
  c.fillRect(6,2,12,8);
  /* detail */
  c.fillStyle="#5aaa4a";
  c.fillRect(6,4,2,2);c.fillRect(14,2,2,2);c.fillRect(10,8,2,2);
  return cv;
},

/* ===== BENCH (side-scroll) ===== */
_buildBenchSide(){
  const cv=document.createElement("canvas");
  cv.width=36;cv.height=18;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  /* legs */
  c.fillStyle="#8b6914";
  c.fillRect(4,8,4,10);c.fillRect(28,8,4,10);
  /* seat plank */
  c.fillStyle="#c4a875";
  c.fillRect(2,4,32,6);
  /* plank lines */
  c.fillStyle="#b09060";
  c.fillRect(2,6,32,1);c.fillRect(2,8,32,1);
  /* highlight */
  c.fillStyle="#d4b885";
  c.fillRect(4,4,28,1);
  /* back rest */
  c.fillStyle="#c4a875";
  c.fillRect(4,0,28,4);
  c.fillStyle="#b09060";
  c.fillRect(4,2,28,1);
  return cv;
},

/* ===== BENCH (top-down) ===== */
_buildBenchTop(){
  const cv=document.createElement("canvas");
  cv.width=28;cv.height=12;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  c.fillStyle="#c4a875";
  c.fillRect(0,2,28,8);
  c.fillStyle="#b09060";
  c.fillRect(0,5,28,1);c.fillRect(0,8,28,1);
  c.fillStyle="#8b6914";
  c.fillRect(2,0,4,12);c.fillRect(22,0,4,12);
  c.fillStyle="#d4b885";
  c.fillRect(2,3,24,1);
  return cv;
},

/* ===== SIGN ===== */
_buildSign(text,bgColor,w,h){
  const cv=document.createElement("canvas");
  cv.width=w||48;cv.height=(h||28)+20;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  /* post */
  c.fillStyle="#6b4a14";
  c.fillRect(cv.width/2-2,h||28,4,20);
  /* sign board */
  c.fillStyle=bgColor||"#50c878";
  c.fillRect(0,0,cv.width,h||28);
  /* border */
  c.fillStyle=this._darken(bgColor||"#50c878",30);
  c.fillRect(0,0,cv.width,2);
  c.fillRect(0,(h||28)-2,cv.width,2);
  c.fillRect(0,0,2,h||28);
  c.fillRect(cv.width-2,0,2,h||28);
  /* text */
  c.fillStyle="#fff";
  c.font="bold 7px Courier New";
  c.textAlign="center";
  c.textBaseline="middle";
  c.fillText(text,cv.width/2,(h||28)/2);
  return cv;
},

/* ===== PLATFORM TILES ===== */
_buildPlatform(type){
  const cv=document.createElement("canvas");
  cv.width=16;cv.height=16;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  if(type==="grass"){
    c.fillStyle="#5a9a4f";c.fillRect(0,0,16,16);
    c.fillStyle="#7acc6f";c.fillRect(0,0,16,4);
    c.fillStyle="#6abc5f";c.fillRect(0,4,16,2);
    /* grass blades */
    c.fillStyle="#8adc7f";
    c.fillRect(2,0,2,3);c.fillRect(8,0,2,4);c.fillRect(14,0,1,3);
    /* dirt specks */
    c.fillStyle="#4a8a3f";
    c.fillRect(4,8,2,2);c.fillRect(10,10,2,2);c.fillRect(2,12,2,2);
  }else if(type==="stone"){
    c.fillStyle="#b0b0c0";c.fillRect(0,0,16,16);
    c.fillStyle="#c0c0d0";c.fillRect(0,0,16,3);
    /* stone pattern */
    c.fillStyle="#a0a0b0";
    c.fillRect(0,7,16,1);c.fillRect(8,0,1,7);c.fillRect(4,8,1,8);c.fillRect(12,8,1,8);
    /* highlights */
    c.fillStyle="#c8c8d8";
    c.fillRect(2,2,4,2);c.fillRect(10,10,4,2);
  }else if(type==="wood"){
    c.fillStyle="#c4a875";c.fillRect(0,0,16,16);
    c.fillStyle="#b09060";
    c.fillRect(0,3,16,1);c.fillRect(0,7,16,1);c.fillRect(0,11,16,1);c.fillRect(0,15,16,1);
    /* wood grain */
    c.fillStyle="#d4b885";
    c.fillRect(4,0,1,3);c.fillRect(10,4,1,3);c.fillRect(2,8,1,3);c.fillRect(12,12,1,3);
    /* top edge */
    c.fillStyle="#a08050";c.fillRect(0,0,16,2);
  }else if(type==="dirt"){
    c.fillStyle="#8b6914";c.fillRect(0,0,16,16);
    c.fillStyle="#7a5a10";
    c.fillRect(4,3,2,2);c.fillRect(10,7,2,2);c.fillRect(2,11,2,2);c.fillRect(12,13,2,2);
    c.fillStyle="#9b7924";
    c.fillRect(6,1,2,2);c.fillRect(0,9,2,2);c.fillRect(14,5,2,2);
  }
  return cv;
},

/* ===== GROUND STRIP (side-scroll bottom) ===== */
_buildGround(){
  const cv=document.createElement("canvas");
  cv.width=16;cv.height=48;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  /* grass top */
  c.fillStyle="#7acc6f";c.fillRect(0,0,16,6);
  c.fillStyle="#8adc7f";
  c.fillRect(2,0,2,4);c.fillRect(6,0,1,5);c.fillRect(10,0,2,3);c.fillRect(14,0,1,4);
  /* grass dark edge */
  c.fillStyle="#5a9a4f";c.fillRect(0,5,16,2);
  /* dirt */
  c.fillStyle="#8b6914";c.fillRect(0,7,16,41);
  /* dirt texture */
  c.fillStyle="#7a5a10";
  c.fillRect(4,10,2,2);c.fillRect(10,16,2,2);c.fillRect(2,24,2,2);c.fillRect(12,30,2,2);
  c.fillStyle="#9b7924";
  c.fillRect(8,12,2,2);c.fillRect(0,20,2,2);c.fillRect(14,28,2,2);
  /* rocks */
  c.fillStyle="#a09080";
  c.fillRect(6,36,4,3);c.fillRect(2,42,3,2);
  return cv;
},

/* ===== SPIKE HAZARD ===== */
_buildSpike(){
  const cv=document.createElement("canvas");
  cv.width=8;cv.height=14;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  /* spike shape */
  c.fillStyle="#c05030";
  c.fillRect(3,0,2,2);
  c.fillRect(2,2,4,2);
  c.fillRect(1,4,6,2);
  c.fillRect(0,6,8,8);
  /* highlight */
  c.fillStyle="#e06040";
  c.fillRect(3,2,1,4);
  /* shadow */
  c.fillStyle="#a04020";
  c.fillRect(5,4,2,10);
  return cv;
},

/* ===== PUDDLE ===== */
_buildPuddle(){
  const cv=document.createElement("canvas");
  cv.width=16;cv.height=8;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  c.fillStyle="rgba(60,130,60,0.5)";
  c.fillRect(2,2,12,4);
  c.fillRect(4,0,8,8);
  c.fillStyle="rgba(80,180,80,0.3)";
  c.fillRect(4,2,4,2);
  return cv;
},

/* ===== FALLING ROCK ===== */
_buildRock(){
  const cv=document.createElement("canvas");
  cv.width=16;cv.height=16;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  c.fillStyle="#888";
  c.fillRect(4,2,8,12);c.fillRect(2,4,12,8);
  c.fillStyle="#999";
  c.fillRect(4,4,4,4);
  c.fillStyle="#777";
  c.fillRect(8,8,4,4);
  c.fillStyle="#aaa";
  c.fillRect(6,4,2,2);
  return cv;
},

/* ===== RAILING (overpass) ===== */
_buildRailing(){
  const cv=document.createElement("canvas");
  cv.width=24;cv.height=24;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  /* post */
  c.fillStyle="#8080a0";
  c.fillRect(10,0,4,24);
  /* top bar */
  c.fillStyle="#9090b0";
  c.fillRect(0,0,24,3);
  /* middle bar */
  c.fillStyle="#8888a8";
  c.fillRect(0,10,24,2);
  /* highlight */
  c.fillStyle="#a0a0c0";
  c.fillRect(11,0,1,24);
  c.fillRect(0,0,24,1);
  return cv;
},

/* ===== BRIDGE PILLAR ===== */
_buildBridgePillar(){
  const cv=document.createElement("canvas");
  cv.width=8;cv.height=28;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  c.fillStyle="#9090a8";c.fillRect(1,0,6,28);
  c.fillStyle="#a0a0b8";c.fillRect(2,0,2,28);
  c.fillStyle="#8080a0";c.fillRect(5,0,2,28);
  /* rivets */
  c.fillStyle="#b0b0c8";
  c.fillRect(3,4,2,2);c.fillRect(3,12,2,2);c.fillRect(3,20,2,2);
  return cv;
},

/* ===== LAMP POST ===== */
_buildLampPost(){
  const cv=document.createElement("canvas");
  cv.width=12;cv.height=48;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  /* pole */
  c.fillStyle="#555";c.fillRect(4,12,4,36);
  c.fillStyle="#666";c.fillRect(5,12,1,36);
  /* lamp head */
  c.fillStyle="#666";c.fillRect(1,4,10,8);
  /* lamp glass */
  c.fillStyle="#f0d060";c.fillRect(2,5,8,6);
  /* glow */
  c.fillStyle="rgba(240,208,96,0.2)";c.fillRect(0,0,12,14);
  /* base */
  c.fillStyle="#444";c.fillRect(2,44,8,4);
  return cv;
},

/* ===== CRICKET BALL (8-bit style) ===== */
_buildCricketBall(){
  const cv=document.createElement("canvas");
  cv.width=12;cv.height=12;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  c.fillStyle="#c02020";
  c.fillRect(2,0,8,2);c.fillRect(0,2,12,8);c.fillRect(2,10,8,2);
  c.fillStyle="#e03030";
  c.fillRect(2,2,4,4);
  c.fillStyle="#a01818";
  c.fillRect(6,6,4,4);
  /* seam */
  c.fillStyle="#f8e870";
  c.fillRect(1,5,2,2);c.fillRect(9,5,2,2);
  return cv;
},

/* ===== FOOTBALL GOAL (top-down) ===== */
_buildGoal(){
  const cv=document.createElement("canvas");
  cv.width=32;cv.height=12;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  c.fillStyle="#fff";
  c.fillRect(0,0,2,12);c.fillRect(30,0,2,12);
  c.fillRect(0,0,32,2);
  /* net pattern */
  c.fillStyle="rgba(255,255,255,0.3)";
  for(let x=4;x<30;x+=4)c.fillRect(x,2,1,10);
  for(let y=4;y<12;y+=4)c.fillRect(2,y,28,1);
  return cv;
},

/* ===== CRICKET STUMPS (top-down) ===== */
_buildStumps(){
  const cv=document.createElement("canvas");
  cv.width=10;cv.height=6;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  c.fillStyle="#8b6914";
  c.fillRect(1,0,2,6);c.fillRect(4,0,2,6);c.fillRect(7,0,2,6);
  /* bail */
  c.fillStyle="#c4a875";
  c.fillRect(0,0,10,1);
  return cv;
},

/* ===== CAFE TABLE (top-down) ===== */
_buildCafeTable(){
  const cv=document.createElement("canvas");
  cv.width=16;cv.height=16;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  /* table */
  c.fillStyle="#d4b885";c.fillRect(2,2,12,12);
  c.fillStyle="#c4a875";c.fillRect(3,3,10,10);
  /* chair hint */
  c.fillStyle="#8b6914";
  c.fillRect(6,0,4,2);c.fillRect(6,14,4,2);c.fillRect(0,6,2,4);c.fillRect(14,6,2,4);
  /* cup on table */
  c.fillStyle="#fff";c.fillRect(6,6,4,4);
  c.fillStyle="#8b4513";c.fillRect(7,7,2,2);
  return cv;
},

/* ===== PLAYGROUND EQUIPMENT (top-down) ===== */
_buildPlayground(){
  const cv=document.createElement("canvas");
  cv.width=16;cv.height=16;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  /* slide frame */
  c.fillStyle="#e84855";c.fillRect(2,2,4,12);
  c.fillStyle="#f0d060";c.fillRect(6,0,4,16);
  c.fillStyle="#4a90d9";c.fillRect(10,4,4,8);
  /* details */
  c.fillStyle="#c41e3a";c.fillRect(3,4,2,4);
  c.fillStyle="#d4a820";c.fillRect(7,2,2,4);
  return cv;
},

/* ===== ROAD MARKING (side-scroll) ===== */
_buildRoadMarking(){
  const cv=document.createElement("canvas");
  cv.width=24;cv.height=4;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  c.fillStyle="#e8d040";
  c.fillRect(0,1,20,2);
  c.fillStyle="#f0e060";
  c.fillRect(0,1,20,1);
  return cv;
},

/* ===== WIND LINE ===== */
_buildWindLine(){
  const cv=document.createElement("canvas");
  cv.width=48;cv.height=4;
  const c=cv.getContext("2d");
  c.imageSmoothingEnabled=false;
  c.fillStyle="rgba(180,220,255,0.4)";
  c.fillRect(0,1,48,2);
  c.fillStyle="rgba(200,230,255,0.5)";
  c.fillRect(0,1,24,1);
  return cv;
},

/* ===== BUILD ALL CACHES ===== */
_buildAll(){
  const T=this;
  /* buildings - various styles */
  T._cache.building_brick=T._buildBuilding(80,120,"#c0a890","#8a7860","rgba(180,220,255,0.6)");
  T._cache.building_cream=T._buildBuilding(100,140,"#d4c4b0","#9a8a70","rgba(200,220,240,0.5)");
  T._cache.building_gray=T._buildBuilding(90,100,"#b0b0b8","#808088","rgba(160,200,240,0.5)");
  T._cache.building_tan=T._buildBuilding(70,110,"#c8b8a0","#988870","rgba(180,210,250,0.6)");
  T._cache.building_dark=T._buildBuilding(85,130,"#a09888","#706860","rgba(140,180,220,0.4)");
  /* distant buildings (silhouette) */
  for(let i=0;i<5;i++){
    const cv=document.createElement("canvas");
    cv.width=60+i*20;cv.height=70+i*15;
    const c=cv.getContext("2d");c.imageSmoothingEnabled=false;
    c.fillStyle=`rgba(100,120,150,${0.25+i*0.02})`;
    c.fillRect(0,0,cv.width,cv.height);
    c.fillStyle=`rgba(140,170,200,${0.15+i*0.01})`;
    for(let wy=8;wy<cv.height-8;wy+=12){
      for(let wx=6;wx<cv.width-6;wx+=10){
        c.fillRect(wx,wy,4,6);
      }
    }
    T._cache["building_distant_"+i]=cv;
  }
  /* natural elements */
  T._cache.tree_side=T._buildTreeSide();
  T._cache.tree_top=T._buildTreeTop();
  T._cache.bench_side=T._buildBenchSide();
  T._cache.bench_top=T._buildBenchTop();
  T._cache.sign_park=T._buildSign("RYDE PARK","#50c878",48,20);
  T._cache.sign_next=T._buildSign("NEXT →","#50c878",48,20);
  T._cache.sign_cafe=T._buildSign("PARK CAFE","#8b4513",48,16);
  T._cache.sign_playground=T._buildSign("PLAYGROUND","#4a90d9",56,14);
  /* platforms */
  T._cache.plat_grass=T._buildPlatform("grass");
  T._cache.plat_stone=T._buildPlatform("stone");
  T._cache.plat_wood=T._buildPlatform("wood");
  T._cache.plat_dirt=T._buildPlatform("dirt");
  T._cache.ground_strip=T._buildGround();
  /* hazards */
  T._cache.spike=T._buildSpike();
  T._cache.puddle=T._buildPuddle();
  T._cache.rock=T._buildRock();
  /* structures */
  T._cache.railing=T._buildRailing();
  T._cache.bridge_pillar=T._buildBridgePillar();
  T._cache.lamp_post=T._buildLampPost();
  T._cache.road_marking=T._buildRoadMarking();
  T._cache.wind_line=T._buildWindLine();
  T._cache.cricket_ball_8=T._buildCricketBall();
  /* top-down decorations */
  T._cache.goal=T._buildGoal();
  T._cache.stumps=T._buildStumps();
  T._cache.cafe_table=T._buildCafeTable();
  T._cache.playground_eq=T._buildPlayground();
  /* parking garage tiles */
  T._cache.parking_pillar=T._buildParkingPillar();
  T._cache.parking_light=T._buildParkingLight();
  T._cache.parking_car_red=T._buildParkingCar("#cc3333","#aa1818");
  T._cache.parking_car_blue=T._buildParkingCar("#3355cc","#2244aa");
  T._cache.parking_car_white=T._buildParkingCar("#dddddd","#bbbbbb");
},

/* ===== TILE RENDER HELPERS ===== */
/* draw tiled platform (8-bit style) */
drawPlatform(ctx,sx,sy,w,h,type){
  const tile=this._cache["plat_"+(type||"grass")];
  if(!tile)return;
  for(let px=0;px<w;px+=16){
    const tw=Math.min(16,w-px);
    for(let py=0;py<h;py+=16){
      const th=Math.min(16,h-py);
      ctx.drawImage(tile,0,0,tw,th,sx+px,sy+py,tw,th);
    }
  }
},

/* draw tiled ground (side-scroll) */
drawGround(ctx,ox,groundY,worldW,screenH){
  const tile=this._cache.ground_strip;
  if(!tile)return;
  const sy=groundY;
  for(let px=-((ox%16)+16);px<480+16;px+=16){
    const wx=px+ox;
    if(wx<0||wx>worldW)continue;
    ctx.drawImage(tile,px,sy,16,48);
  }
},

_buildParkingPillar(){
  var cv=document.createElement("canvas");cv.width=16;cv.height=132;
  var c=cv.getContext("2d");c.imageSmoothingEnabled=false;
  c.fillStyle="#606060";c.fillRect(0,0,16,132);
  c.fillStyle="#707070";c.fillRect(2,0,12,132);
  c.fillStyle="#555";c.fillRect(0,0,16,4);c.fillRect(0,128,16,4);
  c.fillStyle="#686868";c.fillRect(4,2,8,128);
  for(var y=8;y<128;y+=16){c.fillStyle="#5a5a5a";c.fillRect(2,y,12,2)}
  return cv;
},
_buildParkingLight(){
  var cv=document.createElement("canvas");cv.width=32;cv.height=6;
  var c=cv.getContext("2d");c.imageSmoothingEnabled=false;
  c.fillStyle="#888";c.fillRect(0,0,32,2);
  c.fillStyle="#ddeeff";c.fillRect(2,2,28,3);
  c.fillStyle="#fff";c.fillRect(6,3,20,1);
  return cv;
},
_buildParkingCar(body,dark){
  var cv=document.createElement("canvas");cv.width=48;cv.height=28;
  var c=cv.getContext("2d");c.imageSmoothingEnabled=false;
  /* body */
  c.fillStyle=body;c.fillRect(4,8,40,14);
  /* roof */
  c.fillStyle=dark;c.fillRect(12,2,20,10);
  /* windshield */
  c.fillStyle="rgba(150,200,255,0.7)";c.fillRect(14,3,7,8);c.fillRect(27,3,7,8);
  /* wheels */
  c.fillStyle="#222";c.fillRect(8,22,8,6);c.fillRect(32,22,8,6);
  c.fillStyle="#444";c.fillRect(10,23,4,4);c.fillRect(34,23,4,4);
  /* headlight */
  c.fillStyle="#ff0";c.fillRect(44,12,2,4);
  /* taillight */
  c.fillStyle="#f00";c.fillRect(4,12,2,4);
  /* bumper */
  c.fillStyle="#888";c.fillRect(2,10,2,10);c.fillRect(44,10,2,10);
  return cv;
},

drawParkingBG(ctx,w,h){
  var grad=ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,"#252525");
  grad.addColorStop(0.3,"#333");
  grad.addColorStop(0.6,"#303030");
  grad.addColorStop(1,"#282828");
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,w,h);
},

/* ===== UTILITY ===== */
_darken(hex,amt){
  let r=parseInt(hex.slice(1,3),16)-amt;
  let g=parseInt(hex.slice(3,5),16)-amt;
  let b=parseInt(hex.slice(5,7),16)-amt;
  r=Math.max(0,r);g=Math.max(0,g);b=Math.max(0,b);
  return"#"+r.toString(16).padStart(2,"0")+g.toString(16).padStart(2,"0")+b.toString(16).padStart(2,"0");
}
};
