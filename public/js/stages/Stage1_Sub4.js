/* =====================================================
   Stage 1-4: Ryde Park  (Top-Down)
   Based on real Ryde Park layout:
     North  – Ryde Public School (fenced)
     West   – Cafe, Playground, Wushu area (BOSS)
     East   – Football field
     South  – Cricket ground (cricket ball hazards)
   ===================================================== */

/* ---------- new enemy: Australian Crow ---------- */
class AustralianCrow extends Enemy{
  constructor(g,c){
    super(g,{...c,
      enemyType:"crow",
      name:"Australian Raven",
      hp:30,atk:9,def:2,speed:2.0,
      color:"#1a1a2e",aggroRange:100,ai:"chase",
      expReward:7,width:24,height:24
    });
    this._cawTimer=3+Math.random()*4;
  }
  update(dt){
    super.update(dt);
    if(!this.alive)return;
    this._cawTimer-=dt;
    if(this._cawTimer<=0){
      this._cawTimer=5+Math.random()*5;
      this.game.hud.addChatMessage("CAW! CAW!","#555");
    }
  }
}

/* ---------- new enemy: Cricket Ball (projectile hazard) ---------- */
class CricketBall extends Entity{
  constructor(game,cfg){
    super(game,{
      x:cfg.x,y:cfg.y,
      width:12,height:12,
      speed:0,color:"#cc2200",
      type:"enemy",tags:["enemy"]
    });
    this.damage=cfg.damage||14;
    this.dirX=cfg.dirX||0;
    this.dirY=cfg.dirY||0;
    this.flySpeed=cfg.flySpeed||220;
    this.lifetime=3.5;
    this.alive=true;
    this.hp=1;this.maxHp=1;
    this.atk=this.damage;this.def=0;
    this.contactDamage=this.damage;
    this.showHP=false;
    this.name="Cricket Ball";
    this.enemyType="cricketBall";
    this.expReward=2;
  }
  update(dt){
    if(!this.alive)return;
    this.x+=this.dirX*this.flySpeed*dt;
    this.y+=this.dirY*this.flySpeed*dt;
    this.lifetime-=dt;
    if(this.lifetime<=0||this.x<0||this.y<0||this.x>1200||this.y>1000){
      this.alive=false;this.destroy();
    }
  }
  takeDamage(){this.alive=false;this.destroy();}
  render(ctx,camera){
    if(!this.alive)return;
    const sp=camera.worldToScreen(this.x,this.y);
    if(sp.x<-16||sp.x>500||sp.y<-16||sp.y>340)return;
    ctx.fillStyle="#cc2200";
    ctx.beginPath();
    ctx.arc(sp.x+6,sp.y+6,6,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle="#fff";
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.arc(sp.x+6,sp.y+6,6,0.3,1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sp.x+6,sp.y+6,6,3.4,4.3);
    ctx.stroke();
    ctx.lineWidth=1;
  }
}

/* ================================================================
   Stage1_Sub4 — Ryde Park (top-down, tile-map based)
   ================================================================ */
class Stage1_Sub4{
  constructor(onComplete){
    this.game=null;
    this.onComplete=onComplete;
    this.complete=false;
    this.boss=null;
    this.bossTriggered=false;
    this.bossDefeated=false;
    this.bossTransformed=false;
    this.bossClone=null;
    this.cricketBallTimer=2;
    this.songTimer=0;
    this.songIndex=0;
    this.ambientTimer=0;
    this.hintTimer=0;
    this.hintIndex=0;
    /* no SideScroll — top-down mode */
    this.ss=null;
  }

  /* ---------- constants ---------- */
  static get W(){return 55}
  static get H(){return 45}
  static get TS(){return 16}

  /* zones (tile coords) */
  static get ZONES(){return{
    schoolTop:3,schoolBottom:11,schoolLeft:22,schoolRight:42,
    cafeTop:16,cafeBottom:23,cafeLeft:5,cafeRight:18,
    playgroundTop:20,playgroundBottom:26,playgroundLeft:8,playgroundRight:19,
    bossX:13,bossY:23,
    footyTop:16,footyBottom:28,footyLeft:28,footyRight:42,
    cricketCX:26,cricketCY:36,cricketR:7,
    exitX:27,exitY:43
  }}

