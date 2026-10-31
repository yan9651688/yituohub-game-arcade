/* Source-backed character context, not transcribed animation dialogue.
 * Only extends existing dialogue arrays. Battles, event IDs and saves unchanged.
 * Late scenes retain approved game staging; their exact original scenes remain
 * unverified. Narration has a portrait subject, never a falsely attributed quote.
 */
(() => {
  'use strict';
  const provenance='剧情旁白';
  const line=(portraitSpeaker,text,sourceIds=[],stageId)=>({speaker:'旁白',portraitSpeaker,text,sourceIds,provenance,...(stageId?{stageId}:{})});
  const scenes={
    'hongmao-02': {before:[line('猪无戒','猪无戒围困玉蟾宫。虹猫伤愈后，准备与蓝兔两剑合璧。',['cctv-11'])]},
    'hongmao-05': {before:[line('黑小虎','黑小虎率船围湖，随后将虹猫和蓝兔困在孤岛。',['cctv-61'])]},
    'hongmao-07': {before:[line('黑小虎','黑小虎挡在围阵前。')]},
    'hongmao-08': {before:[line('黑心虎','黑心虎企图夺取麒麟。七剑合璧，是七剑对抗他的目标。',['cctv-story'])]},
    'sali-01': {before:[line('马三娘','马三娘来到客栈，谋夺紫云剑主的身份。',['cctv-11','cctv-21'],'neutral')]},
    'sali-08': {before:[line('马三娘','马三娘持着紫云剑。莎丽赶来迎战。',[],'purple-sword')]},
    'lantu-01': {before:[line('猪无戒','猪无戒参加比武招亲，想娶蓝兔。蓝兔则借比试拖延疗伤时间。',['cctv-01'])]},
    'daben-03': {before:[line('猪无戒','猪无戒利用大奔与牛旋风赌酒的机会，夺下关口。',['cctv-51'])],after:[line('牛旋风','牛旋风发现自己被利用，转而帮助大奔。',['cctv-51'])]},
    'tiaotiao-05': {before:[line('黑心虎','跳跳借雷电聚力，亮明青光剑主身份，刺杀黑心虎。',['cctv-81'])]},
    'dada-05': {before:[line('黑小虎','黑小虎以达夫人的安危要挟达达。',['cctv-dada'])]},
    'doudou-02': {before:[line('猪无戒','猪无戒夺书离去，临走时掷出蝴蝶镖。虹猫和逗逗仍要应付洞中的灵兽。',['cctv-31'])]}
  };
  const applied=[];
  for(const hero of Object.values(window.CANON_DATA.heroes))for(const chapter of hero.chapters){
    const entry=scenes[chapter.id];if(!entry)continue;
    chapter.dialogue=[...(entry.before||[]),...chapter.dialogue,...(entry.after||[])];
    applied.push({id:chapter.id,title:chapter.title,lines:[...(entry.before||[]),...(entry.after||[])]});
  }
  window.SevenVillainDialogue=Object.freeze({version:2,provenance,verifiedOriginalLines:0,removedInventedLines:22,addedLineCount:applied.reduce((n,s)=>n+s.lines.length,0),scenes:applied});
})();
