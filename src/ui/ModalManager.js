import { GameEvents, emit, on } from "../core/EventBus.js";

const ROOT_ID = "modal-root";
const BACKDROP_SELECTOR = ".ui-modal-root__backdrop";
export const MODAL_TRANSITION_MS = 350;

export const ModalEvents = Object.freeze({
  STACK_CHANGED: "modal:stack-changed",
});

/** @type {Phaser.Game | null} */
let gameRef = null;

/** @type {Map<string, HTMLElement>} */
const modals = new Map();

/** @type {HTMLElement | null} */
let root = null;

/** @type {string[]} */
const modalStack = [];

/** @returns {HTMLElement | null} */
function getRoot() {
  if (!root) {
    root = document.getElementById(ROOT_ID);
  }
  return root;
}

/**
 * @param {HTMLElement} modalRoot
 * @param {() => void} onDone
 */
function waitForBackdropFade(modalRoot, onDone) {
  const backdrop = modalRoot.querySelector(BACKDROP_SELECTOR);
  if (!backdrop) {
    onDone();
    return;
  }

  const finish = () => {
    backdrop.removeEventListener("transitionend", onTransitionEnd);
    onDone();
  };

  const onTransitionEnd = (event) => {
    if (event.target !== backdrop || event.propertyName !== "opacity") {
      return;
    }
    finish();
  };

  backdrop.addEventListener("transitionend", onTransitionEnd);
  window.setTimeout(finish, MODAL_TRANSITION_MS + 50);
}

/**
 * @param {HTMLElement} modalEl
 * @returns {boolean}
 */
function modalDismissesOnBackdrop(modalEl) {
  return modalEl.getAttribute("data-modal-dismiss") === "backdrop";
}

/**
 * @param {HTMLElement} modalEl
 */
function deactivateModal(modalEl) {
  modalEl.classList.remove("is-active");
  modalEl.hidden = true;
}

/**
 * @param {HTMLElement} modalEl
 */
function activateModal(modalEl) {
  modalEl.hidden = false;
  modalEl.classList.add("is-active");
}

function deactivateAllStackedModals() {
  for (const id of modalStack) {
    const modalEl = modals.get(id);
    if (modalEl) {
      deactivateModal(modalEl);
    }
  }
}

function emitStackChanged() {
  emit(ModalEvents.STACK_CHANGED, {
    stack: [...modalStack],
    depth: modalStack.length,
  });
}

function hideRootImmediately() {
  const modalRoot = getRoot();
  if (!modalRoot) {
    return;
  }

  modalRoot.classList.remove("is-visible", "is-active");
  modalRoot.hidden = true;
  modalRoot.setAttribute("aria-hidden", "true");
  syncInputBlock();
}

function syncInputBlock() {
  const modalRoot = getRoot();
  const blocked = modalRoot?.classList.contains("is-active") ?? false;

  document.getElementById("world-view")?.classList.toggle("is-input-blocked", blocked);

  if (gameRef?.input) {
    gameRef.input.enabled = !blocked;
  }
}

/**
 * @returns {string | null}
 */
export function getOpenModalId() {
  if (modalStack.length === 0) {
    return null;
  }
  return modalStack[modalStack.length - 1];
}

/**
 * @returns {readonly string[]}
 */
export function getModalStack() {
  return [...modalStack];
}

/**
 * @returns {number}
 */
export function getModalStackDepth() {
  return modalStack.length;
}

/**
 * @param {string} [id]
 * @returns {boolean}
 */
export function isModalOpen(id) {
  const openId = getOpenModalId();
  if (!openId) {
    return false;
  }
  return id ? openId === id : true;
}

/**
 * @param {boolean} [withFade]
 * @returns {Promise<void>}
 */
function finishCloseAllModals(withFade) {
  return new Promise((resolve) => {
    const modalRoot = getRoot();

    deactivateAllStackedModals();
    modalStack.length = 0;
    emitStackChanged();

    if (!modalRoot || !modalRoot.classList.contains("is-visible")) {
      hideRootImmediately();
      resolve();
      return;
    }

    if (!withFade) {
      hideRootImmediately();
      resolve();
      return;
    }

    modalRoot.classList.remove("is-visible");
    modalRoot.setAttribute("aria-hidden", "true");

    waitForBackdropFade(modalRoot, () => {
      hideRootImmediately();
      resolve();
    });
  });
}

/**
 * @returns {Promise<void>}
 */