  /* ===================== init ===================== */
  async init(game){
    this.game=game;
    const p=game.localPlayer;
    /* switch to top-down */
    p.sideScrollMode=false;
    if(p.svy!==undefined)p.svy=0;
    p.vx=0;p.vy=0;

    const md=this._generateMap();
    game.tileMap=new TileMap(game);
    game.tileMap.load(md,null);

    p.x=4*16; p.y=4*16;
    game.camera.follow(p);
    game.camera.x=p.x-240;
    game.camera.y=p.y-160;

    game.hud.showStageName("~ Stage 1-4: Ryde Park ~");
    this._spawnEnemies();
    this._spawnItems();
    this._setupBoss();

    setTimeout(()=>{
      game.startDialogue([
        {speaker:"Alice",text:"Ryde Park! Finally some fresh air."},
        {speaker:"Alice",text:"Wait... is that kung-fu music from the playground?"},
        {speaker:"Alice",text:"And someone's playing cricket. Watch out for stray balls!"}
      ],()=>{if(game.sound)game.sound.playBGM("sub4")});
    },500);
  }

  /* ===================== map gen ===================== */
  _generateMap(){
    const W=Stage1_Sub4.W, H=Stage1_Sub4.H, Z=Stage1_Sub4.ZONES;
    const g=[], c=[];

    for(let y=0;y<H;y++){
      const gr=[],cr=[];
      for(let x=0;x<W;x++){
        /* border fence */
        if(x===0||x===W-1||y===0||y===H-1){gr.push(4);cr.push(1);continue}

        /* --- Ryde Public School (fenced, can't enter) --- */
        if(y>=Z.schoolTop&&y<=Z.schoolBottom&&x>=Z.schoolLeft&&x<=Z.schoolRight){
          if(y===Z.schoolTop||y===Z.schoolBottom||x===Z.schoolLeft||x===Z.schoolRight){
            gr.push(4);cr.push(1); /* fence */
          }else{
            gr.push(5);cr.push(1); /* building interior, blocked */
          }
          continue;
        }

        /* --- Cafe / Playground area --- */
        if(y>=Z.cafeTop&&y<=Z.cafeBottom&&x>=Z.cafeLeft&&x<=Z.cafeRight){
          /* cafe tables (obstacles) */
          if((x===7||x===11||x===15)&&(y===17||y===19)){
            gr.push(6);cr.push(1);
          }else{
            gr.push(12);cr.push(0); /* cafe floor */
          }
          continue;
        }

        /* --- Playground / Wushu area --- */
        if(y>=Z.playgroundTop&&y<=Z.playgroundBottom&&x>=Z.playgroundLeft&&x<=Z.playgroundRight){
          /* playground equipment */
          if((x===10||x===16)&&(y===21||y===24)){
            gr.push(6);cr.push(1);
          }else{
            gr.push(1);cr.push(0); /* concrete */
          }
          continue;
        }

        /* --- Football field --- */
        if(y>=Z.footyTop&&y<=Z.footyBottom&&x>=Z.footyLeft&&x<=Z.footyRight){
          /* field border lines */
          if(y===Z.footyTop||y===Z.footyBottom||x===Z.footyLeft||x===Z.footyRight){
            gr.push(7);cr.push(0); /* dark green border */
          }else{
            gr.push(0);cr.push(0); /* bright green field */
          }
          continue;
        }

        /* --- Cricket ground (oval) --- */
        const dx=x-Z.cricketCX, dy=y-Z.cricketCY;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<=Z.cricketR){
          if(dist>Z.cricketR-1){
            gr.push(2);cr.push(0); /* pitch edge */
          }else if(Math.abs(dx)<=1&&Math.abs(dy)<=2){
            gr.push(2);cr.push(0); /* centre pitch strip */
          }else{
            gr.push(0);cr.push(0); /* green outfield */
          }
          continue;
        }

        /* --- Paths --- */
        /* main horizontal path */
        if(y===14||y===15){gr.push(1);cr.push(0);continue}
        /* path from entry down to cafe */
        if(x===4&&y>=2&&y<=16){gr.push(1);cr.push(0);continue}
        /* path to football field */
        if(y===22&&x>=18&&x<=28){gr.push(1);cr.push(0);continue}
        /* path to cricket */
        if(x===26&&y>=28&&y<=30){gr.push(1);cr.push(0);continue}
        /* path to exit */
        if(x===27&&y>=40&&y<=H-2){gr.push(1);cr.push(0);continue}
        /* path along south */
        if(y===42&&x>=20&&x<=34){gr.push(1);cr.push(0);continue}

        /* --- Scattered trees --- */
        if(this._isTree(x,y)){gr.push(7);cr.push(1);continue}

        /* --- Default: grass --- */
        gr.push(0);cr.push(0);
      }
      g.push(gr);c.push(cr);
    }
    return{width:W,height:H,ground:g,collision:c,above:[],events:[],spawns:{}};
  }

