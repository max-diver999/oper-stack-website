/**
 * Подписывает каждую ячейку таблицы её заголовком колонки.
 *
 * Зачем. На телефоне таблица из четырёх колонок сжимается до одного слова в строке и читать её
 * невозможно. Мобильные стили раскладывают такую таблицу в карточки, по строке на запись, и каждой
 * ячейке нужна подпись: без неё «Рекомендуется» висит в воздухе без вопроса, на который отвечает.
 *
 * Делается на сборке, а не скриптом в браузере: подпись должна быть в готовой странице, иначе её
 * не увидит ни читатель с выключенным JavaScript, ни программа, которая забирает страницу для ИИ.
 *
 * Дерево обходится своими силами: тянуть ради трёх строк зависимость, которая сейчас доступна
 * только потому, что её положил себе Astro, значит поставить сборку в зависимость от чужого
 * дерева пакетов.
 */

const cellsOf = (row) => row.children.filter((c) => c.tagName === 'td' || c.tagName === 'th');

/** Текст узла целиком: заголовок колонки может быть с разметкой внутри. */
function text(node) {
  if (node.type === 'text') return node.value;
  return (node.children || []).map(text).join('');
}

function walk(node, fn) {
  if (node.type === 'element') fn(node);
  for (const child of node.children || []) walk(child, fn);
}

export default function rehypeTableLabels() {
  return (tree) => {
    walk(tree, (node) => {
      if (node.tagName !== 'table') return;
      const head = node.children.find((c) => c.tagName === 'thead');
      const body = node.children.find((c) => c.tagName === 'tbody');
      if (!head || !body) return;
      const headRow = head.children.find((c) => c.tagName === 'tr');
      if (!headRow) return;
      const labels = cellsOf(headRow).map((c) => text(c).trim());
      if (!labels.some(Boolean)) return;
      for (const row of body.children.filter((c) => c.tagName === 'tr')) {
        cellsOf(row).forEach((cell, i) => {
          if (labels[i]) cell.properties = { ...cell.properties, 'data-label': labels[i] };
        });
      }
    });
  };
}
