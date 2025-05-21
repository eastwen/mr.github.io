<script setup>
import { ref, onUnmounted, watch, computed, onMounted } from 'vue'

// 资源状态
const wood = ref(99)
const stone = ref(99)
const iron = ref(0)
const water = ref(0)
const fire = ref(true)
const driedMeat = ref(0)
const fur = ref(0)
const scales = ref(0)
const teeth = ref(0)
const bait = ref(0)
const cloth = ref(0)
const spikyGrass = ref(99)
const traps = ref(0) // 新增陷阱数量状态
const log = ref([])
// 房屋等级状态
const houseLevel = ref(1)
const maxHouseLevel = 10 // 假设最大房屋等级为10
// 冷却相关状态
const gatherCooldown = ref(false)
const gatherCooldownTime = ref(0)
let gatherCooldownTimer = null
let gatherAnimationFrameId = null; // 新增：用于存储 gatherWood 动画帧 ID
// 陷阱建造冷却状态
const trapCooldown = ref(false)
const trapCooldownTime = ref(0)
let trapCooldownTimer = null
const trapAnimationFrameId = ref(null); // 新增：用于存储 buildTrap 动画帧 ID

// 等级、经验、工人数状态
const level = ref(1)
const exp = ref(0)
const maxLevel = 100
const totalWorkers = ref(0) // 已招募工人数
const maxWorkersCapacity = ref(5); // 最大工人容量，初始值设定为5
const lumberMillWorkers = ref(0)
const clothFactoryWorkers = ref(0)
const huntersLodgeWorkers = ref(0)
const curingStationWorkers = ref(0)
const rawMeat = ref(0) // 新增生肉资源

const assignedWorkers = computed(() => lumberMillWorkers.value + clothFactoryWorkers.value + huntersLodgeWorkers.value + curingStationWorkers.value)
const availableWorkers = computed(() => totalWorkers.value - assignedWorkers.value)
const temperatureColor = computed(() => {
  if (temperature.value > 20) return '#FF7700'; // 红色表示温暖
  if (temperature.value >= 0 && temperature.value <= 20) return '#21D96E'; // 绿色表示正常
  return '#0077FF'; // 蓝色表示寒冷
})

// 工人自动收集定时器 (旧的，将被移除或改造)
// let workerCollectInterval = null 
// 各建筑生产定时器
let lumberMillInterval = null;
let clothFactoryInterval = null;
let huntersLodgeInterval = null;
let curingStationInterval = null;
let unassignedWorkerInterval = null; // 新增：未分配工人收集定时器
let trapCollectInterval = null; // 新增：陷阱自动收集定时器

// 天气状态
const weatherStatus = ref('晴朗')
const temperature = ref(20)
let weatherInterval = null
const weatherPhases = [
  { name: '正常', weathers: ['晴朗', '多云', '小雨'], duration: 300000 }, // 正常阶段 5分钟
  { name: '转冷', weathers: ['阴天', '寒风', '冷雨'], duration: 300000 }, // 转冷阶段 5分钟
  { name: '寒冷', weathers: ['寒冷', '大雪', '冰雹'], duration: 300000 }, // 寒冷阶段 5分钟
  { name: '极寒末世', weathers: ['寒冷', '极寒', '暴风雪'], duration: -1 } // 最终阶段，持续时间-1表示永久
];
const currentPhaseIndex = ref(0); // 当前所处的天气阶段
const currentWeatherIndex = ref(0); // 当前天气在当前阶段中的索引

// 等级名称映射
const levelNames = [
  '初级', // 1-10
  '中级', // 11-30
  '高级', // 31-60
  '大师', // 61-90
  '宗师'  // 91-100
]
function getLevelName() {
  if (level.value <= 10) return levelNames[0]
  if (level.value <= 30) return levelNames[1]
  if (level.value <= 60) return levelNames[2]
  if (level.value <= 90) return levelNames[3]
  return levelNames[4]
}
// tabs 状态
const tabs = ['房子', '建筑', '探险']
const currentTab = ref('房子')

function setTab(tab) {
  currentTab.value = tab
}

function ignite() {
  if (wood.value > 0 && !fire.value) {
    fire.value = true
    wood.value--
    log.value.unshift('你点燃了火堆。')
  } else if (fire.value) {
    log.value.unshift('火堆已经燃烧着。')
  } else {
    log.value.unshift('没有足够的木材点火。')
  }
}