  _isTree(x,y){
    const trees=[
      [2,6],[6,3],[10,4],[14,3],[18,5],[44,4],[48,3],[50,6],
      [2,12],[8,13],[20,13],[24,14],[45,13],[50,12],
      [2,18],[2,24],[3,30],[3,36],[3,40],
      [22,16],[24,18],[44,16],[44,22],[44,28],
      [50,18],[50,24],[50,30],[50,36],[50,40],
      [10,30],[14,32],[18,34],[36,32],[40,34],[42,36],
      [8,38],[12,40],[16,42],[34,40],[38,42],[44,40],
      [20,8],[30,8],[36,6],[40,4],[46,8],
      [6,28],[14,28],[22,28],[34,28],[38,30]
    ];
    for(const[tx,ty]of trees) if(x===tx&&y===ty) return true;
    return false;
  }

  /* ===================== enemies ===================== */
  _spawnEnemies(){
    const g=this.game;
    const spawns=[
      /* Cockroaches — paths & grass */
      {cls:Cockroach,x:8,y:8},{cls:Cockroach,x:15,y:14},{cls:Cockroach,x:30,y:14},
      {cls:Cockroach,x:40,y:20},{cls:Cockroach,x:12,y:34},{cls:Cockroach,x:38,y:38},
      /* Ibis (BinChicken) — near cafe & bins */
      {cls:BinChicken,x:6,y:17},{cls:BinChicken,x:14,y:18},{cls:BinChicken,x:10,y:22},
      {cls:BinChicken,x:22,y:42},
      /* Pigeons — paths & open areas */
      {cls:Pigeon,x:12,y:14},{cls:Pigeon,x:25,y:15},{cls:Pigeon,x:35,y:22},
      {cls:Pigeon,x:20,y:38},{cls:Pigeon,x:32,y:34},
      /* Cockatoos — in/near trees */
      {cls:Cockatoo,x:6,y:6},{cls:Cockatoo,x:46,y:6},{cls:Cockatoo,x:46,y:28},
      {cls:Cockatoo,x:8,y:36},
      /* Australian Crows — football & cricket areas */
      {cls:AustralianCrow,x:32,y:18},{cls:AustralianCrow,x:38,y:24},
      {cls:AustralianCrow,x:24,y:34},{cls:AustralianCrow,x:30,y:38},
      /* BugSwarm — shady spots */
      {cls:BugSwarm,x:4,y:26},{cls:BugSwarm,x:48,y:34}
    ];
    for(const s of spawns){
      const e=new s.cls(g,{x:s.x*16,y:s.y*16});
      g.addEntity(e);
    }
  }

