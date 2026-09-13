# Что поменять в товаре на Whop

Товар: <https://whop.com/oper-stack/automatic-site-report>, 9 долларов.

Сайт уже продаёт список задач, а карточка на Whop до сих пор обещает отчёт. Человек платит за одно, получает другое. Ниже готовый текст, вставить как есть.

## Осторожно со ссылкой

Если поменять адрес товара (slug `automatic-site-report`), кнопка на сайте перестанет работать: она зашита в `src/data/products.ts`, поле `cta.href`. **Менять название и описание можно, адрес лучше оставить.** Если всё же меняешь адрес, скажи, я поправлю ссылку в коде.

## Название

```
Site fix list
```

## Подзаголовок

```
What to fix on your site, written out task by task
```

## Описание

```
Every problem found on your site, rewritten as a task you can hand to anyone: whoever built your site, or an assistant like ChatGPT, Claude or Cursor.

Each task says three things: what your site does now, what to change, and how to check it is done. No code, no terminal, nothing to install. Your part is to say what to do and look at the result.

You also get the measurement the tasks came from: up to twenty of your pages read the way a search engine and an AI read them, six area scores with the count of checks behind each, how much of your text disappears when JavaScript is off, and whether the files an AI agent looks for exist on your domain at all.

How it works: pay, open the link in the email, type the address of your site. That is the whole form. Two files come back by email, usually within the hour.

One site. No account, no access to anything of yours, nothing stored after the files are sent.
```

## Чего в описании быть не должно

- Сроков, кроме «usually within the hour», он уже стоит на сайте и в письме
- Обещаний роста позиций или трафика
- Слова «отчёт» в заголовке: отчёт теперь приложение, а не товар
