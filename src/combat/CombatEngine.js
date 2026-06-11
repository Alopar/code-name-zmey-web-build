import { emit, GameEvents } from "../core/EventBus.js";
import { executeCombatAbility, getCombatAbilityConfig } from "./abilities/index.js";
import { setAnimCompleteHandler } from "./combatAnimBridge.js";
import { setFeedbackCompleteHandler } from "./combatFeedbackBridge.js";
import {
  getBloodSplashEffectOptions,
  getEnemyConfig,
  getEnemyLootTable,
  getFloatingTextEffectOptions,
  getOnDeathEffectOptions,
  getOnDeathEffects,
} from "./config/enemies.js";
import { CombatChest } from "./entities/CombatChest.js";
import { CombatLootDrop } from "./entities/CombatLootDrop.js";
import { grantLootDrops } from "../loot/grantLootDrops.js";
import { getLootContainerConfig } from "../loot/config/lootContainers.js";
import { rollCombatLoot } from "../loot/rollCombatLoot.js";
import { rollSingleLootDrop } from "../loot/rollSingleLootDrop.js";
import { COMBAT_BASE_Y, COMBAT_CENTER_X } from "../game/combatEnemyLayout.js";
import { layoutLootBelowChest } from "../game/combatChestLootLayout.js";
import { INFO_TOAST_TYPES } from "../ui/infoToast/config/infoToastTypes.js";
import { delay } from "./delay.js";
import { CombatSequencer } from "./CombatSequencer.js";
import { calcWeaponDamage } from "../weapon/calcDamage.js";

/** @typedef {"player" | "resolving" | "ended"} CombatPhase */

/** Пауза после фидбека, перед первым ходом врага в раунде. */
const ENEMY_RECOVERY_MS = 500;

export class CombatEngine {
  /**
   * @param {ReturnType<import("./CombatEncounter.js").createCombatEncounter>} encounter
   */
  constructor(encounter) {
    this.encounter = encounter;
    /** @type {CombatPhase} */
    this.phase = "player";
    this.victory = false;
    /** @type {string | null} */
    this.selectedTargetId = null;
    this.sequencer = new CombatSequencer();
    this.combatAbilityIds = encounter.combatAbilityIds ?? [];
    /** @type {Map<string, number>} */
    this.abilityCooldowns = new Map(
      this.combatAbilityIds.map((id) => [id, 0]),
    );
  }

  /** @type {CombatLootDrop[]} */
  #lootDrops = [];

  /** @type {CombatChest[]} */
  #chests = [];