function gatherWood() {
  if (gatherCooldown.value) return
  // 启动冷却
  const baseCooldown = 1; // 最低冷却时间1秒
  const levelMultiplier = 0.1; // 每级增加0.1秒
  const calculatedCooldown = baseCooldown + level.value * levelMultiplier;
  const totalCooldownTime = Math.max(baseCooldown, calculatedCooldown); // 确保冷却时间不低于最低值

  gatherCooldownTime.value = 0; // 重置动画进度
  gatherCooldown.value = true; // 启动冷却
  
  // 启动进度条动画
  const startTime = Date.now();
  let animationFrameId = null;

  function updateProgress() {
    const elapsedTime = Date.now() - startTime;
    const progress = (elapsedTime / (totalCooldownTime * 1000)) * 100;
    gatherCooldownTime.value = Math.min(progress, 100);

    if (progress < 100) {
      animationFrameId = requestAnimationFrame(updateProgress);
    }
  }

  animationFrameId = requestAnimationFrame(updateProgress);

  // 在冷却时间结束后再增加木材和日志
  gatherCooldownTimer = setTimeout(() => {
    let collectedResource = '';
    const rand = Math.random();
    if (rand < 0.6) { // 60% 几率获得木材
      collectedResource = '木材';
    } else if (rand < 0.68) { // 8% 石头
      collectedResource = '石头';
    } else if (rand < 0.76) { // 8% 铁
      collectedResource = '铁';
    } else if (rand < 0.84) { // 8% 水
      collectedResource = '水';
    } else if (rand < 0.92) { // 8% 刺草
      collectedResource = '刺草';
    } else { // 8% 没有收获
      collectedResource = '没有收获';
    }

    switch (collectedResource) {
      case '木材':
        wood.value++;
        break;
      case '石头':
        stone.value++;
        break;
      case '铁':
        iron.value++;
        break;
      case '水':
        water.value++;
        break;
      case '刺草':
        spikyGrass.value++;
        break;
      // 其他非基础物资不再通过手动收集获得
    }

    exp.value += 2;
    checkLevelUp();
    if (collectedResource === '没有收获') {
      log.value.push('你没有收集到任何东西。');
    } else {
      log.value.push(`你收集了一份${collectedResource}。`);
    }
    gatherCooldown.value = false;
  }, totalCooldownTime * 1000);
}

function recruitWorker() {
  if (totalWorkers.value < maxWorkersCapacity.value) {
    if (wood.value >= 10) { // 招募工人成本
      wood.value -= 10;
      totalWorkers.value++;
      log.value.push('你招募了一名工人。已招募: ' + totalWorkers.value + ' / ' + maxWorkersCapacity.value);
    } else {
      log.value.push('没有足够的木材招募工人。');
    }
  } else {
    log.value.push('已达到最大工人容量，无法招募更多工人。');
  }
}

/* // 旧的工人自动收集逻辑，已被新的建筑分配系统取代
watch(totalWorkers, (newWorkersCount) => {
  if (workerCollectInterval) {
    clearInterval(workerCollectInterval);
    workerCollectInterval = null;
  }
  if (newWorkersCount > 0 && availableWorkers.value > 0) { // 确保有可用工人且总工人数大于0
    // 此处逻辑需要调整或移除，因为工人现在被分配到特定建筑
    // workerCollectInterval = setInterval(() => {
    //   const collectedWood = availableWorkers.value; // 假设可用工人自动收集木材
    //   if (collectedWood > 0) {
    //      wood.value += collectedWood;
    //      log.value.push(`剩余的 ${collectedWood} 名工人收集了 ${collectedWood} 根木材。`);
    //   }
    // }, 5000); 
  }
});
*/

// 工人分配函数
function assignWorkerTo(building) {
  if (availableWorkers.value > 0) {
    switch (building) {
      case 'lumberMill':
        lumberMillWorkers.value++;
        log.value.push('一名工人被分配到伐木场。');
        break;
      case 'clothFactory':
        clothFactoryWorkers.value++;
        log.value.push('一名工人被分配到布料厂。');
        break;
      case 'huntersLodge':
        huntersLodgeWorkers.value++;
        log.value.push('一名工人被分配到猎人小屋。');
        break;
      case 'curingStation':
        curingStationWorkers.value++;
        log.value.push('一名工人被分配到腌肉厂。');
        break;
    }
  } else {
    log.value.push('没有可用的工人进行分配。');
  }
}

function unassignWorkerFrom(building) {
  switch (building) {
    case 'lumberMill':
      if (lumberMillWorkers.value > 0) {
        lumberMillWorkers.value--;
        log.value.push('一名工人从伐木场被召回。');
      } else {
        log.value.push('伐木场没有工人可召回。');
      }
      break;
    case 'clothFactory':
      if (clothFactoryWorkers.value > 0) {
        clothFactoryWorkers.value--;
        log.value.push('一名工人从布料厂被召回。');
      } else {
        log.value.push('布料厂没有工人可召回。');
      }
      break;
    case 'huntersLodge':
      if (huntersLodgeWorkers.value > 0) {
        huntersLodgeWorkers.value--;
        log.value.push('一名工人从猎人小屋被召回。');
      } else {
        log.value.push('猎人小屋没有工人可召回。');
      }
      break;
    case 'curingStation':
      if (curingStationWorkers.value > 0) {
        curingStationWorkers.value--;
        log.value.push('一名工人从腌肉厂被召回。');
      } else {
        log.value.push('腌肉厂没有工人可召回。');
      }
      break;
  }
}