  /* ===================== items ===================== */
  _spawnItems(){
    const g=this.game;
    const items=[
      {x:9,y:17,item:{name:"Flat White",type:"consumable",heal:18,color:"#d2b48c",pickupMessage:"Park cafe flat white!"}},
      {x:16,y:18,item:{name:"Banana Bread",type:"consumable",heal:15,color:"#daa520",pickupMessage:"Warm banana bread!"}},
      {x:35,y:20,item:{name:"Orange Slice",type:"consumable",heal:10,color:"#ffa500",pickupMessage:"Half-time orange slice!"}},
      {x:28,y:36,item:{name:"Cricket Bat",type:"weapon",equipSlot:"weapon",atk:14,color:"#c4a875",pickupMessage:"Cricket bat! HOWZAT!"}},
      {x:40,y:26,item:{name:"Shin Guards",type:"armor",equipSlot:"armor",def:6,color:"#e0e0e0",pickupMessage:"Football shin guards!"}},
      {x:14,y:40,item:{name:"Meat Pie",type:"consumable",heal:20,color:"#8b4513",pickupMessage:"Classic Aussie meat pie!"}},
      {x:42,y:40,item:{name:"Golden Gaytime",type:"consumable",heal:25,color:"#f0d060",pickupMessage:"Golden Gaytime!! Best find EVER!"}},
      {x:3,y:14,item:{name:"Water Bottle",type:"consumable",heal:12,color:"#70b8f8",pickupMessage:"Stay hydrated!"}}
    ];
    for(const i of items){
      const d=new ItemDrop(g,{x:i.x*16,y:i.y*16,itemData:i.item});
      d.lifetime=99999;
      g.addEntity(d);
    }
  }

  /* ===================== boss: MASTER CHEN ===================== */
  _setupBoss(){
    const Z=Stage1_Sub4.ZONES;
    this.boss=new Enemy(this.game,{
      x:Z.bossX*16,y:Z.bossY*16,
      enemyType:"wushuMaster",
      name:"MASTER CHEN",
      hp:280,atk:17,def:7,speed:1.6,
      color:"#c41e3a",
      aggroRange:140,ai:"chase",
      expReward:50,
      width:48,height:48,
      lootTable:[
        {item:{name:"Tai Chi Robe",type:"armor",equipSlot:"armor",def:12,color:"#c41e3a",pickupMessage:"Master Chen's Tai Chi Robe! Powerful!"},chance:1},
        {item:{name:"Jade Amulet",type:"accessory",equipSlot:"accessory",atk:4,def:4,color:"#50c878",pickupMessage:"Jade Amulet! Ancient power!"},chance:1},
        {item:{name:"Dim Sim Feast",type:"consumable",heal:60,color:"#f0d060",pickupMessage:"A WHOLE feast of dim sims!!"},chance:1}
      ]
    });
    this.boss.isBoss=true;
    this.boss.active=false;
    this.boss.visible=false;
    this.game.addEntity(this.boss);
  }

  /* ===================== update ===================== */
  update(dt){
    if(!this.game)return;
    this._updateCricketBalls(dt);
    this._checkBossTrigger();
    this._updateBoss(dt);
    this._checkBossDefeated();
    this._checkExit();
    this._updateAmbient(dt);
  }

  /* --- cricket ball hazard from cricket ground --- */
  _updateCricketBalls(dt){
    const Z=Stage1_Sub4.ZONES;
    this.cricketBallTimer-=dt;
    if(this.cricketBallTimer<=0){
      this.cricketBallTimer=2.5+Math.random()*3;
      const angle=Math.random()*Math.PI*2;
      const cx=Z.cricketCX*16, cy=Z.cricketCY*16;
      const ball=new CricketBall(this.game,{
        x:cx,y:cy,
        dirX:Math.cos(angle),
        dirY:Math.sin(angle),
        flySpeed:180+Math.random()*80,
        damage:12+Math.floor(Math.random()*6)
      });
      this.game.addEntity(ball);
      /* warning */
      if(Math.random()<0.3){
        this.game.hud.addChatMessage("HOWZAT! Stray cricket ball!","#cc2200");
      }
    }
  }

