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
import { getChestSpawnPosition } from "../combat/config/combatSpawnGuides.js";
import { layoutLootBelowChest } from "../game/combatChestLootLayout.js";
import { INFO_TOAST_TYPES } from "../ui/infoToast/config/infoToastTypes.js";
import { delay } from "./delay.js";
import { CombatSequencer } from "./CombatSequencer.js";
import { calcWeaponDamage, rollDamageInRange } from "../weapon/calcDamage.js";
import { getWeaponConfig } from "../weapon/config/weapons.js";
import { WEAPON_SLOT_ORDER } from "../weapon/weaponSlots.js";
import {
  COMBAT_ACTION_IDS,
  CombatActionPoints,
  DEFAULT_ACTION_COST,
  PLAYER_ACTION_POINTS_MAX,
} from "./actions/CombatActionPoints.js";

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
    this.actionPoints = new CombatActionPoints({ max: PLAYER_ACTION_POINTS_MAX });
  }

  /** @type {CombatLootDrop[]} */
  #lootDrops = [];

  /** @type {CombatChest[]} */
  #chests = [];

  /** Пока true — идёт секвенция действия игрока, UI блокирует кнопки без затемнения. */
  #isResolvingPlayerAction = false;

  start() {
    this.actionPoints.resetTurn();
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

  /**
   * @param {import("../weapon/weaponSlots.js").WeaponSlot} slot
   */
  requestPlayerWeaponAttack(slot) {
    if (this.phase !== "player") {
      return;
    }

    const { player } = this.encounter;
    const weaponId = player.getWeaponIdForSlot(slot);
    if (!weaponId) {
      return;
    }

    const actionId = COMBAT_ACTION_IDS.attack(slot);
    if (!this.actionPoints.canUse(actionId, DEFAULT_ACTION_COST)) {
      return;
    }

    const target = this.#resolveAttackTarget();
    if (!target) {
      return;
    }

    if (!this.actionPoints.spend(actionId, DEFAULT_ACTION_COST)) {
      return;
    }

    const damage = calcWeaponDamage(weaponId);

    this.#beginPlayerActionResolution();
    this.#broadcastState();

    /** @type {ReturnType<CombatEngine["#applyDamageAndBuildHitPayload"]>[]} */
    let hitTargets = [];

    this.sequencer.enqueue([
      {
        run: () => {
          hitTargets = [this.#applyDamageAndBuildHitPayload(target, damage)];
        },
      },
      this.#buildEnemiesHitFeedbackStep(() => hitTargets),
      {
        run: () => {
          this.#sanitizeSelectedTarget();
          this.#broadcastState();
        },
      },
      this.#buildEnemiesDeathFeedbackStep(() =>
        target.hp <= 0 ? [this.#buildEnemyDeathTarget(target)] : [],
      ),
      {
        run: () => {
          if (this.#areAllEnemiesDead()) {
            this.#endCombat(true);
            return { stop: true };
          }
        },
      },
      ...this.#buildPostPlayerActionSteps(ENEMY_RECOVERY_MS),
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

    this.#beginPlayerActionResolution();
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

    this.#beginPlayerActionResolution();
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

    const actionId = COMBAT_ACTION_IDS.ability(abilityId);
    if (!this.actionPoints.canUse(actionId, DEFAULT_ACTION_COST)) {
      return;
    }

    const { player } = this.encounter;
    const result = executeCombatAbility(abilityId, player);
    if (!result.success) {
      return;
    }

    if (!this.actionPoints.spend(actionId, DEFAULT_ACTION_COST)) {
      return;
    }

    const abilityConfig = getCombatAbilityConfig(abilityId);
    this.abilityCooldowns.set(abilityId, abilityConfig.cooldownTurns);

    this.#beginPlayerActionResolution();
    this.#broadcastState();

    if (abilityConfig.kind === "aoe_damage") {
      this.#enqueueAoeDamageAbilitySteps(abilityId, abilityConfig);
      void this.sequencer.run(this);
      return;
    }

    const healAmount = result.healAmount ?? 0;

    this.sequencer.enqueue([
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
      ...this.#buildPostPlayerActionSteps(0),
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

    const locationId = this.encounter.location?.id ?? "jungle_road";
    const pos = getChestSpawnPosition(locationId);

    this.spawnVictoryChest({
      containerId: chestId,
      x: pos.x,
      y: pos.y,
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
   * @param {string} abilityId
   * @param {object} abilityConfig
   */
  #enqueueAoeDamageAbilitySteps(abilityId, abilityConfig) {
    /** @type {ReturnType<CombatEngine["#buildEnemyHitPayload"]>[]} */
    let hitPayloads = [];
    /** @type {import("./entities/Enemy.js").Enemy[]} */
    let killedEnemies = [];

    this.sequencer.enqueue([
      {
        run: () => {
          const alive = this.#getAliveEnemies();
          hitPayloads = [];
          killedEnemies = [];

          for (const enemy of alive) {
            const damage = rollDamageInRange(abilityConfig.damageMin, abilityConfig.damageMax);
            hitPayloads.push(this.#applyDamageAndBuildHitPayload(enemy, damage));
            if (enemy.hp <= 0) {
              killedEnemies.push(enemy);
            }
          }
        },
      },
      this.#buildEnemiesHitFeedbackStep(() => hitPayloads),
      {
        run: () => {
          this.#sanitizeSelectedTarget();
          this.#broadcastState();
        },
      },
      this.#buildEnemiesDeathFeedbackStep(() =>
        killedEnemies.map((enemy) => this.#buildEnemyDeathTarget(enemy)),
      ),
      {
        run: () => {
          if (this.#areAllEnemiesDead()) {
            this.#endCombat(true);
            return { stop: true };
          }
        },
      },
      ...this.#buildPostPlayerActionSteps(ENEMY_RECOVERY_MS),
    ]);
  }

  /**
   * @param {import("./entities/Enemy.js").Enemy} enemy
   * @param {number} damage
   */
  #applyDamageAndBuildHitPayload(enemy, damage) {
    const payload = this.#buildEnemyHitPayload(enemy, damage);
    enemy.takeDamage(damage);
    return {
      ...payload,
      hpPercent: enemy.getHpPercent(),
    };
  }

  /**
   * @param {import("./entities/Enemy.js").Enemy} enemy
   * @param {number} damage
   */
  #buildEnemyHitPayload(enemy, damage) {
    const enemyConfig = getEnemyConfig(enemy.enemyId);
    const visual = enemyConfig.visual ?? {};
    const onHitEffects = visual.feedback?.onHit ?? ["redBlink", "shake", "bloodSplash"];
    const onHitEffectOptions = {
      ...(visual.feedback?.effectOptions ?? {}),
      bloodSplash: getBloodSplashEffectOptions(enemyConfig),
      floatingText: getFloatingTextEffectOptions(enemyConfig, damage),
    };

    return {
      combatantId: enemy.id,
      enemyId: enemy.enemyId,
      damage,
      previousHpPercent: enemy.getHpPercent(),
      effects: onHitEffects,
      effectOptions: onHitEffectOptions,
    };
  }

  /**
   * @param {import("./entities/Enemy.js").Enemy} enemy
   */
  #buildEnemyDeathTarget(enemy) {
    const enemyConfig = getEnemyConfig(enemy.enemyId);
    return {
      combatantId: enemy.id,
      enemyId: enemy.enemyId,
      effects: getOnDeathEffects(enemyConfig),
      effectOptions: getOnDeathEffectOptions(enemyConfig),
    };
  }

  /**
   * @param {() => object[]} getTargets
   */
  #buildEnemiesHitFeedbackStep(getTargets) {
    return {
      async: true,
      run: (_ctx, done) => {
        const targets = getTargets();
        if (!targets.length) {
          done();
          return;
        }

        emit(GameEvents.COMBAT_FEEDBACK_REQUEST, {
          type: "enemies_hit",
          targets,
        });
        setFeedbackCompleteHandler(() => done());
      },
    };
  }

  /**
   * @param {() => object[]} getTargets
   */
  #buildEnemiesDeathFeedbackStep(getTargets) {
    return {
      async: true,
      run: (_ctx, done) => {
        const targets = getTargets();
        if (!targets.length) {
          done();
          return;
        }

        emit(GameEvents.COMBAT_FEEDBACK_REQUEST, {
          type: "enemies_death",
          targets,
        });
        setFeedbackCompleteHandler(() => done());
      },
    };
  }

  #beginPlayerActionResolution() {
    this.#isResolvingPlayerAction = true;
    this.phase = "resolving";
  }

  /**
   * @returns {"none" | "busy" | "turn"}
   */
  #getActionsLock() {
    if (this.phase === "player") {
      return "none";
    }

    if (this.phase === "ended") {
      return "turn";
    }

    return this.#isResolvingPlayerAction ? "busy" : "turn";
  }

  /**
   * Ходы врагов собираются в момент выполнения (после урона игрока).
   * @param {number} recoveryMs — пауза только перед первым врагом в раунде
   */
  #buildAllEnemyTurnSteps(recoveryMs) {
    return [
      {
        run: () => {
          this.#isResolvingPlayerAction = false;
          this.#broadcastState();
        },
      },
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

    const damage = calcWeaponDamage(enemy.primaryWeaponId);
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

  /**
   * После AP-действия: либо оставить игроку ход, либо передать врагам.
   * @param {number} recoveryMs
   */
  #buildPostPlayerActionSteps(recoveryMs) {
    if (this.actionPoints.isEmpty) {
      return [
        ...this.#buildAllEnemyTurnSteps(recoveryMs),
        this.#buildReturnToPlayerStep(),
      ];
    }

    return [this.#buildReturnToPlayerSameTurnStep()];
  }

  #buildReturnToPlayerSameTurnStep() {
    return {
      run: () => {
        if (this.phase === "ended") {
          return;
        }
        this.#isResolvingPlayerAction = false;
        this.phase = "player";
        this.#broadcastState();
      },
    };
  }

  #buildReturnToPlayerStep() {
    return {
      run: () => {
        if (this.phase === "ended") {
          return;
        }
        this.#isResolvingPlayerAction = false;
        this.#tickAbilityCooldowns();
        this.actionPoints.resetTurn();
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
      actionsLock: this.#getActionsLock(),
      victory: this.victory,
      selectedTargetId: this.selectedTargetId,
      player: player.toSnapshot(),
      enemies: this.encounter.enemies.map((e) => e.toSnapshot()),
      lootDrops: this.#lootDrops.filter((d) => !d.pickedUp).map((d) => d.toSnapshot()),
      chests: this.#chests.map((c) => c.toSnapshot()),
      actionPoints: this.actionPoints.toSnapshot(),
      weaponAttacks: this.#buildWeaponAttackStates(canAct, player),
      abilities: this.#buildAbilityStates(canAct, player),
    });
  }

  /**
   * @param {boolean} canAct
   * @param {import("./entities/Combatant.js").Combatant} player
   */
  #buildWeaponAttackStates(canAct, player) {
    const hasAliveEnemies = this.#getAliveEnemies().length > 0;

    return WEAPON_SLOT_ORDER.flatMap((slot) => {
      const weaponId = player.getWeaponIdForSlot(slot);
      if (!weaponId) {
        return [];
      }

      const { name } = getWeaponConfig(weaponId);
      const canUseActionPoints = this.actionPoints.canUse(
        COMBAT_ACTION_IDS.attack(slot),
        DEFAULT_ACTION_COST,
      );
      const canUseReady = hasAliveEnemies && canUseActionPoints;
      const canUse = canAct && canUseReady;

      return {
        slot,
        weaponId,
        name,
        canUse,
        canUseReady,
      };
    });
  }

  /**
   * @param {boolean} canAct
   * @param {import("./entities/Combatant.js").Combatant} player
   */
  #buildAbilityStates(canAct, player) {
    const hasAliveEnemies = this.#getAliveEnemies().length > 0;

    return this.combatAbilityIds.map((id) => {
      const config = getCombatAbilityConfig(id);
      const cooldownRemaining = this.abilityCooldowns.get(id) ?? 0;
      const onCooldown = cooldownRemaining > 0;
      const atFullHp = player.hp >= player.maxHp;
      const resourceId = config.resourceId ?? null;
      const resourceCost = config.resourceCost ?? 0;
      const resourceCount = resourceId ? player.getResourceCount(resourceId) : 0;
      const hasResource = !resourceId || resourceCount >= resourceCost;

      const canUseActionPoints = this.actionPoints.canUse(
        COMBAT_ACTION_IDS.ability(id),
        DEFAULT_ACTION_COST,
      );

      let canUseReady = !onCooldown && hasResource && canUseActionPoints;
      if (config.kind === "heal") {
        canUseReady = canUseReady && !atFullHp;
      } else if (config.kind === "aoe_damage") {
        canUseReady = canUseReady && hasAliveEnemies;
      }

      const canUse = canAct && canUseReady;

      return {
        id,
        name: config.name,
        resourceId,
        resourceCount,
        cooldownRemaining,
        canUse,
        canUseReady,
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
