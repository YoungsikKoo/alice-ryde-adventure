/* ================================================================
   IntroScreen — Title, Character Intro, Character Selection
   8-bit styled canvas rendering. Press ENTER to advance pages.
   Page 0: Title/Story, Page 1: Character Info, Page 2: Character Select
   ================================================================ */
class IntroScreen{
  constructor(game,onStart){
    this.game=game;
    this.onStart=onStart;
    this.active=true;
    this.page=0;
    this.maxPages=2;
    this._blink=0;
    this._stars=[];
    this.selectedChar=0;
    this._selectCooldown=0;
    for(let i=0;i<30;i++){
      this._stars.push({x:Math.random()*480,y:Math.random()*320,s:1+Math.random()*2,spd:0.3+Math.random()*0.4});
    }
    this.chars=[
      {name:"Alice",type:"alice",color:"#ff69b4",
       desc:["12yo Korean girl","Brave & determined","Balanced stats"],
       stats:{hp:100,atk:10,def:5,speed:2.2}},
      {name:"Rinka",type:"rinka",color:"#40bfa0",
       desc:["12yo half-AUS/JP","Sporty & fast","High speed, low def"],
       stats:{hp:90,atk:9,def:4,speed:2.6}},
      {name:"Tara",type:"tara",color:"#8b5cf6",
       desc:["12yo Central Asian","Mysterious & strong","High atk, low speed"],
       stats:{hp:95,atk:13,def:5,speed:2.0}},
      {name:"Yuri",type:"yuri",color:"#4a90d9",
       desc:["15yo Korean sister","Cool & protective","High def, balanced"],
       stats:{hp:110,atk:10,def:7,speed:2.1}},
      {name:"Mom",type:"mom",color:"#e8c098",
       desc:["Korean mother","Kind & powerful","High HP, high atk"],
       stats:{hp:130,atk:12,def:6,speed:1.9}},
      {name:"FaFa",type:"fafa",color:"#f0d060",
       desc:["Korean grandpa","Wise & tough","Highest def, slow"],
       stats:{hp:120,atk:8,def:9,speed:1.8}}
    ];
  }

  update(dt){
    if(!this.active)return;
    this._blink+=dt;
    if(this._selectCooldown>0)this._selectCooldown-=dt;
    for(const s of this._stars){
      s.y+=s.spd;
      if(s.y>320){s.y=-2;s.x=Math.random()*480;}
    }
    const inp=this.game.input;

    if(this.page===2){
      /* character selection navigation */
      if(this._selectCooldown<=0){
        const mv=inp.getMovement();
        if(mv.x>0.5){this.selectedChar=(this.selectedChar+1)%6;this._selectCooldown=0.15;}
        else if(mv.x<-0.5){this.selectedChar=(this.selectedChar+5)%6;this._selectCooldown=0.15;}
        else if(mv.y>0.5){this.selectedChar=(this.selectedChar+3)%6;this._selectCooldown=0.15;}
        else if(mv.y<-0.5){this.selectedChar=(this.selectedChar+3)%6;this._selectCooldown=0.15;}
      }
      if(inp.justPressed&&(inp.justPressed["enter"]||inp.justPressed[" "])){
        this.active=false;
        const chosen=this.chars[this.selectedChar];
        if(this.onStart)this.onStart(chosen);
      }
    }else{
      if(inp.justPressed&&(inp.justPressed["enter"]||inp.justPressed[" "])){
        this.page++;
      }
    }
  }

  render(ctx){
    if(!this.active)return;
    const W=480,H=320;
    ctx.fillStyle="#0a0a1a";
    ctx.fillRect(0,0,W,H);
    for(const s of this._stars){
      const a=0.4+Math.sin(this._blink*2+s.x)*0.3;
      ctx.fillStyle=`rgba(255,255,200,${a})`;
      ctx.fillRect(Math.floor(s.x),Math.floor(s.y),s.s,s.s);
    }
    if(this.page===0) this._renderTitlePage(ctx);
    else if(this.page===1) this._renderCharPage(ctx);
    else this._renderSelectPage(ctx);

    const show=Math.sin(this._blink*3)>-0.3;
    if(show){
      ctx.fillStyle="#f0d060";
      ctx.font="10px 'Press Start 2P',Courier New";
      ctx.textAlign="center";
      if(this.page<2)
        ctx.fillText("PRESS ENTER",W/2,H-18);
      else
        ctx.fillText("ENTER TO START",W/2,H-18);
    }
  }

  _renderTitlePage(ctx){
    const W=480,H=320;
    ctx.fillStyle="#ff69b4";
    ctx.font="18px 'Press Start 2P',Courier New";
    ctx.textAlign="center";
    ctx.fillText("Alice's Ryde",W/2,50);
    ctx.fillText("Adventure",W/2,75);
    ctx.fillStyle="#f0d060";
    ctx.font="8px 'Press Start 2P',Courier New";
    ctx.fillText("~ A 12-year-old's walk to school ~",W/2,100);
    ctx.fillStyle="#c0c0d0";
    ctx.font="9px Courier New";
    const lines=[
      "Alice is a 12-year-old Korean girl",
      "who just moved to Ryde, Sydney.",
      "",
      "Every morning she walks to school,",
      "but the streets are full of dangers!",
      "",
      "Cockroaches, angry birds, stray dogs...",
      "and something stranger in Ryde Park.",
      "",
      "Can Alice make it to school on time?"
    ];
    let ly=130;
    for(const l of lines){ctx.fillText(l,W/2,ly);ly+=16;}
    if(window.CharacterSprites&&CharacterSprites._inited){
      CharacterSprites.draw(ctx,"alice",W/2-16,270,32,32,"down",0,false);
    }else{
      ctx.fillStyle="#ff69b4";ctx.fillRect(W/2-8,275,16,20);
    }
  }