  start() {
    emit(GameEvents.COMBAT_STARTED, { encounter: this.#encounterSnapshot() });
    this.#broadcastState();
  }

  /** Синхронизирует UI с текущим состоянием модели боя. */
  refreshState() {
    this.#broadcastState();
  }

  /**
   * @param {string} enemyId
   * @param {{ x: number, y: number }} position
   * @returns {CombatLootDrop | null}
   */
  trySpawnLootFromEnemy(enemyId, position) {
    const enemyConfig = getEnemyConfig(enemyId);
    const lootTable = getEnemyLootTable(enemyConfig);
    const rolled = rollSingleLootDrop(lootTable);

    if (!rolled) {
      return null;
    }

    const drop = new CombatLootDrop({
      resourceId: rolled.resourceId,
      amount: rolled.amount,
      x: position.x,
      y: position.y,
    });

    this.#lootDrops.push(drop);
    this.#broadcastState();
    return drop;
  }

  /**
   * @param {{ containerId: string, x: number, y: number }} data
   * @returns {CombatChest}
   */
  spawnVictoryChest({ containerId, x, y }) {
    const chest = new CombatChest({ containerId, x, y });
    this.#chests.push(chest);
    this.#broadcastState();
    return chest;
  }

  /** @returns {readonly CombatChest[]} */
  getChests() {
    return this.#chests;
  }

  /**
   * @param {string} chestId
   * @returns {{ tapped: boolean, readyToOpen: boolean } | null}
   */
  tapChest(chestId) {
    const chest = this.#chests.find((c) => c.id === chestId);
    if (!chest || chest.opened || this.phase !== "ended" || !this.victory) {
      return null;
    }

    chest.tapCount += 1;
    const readyToOpen = chest.tapCount >= chest.requiredTaps;
    this.#broadcastState();
    return { tapped: true, readyToOpen };
  }

  /**
   * @param {string} chestId
   * @returns {CombatLootDrop[]}
   */
  openChest(chestId) {
    const chest = this.#chests.find((c) => c.id === chestId);
    if (!chest || chest.opened || this.phase !== "ended" || !this.victory) {
      return [];
    }

    if (chest.tapCount < chest.requiredTaps) {
      return [];
    }

    const containerConfig = getLootContainerConfig(chest.containerId);
    const rolled = rollCombatLoot(containerConfig.loot);
    const positions = layoutLootBelowChest(chest.x, chest.y, rolled);

    const drops = rolled.map((item, index) => {
      const pos = positions[index] ?? { x: chest.x, y: chest.y };
      return new CombatLootDrop({
        resourceId: item.resourceId,
        amount: item.amount,
        x: pos.x,
        y: pos.y,
      });
    });

    for (const drop of drops) {
      this.#lootDrops.push(drop);
      chest.lootDropIds.push(drop.id);
    }

    chest.opened = true;
    this.#broadcastState();
    return drops;
  }

  /**
   * @param {string} dropId
   * @returns {{ resourceId: string, amount: number } | null}
   */
  pickupLoot(dropId) {
    const drop = this.#lootDrops.find((d) => d.id === dropId && !d.pickedUp);
    if (!drop) {
      return null;
    }

    drop.pickedUp = true;
    const grantDrop = { resourceId: drop.resourceId, amount: drop.amount };

    grantLootDrops([grantDrop], {
      combatPlayer: this.encounter.player,
    });

    emit(GameEvents.INFO_TOAST, {
      type: INFO_TOAST_TYPES.LOOT,
      drops: [grantDrop],
    });

    this.#broadcastState();
    return grantDrop;
  }

  /**
   * @param {string} combatantId
   */
  selectTarget(combatantId) {
    if (this.phase !== "player") {
      return;
    }

    const enemy = this.encounter.enemies.find((e) => e.id === combatantId);
    if (!enemy || enemy.hp <= 0) {
      return;
    }

    if (this.selectedTargetId === combatantId) {
      this.selectedTargetId = null;
    } else {
      this.selectedTargetId = combatantId;
    }
    this.#broadcastState();
  }

  requestPlayerAttack() {
    if (this.phase !== "player") {
      return;
    }

    const target = this.#resolveAttackTarget();
    if (!target) {
      return;
    }

    const { player } = this.encounter;
    const damage = calcWeaponDamage(player.weaponId);
    const enemyConfig = getEnemyConfig(target.enemyId);
    const visual = enemyConfig.visual ?? {};
    const onHitEffects = visual.feedback?.onHit ?? ["redBlink", "shake", "bloodSplash"];
    const onHitEffectOptions = {
      ...(visual.feedback?.effectOptions ?? {}),
      bloodSplash: getBloodSplashEffectOptions(enemyConfig),
      floatingText: getFloatingTextEffectOptions(enemyConfig, damage),
    };

    this.phase = "resolving";
    this.#broadcastState();

    const previousHpPercent = target.getHpPercent();

    this.sequencer.enqueue([
      {
        run: () => {
          target.takeDamage(damage);
        },
      },
      {
        async: true,
        run: (_ctx, done) => {
          emit(GameEvents.COMBAT_FEEDBACK_REQUEST, {
            type: "enemy_hit",
            combatantId: target.id,
            enemyId: target.enemyId,
            damage,
            previousHpPercent,
            hpPercent: target.getHpPercent(),
            effects: onHitEffects,
            effectOptions: onHitEffectOptions,
          });
          setFeedbackCompleteHandler(() => done());
        },
      },
      {
        run: () => {
          this.#sanitizeSelectedTarget();
          this.#broadcastState();
        },
      },
      ...this.#buildEnemyDeathSteps(target, enemyConfig),
      {
        run: () => {
          if (this.#areAllEnemiesDead()) {
            this.#endCombat(true);
            return { stop: true };
          }
        },
      },
      ...this.#buildAllEnemyTurnSteps(ENEMY_RECOVERY_MS),
      this.#buildReturnToPlayerStep(),
    ]);

    void this.sequencer.run(this);
  }

  requestPlayerWait() {
    if (this.phase !== "player") {
      return;
    }

    if (!this.#getAliveEnemies().length) {
      return;
    }

    this.phase = "resolving";
    this.#broadcastState();

    this.sequencer.enqueue([
      ...this.#buildAllEnemyTurnSteps(0),
      this.#buildReturnToPlayerStep(),
    ]);

    void this.sequencer.run(this);
  }

  requestRetreat() {
    if (this.phase !== "player") {
      return false;
    }

    if (!this.#getAliveEnemies().length) {
      return false;
    }

    this.phase = "resolving";
    this.#broadcastState();
    return true;
  }

  /**
   * @param {string} abilityId
   */
  requestPlayerAbility(abilityId) {
    if (this.phase !== "player") {
      return;
    }

    if (!this.#getAliveEnemies().length) {
      return;
    }

    if (!this.combatAbilityIds.includes(abilityId)) {
      return;
    }

    if ((this.abilityCooldowns.get(abilityId) ?? 0) > 0) {
      return;
    }

    const { player } = this.encounter;
    const result = executeCombatAbility(abilityId, player);
    if (!result.success) {
      return;
    }

    const abilityConfig = getCombatAbilityConfig(abilityId);
    const healAmount = result.healAmount ?? 0;

    this.phase = "resolving";
    this.#broadcastState();

    this.sequencer.enqueue([
      {
        run: () => {
          this.abilityCooldowns.set(abilityId, abilityConfig.cooldownTurns);
        },
      },
      {
        async: true,
        run: (_ctx, done) => {
          emit(GameEvents.COMBAT_FEEDBACK_REQUEST, {
            type: "player_heal",
            healAmount,
          });
          setFeedbackCompleteHandler(() => done());
        },
      },
      {
        run: () => {
          this.#broadcastState();
        },
      },
      ...this.#buildAllEnemyTurnSteps(0),
      this.#buildReturnToPlayerStep(),
    ]);

    void this.sequencer.run(this);
  }

  /**
   * @param {boolean} victory
   */
  #endCombat(victory) {
    this.phase = "ended";
    this.victory = victory;

    if (victory) {
      this.#ensureVictoryChestSpawned();
    }

    this.#broadcastState();
    emit(GameEvents.COMBAT_ENDED, { victory });
  }

  #ensureVictoryChestSpawned() {
    if (this.#chests.length > 0) {
      return;
    }

    const chestId = this.encounter.location?.chestId;
    if (!chestId) {
      return;
    }

    this.spawnVictoryChest({
      containerId: chestId,
      x: COMBAT_CENTER_X,
      y: COMBAT_BASE_Y,
    });
  }

