/**
 * Боевой мировой объект = pivot (физика) + view (визуал).
 *
 * Pivot — контейнер на сцене: точка опоры на «земле», depth-сортировка, игровые
 * координаты. Двигается только по игровой логике (позиция врага, спавн лута и т.д.).
 *
 * View — дочерний контейнер внутри pivot: спрайт и UI над ним. Все чисто визуальные
 * анимации (прыжок появления, улет при подборе, шейк) меняют только view.
 *
 * Тень крепится к pivot — «земля» не прыгает вместе со спрайтом.
 */

/**
 * @param {Phaser.Scene} scene
 * @param {number} pivotX
 * @param {number} pivotY
 * @returns {{ pivot: Phaser.GameObjects.Container, view: Phaser.GameObjects.Container }}
 */
export function createCombatWorldRig(scene, pivotX, pivotY) {
  const pivot = scene.add.container(pivotX, pivotY);
  const view = scene.add.container(0, 0);
  pivot.add(view);
  return { pivot, view };
}