  /* --- boss trigger --- */
  _checkBossTrigger(){
    if(this.bossTriggered||this.bossDefeated)return;
    const p=this.game.localPlayer;
    const bd=this.boss?Math.sqrt(Math.pow(p.x-this.boss.x,2)+Math.pow(p.y-this.boss.y,2)):Infinity;
    if(bd<100){
      this.bossTriggered=true;
      this.boss.active=true;
      this.boss.visible=true;
      this.game.camera.shake(6,0.6);
      this.game.hud.setBoss(this.boss,"MASTER CHEN");
      if(this.game.sound)this.game.sound.playBossAppear();
      this.game.startDialogue([
        {speaker:"???",text:"\u2669 \u6708\u4eae\u4ee3\u8868\u6211\u7684\u5fc3~ \u2669"},
        {speaker:"MASTER CHEN",text:"WHO DARES DISTURB MY MORNING WUSHU?!"},
        {speaker:"Alice",text:"Sir I'm just walking through the park!"},
        {speaker:"MASTER CHEN",text:"YOU MUST FACE THE ANCIENT ARTS!"},
        {speaker:"Alice",text:"Oh no... here we go again..."}
      ]);
    }
  }

  /* --- boss phase 2 transformation --- */
  _updateBoss(dt){
    if(!this.bossTriggered||this.bossDefeated||!this.boss||!this.boss.alive)return;

    /* singing */
    this.songTimer-=dt;
    if(this.songTimer<=0){
      this.songTimer=6+Math.random()*4;
      const songs=[
        "\u2669 \u7518\u5fc3\u60c5~~ \u2669",
        "\u2669 \u6708\u4eae\u4ee3\u8868\u6211\u7684\u5fc3~~ \u2669",
        "\u2669 \u5929\u6daf\u6d77\u89d2\u89c5\u77e5\u5df1~~ \u2669",
        "\u2669 \u5c0f\u57ce\u6545\u4e8b\u591a~~ \u2669",
        "\u2669 \u7231\u62fc\u624d\u4f1a\u8d62~~ \u2669",
        "\u2669 HYAAAAH! \u2669"
      ];
      this.game.hud.addChatMessage(songs[this.songIndex%songs.length],"#c41e3a");
      this.songIndex++;
    }

    /* Phase 2: transform + split at 50% HP */
    if(!this.bossTransformed&&this.boss.hp<=this.boss.maxHp*0.5){
      this.bossTransformed=true;
      this.boss.color="#4a0028";
      this.boss._spriteType="wushuMonster";
      this.boss.enemyType="wushuMonster";
      this.boss.atk=28;
      this.boss.contactDamage=28*3.0;
      this.boss.chaseSpeed=3.2;
      this.boss.aggroRange=250;
      this.boss.width=56;
      this.boss.height=56;
      this.game.camera.shake(10,1.0);
      this.game.hud.addChatMessage("MASTER CHEN TRANSFORMS AND SPLITS!","#f44");
      /* spawn SHADOW CHEN clone */
      this.bossClone=new Enemy(this.game,{
        x:this.boss.x+80,y:this.boss.y,
        enemyType:"wushuMonster",
        name:"SHADOW CHEN",
        hp:Math.floor(this.boss.maxHp*0.35),
        atk:22,def:5,speed:2.8,
        color:"#2a0040",
        aggroRange:220,ai:"chase",
        expReward:20,
        width:48,height:48
      });
      this.bossClone.isBoss=false;
      this.game.addEntity(this.bossClone);
      this.game.startDialogue([
        {speaker:"MASTER CHEN",text:"\u2669 \u53d8\u8eab~~!! \u2669"},
        {speaker:"MASTER CHEN",text:"YOU HAVE ANGERED THE ANCIENT SPIRIT!"},
        {speaker:"SHADOW CHEN",text:"WE ARE NOW TWO! HAHAHA!"},
        {speaker:"Alice",text:"HE SPLIT IN TWO?! AND TRANSFORMED?!"},
        {speaker:"Alice",text:"This is NOT a normal park!"}
      ]);
      /* play transformation sound */
      try{
        const s=this.game.sound;
        if(s&&s.ctx&&!s.muted){
          const t=s.ctx.currentTime;
          [200,300,500,800,1200].forEach((f,i)=>{
            const o=s.ctx.createOscillator(),g=s.ctx.createGain();
            o.type="sawtooth";o.frequency.value=f;
            g.gain.setValueAtTime(0.3,t+i*0.12);
            g.gain.exponentialRampToValueAtTime(0.001,t+i*0.12+0.15);
            o.connect(g);g.connect(s.sfxGain);
            o.start(t+i*0.12);o.stop(t+i*0.12+0.15);
          });
        }
      }catch(e){}
    }
  }