// 建筑生产逻辑
watch(lumberMillWorkers, (newCount) => {
  if (lumberMillInterval) clearInterval(lumberMillInterval);
  if (newCount > 0) {
    lumberMillInterval = setInterval(() => {
      const producedWood = newCount * 1; // 每工人产1木材
      wood.value += producedWood;
      log.value.push(`伐木场的 ${newCount} 名工人生产了 ${producedWood} 木材。`);
    }, 5000); // 5秒生产一次
  }
});

watch(clothFactoryWorkers, (newCount) => {
  if (clothFactoryInterval) clearInterval(clothFactoryInterval);
  if (newCount > 0) {
    clothFactoryInterval = setInterval(() => {
      const neededSpikyGrass = newCount * 1; // 每工人需1尖刺草
      if (spikyGrass.value >= neededSpikyGrass) {
        spikyGrass.value -= neededSpikyGrass;
        cloth.value += newCount; // 每工人产1布料
        log.value.push(`布料厂的 ${newCount} 名工人生产了 ${newCount} 布料 (消耗 ${neededSpikyGrass} 尖刺草)。`);
      } else {
        log.value.push(`布料厂因缺少尖刺草，工人无法生产布料。`);
      }
    }, 6000); // 6秒生产一次
  }
});

watch(huntersLodgeWorkers, (newCount) => {
  if (huntersLodgeInterval) clearInterval(huntersLodgeInterval);
  if (newCount > 0) {
    huntersLodgeInterval = setInterval(() => {
      let producedItemsLog = [];
      let expGained = 0;
      for (let i = 0; i < newCount; i++) {
        const huntRoll = Math.random();
        if (huntRoll < 0.4) { // 40% 生肉
          rawMeat.value++;
          producedItemsLog.push("1 生肉");
        } else if (huntRoll < 0.7) { // 30% 毛皮
          fur.value++;
          producedItemsLog.push("1 毛皮");
        } else if (huntRoll < 0.9) { // 20% 牙齿
          teeth.value++;
          producedItemsLog.push("1 牙齿");
        } else { // 10% 鳞片
          scales.value++;
          producedItemsLog.push("1 鳞片");
        }
        // expGained += 1; // 每次狩猎尝试获得经验
      }
      if (producedItemsLog.length > 0) {
        log.value.push(`猎人小屋的 ${newCount} 名工人带回: ${producedItemsLog.join(', ')}。`);
      }
      // if (expGained > 0) {
      //   exp.value += expGained;
      //   checkLevelUp();
      // }
    }, 7000); // 7秒狩猎一次
  }
});

watch(curingStationWorkers, (newCount) => {
  if (curingStationInterval) clearInterval(curingStationInterval);
  if (newCount > 0) {
    curingStationInterval = setInterval(() => {
      const neededRawMeat = newCount * 1;
      const neededWood = newCount * 1; // 腌制也需要木材
      if (rawMeat.value >= neededRawMeat && wood.value >= neededWood) {
        rawMeat.value -= neededRawMeat;
        wood.value -= neededWood;
        driedMeat.value += newCount;
        log.value.push(`腌肉厂的 ${newCount} 名工人制作了 ${newCount} 肉干 (消耗 ${neededRawMeat} 生肉, ${neededWood} 木材)。`);
      } else {
        let missing = [];
        if (rawMeat.value < neededRawMeat) missing.push("生肉");
        if (wood.value < neededWood) missing.push("木材");
        log.value.push(`腌肉厂因缺少 ${missing.join('和')}，工人无法制作肉干。`);
      }
    }, 8000); // 8秒制作一次
  }
});

watch(traps, (newCount) => {
  if (trapCollectInterval) clearInterval(trapCollectInterval);
  if (newCount > 0) {
    trapCollectInterval = setInterval(() => {
      let collectedItemsLog = [];
      for (let i = 0; i < newCount; i++) {
        const trapRoll = Math.random();
        if (trapRoll < 0.4) { // 40% 生肉
          rawMeat.value++;
          collectedItemsLog.push("1 生肉");
        } else if (trapRoll < 0.7) { // 30% 毛皮
          fur.value++;
          collectedItemsLog.push("1 毛皮");
        } else if (trapRoll < 0.9) { // 20% 牙齿
          teeth.value++;
          collectedItemsLog.push("1 牙齿");
        } else { // 10% 鳞片
          scales.value++;
          collectedItemsLog.push("1 鳞片");
        }
      }
      if (collectedItemsLog.length > 0) {
        log.value.push(`${newCount} 个陷阱捕获到: ${collectedItemsLog.join(', ')}。`);
      }
    }, 10000); // 每10秒尝试捕获一次
  }
});