  #areAllEnemiesDead() {
    return this.encounter.enemies.every((e) => e.hp <= 0);
  }

  /** @returns {import("./entities/Enemy.js").Enemy[]} */
  #getAliveEnemies() {
    return this.encounter.enemies.filter((e) => e.hp > 0);
  }

  /**
   * @returns {import("./entities/Enemy.js").Enemy | null}
   */
  #resolveAttackTarget() {
    const alive = this.#getAliveEnemies();
    if (!alive.length) {
      return null;
    }

    if (this.selectedTargetId) {
      const selected = alive.find((e) => e.id === this.selectedTargetId);
      if (selected) {
        return selected;
      }
    }

    return alive[Math.floor(Math.random() * alive.length)];
  }

  #sanitizeSelectedTarget() {
    if (!this.selectedTargetId) {
      return;
    }

    const selected = this.encounter.enemies.find((e) => e.id === this.selectedTargetId);
    if (!selected || selected.hp <= 0) {
      this.selectedTargetId = null;
    }
  }

  /**
   * @param {import("./entities/Enemy.js").Enemy} enemy
   * @param {object} enemyConfig
   */
  #buildEnemyDeathSteps(enemy, enemyConfig) {
    const onDeathEffects = getOnDeathEffects(enemyConfig);
    const onDeathEffectOptions = getOnDeathEffectOptions(enemyConfig);

    return [
      {
        async: true,
        run: (_ctx, done) => {
          if (enemy.hp > 0) {
            done();
            return;
          }

          emit(GameEvents.COMBAT_FEEDBACK_REQUEST, {
            type: "enemy_death",
            combatantId: enemy.id,
            enemyId: enemy.enemyId,
            effects: onDeathEffects,
            effectOptions: onDeathEffectOptions,
          });
          setFeedbackCompleteHandler(() => done());
        },
      },
    ];
  }

  /**
   * Ходы врагов собираются в момент выполнения (после урона игрока).
   * @param {number} recoveryMs — пауза только перед первым врагом в раунде
   */
  #buildAllEnemyTurnSteps(recoveryMs) {
    return [
      {
        async: true,
        run: async (_ctx, done) => {
          const stopped = await this.#runAllEnemyTurns(recoveryMs);
          done(stopped ? { stop: true } : undefined);
        },
      },
    ];
  }

  /**
   * @param {number} recoveryMs
   * @returns {Promise<boolean>} true — остановить секвенсор
   */
  async #runAllEnemyTurns(recoveryMs) {
    const alive = this.#shuffleEnemies([...this.#getAliveEnemies()]);
    for (let index = 0; index < alive.length; index += 1) {
      if (this.phase === "ended") {
        return true;
      }
      const delayBefore = index === 0 ? recoveryMs : 0;
      const stopped = await this.#runSingleEnemyTurn(delayBefore, alive[index]);
      if (stopped) {
        return true;
      }
    }
    return false;
  }

  /**
   * @param {number} recoveryMs
   * @param {import("./entities/Enemy.js").Enemy} enemy
   * @returns {Promise<boolean>}
   */
  async #runSingleEnemyTurn(recoveryMs, enemy) {
    const { player } = this.encounter;

    if (recoveryMs > 0) {
      await delay(recoveryMs);
    }

    if (this.phase === "ended") {
      return true;
    }

    await new Promise((resolve) => {
      emit(GameEvents.COMBAT_ANIM_REQUEST, {
        type: "enemy_attack",
        combatantId: enemy.id,
        enemyId: enemy.enemyId,
      });
      setAnimCompleteHandler(() => resolve());
    });

    if (this.phase === "ended") {
      return true;
    }

    const damage = calcWeaponDamage(enemy.weaponId);
    player.takeDamage(damage);
    emit(GameEvents.COMBAT_SCREEN_FEEDBACK_REQUEST, {
      type: "player_hit",
      damage,
      effects: ["cameraShake"],
    });
    this.#broadcastState();

    if (player.hp <= 0) {
      this.#endCombat(false);
      return true;
    }

    return false;
  }

  /**
   * @param {import("./entities/Enemy.js").Enemy[]} enemies
   */
  #shuffleEnemies(enemies) {
    for (let i = enemies.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [enemies[i], enemies[j]] = [enemies[j], enemies[i]];
    }
    return enemies;
  }

  #buildReturnToPlayerStep() {
    return {
      run: () => {
        if (this.phase === "ended") {
          return;
        }
        this.#tickAbilityCooldowns();
        this.phase = "player";
        this.#broadcastState();
      },
    };
  }

  #tickAbilityCooldowns() {
    for (const [abilityId, remaining] of this.abilityCooldowns) {
      if (remaining > 0) {
        this.abilityCooldowns.set(abilityId, remaining - 1);
      }
    }
  }

  #broadcastState() {
    this.#sanitizeSelectedTarget();
    const canAct = this.phase === "player";
    const { player } = this.encounter;
    emit(GameEvents.COMBAT_STATE, {
      phase: this.phase,
      canAct,
      victory: this.victory,
      selectedTargetId: this.selectedTargetId,
      player: player.toSnapshot(),
      enemies: this.encounter.enemies.map((e) => e.toSnapshot()),
      lootDrops: this.#lootDrops.filter((d) => !d.pickedUp).map((d) => d.toSnapshot()),
      chests: this.#chests.map((c) => c.toSnapshot()),
      abilities: this.#buildAbilityStates(canAct, player),
    });
  }

  /**
   * @param {boolean} canAct
   * @param {import("./entities/Combatant.js").Combatant} player
   */
  #buildAbilityStates(canAct, player) {
    return this.combatAbilityIds.map((id) => {
      const config = getCombatAbilityConfig(id);
      const cooldownRemaining = this.abilityCooldowns.get(id) ?? 0;
      const onCooldown = cooldownRemaining > 0;
      const atFullHp = player.hp >= player.maxHp;
      const resourceId = config.resourceId ?? null;
      const resourceCost = config.resourceCost ?? 0;
      const resourceCount = resourceId ? player.getResourceCount(resourceId) : 0;
      const hasResource = !resourceId || resourceCount >= resourceCost;

      return {
        id,
        name: config.name,
        resourceId,
        resourceCount,
        cooldownRemaining,
        canUse: canAct && !onCooldown && !atFullHp && hasResource,
      };
    });
  }

  #encounterSnapshot() {
    return {
      location: this.encounter.location,
      settings: this.encounter.settings,
      player: this.encounter.player.toSnapshot(),
      enemies: this.encounter.enemies.map((e) => e.toSnapshot()),
    };
  }
}
