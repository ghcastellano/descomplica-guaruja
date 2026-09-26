/* Um exemplo por vez para aprofundar a conversa, sem trocar de slide. */
(function () {
  var choices = Array.from(document.querySelectorAll('[data-value]'));
  var panels = Array.from(document.querySelectorAll('.value-panel'));
  if (!choices.length) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function select(choice, animate) {
    choices.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button === choice));
    });
    panels.forEach(function (panel) {
      panel.hidden = panel.id !== choice.getAttribute('aria-controls');
      panel.classList.toggle('is-entering', !panel.hidden && animate && !reduced.matches);
    });
  }
  choices.forEach(function (choice) {
    choice.addEventListener('click', function (event) { select(choice, event.detail > 0); });
  });
  select(choices[0], false);
})();
