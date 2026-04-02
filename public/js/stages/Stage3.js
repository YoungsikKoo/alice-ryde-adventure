/* ================================================================
   Stage 3: Ryde Public School — Landing Page (Coming Soon)
   ================================================================ */
class Stage3{
  constructor(){
    this.game=null;
    this._age=0;
    this._pulsePhase=0;
  }
  async init(game){
    this.game=game;
    game.tileMap=null;
    game.entities=game.entities.filter(e=>e instanceof Player);
    const p=game.localPlayer;
    p.sideScrollMode=false;
    p.x=240;p.y=200;p.vx=0;p.vy=0;
    game.camera.x=0;game.camera.y=0;
    if(game.sound)game.sound.stopBGM();
    game.hud.showStageName("~ Coming Soon ~");
  }
  update(dt){
    this._age+=dt;
    this._pulsePhase+=dt*2;
  }
  render(ctx,camera){
    /* dark school-themed background */
    const grad=ctx.createLinearGradient(0,0,0,320);
    grad.addColorStop(0,"#1a2a4a");
    grad.addColorStop(0.5,"#2a3a5a");
    grad.addColorStop(1,"#0a1a3a");
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,480,320);

    /* stars */
    ctx.fillStyle="rgba(255,255,255,0.6)";
    for(let i=0;i<40;i++){
      const sx=(i*127+33)%480;
      const sy=(i*97+17)%200;
      const sz=1+((i*31)%3)*0.5;
      const blink=Math.sin(this._age*2+i)*0.3+0.7;
      ctx.globalAlpha=blink*0.6;
      ctx.fillRect(sx,sy,sz,sz);
    }
    ctx.globalAlpha=1;

    /* school building silhouette */
    ctx.fillStyle="#1a1a2e";
    ctx.fillRect(100,140,280,120);
    ctx.fillRect(140,120,200,20);
    /* roof */
    ctx.beginPath();
    ctx.moveTo(120,140);ctx.lineTo(240,90);ctx.lineTo(360,140);
    ctx.fillStyle="#1a1a2e";ctx.fill();
    /* windows (warm glow) */
    ctx.fillStyle="rgba(255,220,100,0.4)";
    for(let r=0;r<3;r++){
      for(let c=0;c<6;c++){
        ctx.fillRect(120+c*42,150+r*30,20,18);
      }
    }
    /* door */
    ctx.fillStyle="rgba(255,200,80,0.5)";
    ctx.fillRect(225,210,30,50);

    /* main title */
    const pulse=Math.sin(this._pulsePhase)*0.15+0.85;
    ctx.save();
    ctx.globalAlpha=pulse;
    ctx.fillStyle="#ffdd44";
    ctx.font="bold 22px Courier New, monospace";
    ctx.textAlign="center";
    ctx.fillText("Ryde Public School",240,60);
    ctx.restore();

    /* Korean subtitle */
    ctx.fillStyle="#ff88aa";
    ctx.font="bold 16px Courier New, monospace";
    ctx.textAlign="center";
    ctx.fillText("\uC708\uBE44 \uC21C~~~",240,280);

    /* coming soon */
    const fade=Math.sin(this._age*1.5)*0.4+0.6;
    ctx.globalAlpha=fade;
    ctx.fillStyle="#ffffff";
    ctx.font="bold 13px Courier New, monospace";
    ctx.textAlign="center";
    ctx.fillText("Stage 3 - Coming Soon",240,300);
    ctx.globalAlpha=1;

    /* part 2 update notice */
    ctx.fillStyle="rgba(255,255,255,0.5)";
    ctx.font="10px Courier New, monospace";
    ctx.textAlign="center";
    ctx.fillText("Part 2 Update Coming!",240,315);
  }
}