// 未分配工人自动收集基础物资
watch(availableWorkers, (newAvailableCount) => {
  if (unassignedWorkerInterval) {
    clearInterval(unassignedWorkerInterval);
    unassignedWorkerInterval = null;
  }
  if (newAvailableCount > 0) {
    unassignedWorkerInterval = setInterval(() => {
      let collectedItemsSummary = {}; // 用于汇总本次收集的各项资源数量

      for (let i = 0; i < newAvailableCount; i++) {
        let collectedResource = '';
        const rand = Math.random();
        if (rand < 0.6) { // 60% 几率获得木材
          collectedResource = '木材';
        } else if (rand < 0.7) { // 10% 石头
          collectedResource = '石头';
        } else if (rand < 0.8) { // 10% 铁
          collectedResource = '铁';
        } else if (rand < 0.9) { // 10% 水
          collectedResource = '水';
        } else { // 10% 刺草
          collectedResource = '刺草';
        }
        switch (collectedResource) {
          case '木材':
            wood.value++;
            break;
          case '石头':
            stone.value++;
            break;
          case '铁':
            iron.value++;
            break;
          case '水':
            water.value++;
            break;
          case '刺草':
            spikyGrass.value++;
            break;
        }
        // 记录收集到的资源类型和数量
        collectedItemsSummary[collectedResource] = (collectedItemsSummary[collectedResource] || 0) + 1;
      }

      // 生成日志消息
      let logMessageParts = [];
      for (const resourceName in collectedItemsSummary) {
        logMessageParts.push(`${collectedItemsSummary[resourceName]} ${resourceName}`);
      }
      if (logMessageParts.length > 0) {
        log.value.push(`${newAvailableCount} 名可用工人收集了: ${logMessageParts.join(', ')}。`);
      }
// ...
watch(availableWorkers, (newAvailableCount) => {
  // ...
  if (newAvailableCount > 0) {
    unassignedWorkerInterval = setInterval(() => {
      // ...
      // 可选：为工人收集行为增加少量经验
      exp.value += newAvailableCount; 
      checkLevelUp();
      // ...
    }, 5000); // 每5秒收集一次
  }
});
// ...// ...
watch(availableWorkers, (newAvailableCount) => {
  // ...
  if (newAvailableCount > 0) {
    unassignedWorkerInterval = setInterval(() => {
      // ...
      // 可选：为工人收集行为增加少量经验
      exp.value += newAvailableCount; 
      checkLevelUp();
      // ...
    }, 5000); // 每5秒收集一次
  }
});
// ...      // 可选：为工人收集行为增加少量经验
      exp.value += newAvailableCount; 
      checkLevelUp();

    }, 5000); // 每5秒收集一次
  }
});

// 更新天气函数
function updateWeather() {
  const currentPhase = weatherPhases[currentPhaseIndex.value];
  const currentWeathers = currentPhase.weathers;
  
  // 更新当前天气
  currentWeatherIndex.value = (currentWeatherIndex.value + 1) % currentWeathers.length;
  weatherStatus.value = currentWeathers[currentWeatherIndex.value];

  // 根据当前阶段和天气设置温度
  switch (currentPhase.name) {
    case '正常':
      temperature.value = Math.floor(Math.random() * 11) + 15; // 15-25度
      break;
    case '转冷':
      temperature.value = Math.floor(Math.random() * 11) + 5; // 5-15度
      break;
    case '寒冷':
      temperature.value = Math.floor(Math.random() * 11) - 10; // -10-0度
      break;
    case '极寒末世':
      switch (weatherStatus.value) {
        case '寒冷':
          temperature.value = Math.floor(Math.random() * 11) - 20; // -20到-10度
          break;
        case '极寒':
          temperature.value = Math.floor(Math.random() * 21) - 40; // -40到-20度
          break;
        case '暴风雪':
          temperature.value = Math.floor(Math.random() * 21) - 60; // -60到-40度
          break;
      }
      break;
  }

  log.value.push(`天气变为 ${weatherStatus.value}，温度 ${temperature.value}℃。`);

  // 检查是否需要进入下一个天气阶段
  if (currentPhase.duration > 0) { // duration为-1的阶段不会过渡到下一阶段
    setTimeout(() => {
      if (currentPhaseIndex.value < weatherPhases.length - 1) {
        currentPhaseIndex.value++;
        log.value.push(`世界进入了${weatherPhases[currentPhaseIndex.value].name}时期。`);
      }
    }, currentPhase.duration);
  }
}

