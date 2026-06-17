import Phaser from "phaser";
import { MapNodeState } from "../MapNodeState.js";

const NODE_SIZE = 72;
const CORNER_SIZE = 9;

/** @type {Readonly<Record<string, { fill: number, border: number, icon: number }>>} */
const STATE_PALETTE = Object.freeze({
  [MapNodeState.LOCKED]: {
    fill: 0x1a1c18,
    border: 0x5a5848,
    icon: 0x6e6848,
  },
  [MapNodeState.AVAILABLE]: {
    fill: 0x2f3a1e,
    border: 0xc4b574,
    icon: 0xe2dbb8,
  },
  [MapNodeState.VISITED]: {
    fill: 0x3d5228,
    border: 0x6b8a42,
    icon: 0xd8d0a8,
  },
});

const HOVER_BORDER = 0xe8d78a;

/** @type {Readonly<Record<string, string>>} */
const TYPE_LABELS = Object.freeze({
  start: "●",
  combat: "⚔",
  final: "★",
});

/**
 * @param {string} state
 * @param {boolean} hovered
 */
function resolveColors(state, hovered, selectable) {
  const palette = STATE_PALETTE[state] ?? STATE_PALETTE[MapNodeState.LOCKED];

  return {
    fill: palette.fill,
    border: hovered && selectable ? HOVER_BORDER : palette.border,
    icon: palette.icon,
  };
}

/**
 * @param {number} color
 */
function colorToHex(color) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

/**
 * @param {Phaser.GameObjects.Graphics} graphics
 * @param {number} half
 * @param {number} fillColor
 * @param {number} borderColor
 */
function drawNodeFrame(graphics, half, fillColor, borderColor) {
  graphics.clear();
  graphics.fillStyle(fillColor, 1);
  graphics.fillRect(-half, -half, NODE_SIZE, NODE_SIZE);
  graphics.lineStyle(1, borderColor, 1);
  graphics.strokeRect(-half, -half, NODE_SIZE, NODE_SIZE);

  const c = CORNER_SIZE;
  graphics.lineStyle(2, borderColor, 1);

  graphics.beginPath();
  graphics.moveTo(-half, -half + c);
  graphics.lineTo(-half, -half);
  graphics.lineTo(-half + c, -half);
  graphics.strokePath();

  graphics.beginPath();
  graphics.moveTo(half - c, -half);
  graphics.lineTo(half, -half);
  graphics.lineTo(half, -half + c);
  graphics.strokePath();

  graphics.beginPath();
  graphics.moveTo(-half, half - c);
  graphics.lineTo(-half, half);
  graphics.lineTo(-half + c, half);
  graphics.strokePath();

  graphics.beginPath();
  graphics.moveTo(half - c, half);
  graphics.lineTo(half, half);
  graphics.lineTo(half, half - c);
  graphics.strokePath();
}

/**
 * @param {Phaser.Scene} scene
 * @param {import("../entities/MapNode.js").MapNode} node
 * @param {string} state
 * @param {(nodeId: string) => void} onSelect
 */
export function createMapNodeView(scene, node, state, onSelect) {
  const half = NODE_SIZE / 2;
  const container = scene.add.container(node.position.x, node.position.y);
  container.setDepth(2);

  const frame = scene.add.graphics();
  const label = scene.add.text(0, 0, TYPE_LABELS[node.type] ?? "?", {
    fontFamily: '"Russo One", "Arial Narrow", sans-serif',
    fontSize: "22px",
    color: "#e2dbb8",
  });
  label.setOrigin(0.5);

  container.add([frame, label]);

  let hovered = false;
  let currentState = state;
  let selectable = false;

  function applyVisual() {
    const colors = resolveColors(currentState, hovered, selectable);
    drawNodeFrame(frame, half, colors.fill, colors.border);
    label.setColor(colorToHex(colors.icon));
    container.setScale(hovered && selectable ? 1.04 : 1);
  }

  function setState(nextState) {
    currentState = nextState;
    applyVisual();
  }

  function setSelectable(nextSelectable) {
    selectable = nextSelectable;
    applyVisual();

    container.removeAllListeners();
    container.disableInteractive();

    if (!selectable) {
      hovered = false;
      applyVisual();
      return;
    }

    const hitRect = new Phaser.Geom.Rectangle(-half, -half, NODE_SIZE, NODE_SIZE);
    container.setInteractive(hitRect, Phaser.Geom.Rectangle.Contains);
    if (scene.input?.manager?.setCursor) {
      container.input.cursor = "pointer";
    }

    container.on("pointerover", () => {
      hovered = true;
      applyVisual();
    });
    container.on("pointerout", () => {
      hovered = false;
      applyVisual();
    });
    container.on("pointerdown", () => {
      onSelect(node.id);
    });
  }

  applyVisual();
  setSelectable(false);

  return {
    container,
    nodeId: node.id,
    setState,
    setSelectable,
    destroy: () => {
      container.destroy();
    },
  };
}

export { NODE_SIZE };