  /* --- boss defeated --- */
  _checkBossDefeated(){
    if(!this.bossTriggered||this.bossDefeated)return;
    const mainDead=!this.boss||!this.boss.alive||this.boss.hp<=0;
    const cloneDead=!this.bossClone||!this.bossClone.alive||this.bossClone.hp<=0;
    if(mainDead&&cloneDead){
      this.bossDefeated=true;
      this.game.hud.clearBoss();
      this.game.hud.addChatMessage("Master Chen is defeated! The park is safe!","#50c878");
      this.game.startDialogue([
        {speaker:"MASTER CHEN",text:"\u2669 ... \u6211\u8f93\u4e86... good fight... \u2669"},
        {speaker:"Alice",text:"Are you okay sir?"},
        {speaker:"MASTER CHEN",text:"You fight well... take my robe. I go home now."},
        {speaker:"Alice",text:"That was the weirdest park visit ever."},
        {speaker:"Alice",text:"Time to head to Top Ryde City!"}
      ]);
    }
  }

  /* --- exit to Stage 2 --- */
  _checkExit(){
    if(this.complete||!this.bossDefeated)return;
    const p=this.game.localPlayer;
    const Z=Stage1_Sub4.ZONES;
    const dx=p.x-Z.exitX*16, dy=p.y-Z.exitY*16;
    if(Math.sqrt(dx*dx+dy*dy)<28){
      this.complete=true;
      this.game.startDialogue([
        {speaker:"Alice",text:"Through the park! Top Ryde City here I come!"}
      ],()=>{
        if(this.onComplete)this.onComplete("stage2");
      });
    }
  }

  /* --- ambient --- */
  _updateAmbient(dt){
    this.ambientTimer+=dt;
    if(this.ambientTimer>25){
      this.ambientTimer=0;
      const msgs=[
        "A magpie swoops nearby! Missed!",
        "Kids playing in the distance...",
        "BBQ smells wafting from somewhere.",
        "A kookaburra laughs. Classic.",
        "Someone's dog is off-leash again.",
        "The cricket match is getting intense!",
        "A jogger runs past. Show off."
      ];
      this.game.hud.addChatMessage(msgs[Math.floor(Math.random()*msgs.length)],"#aaa");
    }
    this.hintTimer+=dt;
    if(this.hintTimer>18&&this.hintIndex<3){
      this.hintTimer=0;
      const hints=[
        "Hint: The Wushu Master is near the playground!",
        "Hint: Watch out for cricket balls from the south!",
        "Hint: Defeat the boss to unlock the exit south!"
      ];
      if(this.hintIndex<hints.length){
        this.game.hud.addChatMessage(hints[this.hintIndex],"#88bbff");
        this.hintIndex++;
      }
    }
  }

  /* ===================== render ===================== */
  render(ctx,camera){
    /* TileMap renders automatically via Game.js for top-down mode.
       We add overlay decorations on top. */
    this._renderSchoolLabel(ctx,camera);
    this._renderCafeDetails(ctx,camera);
    this._renderFootballLines(ctx,camera);
    this._renderCricketDetails(ctx,camera);
    this._renderParkBenches(ctx,camera);
    this._renderTrees3D(ctx,camera);
    if(this.bossDefeated)this._renderExit(ctx,camera);
  }

  _renderSchoolLabel(ctx,camera){
    const Z=Stage1_Sub4.ZONES;
    const sx=(Z.schoolLeft+Z.schoolRight)/2*16-camera.offsetX;
    const sy=(Z.schoolTop+2)*16-camera.offsetY;
    if(sx<-80||sx>560)return;
    ctx.fillStyle="#fff";
    ctx.font="8px Courier New";
    ctx.textAlign="center";
    ctx.fillText("RYDE PUBLIC SCHOOL",sx,sy);
    ctx.fillText("(No Trespassing)",sx,sy+10);
  }

