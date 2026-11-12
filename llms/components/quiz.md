# Quiz (`UiQuiz`)

> Ask a few questions one at a time, such as a short survey or the setup of a new workspace, and answer each by a tile, a key or a line of your own.

A component of grani-ui 0.2.1. Form, stable, since 0.2.0. Page: https://grani.arseni.work/components/quiz

Also called questionnaire, survey, multi-step questions, onboarding questions.

Vue 3 components as a plain package: `npm i grani-ui`, then `app.use(createGrani())`. Tailwind 4.1.0 or later: `@import 'tailwindcss'; @import 'grani-ui/style.css';` in the app's stylesheet (the theme and the sources come with it; it styles grani's elements only, and `@import 'grani-ui/base.css';` after it is an optional base for the app's own). Components are imported from `grani-ui` (`import { UiButton } from 'grani-ui'`) or resolved in templates as <UiName> by `GraniResolver` from `grani-ui/resolver` through unplugin-vue-components.

## Use

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { QuizAnswers, QuizQuestion } from 'grani-ui'
import { UiQuiz, UiNoData, UiButton } from 'grani-ui'

const questions: QuizQuestion[] = [
  {
    name: 'use',
    title: 'What will you keep in the workspace?',
    description: 'It sets the first table you see.',
    required: true,
    other: true,
    options: [
      { value: 'invoices', label: 'Invoices', description: 'What you billed and what was paid.' },
      { value: 'orders', label: 'Orders', description: 'From the cart to the delivery.' },
      { value: 'requests', label: 'Support requests', description: 'Who asked and who answered.' },
    ],
  },
  {
    name: 'digest',
    title: 'Who gets the weekly digest?',
    description: 'Skip it to send none.',
    multiple: true,
    options: [
      { value: 'owners', label: 'Owners' },
      { value: 'managers', label: 'Managers' },
      { value: 'accountants', label: 'Accountants' },
    ],
  },
  {
    name: 'day',
    title: 'When does your week start?',
    required: true,
    options: [
      { value: 'monday', label: 'Monday' },
      { value: 'sunday', label: 'Sunday' },
    ],
  },
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const save = () => wait(900)

const base = ref<QuizAnswers>({})

const baseRef = ref<{ restart: () => void } | null>(null)

function again() {
  base.value = {}
  baseRef.value?.restart()
}
</script>

<template>
  <UiQuiz
    ref="baseRef"
    v-model="base"
    :questions="questions"
    :action="save"
    submit-label="Create workspace"
    class="w-full max-w-xl"
  >
    <template #done>
      <UiNoData title="The workspace is ready" description="Your first table is open.">
        <template #actions>
          <UiButton variant="outline" @click="again">Start again</UiButton>
        </template>
      </UiNoData>
    </template>
  </UiQuiz>
</template>

```

## Who does what

Provided by grani-ui:

- Rendering, keyboard and screen reader behavior, and the states this page names.

Implemented by the app:

- Data fetching, saving, permissions and business rules.

## Why it works this way

A few questions asked one at a time, each answered by a tile, a key or a line of one's own. Take it for a short survey, an onboarding or a brief: three to ten questions of choices.

**Questions.** A question is data: `name`, `title`, its `options`, and what it allows (`multiple`, `required`, `other`). The answers stand in the model under the question's name: an answer or `null`, a list for a question with `multiple`. The app's model holds what was answered; what a send hands over names every question, with `null` or an empty list where no answer was given.

**Refusal.** The tiles show the answers the app holds: a pick the app refuses, by leaving the model as it was, goes back, the native radio or box with it, and so does a form reset.

**Tiles.** The whole tile is the target: a press anywhere on it, its description and its key cap included, answers. The chosen tile wears a bar of the brand at its start edge over a muted band, and no radio or check is drawn: the line under the question says whether one answer or several are taken. A chosen answer of a question with one answer is not taken back by a second press: Skip clears it.

**Keys.** `keys` gives the first nine answers a key, the digits or the letters from A, shown on a cap before the answer; `none` shows no cap and hears no key. A key chooses and never turns the page: Enter does. The keys are heard while the focus is inside the quiz, and stay silent in the field of one's own answer, under Ctrl, Alt or Cmd, and while an input method composes a word. A letter is read by its key, not its character, so A answers on any layout.

**Own answer.** `other` adds a field after the tiles. Its text, trimmed, is the answer as soon as it is typed; in a list it stands beside the tiles chosen. A tile chosen after that leaves the text in the field, no longer the answer; a press in the field, its key or more typing makes it the answer again, and the focus passing through it by Tab does not. An answer that matches no option is read as one's own, so a saved answer comes back into the field: only in a question with `other`, and only the first such value of a list. Any other value no option has (an option the app has removed since) is no answer: nothing is chosen, a `required` question still asks, and the quiz leaves the value as it is. Names are one per question and values one per answer, never empty: an empty value reads as no answer. In development the console names a repeat and an empty value.

**Names.** Two Vue apps on one page each need their own `app.config.idPrefix`, or the ids they generate meet and one quiz is named by the other's question.

**Moving.** Next is never turned off: on a `required` question with no answer it says so under the question, puts the focus on the first answer and stays. Skip stands only on a question that is not required, and clears its answer. Back checks nothing and clears nothing. After each move the focus stands in the new question, on its chosen answer or its first. An answer changed on an earlier question leaves the later ones as they are.

**Resume.** The answers and the question shown are the app's, `v-model` and `v-model:step`: an app that saved both opens the quiz where it was left. A step past the last question shows the last; an answer under a name no question has is neither shown nor touched. A step the app sets moves no focus: the app turned the page, and the focus is where it put it. With no questions the quiz draws nothing.

**Sending.** The last question's button sends, and a send answers for the whole quiz: an earlier `required` question left empty, which an app may have stepped over, is opened with its error and nothing is sent; Skip on the last question is checked the same way. `action` gets the answers and is waited for, the button busy and the tiles still, and a second press or a held Enter sends nothing. An action that fails keeps the last question and its answers and says so in a toast, so the app needs a UiToaster. After a send the quiz shows `#done` in its place, when the slot is given, and `submit` tells the app; with no `#done` the last question stays and may be sent again. `restart()` brings the first question back: the step, the drafts, the error and the sent state go, the answers stay the app's. Called during a send, it drops that send: its answer, late, shows nothing, raises no toast and tells the app nothing.

**Attributes.** The quiz is a form of many controls, none of them the quiz: the caller's attributes and listeners stand on the form.

**Progress.** "Question 2 of 5" stands over the question, and the card's top edge fills with the brand, a segment per question; past twelve questions the edge is one line. The edge says how far, the words say where. After a send with `#done` the card has its plain top border again.

**Variants.** `outline` is a card of its own. `plain` draws no card and no edge and keeps the words: for a window or a drawer, which frame it already.

**Placement.** On a page of its own or in a column of one, up to 560px wide; `plain` in the body of a window or a drawer.

### Keyboard

- `1-9` `A-I`: choose the answer with that cap, and take it back in a question of several; the key after the last tile's puts the caret in the field of one's own answer.
- `Enter`: goes to the next question, or sends on the last. Held down, it is one press.
- `ArrowUp` `ArrowDown`: move the choice in a question of one answer, as native radios do.
- `Space`: checks and unchecks an answer in a question of several.
- `Tab`: one stop on a question of one answer, a stop per answer in a question of several, then the field, then the buttons.

### Screen reader

- Question: a radiogroup, or a group for several answers, named by the question; its description, the line "Choose one" or "Choose any that apply" and the error are read with it.
- Answers: native radios or checkboxes named by their labels, the description read after; the key caps are not read.
- Progress: "Question 2 of 3" is text over the question and is read with it; the edge of the card is drawn for the eye and hidden from a reader.
- Error: announced when it appears (`role="alert"`) and read with the question. A radiogroup is also `aria-required` and `aria-invalid`; a group of several takes neither, so its error says it.
- Sending: the form is `aria-busy` and the button says busy under its spinner.

### States

A question of one answer, of several, with a field of one's own, required with no answer after Next, the last question, sending, sent with `#done`, `keys` as `numbers`, `letters` and `none`, and the variants `outline` and `plain`.

### When to use another component

- A question before what cannot be undone: UiConfirm.
- One setting among a form's fields: UiRadioGroup.
- A form of fields to type in: UiField in a UiCard.
- A mark from 1 to N: UiScaleInput.

## Examples

### Plain

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { QuizAnswers, QuizQuestion } from 'grani-ui'
import { UiCard, UiQuiz } from 'grani-ui'

const questions: QuizQuestion[] = [
  {
    name: 'use',
    title: 'What will you keep in the workspace?',
    description: 'It sets the first table you see.',
    required: true,
    other: true,
    options: [
      { value: 'invoices', label: 'Invoices', description: 'What you billed and what was paid.' },
      { value: 'orders', label: 'Orders', description: 'From the cart to the delivery.' },
      { value: 'requests', label: 'Support requests', description: 'Who asked and who answered.' },
    ],
  },
  {
    name: 'digest',
    title: 'Who gets the weekly digest?',
    description: 'Skip it to send none.',
    multiple: true,
    options: [
      { value: 'owners', label: 'Owners' },
      { value: 'managers', label: 'Managers' },
      { value: 'accountants', label: 'Accountants' },
    ],
  },
  {
    name: 'day',
    title: 'When does your week start?',
    required: true,
    options: [
      { value: 'monday', label: 'Monday' },
      { value: 'sunday', label: 'Sunday' },
    ],
  },
]

const framed = ref<QuizAnswers>({})
</script>

<template>
  <!-- A window frames the quiz already: no card and no edge of its own, the count stays. -->
  <UiCard title="Set up the workspace" class="w-full max-w-xl">
    <UiQuiz v-model="framed" :questions="questions" variant="plain" />
  </UiCard>
</template>

```

### Letters

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { QuizAnswers, QuizQuestion } from 'grani-ui'
import { UiQuiz } from 'grani-ui'

const questions: QuizQuestion[] = [
  {
    name: 'use',
    title: 'What will you keep in the workspace?',
    description: 'It sets the first table you see.',
    required: true,
    other: true,
    options: [
      { value: 'invoices', label: 'Invoices', description: 'What you billed and what was paid.' },
      { value: 'orders', label: 'Orders', description: 'From the cart to the delivery.' },
      { value: 'requests', label: 'Support requests', description: 'Who asked and who answered.' },
    ],
  },
  {
    name: 'digest',
    title: 'Who gets the weekly digest?',
    description: 'Skip it to send none.',
    multiple: true,
    options: [
      { value: 'owners', label: 'Owners' },
      { value: 'managers', label: 'Managers' },
      { value: 'accountants', label: 'Accountants' },
    ],
  },
  {
    name: 'day',
    title: 'When does your week start?',
    required: true,
    options: [
      { value: 'monday', label: 'Monday' },
      { value: 'sunday', label: 'Sunday' },
    ],
  },
]

const letters = ref<QuizAnswers>({})
</script>

<template>
  <UiQuiz v-model="letters" :questions="questions" keys="letters" class="w-full max-w-xl" />
</template>

```

### No keys

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { QuizAnswers, QuizQuestion } from 'grani-ui'
import { UiQuiz } from 'grani-ui'

const questions: QuizQuestion[] = [
  {
    name: 'use',
    title: 'What will you keep in the workspace?',
    description: 'It sets the first table you see.',
    required: true,
    other: true,
    options: [
      { value: 'invoices', label: 'Invoices', description: 'What you billed and what was paid.' },
      { value: 'orders', label: 'Orders', description: 'From the cart to the delivery.' },
      { value: 'requests', label: 'Support requests', description: 'Who asked and who answered.' },
    ],
  },
  {
    name: 'digest',
    title: 'Who gets the weekly digest?',
    description: 'Skip it to send none.',
    multiple: true,
    options: [
      { value: 'owners', label: 'Owners' },
      { value: 'managers', label: 'Managers' },
      { value: 'accountants', label: 'Accountants' },
    ],
  },
  {
    name: 'day',
    title: 'When does your week start?',
    required: true,
    options: [
      { value: 'monday', label: 'Monday' },
      { value: 'sunday', label: 'Sunday' },
    ],
  },
]

const capless = ref<QuizAnswers>({})
</script>

<template>
  <UiQuiz v-model="capless" :questions="questions" keys="none" class="w-full max-w-xl" />
</template>

```

### Resumed

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { QuizAnswers, QuizQuestion } from 'grani-ui'
import { UiQuiz } from 'grani-ui'

const questions: QuizQuestion[] = [
  {
    name: 'use',
    title: 'What will you keep in the workspace?',
    description: 'It sets the first table you see.',
    required: true,
    other: true,
    options: [
      { value: 'invoices', label: 'Invoices', description: 'What you billed and what was paid.' },
      { value: 'orders', label: 'Orders', description: 'From the cart to the delivery.' },
      { value: 'requests', label: 'Support requests', description: 'Who asked and who answered.' },
    ],
  },
  {
    name: 'digest',
    title: 'Who gets the weekly digest?',
    description: 'Skip it to send none.',
    multiple: true,
    options: [
      { value: 'owners', label: 'Owners' },
      { value: 'managers', label: 'Managers' },
      { value: 'accountants', label: 'Accountants' },
    ],
  },
  {
    name: 'day',
    title: 'When does your week start?',
    required: true,
    options: [
      { value: 'monday', label: 'Monday' },
      { value: 'sunday', label: 'Sunday' },
    ],
  },
]

// What an app saved yesterday: the second question, and an answer of the person's own.
const saved = ref<QuizAnswers>({ use: 'Contracts', digest: ['owners'] })

const savedStep = ref(1)
</script>

<template>
  <!-- The app keeps the answers and the step: the quiz opens on the second question, the answer
       of one's own back in its field on the first. -->
  <UiQuiz
    v-model="saved"
    v-model:step="savedStep"
    :questions="questions"
    class="w-full max-w-xl"
  />
</template>

```

### Sending

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { QuizAnswers, QuizQuestion } from 'grani-ui'
import { UiQuiz, UiNoData, UiRadioGroup, UiRadio } from 'grani-ui'

const questions: QuizQuestion[] = [
  {
    name: 'use',
    title: 'What will you keep in the workspace?',
    description: 'It sets the first table you see.',
    required: true,
    other: true,
    options: [
      { value: 'invoices', label: 'Invoices', description: 'What you billed and what was paid.' },
      { value: 'orders', label: 'Orders', description: 'From the cart to the delivery.' },
      { value: 'requests', label: 'Support requests', description: 'Who asked and who answered.' },
    ],
  },
  {
    name: 'digest',
    title: 'Who gets the weekly digest?',
    description: 'Skip it to send none.',
    multiple: true,
    options: [
      { value: 'owners', label: 'Owners' },
      { value: 'managers', label: 'Managers' },
      { value: 'accountants', label: 'Accountants' },
    ],
  },
  {
    name: 'day',
    title: 'When does your week start?',
    required: true,
    options: [
      { value: 'monday', label: 'Monday' },
      { value: 'sunday', label: 'Sunday' },
    ],
  },
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const refuse = async () => {
  await wait(900)
  throw new Error('offline')
}

// The life of a send, on the last question: what the server does with it is the switch below.
const sending = ref<QuizAnswers>({ use: 'orders', digest: [], day: 'monday' })

const sendingStep = ref(2)

const sendingRef = ref<{ restart: () => void } | null>(null)

const answer = ref<'accepts' | 'refuses' | 'slow'>('accepts')

const send = () =>
  answer.value === 'refuses' ? refuse() : wait(answer.value === 'slow' ? 8000 : 900)

watch(answer, () => {
  sendingRef.value?.restart()
  sendingStep.value = 2
})
</script>

<template>
  <!-- One send from its press to its outcome: busy, then the `#done` slot, or a toast and the
       question kept. The switch is the server's answer. -->
  <div class="flex w-full max-w-xl flex-col gap-4">
    <UiQuiz
      ref="sendingRef"
      v-model="sending"
      v-model:step="sendingStep"
      :questions="questions"
      :action="send"
      submit-label="Create workspace"
    >
      <template #done>
        <UiNoData title="The workspace is ready" description="Your first table is open." />
      </template>
    </UiQuiz>
    <UiRadioGroup v-model="answer" variant="segmented" aria-label="The server">
      <UiRadio value="accepts">Accepts</UiRadio>
      <UiRadio value="refuses">Refuses</UiRadio>
      <UiRadio value="slow">Answers slowly</UiRadio>
    </UiRadioGroup>
  </div>
</template>

```

### In a window

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { QuizAnswers, QuizQuestion } from 'grani-ui'
import { UiButton, UiModal, UiQuiz } from 'grani-ui'

const questions: QuizQuestion[] = [
  {
    name: 'use',
    title: 'What will you keep in the workspace?',
    description: 'It sets the first table you see.',
    required: true,
    other: true,
    options: [
      { value: 'invoices', label: 'Invoices', description: 'What you billed and what was paid.' },
      { value: 'orders', label: 'Orders', description: 'From the cart to the delivery.' },
      { value: 'requests', label: 'Support requests', description: 'Who asked and who answered.' },
    ],
  },
  {
    name: 'digest',
    title: 'Who gets the weekly digest?',
    description: 'Skip it to send none.',
    multiple: true,
    options: [
      { value: 'owners', label: 'Owners' },
      { value: 'managers', label: 'Managers' },
      { value: 'accountants', label: 'Accountants' },
    ],
  },
  {
    name: 'day',
    title: 'When does your week start?',
    required: true,
    options: [
      { value: 'monday', label: 'Monday' },
      { value: 'sunday', label: 'Sunday' },
    ],
  },
]

const windowed = ref(false)

const inWindow = ref<QuizAnswers>({})

function closeWindow() {
  windowed.value = false
  inWindow.value = {}
}
</script>

<template>
  <!-- The window frames it and names it: `plain`, and a window with no form of its own, so
       Enter is the quiz's. -->
  <UiButton variant="outline" @click="windowed = true">Set up the workspace</UiButton>
  <UiModal v-model:open="windowed" title="Set up the workspace" size="md">
    <UiQuiz v-model="inWindow" :questions="questions" variant="plain" @submit="closeWindow" />
  </UiModal>
</template>

```

### Long text

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { QuizAnswers, QuizQuestion } from 'grani-ui'
import { UiQuiz } from 'grani-ui'

// The worst realistic texts: a question of three lines, an address with no place to break, an
// answer of one letter.
const long: QuizQuestion[] = [
  {
    name: 'source',
    title:
      'Where should the workspace take the invoices from when the accounting system and the bank statement disagree about the day a payment arrived?',
    description:
      'It decides which date a late payment is counted by, and it can be changed later for every invoice at once.',
    required: true,
    other: 'Another source',
    options: [
      {
        value: 'ledger',
        label: 'https://accounting.example.com/api/v2/ledgers/2026/receivables/export?format=csv',
        description: 'The address of the export, read every night; the bank statement is ignored.',
      },
      { value: 'bank', label: 'B', description: 'The bank.' },
      {
        value: 'ask',
        label: 'Ask the accountant each time the two disagree by more than a working day',
      },
    ],
  },
]

const longAnswers = ref<QuizAnswers>({ source: 'ledger' })
</script>

<template>
  <UiQuiz v-model="longAnswers" :questions="long" class="w-full max-w-xl" />
</template>

```

## API

Props:
- `questions`: `QuizQuestion[]` (required) — The questions, in the order they are asked.
- `modelValue`: `QuizAnswers` (required) — The answers by question name (`v-model`): an answer or `null`, a list for a question with `multiple`.
- `step`: `number` — The question shown, from 0 (`v-model:step`). Unset, the quiz keeps it itself and starts at the first.
- `keys`: `QuizKeys` = `none | numbers | letters` (default `"numbers"`) — The keys the answers answer to: the digits, the letters from A, or none, which also hides the caps.
- `action`: `((answers: QuizAnswers) => unknown)` — Sends the answers from the last question. The quiz waits for it; a rejection keeps the question and raises a toast.
- `submitLabel`: `string` (default `""`) — The last question's button, the act itself: "Save plan" beats "Send".
- `sendLabel`: `string` (default `""`)
- `variant`: `"outline" | "plain"` = `outline | plain` (default `"outline"`) — `outline` is a card of its own, its top edge the progress; `plain` draws no card and no edge, for a window or a drawer that already frames it.
Attributes are placed by the component itself: its description says where.

Events:
- `submit` (`answers: QuizAnswers`) — The answers were sent: after `action` settled, or at once without one.
- `update:modelValue` (`answers: QuizAnswers`) — An answer changed: all the answers, by question name.
- `update:step` (`step: number`) — Another question is shown: its index from 0.

Slots:
- `done` with `Record<string, never>` — What stands in place of the questions after a send: a thank-you, what happens next.

Built with what `grani-ui` exports: `useToast`, `useUiT`, `focusInvalid`.