// 组件挂载时启动天气更新定时器
onMounted(() => {
  // 初始天气设置为晴朗
  weatherStatus.value = '晴朗';
  temperature.value = Math.floor(Math.random() * 11) + 15; // 初始温度在15-25度之间
  log.value.push(`初始天气：${weatherStatus.value}，温度 ${temperature.value}℃。`);
  log.value.push('世界处于正常时期。');

  weatherInterval = setInterval(updateWeather, 30000); // 每30秒更新一次天气
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (gatherCooldownTimer) {
    clearTimeout(gatherCooldownTimer);
  }
  if (gatherAnimationFrameId) {
    cancelAnimationFrame(gatherAnimationFrameId);
  }
  if (trapCooldownTimer) {
    clearTimeout(trapCooldownTimer);
  }
  if (trapAnimationFrameId) {
    cancelAnimationFrame(trapAnimationFrameId);
  }
  if (houseExpandCooldownTimer) {
    clearTimeout(houseExpandCooldownTimer);
  }
  if (houseExpandAnimationFrameId) {
    cancelAnimationFrame(houseExpandAnimationFrameId);
  }
  if (workerCollectInterval) {
    clearInterval(workerCollectInterval); // Though this interval is now unused
  }
  if (lumberMillInterval) clearInterval(lumberMillInterval);
  if (clothFactoryInterval) clearInterval(clothFactoryInterval);
  if (huntersLodgeInterval) clearInterval(huntersLodgeInterval);
  if (curingStationInterval) clearInterval(curingStationInterval);
  if (unassignedWorkerInterval) clearInterval(unassignedWorkerInterval); // 清理未分配工人定时器
  if (trapCollectInterval) clearInterval(trapCollectInterval); // 清理陷阱定时器
    if (weatherInterval) {
    clearInterval(weatherInterval);
  }
});

// 导出状态和函数供模板使用
// export default {
//   setup() {
//     return {
//       wood,
//       stone,
//       iron,
//       water,
//       fire,
//       driedMeat,
//       fur,
//       scales,
//       teeth,
//       bait,
//       cloth,
//       spikyGrass,
//       traps,
//       log,
//       houseLevel,
//       maxHouseLevel,
//       gatherCooldown,
//       gatherCooldownTime,
//       level,
//       exp,
//       maxLevel,
//       totalWorkers,
//       maxWorkersCapacity,
//       lumberMillWorkers,
//       clothFactoryWorkers,
//       huntersLodgeWorkers,
//       curingStationWorkers,
//       rawMeat,
//       assignedWorkers,
//       availableWorkers,
//       temperatureColor,
//       weatherStatus,
//       temperature,
//       tabs,
//       currentTab,
//       getLevelName,
//       setTab,
//       ignite,
//       gatherWood,
//       recruitWorker,
//       assignWorkerTo,
//       unassignWorkerFrom,
//       checkLevelUp,
//       getExpToNextLevel,
//       addWoodToFire,
//       getHouseUpgradeCost,
//       expandHouse,
//       buildTrap
//     }
//   }
// }

function checkLevelUp() {
  while (level.value < maxLevel && exp.value >= getExpToNextLevel()) {
    exp.value -= getExpToNextLevel()
    level.value++
    log.value.push('恭喜你升级到了等级 ' + level.value + '！')
  }
}

function getExpToNextLevel() {
  // 升级所需经验固定为 100
  return 100
}

function addWoodToFire() {
  if (fire.value && wood.value > 0) {
    wood.value--;
    temperature.value += 10; // 增加温度，幅度加大
    log.value.push('你向火堆添加了一根木材，温度升高了。');
  } else if (!fire.value) {
    log.value.push('火还没有点燃。');
  } else {
    log.value.push('没有木材可以添加。');
  }
}

// 计算扩建房屋所需资源
function getHouseUpgradeCost(level) {
  const baseWood = 20;
  const baseStone = 15;
  const woodCost = baseWood + (level - 1) * 5; // 每级木材消耗增加5
  const stoneCost = baseStone + (level - 1) * 4; // 每级石头消耗增加4
  return { wood: woodCost, stone: stoneCost };
}

// 房屋扩建冷却状态
const houseExpandCooldown = ref(false)
const houseExpandCooldownTime = ref(0)
let houseExpandCooldownTimer = null
let houseExpandAnimationFrameId = null; // 新增：用于存储 expandHouse 动画帧 ID

// 扩建房屋函数
function expandHouse() {
  if (houseExpandCooldown.value) return; // 如果在冷却中，直接返回
  
  const currentLevel = houseLevel.value;
  if (currentLevel >= maxHouseLevel) {
    log.value.push('房屋已达到最高等级。');
    return;
  }

  const cost = getHouseUpgradeCost(currentLevel);

  if (wood.value >= cost.wood && stone.value >= cost.stone) {
    // 启动冷却和进度条
    const upgradeTime = 5; // 扩建时间5秒
    houseExpandCooldownTime.value = 0; // 重置进度条
    houseExpandCooldown.value = true;

    // 启动进度条动画
    const startTime = Date.now();
    let currentAnimationFrameId = null;

    function updateProgress() {
      const elapsedTime = Date.now() - startTime;
      const progress = (elapsedTime / (upgradeTime * 1000)) * 100;
      houseExpandCooldownTime.value = Math.min(progress, 100);

      if (progress < 100) {
        currentAnimationFrameId = requestAnimationFrame(updateProgress);
      }
    }

    houseExpandAnimationFrameId = requestAnimationFrame(updateProgress);

    // 在建造时间结束后执行扩建逻辑
    houseExpandCooldownTimer = setTimeout(() => {
      if (houseExpandAnimationFrameId) {
        cancelAnimationFrame(houseExpandAnimationFrameId);
      }
      wood.value -= cost.wood;
      stone.value -= cost.stone;
      houseLevel.value++;
      maxWorkersCapacity.value += 2; // 每次扩建增加2个最大工人容量
      log.value.push(`房屋扩建成功！当前等级: ${houseLevel.value}。最大工人容量增加到 ${maxWorkersCapacity.value}。`);
      houseExpandCooldown.value = false;
    }, upgradeTime * 1000);
  } else {
    let missing = [];
    if (wood.value < cost.wood) missing.push('木材');
    if (stone.value < cost.stone) missing.push('石头');
    log.value.push(`扩建房屋需要 ${cost.wood} 木材和 ${cost.stone} 石头，你缺少 ${missing.join('和')}。`);
  }
}

