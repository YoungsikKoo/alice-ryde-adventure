class Game{constructor(canvasId){this.canvas=document.getElementById(canvasId);this.renderer=new Renderer(this.canvas,480,320);this.input=new Input();this.camera=new Camera(480,320);this.assets=new AssetLoader();this.state="loading";this.currentStage=null;this.entities=[];this.players=[];this.localPlayer=null;this.targetFPS=30;this.frameInterval=1000/this.targetFPS;this.lastFrameTime=0;this.deltaTime=0;this.frameCount=0;this.combat=null;this.hud=null;this.dialogue=null;this.tileMap=null;this.sound=new Sound();this.transition=null}async init(){this.updateLoadingBar(5,"Initializing...");this.combat=new Combat(this);this.hud=new HUD(this);this.dialogue=new Dialogue(this);this.transition=new Transition(this);const initSound=()=>{try{this.sound.ctx=new AudioContext();this.sound._initialized=true;this.sound.masterGain=this.sound.ctx.createGain();this.sound.masterGain.connect(this.sound.ctx.destination);this.sound.sfxGain=this.sound.ctx.createGain();this.sound.sfxGain.gain.value=0.5;this.sound.sfxGain.connect(this.sound.masterGain);this.sound.musicGain=this.sound.ctx.createGain();this.sound.musicGain.gain.value=0.3;this.sound.musicGain.connect(this.sound.masterGain)}catch(e){};window.removeEventListener("click",initSound);window.removeEventListener("keydown",initSound);window.removeEventListener("touchstart",initSound)};window.addEventListener("click",initSound);window.addEventListener("keydown",initSound);window.addEventListener("touchstart",initSound);this.balanceConfig={player:{hp:100,atk:10,def:5,speed:2.2}};this.updateLoadingBar(50,"Creating player...");this.localPlayer=new Player(this,{x:240,y:160,name:"Alice"});this.players.push(this.localPlayer);this.entities.push(this.localPlayer);this.camera.follow(this.localPlayer);this.updateLoadingBar(100,"Ready!");this.introScreen=null;setTimeout(()=>{document.getElementById("loading-screen").classList.add("hidden");this.state="intro";this.introScreen=new IntroScreen(this,(chosen)=>{this.introScreen=null;if(chosen){this.localPlayer._spriteType=chosen.type;this.localPlayer.name=chosen.name;this.localPlayer.maxHp=chosen.stats.hp;this.localPlayer.hp=chosen.stats.hp;this.localPlayer.atk=chosen.stats.atk;this.localPlayer.def=chosen.stats.def;this.localPlayer.speed=chosen.stats.speed}this.state="playing";this.loadStage(new Stage1())})},500);this.lastFrameTime=performance.now();requestAnimationFrame(t=>this.loop(t))}loop(ts){requestAnimationFrame(t=>this.loop(t));const el=ts-this.lastFrameTime;if(el<this.frameInterval)return;this.deltaTime=Math.min(el/1000,0.05);this.lastFrameTime=ts-(el%this.frameInterval);this.frameCount++;this.update();this.render()}update(){if(this.state==="paused"||this.state==="loading")return;if(this.state==="intro"){if(this.introScreen){this.introScreen.update(this.deltaTime)}this.input.update();return}if(this.state==="dialogue"){this.dialogue.update(this.input);this.input.update();return}if(this.transition&&this.transition.active){this.transition.update(this.deltaTime);this.input.update();return}if(this.state!=="playing"){this.input.update();return}if(this.currentStage)this.currentStage.update(this.deltaTime);if(this.state==="playing"){
  if(this.input.justPressed["1"]){this._cheatLoad("sub1");}
  if(this.input.justPressed["2"]){this._cheatLoad("sub2");}
  if(this.input.justPressed["3"]){this._cheatLoad("sub3");}
  if(this.input.justPressed["4"]){this._cheatLoad("sub4");}
  if(this.input.justPressed["5"]){this._cheatLoadStage2("b2");}
  if(this.input.justPressed["6"]){this._cheatLoadStage2("b1");}
}for(let i=this.entities.length-1;i>=0;i--){this.entities[i].update(this.deltaTime);if(this.entities[i].destroyed)this.entities.splice(i,1)}this.combat.update(this.deltaTime);this.camera.update(this.deltaTime);this.hud.update(this.deltaTime);this.input.update()}render(){const ctx=this.renderer.begin();this.renderer.clear("#c0c0d0");if(this.state==="loading")return;if(this.state==="intro"&&this.introScreen){this.introScreen.render(ctx);this.renderer.end();return}if(this.currentStage&&this.currentStage.currentSub&&this.currentStage.currentSub.ss&&this.currentStage.currentSub.ss.active){this.currentStage.currentSub.render(ctx,this.camera)}else if(this.currentStage&&this.currentStage.ss&&this.currentStage.ss.active){this.currentStage.render(ctx,this.camera)}else{if(this.tileMap)this.tileMap.render(ctx,this.camera);if(this.currentStage&&this.currentStage.currentSub&&this.currentStage.currentSub.render&&(!this.currentStage.currentSub.ss||!this.currentStage.currentSub.ss.active))this.currentStage.currentSub.render(ctx,this.camera)};const sorted=[...this.entities].sort((a,b)=>a.y-b.y);for(const e of sorted)e.render(ctx,this.camera);this.combat.render(ctx,this.camera);this.hud.render(ctx);if(this.state==="dialogue")this.dialogue.render(ctx);if(this.transition&&this.transition.active)this.transition.render(ctx);this.renderer.renderFlash(this.deltaTime);this.renderer.end()}loadStage(stage){this.entities=this.entities.filter(e=>e instanceof Player);this.currentStage=stage;stage.init(this)}addEntity(e){this.entities.push(e)}removeEntity(e){e.destroyed=true}getEntitiesInRadius(x,y,r,filter){return this.entities.filter(e=>{if(filter&&!filter(e))return false;const dx=e.x-x,dy=e.y-y;return dx*dx+dy*dy<=r*r})}updateLoadingBar(pct,text){const b=document.getElementById("loading-bar"),t=document.getElementById("loading-text");if(b)b.style.width=pct+"%";if(t)t.textContent=text}_handleDeath(){
  if(this._respawning)return;
  this._respawning=true;
  this.state="paused";
  this.camera.shake(8,0.5);
  // GAME OVER 메시지
  this.hud.addChatMessage("GAME OVER! Restarting in 3...","#f44");
  let count=2;
  const tick=setInterval(()=>{
    this.hud.addChatMessage("Restarting in "+count+"...","#f44");
    count--;
    if(count<0){
      clearInterval(tick);
      this._doRespawn();
    }
  },1000);
}
_doRespawn(){
  const stage=this.currentStage;
  if(!stage){this._respawning=false;this.state="playing";return;}
  this.state="playing";
  this.transition.startFade(()=>{
    // 엔티티 정리
    this.entities=this.entities.filter(e=>e instanceof Player);
    // 플레이어 리셋
    this.localPlayer.hp=this.localPlayer.maxHp;
    this.localPlayer.alive=true;
    this.localPlayer.alpha=1;
    this.localPlayer.invincible=false;
    this.localPlayer.vx=0;
    this.localPlayer.vy=0;
    if(this.localPlayer.svx!==undefined)this.localPlayer.svx=0;
    if(this.localPlayer.svy!==undefined)this.localPlayer.svy=0;
    // 서브스테이지 재시작
    if(stage._loadSub&&this._currentSubName){
      stage._loadSub(this,this._currentSubName);
    } else {
      this.loadStage(new stage.constructor());
    }
    this._respawning=false;
    this.state="playing";
    this.hud.addChatMessage("Back in the game!","#50c878");
  },()=>{});
}
_cheatLoad(sub){
  const s=new Stage1();
  s.game=this;
  this.currentStage=s;
  this.entities=this.entities.filter(e=>e instanceof Player);
  s._loadSub(this,sub);
}
_cheatLoadStage2(floor){
  if(this.sound)this.sound.stopBGM();
  this.tileMap=null;
  var p=this.localPlayer;
  p.sideScrollMode=false;p.svy=0;p.vx=0;p.vy=0;
  p.hp=p.maxHp;
  var s=new Stage2();
  s.game=this;
  this.currentStage=s;
  this.entities=this.entities.filter(e=>e instanceof Player);
  this.state="playing";
  s._loadSub(this,floor||"b2");
}
startDialogue(lines,onComplete){this.state="dialogue";this.dialogue.start(lines,()=>{this.state="playing";if(onComplete)onComplete()})}}