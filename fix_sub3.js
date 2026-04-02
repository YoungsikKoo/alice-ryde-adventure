const fs = require('fs');
const base = 'public/js/stages/';

// Stage1.js sub3 연결
let s1 = fs.readFileSync('public/js/stages/Stage1.js','utf8');
const idx = s1.indexOf('sub3');
console.log('sub3 위치:', s1.substring(idx-10, idx+120));

s1 = s1.replace(
  '// Sub3 coming soon — 임시로 Stage2',
  '// Sub3 loaded'
).replace(
  'game.hud.addChatMessage("Stage 1 clear! Off to Top Ryde City!","#50c878");\n    if(game.sound)game.sound.stopBGM();\n    game.transition.startFade(()=>{game.loadStage(new Stage2())},()=>{});\n  }',
  'this.currentSub=new Stage1_Sub3((next)=>this._loadSub(game,next));\n    this.currentSub.init(game);\n  } else if(sub==="sub4"){\n    game.hud.addChatMessage("Stage 1 clear! Off to Top Ryde City!","#50c878");\n    if(game.sound)game.sound.stopBGM();\n    game.transition.startFade(()=>{game.loadStage(new Stage2())},()=>{});\n  }'
);
fs.writeFileSync('public/js/stages/Stage1.js', s1);
console.log('Stage1.js 완료');

// index.html
let html = fs.readFileSync('public/index.html','utf8');
if (!html.includes('Stage1_Sub3')) {
  html = html.replace(
    '<script src=js/stages/Stage1_Sub2.js></script>',
    '<script src=js/stages/Stage1_Sub2.js></script><script src=js/stages/Stage1_Sub3.js></script>'
  );
  fs.writeFileSync('public/index.html', html);
  console.log('index.html 완료');
} else {
  console.log('index.html 이미 있음');
}