// 建造陷阱函数
function buildTrap() {
  if (trapCooldown.value) return; // 如果在冷却中，直接返回
  
  const woodCost = 5; // 建造陷阱所需木材
  const spikyGrassCost = 3; // 建造陷阱所需刺草

  if (wood.value >= woodCost && spikyGrass.value >= spikyGrassCost) {
    // 启动冷却和进度条
    const buildTime = 3; // 建造时间3秒
    trapCooldownTime.value = 0; // 重置动画进度
    trapCooldown.value = true;
    
    // 启动进度条动画
    const startTime = Date.now();
    let currentAnimationFrameId = null;

    function updateProgress() {
      const elapsedTime = Date.now() - startTime;
      const progress = (elapsedTime / (buildTime * 1000)) * 100;
      trapCooldownTime.value = Math.min(progress, 100);

      if (progress < 100) {
        currentAnimationFrameId = requestAnimationFrame(updateProgress);
      }
    }

    currentAnimationFrameId = requestAnimationFrame(updateProgress);
    trapAnimationFrameId.value = currentAnimationFrameId; // Store the animation frame ID

    // 在建造时间结束后再执行建造逻辑
    trapCooldownTimer = setTimeout(() => {
      cancelAnimationFrame(trapAnimationFrameId.value); // 清除动画帧
      trapAnimationFrameId.value = null; // Reset the stored ID
      wood.value -= woodCost;
      spikyGrass.value -= spikyGrassCost;
      traps.value++;
      log.value.push(`你建造了一个陷阱。当前陷阱数量: ${traps.value}。`);
      trapCooldown.value = false;
    }, buildTime * 1000);
  } else {
    let missing = [];
    if (wood.value < woodCost) missing.push('木材');
    if (spikyGrass.value < spikyGrassCost) missing.push('刺草');
    log.value.push(`建造陷阱需要 ${woodCost} 木材和 ${spikyGrassCost} 刺草，你缺少 ${missing.join('和')}。`);
  }
}

// 导出状态和函数供模板使用
defineExpose({
  wood,
  stone,
  iron,
  water,
  fire,
  driedMeat,
  fur,
  scales,
  teeth,
  bait,
  cloth,
  spikyGrass,
  traps,
  log,
  houseLevel,
  maxHouseLevel,
  gatherCooldown,
  gatherCooldownTime,
  houseExpandCooldown,
  houseExpandCooldownTime,
  level,
  exp,
  maxLevel,
  totalWorkers,
  maxWorkersCapacity,
  lumberMillWorkers,
  clothFactoryWorkers,
  huntersLodgeWorkers,
  curingStationWorkers,
  rawMeat,
  assignedWorkers,
  availableWorkers,
  temperatureColor,
  weatherStatus,
  temperature,
  tabs,
  currentTab,
  getLevelName,
  setTab,
  ignite,
  gatherWood,
  recruitWorker,
  assignWorkerTo,
  unassignWorkerFrom,
  checkLevelUp,
  getExpToNextLevel,
  addWoodToFire,
  getHouseUpgradeCost,
  expandHouse,
  buildTrap
});
</script>

