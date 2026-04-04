/* ================================================================
   Stage 3: Ryde Public School
   Sub-stage based controller (same pattern as Stage2).
   Sub-stages: senior1f, senior2f, hall, oval, garden,
               junior1f, junior2f, office
   ================================================================ */
class Stage3 {
  constructor() {
    this.game = null;
    this.currentSub = null;
    this.complete = false;
  }

  async init(game) {
    this.game = game;
    game._currentStageClass = Stage3;
    this._loadSub(game, "senior1f");
  }

  _loadSub(game, sub) {
    this.game = game;
    game.entities = game.entities.filter(e => e instanceof Player);
    game._currentSubName = sub;
    game._notifyStageChange("s3_" + sub);

    if (sub === "senior1f") {
      this.currentSub = new Stage3_Senior1F((next) => {
        this._loadSub(game, "senior2f");
      });
      this.currentSub.init(game);
    }
    if (sub === "senior2f") {
      this.currentSub = new Stage3_Senior2F((next) => {
        this._loadSub(game, "hall");
      });
      this.currentSub.init(game);
    }
    /* Future sub-stages: hall, oval, garden, junior1f, junior2f, office */
    if (sub === "hall" || sub === "oval" || sub === "garden" ||
        sub === "junior1f" || sub === "junior2f" || sub === "office") {
      /* Placeholder - coming soon screen */
      game.hud.showStageName("~ " + sub + " Coming Soon ~");
    }
  }

  update(dt) {
    if (this.currentSub) this.currentSub.update(dt);
  }

  render(ctx, camera) {
    /* substages handle their own rendering */
    if (this.currentSub && this.currentSub.render) this.currentSub.render(ctx, camera);
  }
}
