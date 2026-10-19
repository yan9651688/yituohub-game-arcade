(function(root){'use strict';
// Declarative skill-mode contract; classic content remains untouched.
const SCHEMA_VERSION=1, ENEMY_MULTIPLIER=8/7;
const SKILLS={
  "peashooter": {
    "id": "peashooter",
    "plantNameZh": "豌豆射手",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常发射6颗20伤害豌豆后，第7颗变为40伤害大豌豆；7发共160伤害，较原版140提升至8/7。",
    "descriptionZh": "正常发射6颗20伤害豌豆后，第7颗变为40伤害大豌豆；7发共160伤害，较原版140提升至8/7。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "peashooter",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "snow-pea": {
    "id": "snow-pea",
    "plantNameZh": "寒冰射手",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "snow-pea",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "puff-shroom": {
    "id": "puff-shroom",
    "plantNameZh": "小喷菇",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 11,
      "plant": "puff-shroom",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "fume-shroom": {
    "id": "fume-shroom",
    "plantNameZh": "大喷菇",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 11,
      "plant": "fume-shroom",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "scaredy-shroom": {
    "id": "scaredy-shroom",
    "plantNameZh": "胆小菇",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 11,
      "plant": "scaredy-shroom",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "threepeater": {
    "id": "threepeater",
    "plantNameZh": "三线射手",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "threepeater",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "sea-shroom": {
    "id": "sea-shroom",
    "plantNameZh": "海蘑菇",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 31,
      "plant": "sea-shroom",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "cactus": {
    "id": "cactus",
    "plantNameZh": "仙人掌",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "cactus",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "split-pea": {
    "id": "split-pea",
    "plantNameZh": "裂荚射手",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "split-pea",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "starfruit": {
    "id": "starfruit",
    "plantNameZh": "杨桃",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "starfruit",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "cabbage-pult": {
    "id": "cabbage-pult",
    "plantNameZh": "卷心菜投手",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 41,
      "plant": "cabbage-pult",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "kernel-pult": {
    "id": "kernel-pult",
    "plantNameZh": "玉米投手",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 41,
      "plant": "kernel-pult",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "melon-pult": {
    "id": "melon-pult",
    "plantNameZh": "西瓜投手",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 41,
      "plant": "melon-pult",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "gloom-shroom": {
    "id": "gloom-shroom",
    "plantNameZh": "忧郁蘑菇",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 11,
      "plant": "gloom-shroom",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "cattail": {
    "id": "cattail",
    "plantNameZh": "香蒲",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 21,
      "plant": "cattail",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "winter-melon": {
    "id": "winter-melon",
    "plantNameZh": "冰西瓜",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "蓄能重击",
    "nameZh": "蓄能重击",
    "description": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "descriptionZh": "正常攻击6轮后，第7轮整轮伤害翻倍；本轮的各方向、各弹丸、穿透及溅射一起强化。控制时长不翻倍。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 41,
      "plant": "winter-melon",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "布置可命中的存活目标；观察6轮普通攻击和第7轮强化。多弹、穿透与溅射核对整轮总伤害。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "sunflower": {
    "id": "sunflower",
    "plantNameZh": "向日葵",
    "classification": "persistent",
    "enabled": true,
    "threshold": 4,
    "chargeUnit": "normal-production",
    "hook": "sun-output",
    "effect": {
      "type": "double-sun",
      "valueMultiplier": 2
    },
    "name": "灿烂收获",
    "nameZh": "灿烂收获",
    "description": "正常产出4轮阳光后，第5轮阳光价值翻倍。阳光菇按当时生长阶段计算；双子按完整一轮两份阳光计算，不按阳光个数重复充能。",
    "descriptionZh": "正常产出4轮阳光后，第5轮阳光价值翻倍。阳光菇按当时生长阶段计算；双子按完整一轮两份阳光计算，不按阳光个数重复充能。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "sunflower",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "等待4次真实产出，第5轮检查总值：向日葵50，幼年/成年阳光菇30/50，双子100。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "sun-shroom": {
    "id": "sun-shroom",
    "plantNameZh": "阳光菇",
    "classification": "persistent",
    "enabled": true,
    "threshold": 4,
    "chargeUnit": "normal-production",
    "hook": "sun-output",
    "effect": {
      "type": "double-sun",
      "valueMultiplier": 2
    },
    "name": "灿烂收获",
    "nameZh": "灿烂收获",
    "description": "正常产出4轮阳光后，第5轮阳光价值翻倍。阳光菇按当时生长阶段计算；双子按完整一轮两份阳光计算，不按阳光个数重复充能。",
    "descriptionZh": "正常产出4轮阳光后，第5轮阳光价值翻倍。阳光菇按当时生长阶段计算；双子按完整一轮两份阳光计算，不按阳光个数重复充能。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 11,
      "plant": "sun-shroom",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "等待4次真实产出，第5轮检查总值：向日葵50，幼年/成年阳光菇30/50，双子100。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "twin-sunflower": {
    "id": "twin-sunflower",
    "plantNameZh": "双子向日葵",
    "classification": "persistent",
    "enabled": true,
    "threshold": 4,
    "chargeUnit": "normal-production",
    "hook": "sun-output",
    "effect": {
      "type": "double-sun",
      "valueMultiplier": 2
    },
    "name": "灿烂收获",
    "nameZh": "灿烂收获",
    "description": "正常产出4轮阳光后，第5轮阳光价值翻倍。阳光菇按当时生长阶段计算；双子按完整一轮两份阳光计算，不按阳光个数重复充能。",
    "descriptionZh": "正常产出4轮阳光后，第5轮阳光价值翻倍。阳光菇按当时生长阶段计算；双子按完整一轮两份阳光计算，不按阳光个数重复充能。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "twin-sunflower",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "等待4次真实产出，第5轮检查总值：向日葵50，幼年/成年阳光菇30/50，双子100。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "repeater": {
    "id": "repeater",
    "plantNameZh": "双发射手",
    "classification": "persistent",
    "enabled": true,
    "threshold": 12,
    "chargeUnit": "normal-bullet",
    "hook": "normal-shot",
    "effect": {
      "type": "repeater-burst",
      "duration": 2,
      "rateMultiplier": 1.8,
      "bulletsPerVolley": 2
    },
    "name": "快速连射",
    "nameZh": "快速连射",
    "description": "正常射出12颗豌豆（6轮双发）后，进入2秒快速连射：发射频率为正常1.8倍，每轮仍2颗；爆发弹丸不充能。",
    "descriptionZh": "正常射出12颗豌豆（6轮双发）后，进入2秒快速连射：发射频率为正常1.8倍，每轮仍2颗；爆发弹丸不充能。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "repeater",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "连续有效攻击6轮，核对第12颗普通弹后进入2秒爆发，随后从0恢复。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "gatling-pea": {
    "id": "gatling-pea",
    "plantNameZh": "机枪射手",
    "classification": "persistent",
    "enabled": true,
    "threshold": 4,
    "chargeUnit": "normal-volley",
    "hook": "normal-attack",
    "effect": {
      "type": "gatling-burst",
      "stages": [
        {
          "duration": 2,
          "rateMultiplier": 1.2,
          "bulletsPerVolley": 6
        },
        {
          "duration": 1,
          "rateMultiplier": 1.5,
          "bulletsPerVolley": 8
        }
      ],
      "duration": 3
    },
    "name": "三段过载",
    "nameZh": "三段过载",
    "description": "正常攻击4轮后，先持续2秒以正常1.2倍频率每轮6发，再持续1秒以正常1.5倍频率每轮8发；按最新平衡要求降低攻速倍率。过载全程不充能。",
    "descriptionZh": "正常攻击4轮后，先持续2秒以正常1.2倍频率每轮6发，再持续1秒以正常1.5倍频率每轮8发；按最新平衡要求降低攻速倍率。过载全程不充能。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "gatling-pea",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "观察4轮普通四发，2秒六发快射，1秒八发极限射；核对阶段边界与保存恢复。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "wall-nut": {
    "id": "wall-nut",
    "plantNameZh": "坚果墙",
    "classification": "persistent",
    "enabled": true,
    "threshold": 500.0,
    "chargeUnit": "actual-hp-loss",
    "hook": "plant-damaged",
    "effect": {
      "type": "repair",
      "healFraction": 0.015625,
      "damageThresholdFraction": 0.125
    },
    "name": "韧性修复",
    "nameZh": "韧性修复",
    "description": "每累计实际承受500点非致死伤害，恢复62.5点生命；不超过生命上限、不复活、不抵挡碾压秒杀。持续受伤时等效耐久约提升至8/7。",
    "descriptionZh": "每累计实际承受500点非致死伤害，恢复62.5点生命；不超过生命上限、不复活、不抵挡碾压秒杀。持续受伤时等效耐久约提升至8/7。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "wall-nut",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "让普通僵尸真实啃咬，记录累计伤害、充能条和一次回血；再核对巨人砸击或车辆碾压仍按原机制。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "tall-nut": {
    "id": "tall-nut",
    "plantNameZh": "高坚果",
    "classification": "persistent",
    "enabled": true,
    "threshold": 1000.0,
    "chargeUnit": "actual-hp-loss",
    "hook": "plant-damaged",
    "effect": {
      "type": "repair",
      "healFraction": 0.015625,
      "damageThresholdFraction": 0.125
    },
    "name": "韧性修复",
    "nameZh": "韧性修复",
    "description": "每累计实际承受1000点非致死伤害，恢复125点生命；不超过生命上限、不复活、不抵挡碾压秒杀。持续受伤时等效耐久约提升至8/7。",
    "descriptionZh": "每累计实际承受1000点非致死伤害，恢复125点生命；不超过生命上限、不复活、不抵挡碾压秒杀。持续受伤时等效耐久约提升至8/7。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "tall-nut",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "让普通僵尸真实啃咬，记录累计伤害、充能条和一次回血；再核对巨人砸击或车辆碾压仍按原机制。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "pumpkin": {
    "id": "pumpkin",
    "plantNameZh": "南瓜头",
    "classification": "persistent",
    "enabled": true,
    "threshold": 500.0,
    "chargeUnit": "actual-hp-loss",
    "hook": "plant-damaged",
    "effect": {
      "type": "repair",
      "healFraction": 0.015625,
      "damageThresholdFraction": 0.125
    },
    "name": "韧性修复",
    "nameZh": "韧性修复",
    "description": "每累计实际承受500点非致死伤害，恢复62.5点生命；不超过生命上限、不复活、不抵挡碾压秒杀。持续受伤时等效耐久约提升至8/7。",
    "descriptionZh": "每累计实际承受500点非致死伤害，恢复62.5点生命；不超过生命上限、不复活、不抵挡碾压秒杀。持续受伤时等效耐久约提升至8/7。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "pumpkin",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "让普通僵尸真实啃咬，记录累计伤害、充能条和一次回血；再核对巨人砸击或车辆碾压仍按原机制。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "lily-pad": {
    "id": "lily-pad",
    "plantNameZh": "睡莲",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-occupant-action",
    "hook": "occupant-normal-action",
    "effect": {
      "type": "host-shield",
      "shieldFraction": 0.125,
      "stacking": false
    },
    "name": "扎根护佑",
    "nameZh": "扎根护佑",
    "description": "上层植物正常攻击或生产6轮后，第7轮为其补充最多等于上层最大生命1/8的护盾；不叠加，护盾满时不消耗待发状态。空底座、休眠和强化动作不充能。",
    "descriptionZh": "上层植物正常攻击或生产6轮后，第7轮为其补充最多等于上层最大生命1/8的护盾；不叠加，护盾满时不消耗待发状态。空底座、休眠和强化动作不充能。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 21,
      "plant": "lily-pad",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "种植上层射手并布置敌人；观察6轮后第7轮护盾，再让僵尸攻击，验证护盾真实吸收且不会叠加。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "flower-pot": {
    "id": "flower-pot",
    "plantNameZh": "花盆",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-occupant-action",
    "hook": "occupant-normal-action",
    "effect": {
      "type": "host-shield",
      "shieldFraction": 0.125,
      "stacking": false
    },
    "name": "扎根护佑",
    "nameZh": "扎根护佑",
    "description": "上层植物正常攻击或生产6轮后，第7轮为其补充最多等于上层最大生命1/8的护盾；不叠加，护盾满时不消耗待发状态。空底座、休眠和强化动作不充能。",
    "descriptionZh": "上层植物正常攻击或生产6轮后，第7轮为其补充最多等于上层最大生命1/8的护盾；不叠加，护盾满时不消耗待发状态。空底座、休眠和强化动作不充能。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 41,
      "plant": "flower-pot",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "种植上层射手并布置敌人；观察6轮后第7轮护盾，再让僵尸攻击，验证护盾真实吸收且不会叠加。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "chomper": {
    "id": "chomper",
    "plantNameZh": "大嘴花",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-swallow",
    "hook": "swallow",
    "effect": {
      "type": "fast-digest",
      "digestSeconds": 21
    },
    "name": "轻快消化",
    "nameZh": "轻快消化",
    "description": "正常吞食6次后，第7次吞食消化时间减半为21秒；未吞下的啃咬和巨人目标不充能。",
    "descriptionZh": "正常吞食6次后，第7次吞食消化时间减半为21秒；未吞下的啃咬和巨人目标不充能。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "chomper",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "依次供应可吞食目标并快进真实消化；第7次计时21秒，对比普通42秒。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "spikeweed": {
    "id": "spikeweed",
    "plantNameZh": "地刺",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-damaging-tick",
    "hook": "spike-tick",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "锋芒地毯",
    "nameZh": "锋芒地毯",
    "description": "对有效步行目标造成伤害6轮后，第7轮地刺伤害翻倍；空场轮询不充能，扎爆轮胎不计入普通攻击。",
    "descriptionZh": "对有效步行目标造成伤害6轮后，第7轮地刺伤害翻倍；空场轮询不充能，扎爆轮胎不计入普通攻击。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "spikeweed",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "将步行目标置于地刺有效接触区，核对20×6后40；车辆仍按原机制。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "spikerock": {
    "id": "spikerock",
    "plantNameZh": "地刺王",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-damaging-tick",
    "hook": "spike-tick",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "钢岩锋芒",
    "nameZh": "钢岩锋芒",
    "description": "对有效步行目标造成伤害6轮后，第7轮伤害翻倍至80；保持原有九次抗碾压，不凭空补充次数。",
    "descriptionZh": "对有效步行目标造成伤害6轮后，第7轮伤害翻倍至80；保持原有九次抗碾压，不凭空补充次数。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "spikerock",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "目标站在地刺王上，核对40×6后80；抗碾压次数不受技能刷新影响。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "torchwood": {
    "id": "torchwood",
    "plantNameZh": "火炬树桩",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-fire-conversion",
    "hook": "pea-fire-conversion",
    "effect": {
      "type": "double-fire",
      "damageMultiplier": 2
    },
    "name": "炽热火种",
    "nameZh": "炽热火种",
    "description": "正常将6颗普通豌豆转为火球后，第7次火球转换伤害翻倍；保留来弹原有伤害倍率，强化来弹不再给火炬充能，寒冰豌豆仅解冻不充能。",
    "descriptionZh": "正常将6颗普通豌豆转为火球后，第7次火球转换伤害翻倍；保留来弹原有伤害倍率，强化来弹不再给火炬充能，寒冰豌豆仅解冻不充能。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "torchwood",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "在射手前种植火炬，观察6次普通火球和第7次重火球；另测大豌豆穿过火炬后不被固定40覆盖。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "plantern": {
    "id": "plantern",
    "plantNameZh": "路灯花",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "nearby-normal-volley",
    "hook": "nearby-ally-normal-attack",
    "effect": {
      "type": "light-slow",
      "radius": 1.5,
      "duration": 1,
      "allyRadius": 1
    },
    "name": "光晕脉冲",
    "nameZh": "光晕脉冲",
    "description": "相邻一格友方真实有效普通攻击6轮后，第7轮释放半径1.5格、持续1秒的减速光晕；本体照雾功能不变，空场和强化攻击不充能。",
    "descriptionZh": "相邻一格友方真实有效普通攻击6轮后，第7轮释放半径1.5格、持续1秒的减速光晕；本体照雾功能不变，空场和强化攻击不充能。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 31,
      "plant": "plantern",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "让相邻射手有效射击，并让敌人进入光晕半径；核对第7轮真实减速，而非虚构DPS。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "magnet-shroom": {
    "id": "magnet-shroom",
    "plantNameZh": "磁力菇",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-removal",
    "hook": "metal-removed",
    "effect": {
      "type": "instant-rearm",
      "cooldown": 0
    },
    "name": "连锁吸附",
    "nameZh": "连锁吸附",
    "description": "实际吸走6次金属装备或梯子后，第7次吸附不进入15秒冷却，可立即继续吸附；强化吸附不计入新一轮。",
    "descriptionZh": "实际吸走6次金属装备或梯子后，第7次吸附不进入15秒冷却，可立即继续吸附；强化吸附不计入新一轮。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 11,
      "plant": "magnet-shroom",
      "row": 2,
      "col": 3,
      "zombies": [
        "bucket"
      ],
      "steps": "逐个提供带金属目标或梯子；第7次移除后立刻检测新的有效目标，不预先凭空移除护甲。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "gold-magnet": {
    "id": "gold-magnet",
    "plantNameZh": "吸金磁",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-collection-batch",
    "hook": "coin-collected-batch",
    "effect": {
      "type": "double-coins",
      "valueMultiplier": 2
    },
    "name": "金色回响",
    "nameZh": "金色回响",
    "description": "真实收集6批金币后，第7批金币总价值翻倍；每批最多5枚按一轮计数，空收集不充能。",
    "descriptionZh": "真实收集6批金币后，第7批金币总价值翻倍；每批最多5枚按一轮计数，空收集不充能。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "gold-magnet",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "用金盏花产出真实金币，分7批收集，对比第7批入账值与原始币值。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "garlic": {
    "id": "garlic",
    "plantNameZh": "大蒜",
    "classification": "persistent",
    "enabled": true,
    "threshold": 2,
    "chargeUnit": "normal-redirect",
    "hook": "garlic-redirect",
    "effect": {
      "type": "redirect-stun",
      "duration": 1.4
    },
    "name": "辛香迷眩",
    "nameZh": "辛香迷眩",
    "description": "正常成功改道2次后，第3次改道的停顿延长为1.4秒（原0.7秒）；不能改道不充能，受伤量和原生命不变。",
    "descriptionZh": "正常成功改道2次后，第3次改道的停顿延长为1.4秒（原0.7秒）；不能改道不充能，受伤量和原生命不变。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "garlic",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "在可改道陆地放入3名僵尸，分别完成真实啃咬改道；第3次核对1.4秒停顿。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "umbrella-leaf": {
    "id": "umbrella-leaf",
    "plantNameZh": "叶子保护伞",
    "classification": "persistent",
    "enabled": true,
    "threshold": 3,
    "chargeUnit": "normal-interception",
    "hook": "umbrella-block",
    "effect": {
      "type": "intercept-slow",
      "radius": 1.5,
      "duration": 1.5
    },
    "name": "回风屏障",
    "nameZh": "回风屏障",
    "description": "真实拦截3次蹦极或篮球后，第4次拦截释放半径1.5格、持续1.5秒的减速回风；查询保护范围本身不充能。",
    "descriptionZh": "真实拦截3次蹦极或篮球后，第4次拦截释放半径1.5格、持续1.5秒的减速回风；查询保护范围本身不充能。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 41,
      "plant": "umbrella-leaf",
      "row": 2,
      "col": 3,
      "zombies": [
        "catapult"
      ],
      "steps": "连续4次真实篮球/蹦极攻击保护范围内植物，第四次观察附近僵尸减速；保护查询不可重复计数。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "marigold": {
    "id": "marigold",
    "plantNameZh": "金盏花",
    "classification": "persistent",
    "enabled": true,
    "threshold": 4,
    "chargeUnit": "normal-production",
    "hook": "coin-output",
    "effect": {
      "type": "double-coin-output",
      "valueMultiplier": 2
    },
    "name": "丰盈花开",
    "nameZh": "丰盈花开",
    "description": "正常产出4枚金币后，第5枚金币价值从10提升到20；按真实产出事件充能，与是否手动拾取无关。",
    "descriptionZh": "正常产出4枚金币后，第5枚金币价值从10提升到20；按真实产出事件充能，与是否手动拾取无关。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 1,
      "plant": "marigold",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "等待5次真实产币，检查第5枚价值20，普通币10。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "cob-cannon": {
    "id": "cob-cannon",
    "plantNameZh": "玉米加农炮",
    "classification": "persistent",
    "enabled": true,
    "threshold": 6,
    "chargeUnit": "normal-manual-launch",
    "hook": "cob-fired",
    "effect": {
      "type": "double-volley",
      "damageMultiplier": 2
    },
    "name": "重载玉米",
    "nameZh": "重载玉米",
    "description": "成功手动发射6枚玉米后，第7枚爆炸伤害翻倍；装填、瞄准取消和空操作不充能，装填时间不变。",
    "descriptionZh": "成功手动发射6枚玉米后，第7枚爆炸伤害翻倍；装填、瞄准取消和空操作不充能，装填时间不变。",
    "recovery": "技能结束后清零，重新积攒；强化动作不充能",
    "recoveryText": "技能结束后清零，重新积攒；强化动作不充能",
    "demo": {
      "level": 41,
      "plant": "cob-cannon",
      "row": 2,
      "col": 3,
      "zombies": [
        "normal"
      ],
      "steps": "连续6次有效发射并完成真实装填，再发第7枚，核对爆炸和范围伤害翻倍。",
      "note": "演示使用同一战斗引擎的真实动作与事件；加速演示时间可行，不得伪造充能或伤害。"
    }
  },
  "cherry-bomb": {
    "id": "cherry-bomb",
    "plantNameZh": "樱桃炸弹",
    "classification": "consumable",
    "enabled": false,
    "threshold": 0,
    "chargeUnit": "none",
    "hook": null,
    "effect": {
      "type": "none"
    },
    "name": "一次性植物",
    "nameZh": "一次性植物",
    "description": "爆炸后消失，没有持续充能技能；保持原有效果。",
    "descriptionZh": "爆炸后消失，没有持续充能技能；保持原有效果。",
    "recovery": "不适用",
    "recoveryText": "不适用",
    "demo": {
      "plant": "cherry-bomb",
      "note": "演示原有一次性动作，不显示虚假充能条。"
    }
  },
  "potato-mine": {
    "id": "potato-mine",
    "plantNameZh": "土豆雷",
    "classification": "consumable",
    "enabled": false,
    "threshold": 0,
    "chargeUnit": "none",
    "hook": null,
    "effect": {
      "type": "none"
    },
    "name": "一次性植物",
    "nameZh": "一次性植物",
    "description": "触发后消失，没有持续充能技能；保持原有效果。",
    "descriptionZh": "触发后消失，没有持续充能技能；保持原有效果。",
    "recovery": "不适用",
    "recoveryText": "不适用",
    "demo": {
      "plant": "potato-mine",
      "note": "演示原有一次性动作，不显示虚假充能条。"
    }
  },
  "grave-buster": {
    "id": "grave-buster",
    "plantNameZh": "墓碑吞噬者",
    "classification": "consumable",
    "enabled": false,
    "threshold": 0,
    "chargeUnit": "none",
    "hook": null,
    "effect": {
      "type": "none"
    },
    "name": "一次性植物",
    "nameZh": "一次性植物",
    "description": "清墓后消失，没有持续充能技能；保持原有效果。",
    "descriptionZh": "清墓后消失，没有持续充能技能；保持原有效果。",
    "recovery": "不适用",
    "recoveryText": "不适用",
    "demo": {
      "plant": "grave-buster",
      "note": "演示原有一次性动作，不显示虚假充能条。"
    }
  },
  "hypno-shroom": {
    "id": "hypno-shroom",
    "plantNameZh": "魅惑菇",
    "classification": "consumable",
    "enabled": false,
    "threshold": 0,
    "chargeUnit": "none",
    "hook": null,
    "effect": {
      "type": "none"
    },
    "name": "一次性植物",
    "nameZh": "一次性植物",
    "description": "被吃掉后完成魅惑，没有持续充能技能；保持原有效果。",
    "descriptionZh": "被吃掉后完成魅惑，没有持续充能技能；保持原有效果。",
    "recovery": "不适用",
    "recoveryText": "不适用",
    "demo": {
      "plant": "hypno-shroom",
      "note": "演示原有一次性动作，不显示虚假充能条。"
    }
  },
  "ice-shroom": {
    "id": "ice-shroom",
    "plantNameZh": "寒冰菇",
    "classification": "consumable",
    "enabled": false,
    "threshold": 0,
    "chargeUnit": "none",
    "hook": null,
    "effect": {
      "type": "none"
    },
    "name": "一次性植物",
    "nameZh": "一次性植物",
    "description": "冻结后消失，没有持续充能技能；保持原有效果。",
    "descriptionZh": "冻结后消失，没有持续充能技能；保持原有效果。",
    "recovery": "不适用",
    "recoveryText": "不适用",
    "demo": {
      "plant": "ice-shroom",
      "note": "演示原有一次性动作，不显示虚假充能条。"
    }
  },
  "doom-shroom": {
    "id": "doom-shroom",
    "plantNameZh": "毁灭菇",
    "classification": "consumable",
    "enabled": false,
    "threshold": 0,
    "chargeUnit": "none",
    "hook": null,
    "effect": {
      "type": "none"
    },
    "name": "一次性植物",
    "nameZh": "一次性植物",
    "description": "爆炸后消失，没有持续充能技能；保持原有效果。",
    "descriptionZh": "爆炸后消失，没有持续充能技能；保持原有效果。",
    "recovery": "不适用",
    "recoveryText": "不适用",
    "demo": {
      "plant": "doom-shroom",
      "note": "演示原有一次性动作，不显示虚假充能条。"
    }
  },
  "squash": {
    "id": "squash",
    "plantNameZh": "窝瓜",
    "classification": "consumable",
    "enabled": false,
    "threshold": 0,
    "chargeUnit": "none",
    "hook": null,
    "effect": {
      "type": "none"
    },
    "name": "一次性植物",
    "nameZh": "一次性植物",
    "description": "压击后消失，没有持续充能技能；保持原有效果。",
    "descriptionZh": "压击后消失，没有持续充能技能；保持原有效果。",
    "recovery": "不适用",
    "recoveryText": "不适用",
    "demo": {
      "plant": "squash",
      "note": "演示原有一次性动作，不显示虚假充能条。"
    }
  },
  "tangle-kelp": {
    "id": "tangle-kelp",
    "plantNameZh": "缠绕海草",
    "classification": "consumable",
    "enabled": false,
    "threshold": 0,
    "chargeUnit": "none",
    "hook": null,
    "effect": {
      "type": "none"
    },
    "name": "一次性植物",
    "nameZh": "一次性植物",
    "description": "拖走目标后消失，没有持续充能技能；保持原有效果。",
    "descriptionZh": "拖走目标后消失，没有持续充能技能；保持原有效果。",
    "recovery": "不适用",
    "recoveryText": "不适用",
    "demo": {
      "plant": "tangle-kelp",
      "note": "演示原有一次性动作，不显示虚假充能条。"
    }
  },
  "jalapeno": {
    "id": "jalapeno",
    "plantNameZh": "火爆辣椒",
    "classification": "consumable",
    "enabled": false,
    "threshold": 0,
    "chargeUnit": "none",
    "hook": null,
    "effect": {
      "type": "none"
    },
    "name": "一次性植物",
    "nameZh": "一次性植物",
    "description": "清行后消失，没有持续充能技能；保持原有效果。",
    "descriptionZh": "清行后消失，没有持续充能技能；保持原有效果。",
    "recovery": "不适用",
    "recoveryText": "不适用",
    "demo": {
      "plant": "jalapeno",
      "note": "演示原有一次性动作，不显示虚假充能条。"
    }
  },
  "blover": {
    "id": "blover",
    "plantNameZh": "三叶草",
    "classification": "consumable",
    "enabled": false,
    "threshold": 0,
    "chargeUnit": "none",
    "hook": null,
    "effect": {
      "type": "none"
    },
    "name": "一次性植物",
    "nameZh": "一次性植物",
    "description": "吹风后消失，没有持续充能技能；保持原有效果。",
    "descriptionZh": "吹风后消失，没有持续充能技能；保持原有效果。",
    "recovery": "不适用",
    "recoveryText": "不适用",
    "demo": {
      "plant": "blover",
      "note": "演示原有一次性动作，不显示虚假充能条。"
    }
  },
  "coffee-bean": {
    "id": "coffee-bean",
    "plantNameZh": "咖啡豆",
    "classification": "consumable",
    "enabled": false,
    "threshold": 0,
    "chargeUnit": "none",
    "hook": null,
    "effect": {
      "type": "none"
    },
    "name": "一次性植物",
    "nameZh": "一次性植物",
    "description": "唤醒后消失，没有持续充能技能；保持原有效果。",
    "descriptionZh": "唤醒后消失，没有持续充能技能；保持原有效果。",
    "recovery": "不适用",
    "recoveryText": "不适用",
    "demo": {
      "plant": "coffee-bean",
      "note": "演示原有一次性动作，不显示虚假充能条。"
    }
  },
  "imitater": {
    "id": "imitater",
    "plantNameZh": "模仿者",
    "classification": "inherit",
    "enabled": true,
    "threshold": 0,
    "chargeUnit": "inherited",
    "hook": "imitater-transformed",
    "effect": {
      "type": "inherit-target",
      "resetCharge": true
    },
    "name": "同形同技",
    "nameZh": "同形同技",
    "description": "变身完成后，继承目标植物的完整技能与分类，从0充能；模仿一次性植物则没有持续技能，变身期间不充能。",
    "descriptionZh": "变身完成后，继承目标植物的完整技能与分类，从0充能；模仿一次性植物则没有持续技能，变身期间不充能。",
    "recovery": "按变身目标技能计算",
    "recoveryText": "按变身目标技能计算",
    "demo": {
      "plant": "imitater",
      "imitaterKind": "peashooter",
      "steps": "等待3.2秒真实变身，再观察6发普通豌豆与第7发强化；另测模仿樱桃无持续技能。"
    }
  }
};
function getSkill(kind){return Object.prototype.hasOwnProperty.call(SKILLS,kind)?SKILLS[kind]:null;}
function isPersistent(kind){return getSkill(kind)?.classification==='persistent';}
const api={SCHEMA_VERSION,ENEMY_MULTIPLIER,SKILLS,getSkill,get:getSkill,isPersistent};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PVZSkills=api;
})(typeof globalThis!=='undefined'?globalThis:this);