<template>
  <div>
    <div class="main-layout">
      <div class="log">
        <div class="log-title">日志记录</div>
        <div v-for="(item, idx) in [...log].reverse()" :key="idx" class="log-item">{{ item }}</div>
      </div>
      <div class="main-content">
        <div class="title-tabs-row">
          <h1 class="game-title">小黑屋</h1>
          <div class="tabs-bar-inline">
            <div v-for="tab in tabs" :key="tab" :class="['tab-item', {active: currentTab === tab}]" @click="setTab(tab)">
              {{ tab }}
            </div>
          </div>
        </div>
        <!-- 新增信息栏 -->
        <div class="status-bar">
          <ul class="status-list">
            <li class="status-item">
              {{ getLevelName() }}：{{ level }} / {{ maxLevel }}（经验：{{ exp }} / 100）
            </li>
            <li class="status-item">已招募工人：{{ totalWorkers }} / {{ maxWorkersCapacity }}</li>
            <li class="status-item">已分配：{{ assignedWorkers }}</li>
          </ul>
        </div>
        <div class="status-bar">
          <div class="status-item weather-info" :style="{ color: temperatureColor, fontWeight: 700 }">
            天气：{{ weatherStatus }}，温度：{{ temperature }}℃
          </div>
        </div>
        <div v-if="currentTab === '房子'">
          <div class="actions house-actions">
            <button class="action-btn gather-btn" :disabled="gatherCooldown" @click="gatherWood">
              <span>收集</span>
              <div v-if="gatherCooldown" class="cooldown-bar active" :style="{'--progress': gatherCooldownTime + '%'}"></div>
            </button>
            <button class="action-btn" @click="recruitWorker">招募工人</button>
            <button class="action-btn" @click="addWoodToFire">添加木材</button>
          </div>
        </div>
        <div v-else-if="currentTab === '建筑'">
          <div class="actions building-actions">
            <button class="action-btn house-btn" @click="expandHouse" :class="{'disabled': houseExpandCooldown || houseLevel >= maxHouseLevel || wood < getHouseUpgradeCost(houseLevel).wood || stone < getHouseUpgradeCost(houseLevel).stone}">
              <span>扩建房子 ({{ houseLevel }}/{{ maxHouseLevel }})</span>
              <span v-if="houseLevel < maxHouseLevel"> (消耗: {{ getHouseUpgradeCost(houseLevel).wood }} 木材, {{ getHouseUpgradeCost(houseLevel).stone }} 石头)</span>
              <div v-if="houseExpandCooldown" class="cooldown-bar active" :style="{'--progress': houseExpandCooldownTime + '%'}"></div>
            </button>
            <button class="action-btn trap-btn" @click="buildTrap" :disabled="trapCooldown || wood < 5 || spikyGrass < 3">
              <span>建造陷阱 ({{ traps }})</span>
              <span v-if="wood < 5 || spikyGrass < 3"> (消耗: 5 木材, 3 刺草)</span>
              <div v-if="trapCooldown" class="cooldown-bar active" :style="{'--progress': trapCooldownTime + '%'}"></div>
            </button>
            
            <div class="building-control">
              <span>伐木场 (工人: {{ lumberMillWorkers }})</span>
              <div>
                <button class="action-btn-small" @click="assignWorkerTo('lumberMill')" :disabled="availableWorkers === 0">+</button>
                <button class="action-btn-small" @click="unassignWorkerFrom('lumberMill')" :disabled="lumberMillWorkers === 0">-</button>
              </div>
            </div>

            <div class="building-control">
              <span>布料厂 (工人: {{ clothFactoryWorkers }})</span>
              <div>
                <button class="action-btn-small" @click="assignWorkerTo('clothFactory')" :disabled="availableWorkers === 0">+</button>
                <button class="action-btn-small" @click="unassignWorkerFrom('clothFactory')" :disabled="clothFactoryWorkers === 0">-</button>
              </div>
            </div>

            <div class="building-control">
              <span>猎人小屋 (工人: {{ huntersLodgeWorkers }})</span>
              <div>
                <button class="action-btn-small" @click="assignWorkerTo('huntersLodge')" :disabled="availableWorkers === 0">+</button>
                <button class="action-btn-small" @click="unassignWorkerFrom('huntersLodge')" :disabled="huntersLodgeWorkers === 0">-</button>
              </div>
            </div>

            <div class="building-control">
              <span>腌肉厂 (工人: {{ curingStationWorkers }})</span>
              <div>
                <button class="action-btn-small" @click="assignWorkerTo('curingStation')" :disabled="availableWorkers === 0">+</button>
                <button class="action-btn-small" @click="unassignWorkerFrom('curingStation')" :disabled="curingStationWorkers === 0">-</button>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="currentTab === '探险'">
          <div style="padding: 24px 0;">探险功能开发中...</div>
        </div>
      </div>
      <div class="inventory-bar">
        <div class="inventory-title">库存栏</div>
        <div class="inventory-item">木材：<span class="resource-count">{{ wood }}</span></div>
        <div class="inventory-item">石头：<span class="resource-count">{{ stone }}</span></div>
        <div class="inventory-item">铁：<span class="resource-count">{{ iron }}</span></div>
        <div class="inventory-item">水：<span class="resource-count">{{ water }}</span></div>
        <div class="inventory-item">刺草：<span class="resource-count">{{ spikyGrass }}</span></div>
        <div class="inventory-item">肉干：<span class="resource-count">{{ driedMeat }}</span></div>
        <div class="inventory-item">毛皮：<span class="resource-count">{{ fur }}</span></div>
        <div class="inventory-item">鳞片：<span class="resource-count">{{ scales }}</span></div>
        <div class="inventory-item">牙齿：<span class="resource-count">{{ teeth }}</span></div>
        <div class="inventory-item">诱饵：<span class="resource-count">{{ bait }}</span></div>
        <div class="inventory-item">布料：<span class="resource-count">{{ cloth }}</span></div>
        <div class="inventory-item">生肉：<span class="resource-count">{{ rawMeat }}</span></div>
        <!-- 可扩展更多资源 -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.title-tabs-row {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 22px;
}
.tabs-bar-inline {
  display: flex;
  gap: 0;
  background: #f7faff;
  border-radius: 8px;
  border: 1.5px solid #e3eaf2;
  overflow: hidden;
  box-shadow: 0 2px 8px 0 rgba(60,120,240,0.04);
}
.tabs-bar {
  display: none;
}
.tab-item {
  font-size: 1.13em;
  padding: 10px 36px;
  border: none;
  border-radius: 0;
  cursor: pointer;
  background: transparent;
  color: #222;
  transition: background 0.18s, color 0.18s;
  outline: none;
  font-weight: 500;
  flex: 1 1 0;
  text-align: center;
  position: relative;
}
.tab-item:not(:last-child) {
  border-right: 1.5px solid #e3eaf2;
}
.tab-item.active {
  background: #010e1b;
  color: #fff;
  font-weight: bold;
  z-index: 1;
  box-shadow: 0 2px 8px 0 rgba(60,120,240,0.08);
}
.tab-item:hover:not(.active) {
  background: #eaf4ff;
  color: #409eff;
}

