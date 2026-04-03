/* ================================================================
   Stage 2: Top Ryde City Shopping Centre
   Sub-stage based (like Stage1). Currently: B2 Parking Garage only.
   ================================================================ */
class Stage2{
  constructor(){
    this.game=null;
    this.currentSub=null;
    this.complete=false;
  }
  async init(game){
    this.game=game;
    game._currentStageClass=Stage2;
    this._loadSub(game,"b2");
  }
  _loadSub(game,sub){
    this.game=game;
    game.entities=game.entities.filter(e=>e instanceof Player);
    game._currentSubName=sub;
    game._notifyStageChange("s2_"+sub);
    if(sub==="b2"){
      this.currentSub=new Stage2_B2((next)=>{
        this._loadSub(game,"b1");
      });
      this.currentSub.init(game);
    }
    if(sub==="b1"){
      this.currentSub=new Stage2_B1((next)=>{
        this._loadSub(game,"1f");
      });
      this.currentSub.init(game);
    }
    if(sub==="1f"){
      this.currentSub=new Stage2_1F((next)=>{
        this._loadSub(game,"2f");
      });
      this.currentSub.init(game);
    }
    if(sub==="2f"){
      this.currentSub=new Stage2_2F((next)=>{
        this._loadSub(game,"3f");
      });
      this.currentSub.init(game);
    }
    if(sub==="3f"){
      this.currentSub=new Stage2_3F((next)=>{
        if(game.sound)game.sound.stopBGM();
        this.complete=true;
        game._notifyStageChange("s3");
        game.loadStage(new Stage3());
      });
      this.currentSub.init(game);
    }
  }
  update(dt){
    if(this.currentSub)this.currentSub.update(dt);
  }
  render(ctx,camera){
    if(this.currentSub)this.currentSub.render(ctx,camera);
  }
}