export function closeAllModals() {
  if (modalStack.length === 0) {
    return Promise.resolve();
  }
  return finishCloseAllModals(true);
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export function closeModal(id) {
  if (getOpenModalId() !== id) {
    return Promise.resolve();
  }
  return closeAllModals();
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
function showModalRootIfNeeded() {
  return new Promise((resolve) => {
    const modalRoot = getRoot();
    if (!modalRoot) {
      resolve();
      return;
    }

    if (modalRoot.classList.contains("is-visible")) {
      resolve();
      return;
    }

    modalRoot.hidden = false;
    modalRoot.setAttribute("aria-hidden", "false");
    modalRoot.classList.add("is-active");
    syncInputBlock();

    void modalRoot.offsetWidth;
    modalRoot.classList.add("is-visible");
    waitForBackdropFade(modalRoot, resolve);
  });
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export function pushModal(id) {
  return new Promise((resolve) => {
    const modalEl = modals.get(id);
    const modalRoot = getRoot();

    if (!modalEl || !modalRoot) {
      console.warn(`[ModalManager] Модалка «${id}» не найдена`);
      resolve();
      return;
    }

    const currentId = getOpenModalId();
    if (currentId === id && modalRoot.classList.contains("is-visible")) {
      resolve();
      return;
    }

    if (currentId) {
      const currentModal = modals.get(currentId);
      if (currentModal) {
        deactivateModal(currentModal);
      }
    }

    modalStack.push(id);
    activateModal(modalEl);
    emitStackChanged();

    void showModalRootIfNeeded().then(resolve);
  });
}

/**
 * @returns {Promise<void>}
 */
export function popModal() {
  return new Promise((resolve) => {
    if (modalStack.length === 0) {
      resolve();
      return;
    }

    const topId = modalStack.pop();
    const topModal = topId ? modals.get(topId) : null;
    if (topModal) {
      deactivateModal(topModal);
    }

    const previousId = getOpenModalId();
    if (!previousId) {
      emitStackChanged();
      void finishCloseAllModals(true).then(resolve);
      return;
    }

    const previousModal = modals.get(previousId);
    if (previousModal) {
      activateModal(previousModal);
    }

    emitStackChanged();
    resolve();
  });
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export function openModal(id) {
  return new Promise((resolve) => {
    const modalEl = modals.get(id);
    const modalRoot = getRoot();

    if (!modalEl || !modalRoot) {
      console.warn(`[ModalManager] Модалка «${id}» не найдена`);
      resolve();
      return;
    }

    if (modalStack.length === 1 && getOpenModalId() === id && modalRoot.classList.contains("is-visible")) {
      resolve();
      return;
    }

    deactivateAllStackedModals();
    modalStack.length = 0;
    modalStack.push(id);
    activateModal(modalEl);
    emitStackChanged();

    void showModalRootIfNeeded().then(resolve);
  });
}

export function initModalManager(game) {
  gameRef = game;

  document.querySelectorAll("[data-modal]").forEach((el) => {
    const id = el.getAttribute("data-modal");
    if (id) {
      modals.set(id, el);
    }
  });

  on(GameEvents.SPACE_CHANGED, () => {
    closeAllModals();
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const openTrigger = target.closest("[data-modal-open]");
    if (openTrigger) {
      event.preventDefault();
      event.stopPropagation();
      const modalId = openTrigger.getAttribute("data-modal-open");
      if (modalId) {
        openModal(modalId);
      }
      return;
    }

    const pushTrigger = target.closest("[data-modal-push]");
    if (pushTrigger) {
      event.preventDefault();
      event.stopPropagation();
      const modalId = pushTrigger.getAttribute("data-modal-push");
      if (modalId) {
        pushModal(modalId);
      }
      return;
    }

    const popTrigger = target.closest("[data-modal-pop]");
    if (popTrigger) {
      event.preventDefault();
      event.stopPropagation();
      popModal();
      return;
    }

    if (modalStack.length === 0) {
      return;
    }

    const closeTrigger = target.closest("[data-modal-close]");
    if (closeTrigger) {
      event.preventDefault();
      event.stopPropagation();
      closeAllModals();
      return;
    }

    const openModalId = getOpenModalId();
    const activeModal = openModalId ? modals.get(openModalId) : null;
    if (!activeModal || !modalDismissesOnBackdrop(activeModal)) {
      return;
    }

    const modalRoot = getRoot();
    if (!modalRoot?.contains(target)) {
      return;
    }

    if (target.closest(".ui-modal__panel")) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    closeAllModals();
  });
}
