import { isDebugEnabled } from "../DebugSettings.js";
import { isSpawnGuideDebugEntity } from "../adapters/spawnGuideDebugAdapter.js";
import { nudgeShadowOffset, nudgeSpriteOffset } from "./DebugOffsetEditor.js";

/** @typedef {import("../adapters/createWorldRigDebugAdapter.js").DebugEntityAdapter} DebugEntityAdapter */

const ARROW_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);
const VERTICAL_ARROW_KEYS = new Set(["ArrowUp", "ArrowDown"]);

export class DebugInputHandler {
  /**
   * @param {{
   *   getSelectedEntity: () => DebugEntityAdapter | null,
   *   onExport: (entity: DebugEntityAdapter) => void,
   * }} options
   */
  constructor({ getSelectedEntity, onExport }) {
    this.getSelectedEntity = getSelectedEntity;
    this.onExport = onExport;
    /** @type {((event: KeyboardEvent) => void) | null} */
    this._onKeyDown = null;
    /** @type {Phaser.Scene | null} */
    this._scene = null;
  }

  /**
   * @param {Phaser.Scene} scene
   */
  attach(scene) {
    this.detach();

    this._scene = scene;
    this._onKeyDown = (event) => {
      if (!isDebugEnabled()) {
        return;
      }

      const entity = this.getSelectedEntity();
      const isCopy = event.ctrlKey && (event.key === "c" || event.key === "C");

      if (isCopy) {
        if (entity) {
          event.preventDefault();
          this.onExport(entity);
        }
        return;
      }

      if (!entity?.canEditOffsets) {
        return;
      }

      if (isSpawnGuideDebugEntity(entity)) {
        if (!VERTICAL_ARROW_KEYS.has(event.key)) {
          return;
        }

        event.preventDefault();
        const deltaY = event.key === "ArrowUp" ? -1 : 1;
        entity.nudgeOffsetY(deltaY);
        return;
      }

      if (!ARROW_KEYS.has(event.key)) {
        if (
          !event.ctrlKey &&
          !event.altKey &&
          (event.key === "l" || event.key === "L" || event.key === "д" || event.key === "Д")
        ) {
          event.preventDefault();
          entity.toggleShadowLayer();
        }
        return;
      }

      event.preventDefault();

      const dx = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
      const dy = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;

      if (event.ctrlKey) {
        nudgeShadowOffset(entity, dx, dy);
      } else {
        nudgeSpriteOffset(entity, dx, dy);
      }
    };

    scene.input.keyboard?.on("keydown", this._onKeyDown);
  }

  detach() {
    if (this._scene?.input?.keyboard && this._onKeyDown) {
      this._scene.input.keyboard.off("keydown", this._onKeyDown);
    }

    this._onKeyDown = null;
    this._scene = null;
  }
}