.main-layout {
  min-width: 1200px;
  max-width: 1200px;
  width: 700px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
}
.inventory-bar {
  min-width: 180px;
  max-width: 220px;
  min-height: 220px;
  background: #f8f8f8;
  border-radius: 7px;
  border: 1.5px solid #111;
  color: #222;
  margin-left: 32px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 1.08em;
  box-sizing: border-box;
}
.inventory-title {
  font-weight: bold;
  font-size: 1.1em;
  margin-bottom: 8px;
  border-bottom: 1px solid #bbb;
  padding-bottom: 4px;
}
.inventory-item {
  padding: 2px 0;
}
.status {
  display: none;
}
.log {
  background: #fafafa;
  min-width: 260px;
  max-width: 320px;
  min-height: 320px;
  padding: 12px 10px;
  border-radius: 7px;
  font-size: 1em;
  border: 1.5px solid #111;
  color: #222;
  max-height: 420px;
  overflow-y: auto;
  margin-right: 32px;
}
.log-item {
  margin-bottom: 2px;
  word-break: break-all;
}
.main-content {
  flex: 1;
  text-align: left;
}
.game-title {
  text-align: left;
  font-size: 2.1em;
  font-weight: bold;
  letter-spacing: 0.1em;
  margin-bottom: 22px;
  color: #111;
  padding-bottom: 10px;
  margin-left: 0;
}
.status {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
  font-size: 1.08em;
}
.status-bar {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
  font-size: 1.08em;
  gap: 24px;
}
.status-list {
  display: flex;
  align-items: center;
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.status-item {
  padding: 2px 0;
}
.fire-on {
  color: #111;
  background: #eee;
  border-radius: 4px;
  padding: 2px 8px;
  border: 1px solid #111;
}
.fire-off {
  color: #fff;
  background: #111;
  border-radius: 4px;
  padding: 2px 8px;
  border: 1px solid #111;
}
.resource-count {
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f5f5f5;
  border: 1px solid #bbb;
  color: #222;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}
.action-btn {
  padding: 8px 22px;
  background: #fff;
  color: #111;
  border: 2px solid #111;
  border-radius: 8px;
  font-size: 1.08em;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
  outline: none;
}
.action-btn:hover {
  background: #111;
  color: #fff;
}
.log-title {
  font-weight: bold;
  font-size: 1.08em;
  margin-bottom: 8px;
  color: #333;
}
.action-btn.gather-btn, .action-btn.trap-btn, .action-btn.house-btn {
  position: relative;
  min-width: 110px;
  overflow: hidden;
}
.action-btn.gather-btn:disabled, .action-btn.trap-btn:disabled{
  background-color: #888;
  cursor: not-allowed;
}
.cooldown-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  width: 0%;
  pointer-events: none;
  transition: width 50ms linear;
}
.cooldown-bar.active {
  width: var(--progress);
}
.building-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #eee;
}
.building-control:last-child {
  border-bottom: none;
}
.building-control span {
  font-size: 1.05em;
}
.action-btn-small {
  padding: 5px 10px;
  font-size: 1em;
  margin-left: 8px;
  background: #fff;
  color: #111;
  border: 1.5px solid #111;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  min-width: 30px; /* Ensure buttons have some width */
  text-align: center;
}
.action-btn-small:hover:not(:disabled) {
  background: #111;
  color: #fff;
}
.action-btn-small:disabled {
  background-color: #e0e0e0;
  color: #999;
  cursor: not-allowed;
  border-color: #ccc;
}

.house-actions .action-btn,
.building-actions .action-btn:not(.action-btn-small) { /* Exclude small buttons from this rule if they are inside .building-actions */
  max-width: 150px;
}
</style>