  _renderCafeDetails(ctx,camera){
    const ox=camera.offsetX,oy=camera.offsetY;
    const MT=window.MapTiles&&MapTiles._inited;
    /* cafe sign */
    const sx=10*16-ox, sy=16*16-oy;
    if(sx>-40&&sx<500){
      const cafeSn=MT?MapTiles.get("sign_cafe"):null;
      if(cafeSn){ctx.drawImage(cafeSn,sx,sy-8)}
      else{ctx.fillStyle="#8b4513";ctx.fillRect(sx,sy,48,12);ctx.fillStyle="#fff";ctx.font="7px Courier New";ctx.textAlign="center";ctx.fillText("PARK CAFE",sx+24,sy+9)}
    }
    /* playground sign */
    const px=12*16-ox, py=20*16-oy;
    if(px>-40&&px<500){
      const pgSn=MT?MapTiles.get("sign_playground"):null;
      if(pgSn){ctx.drawImage(pgSn,px,py-8)}
      else{ctx.fillStyle="#4a90d9";ctx.fillRect(px,py,56,10);ctx.fillStyle="#fff";ctx.font="6px Courier New";ctx.textAlign="center";ctx.fillText("PLAYGROUND",px+28,py+8)}
    }
  }

  _renderFootballLines(ctx,camera){
    const Z=Stage1_Sub4.ZONES;
    const ox=camera.offsetX,oy=camera.offsetY;
    const MT=window.MapTiles&&MapTiles._inited;
    const fx=Z.footyLeft*16-ox, fy=Z.footyTop*16-oy;
    const fw=(Z.footyRight-Z.footyLeft)*16, fh=(Z.footyBottom-Z.footyTop)*16;
    if(fx+fw<0||fx>480||fy+fh<0||fy>320)return;
    ctx.strokeStyle="rgba(255,255,255,0.5)";
    ctx.lineWidth=1;
    ctx.strokeRect(fx+8,fy+8,fw-16,fh-16);
    ctx.beginPath();ctx.moveTo(fx+fw/2,fy+8);ctx.lineTo(fx+fw/2,fy+fh-8);ctx.stroke();
    ctx.beginPath();ctx.arc(fx+fw/2,fy+fh/2,30,0,Math.PI*2);ctx.stroke();
    /* goals */
    const goalCv=MT?MapTiles.get("goal"):null;
    if(goalCv){ctx.drawImage(goalCv,fx+fw/2-16,fy+8);ctx.drawImage(goalCv,fx+fw/2-16,fy+fh-20)}
    ctx.fillStyle="rgba(255,255,255,0.6)";ctx.font="7px Courier New";ctx.textAlign="center";
    ctx.fillText("FOOTBALL FIELD",fx+fw/2,fy-2);
    ctx.lineWidth=1;
  }