  _renderCharPage(ctx){
    const W=480,H=320;
    ctx.fillStyle="#f0d060";
    ctx.font="12px 'Press Start 2P',Courier New";
    ctx.textAlign="center";
    ctx.fillText("~ CHARACTERS ~",W/2,24);
    const cols=3,rows=2;
    const cw=W/cols,ch=(H-60)/rows;
    for(let i=0;i<this.chars.length;i++){
      const c=this.chars[i];
      const col=i%cols,row=Math.floor(i/cols);
      const cx=col*cw+cw/2,cy=40+row*ch;
      if(window.CharacterSprites&&CharacterSprites._inited){
        CharacterSprites.draw(ctx,c.type,cx-16,cy,32,32,"down",0,false);
      }else{
        ctx.fillStyle=c.color;ctx.fillRect(cx-8,cy+4,16,20);
      }
      ctx.fillStyle=c.color;
      ctx.font="9px 'Press Start 2P',Courier New";
      ctx.textAlign="center";
      ctx.fillText(c.name,cx,cy+42);
      ctx.fillStyle="#b0b0c0";
      ctx.font="8px Courier New";
      let dy=cy+56;
      for(const d of c.desc){ctx.fillText(d,cx,dy);dy+=12;}
    }
  }

  _renderSelectPage(ctx){
    const W=480,H=320;
    ctx.fillStyle="#ff69b4";
    ctx.font="12px 'Press Start 2P',Courier New";
    ctx.textAlign="center";
    ctx.fillText("~ SELECT CHARACTER ~",W/2,22);

    ctx.fillStyle="#888";
    ctx.font="8px Courier New";
    ctx.fillText("Arrow keys to move, ENTER to confirm",W/2,36);

    const cols=3,rows=2;
    const cw=W/cols,ch=(H-80)/rows;
    const selIdx=this.selectedChar;

    for(let i=0;i<this.chars.length;i++){
      const c=this.chars[i];
      const col=i%cols,row=Math.floor(i/cols);
      const cx=col*cw+cw/2,cy=50+row*ch;
      const isSel=(i===selIdx);

      /* selection highlight */
      if(isSel){
        const pulse=0.6+Math.sin(this._blink*4)*0.4;
        ctx.strokeStyle=c.color;
        ctx.lineWidth=2;
        ctx.strokeRect(cx-52,cy-8,104,ch-8);
        ctx.fillStyle=`rgba(255,255,255,${pulse*0.08})`;
        ctx.fillRect(cx-52,cy-8,104,ch-8);
        ctx.lineWidth=1;
      }

      /* sprite - animate selected, static others */
      const frame=isSel?Math.floor(this._blink*4)%2:0;
      const spriteSize=isSel?40:32;
      if(window.CharacterSprites&&CharacterSprites._inited){
        CharacterSprites.draw(ctx,c.type,cx-spriteSize/2,cy,spriteSize,spriteSize,"down",frame,false);
      }else{
        ctx.fillStyle=c.color;
        ctx.fillRect(cx-8,cy+4,16,20);
      }

      /* name */
      ctx.fillStyle=isSel?c.color:"#888";
      ctx.font=isSel?"10px 'Press Start 2P',Courier New":"8px 'Press Start 2P',Courier New";
      ctx.textAlign="center";
      ctx.fillText(c.name,cx,cy+spriteSize+14);

      /* stats for selected */
      if(isSel){
        ctx.fillStyle="#c0c0d0";
        ctx.font="8px Courier New";
        const st=c.stats;
        ctx.fillText("HP:"+st.hp+" ATK:"+st.atk+" DEF:"+st.def+" SPD:"+st.speed,cx,cy+spriteSize+28);
        /* stat bars */
        const barY=cy+spriteSize+32;
        const barW=80;
        const bars=[
          {label:"HP",val:st.hp,max:130,col:"#50c878"},
          {label:"ATK",val:st.atk,max:13,col:"#f44"},
          {label:"DEF",val:st.def,max:9,col:"#4a90d9"},
          {label:"SPD",val:st.speed,max:2.6,col:"#f0d060"}
        ];
        let by=barY;
        for(const b of bars){
          ctx.fillStyle="#444";
          ctx.fillRect(cx-barW/2,by,barW,5);
          ctx.fillStyle=b.col;
          ctx.fillRect(cx-barW/2,by,barW*(b.val/b.max),5);
          ctx.fillStyle="#aaa";
          ctx.font="6px Courier New";
          ctx.textAlign="left";
          ctx.fillText(b.label,cx-barW/2-20,by+5);
          ctx.textAlign="center";
          by+=9;
        }
      }
    }
  }
}