  _renderCricketDetails(ctx,camera){
    const Z=Stage1_Sub4.ZONES;
    const ox=camera.offsetX,oy=camera.offsetY;
    const MT=window.MapTiles&&MapTiles._inited;
    const cx=Z.cricketCX*16-ox, cy=Z.cricketCY*16-oy;
    if(cx<-120||cx>600||cy<-120||cy>440)return;
    ctx.strokeStyle="rgba(255,255,255,0.4)";ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(cx,cy,Z.cricketR*16,Z.cricketR*14,0,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="rgba(196,168,117,0.6)";ctx.fillRect(cx-8,cy-24,16,48);
    /* stumps */
    const stCv=MT?MapTiles.get("stumps"):null;
    if(stCv){ctx.drawImage(stCv,cx-5,cy-28);ctx.drawImage(stCv,cx-5,cy+20)}
    else{ctx.fillStyle="#8b6914";ctx.fillRect(cx-4,cy-26,2,6);ctx.fillRect(cx,cy-26,2,6);ctx.fillRect(cx+4,cy-26,2,6);ctx.fillRect(cx-4,cy+20,2,6);ctx.fillRect(cx,cy+20,2,6);ctx.fillRect(cx+4,cy+20,2,6)}
    ctx.fillStyle="rgba(255,255,255,0.6)";ctx.font="7px Courier New";ctx.textAlign="center";
    ctx.fillText("CRICKET GROUND",cx,cy-Z.cricketR*14-4);ctx.lineWidth=1;
  }

  _renderParkBenches(ctx,camera){
    const ox=camera.offsetX,oy=camera.offsetY;
    const MT=window.MapTiles&&MapTiles._inited;
    const benchCv=MT?MapTiles.get("bench_top"):null;
    const benches=[
      {x:6*16,y:14*16},{x:18*16,y:14*16},{x:30*16,y:14*16},
      {x:42*16,y:14*16},{x:20*16,y:30*16},{x:36*16,y:30*16}
    ];
    for(const b of benches){
      const sx=b.x-ox, sy=b.y-oy;
      if(sx<-20||sx>500||sy<-20||sy>340)continue;
      if(benchCv){ctx.drawImage(benchCv,sx,sy)}
      else{ctx.fillStyle="#c4a875";ctx.fillRect(sx,sy,24,6);ctx.fillRect(sx+2,sy+6,4,4);ctx.fillRect(sx+18,sy+6,4,4)}
    }
  }

  _renderTrees3D(ctx,camera){
    const ox=camera.offsetX,oy=camera.offsetY;
    const MT=window.MapTiles&&MapTiles._inited;
    const treeCv=MT?MapTiles.get("tree_top"):null;
    const trees=[
      [2,6],[6,3],[10,4],[14,3],[18,5],[44,4],[48,3],[50,6],
      [2,12],[8,13],[20,13],[24,14],[45,13],[50,12],
      [2,18],[2,24],[3,30],[3,36],[3,40],
      [22,16],[24,18],[44,16],[44,22],[44,28],
      [50,18],[50,24],[50,30],[50,36],[50,40],
      [10,30],[14,32],[18,34],[36,32],[40,34],[42,36],
      [8,38],[12,40],[16,42],[34,40],[38,42],[44,40],
      [20,8],[30,8],[36,6],[40,4],[46,8],
      [6,28],[14,28],[22,28],[34,28],[38,30]
    ];
    for(const[tx,ty]of trees){
      const sx=tx*16-ox, sy=ty*16-oy;
      if(sx<-24||sx>504||sy<-24||sy>344)continue;
      if(treeCv){ctx.drawImage(treeCv,sx-4,sy-6)}
      else{ctx.fillStyle="#8b6914";ctx.fillRect(sx+5,sy+8,6,10);ctx.fillStyle="#2a7a1a";ctx.fillRect(sx-4,sy-6,24,18);ctx.fillStyle="#3a9a2a";ctx.fillRect(sx,sy-10,16,8)}
    }
  }

  _renderExit(ctx,camera){
    const Z=Stage1_Sub4.ZONES;
    const ex=Z.exitX*16-camera.offsetX, ey=Z.exitY*16-camera.offsetY;
    if(ex<-20||ex>500||ey<-20||ey>340)return;
    /* pulsing green arrow */
    const pulse=0.6+Math.sin(Date.now()*0.004)*0.4;
    ctx.fillStyle=`rgba(80,200,120,${pulse})`;
    ctx.beginPath();
    ctx.moveTo(ex,ey);
    ctx.lineTo(ex+16,ey+12);
    ctx.lineTo(ex+32,ey);
    ctx.lineTo(ex+24,ey);
    ctx.lineTo(ex+24,ey-16);
    ctx.lineTo(ex+8,ey-16);
    ctx.lineTo(ex+8,ey);
    ctx.fill();
    ctx.fillStyle="#50c878";
    ctx.font="8px Courier New";
    ctx.textAlign="center";
    ctx.fillText("EXIT",ex+16,ey-20);
    ctx.fillText("Top Ryde City",ex+16,ey+24);
  }
}
