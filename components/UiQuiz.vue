<!--
  UiQuiz: a few questions asked one at a time, each answered by a tile, a key or a line of one's
  own. Take it for a short survey, an onboarding or a brief: three to ten questions of choices.

  Questions. A question is data: `name`, `title`, its `options`, and what it allows (`multiple`,
  `required`, `other`). The answers stand in the model under the question's name: an answer or
  `null`, a list for a question with `multiple`. The app's model holds what was answered; what a
  send hands over names every question, with `null` or an empty list where no answer was given.

  Refusal. The tiles show the answers the app holds: a pick the app refuses, by leaving the model
  as it was, goes back, the native radio or box with it, and so does a form reset.

  Tiles. The whole tile is the target: a press anywhere on it, its description and its key cap
  included, answers. The chosen tile wears a bar of the brand at its start edge over a muted band,
  and no radio or check is drawn: the line under the question says whether one answer or several
  are taken. A chosen answer of a question with one answer is not taken back by a second press:
  Skip clears it.

  Keys. `keys` gives the first nine answers a key, the digits or the letters from A, shown on a cap
  before the answer; `none` shows no cap and hears no key. A key chooses and never turns the page:
  Enter does. The keys are heard while the focus is inside the quiz, and stay silent in the field
  of one's own answer, under Ctrl, Alt or Cmd, and while an input method composes a word. A letter
  is read by its key, not its character, so A answers on any layout.

  Own answer. `other` adds a field after the tiles. Its text, trimmed, is the answer as soon as it
  is typed; in a list it stands beside the tiles chosen. A tile chosen after that leaves the text
  in the field, no longer the answer; a press in the field, its key or more typing makes it the
  answer again, and the focus passing through it by Tab does not. An
  answer that matches no option is read as one's own, so a saved answer comes back into the field:
  only in a question with `other`, and only the first such value of a list. Any other value no
  option has (an option the app has removed since) is no answer: nothing is chosen, a `required`
  question still asks, and the quiz leaves the value as it is. Names are one per question and
  values one per answer, never empty: an empty value reads as no answer. In development the
  console names a repeat and an empty value.

  Names. Two Vue apps on one page each need their own `app.config.idPrefix`, or the ids they
  generate meet and one quiz is named by the other's question.

  Moving. Next is never turned off: on a `required` question with no answer it says so under the
  question, puts the focus on the first answer and stays. Skip stands only on a question that is
  not required, and clears its answer. Back checks nothing and clears nothing. After each move the
  focus stands in the new question, on its chosen answer or its first. An answer changed on an
  earlier question leaves the later ones as they are.

  Resume. The answers and the question shown are the app's, `v-model` and `v-model:step`: an app
  that saved both opens the quiz where it was left. A step past the last question shows the last;
  an answer under a name no question has is neither shown nor touched. A step the app sets moves
  no focus: the app turned the page, and the focus is where it put it. With no questions the quiz
  draws nothing.

  Sending. The last question's button sends, and a send answers for the whole quiz: an earlier
  `required` question left empty, which an app may have stepped over, is opened with its error and
  nothing is sent; Skip on the last question is checked the same way. `action` gets the answers
  and is waited for, the button busy and the tiles still, and a second press or a held Enter sends
  nothing. An action
  that fails keeps the last question and its answers and says so in a toast, so the app needs a
  UiToaster. After a send the quiz shows `#done` in its place, when the slot is given, and `submit`
  tells the app; with no `#done` the last question stays and may be sent again. `restart()` brings
  the first question back: the step, the drafts, the error and the sent state go, the answers
  stay the app's. Called during a send, it drops that send: its answer, late, shows nothing,
  raises no toast and tells the app nothing.

  Attributes. The quiz is a form of many controls, none of them the quiz: the caller's attributes
  and listeners stand on the form.

  Progress. "Question 2 of 5" stands over the question, and the card's top edge fills with the
  brand, a segment per question; past twelve questions the edge is one line. The edge says how far,
  the words say where. After a send with `#done` the card has its plain top border again.

  Variants. `outline` is a card of its own. `plain` draws no card and no edge and keeps the words:
  for a window or a drawer, which frame it already.

  Placement. On a page of its own or in a column of one, up to 560px wide; `plain` in the body of
  a window or a drawer.

  Keyboard.
  - `1-9` `A-I`: choose the answer with that cap, and take it back in a question of several; the
    key after the last tile's puts the caret in the field of one's own answer.
  - `Enter`: goes to the next question, or sends on the last. Held down, it is one press.
  - `ArrowUp` `ArrowDown`: move the choice in a question of one answer, as native radios do.
  - `Space`: checks and unchecks an answer in a question of several.
  - `Tab`: one stop on a question of one answer, a stop per answer in a question of several, then
    the field, then the buttons.

  Reader.
  - Question: a radiogroup, or a group for several answers, named by the question; its
    description, the line "Choose one" or "Choose any that apply" and the error are read with it.
  - Answers: native radios or checkboxes named by their labels, the description read after; the
    key caps are not read.
  - Progress: "Question 2 of 3" is text over the question and is read with it; the edge of the
    card is drawn for the eye and hidden from a reader.
  - Error: announced when it appears (`role="alert"`) and read with the question. A radiogroup is
    also `aria-required` and `aria-invalid`; a group of several takes neither, so its error says it.
  - Sending: the form is `aria-busy` and the button says busy under its spinner.

  States. A question of one answer, of several, with a field of one's own, required with no
  answer after Next, the last question, sending, sent with `#done`, `keys` as `numbers`,
  `letters` and `none`, and the variants `outline` and `plain`.

  Not for.
  - A question before what cannot be undone: UiConfirm.
  - One setting among a form's fields: UiRadioGroup.
  - A form of fields to type in: UiField in a UiCard.
  - A mark from 1 to N: UiScaleInput.
-->
<template>
  <form
    v-if="questions.length"
    v-bind="$attrs"
    class="relative flex flex-col gap-6 text-sm text-fg"
    :class="
      variant === 'outline'
        ? [cardShellClass, 'p-surface-md', edged ? 'border-t-transparent' : '']
        : ''
    "
    novalidate
    :aria-busy="busy || undefined"
    @submit.prevent="onSubmit"
    @reset="onReset"
    @keydown="onKeydown"
  >
    <div v-if="finished" ref="doneRef" tabindex="-1" class="focus:outline-hidden">
      <slot name="done" />
    </div>
    <template v-else-if="question">
      <!-- The card's top edge is the progress, laid over its border: a segment per question, or one
           line past twelve, where segments would be dashes. The strip around it is at least as tall
           as the card's corner, so it is clipped to the corner whatever the radius. For the eye
           only: the count over the question says it to a reader. -->
      <div
        v-if="edged"
        aria-hidden="true"
        class="pointer-events-none absolute -inset-x-px -top-px h-[max(1rem,var(--radius-card))] overflow-hidden rounded-t-card"
      >
        <div class="ui-progress flex h-1" :class="segmented ? 'gap-1' : 'bg-border'">
          <template v-if="segmented">
            <span
              v-for="n in questions.length"
              :key="n"
              :data-filled="n <= index + 1 ? '' : undefined"
              class="flex-1 transition-colors duration-travel"
              :class="n <= index + 1 ? 'bg-brand' : 'bg-border'"
            />
          </template>
          <span
            v-else
            data-filled
            class="bg-brand transition-[width] duration-travel"
            :style="{ width: `${((index + 1) / questions.length) * 100}%` }"
          />
        </div>
      </div>
      <div
        ref="groupRef"
        :role="question.multiple ? 'group' : 'radiogroup'"
        class="flex min-w-0 flex-col gap-6"
        :aria-labelledby="`${uid}-title`"
        :aria-describedby="describedBy"
        :aria-required="(!question.multiple && question.required) || undefined"
        :aria-invalid="(!question.multiple && failed) || undefined"
      >
        <div class="flex flex-col gap-2">
          <p :id="`${uid}-count`" class="text-xs text-fg-muted tabular-nums">{{ progressText }}</p>
          <p
            :id="`${uid}-title`"
            class="text-xl font-semibold tracking-tight text-balance [overflow-wrap:anywhere]"
          >
            {{ question.title }}
          </p>
          <p
            v-if="question.description"
            :id="`${uid}-description`"
            class="text-base text-fg-muted [overflow-wrap:anywhere]"
          >
            {{ question.description }}
          </p>
          <p :id="`${uid}-hint`" class="text-fg-muted">
            {{ t(question.multiple ? 'grani.quiz.any' : 'grani.quiz.one') }}
          </p>
          <p v-if="failed" :id="`${uid}-error`" role="alert" class="text-danger-subtle-fg">
            {{ t('grani.quiz.required') }}
          </p>
        </div>
        <div class="flex flex-col gap-2">
          <label
            v-for="(option, i) in question.options"
            :key="option.value"
            class="ui-choice relative flex min-h-11 items-center gap-3 overflow-hidden rounded-card border border-border px-4 py-3 transition-colors duration-fast"
            :class="[
              busy ? 'cursor-not-allowed' : 'cursor-pointer',
              chosen(option.value)
                ? // The mark of a chosen row of a panel: the band alone is under 3:1, the bar is not.
                  'bg-surface-muted before:absolute before:inset-y-0 before:start-0 before:border-s-[3px] before:border-s-brand'
                : busy
                  ? 'bg-surface'
                  : 'bg-surface hover:bg-surface-muted',
            ]"
          >
            <input
              :type="question.multiple ? 'checkbox' : 'radio'"
              class="sr-only"
              :name="question.name"
              :value="option.value"
              :checked="chosen(option.value)"
              :disabled="busy"
              :aria-describedby="option.description ? `${uid}-option-${i}` : undefined"
              @change="pick(option.value)"
            />
            <kbd v-if="capOf(i)" aria-hidden="true" :class="KEYCAP">{{ capOf(i) }}</kbd>
            <span class="flex min-w-0 flex-1 flex-col">
              <span class="font-medium [overflow-wrap:anywhere]">{{ option.label }}</span>
              <span
                v-if="option.description"
                :id="`${uid}-option-${i}`"
                class="text-fg-muted [overflow-wrap:anywhere]"
              >
                {{ option.description }}
              </span>
            </span>
          </label>
          <div v-if="question.other" class="relative">
            <span
              v-if="ownChosen"
              aria-hidden="true"
              class="pointer-events-none absolute inset-y-0 start-0 z-10 w-[3px] rounded-s-control bg-brand"
            />
            <UiInput
              ref="otherRef"
              :model-value="draft"
              size="md"
              class="w-full"
              :aria-label="otherLabel"
              :placeholder="t('grani.quiz.otherHint')"
              :disabled="busy"
              @update:model-value="setOther(String($event ?? ''))"
              @pointerdown="reclaim"
            >
              <template v-if="capOf(question.options.length)" #start>
                <kbd aria-hidden="true" :class="KEYCAP">{{ capOf(question.options.length) }}</kbd>
              </template>
            </UiInput>
          </div>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UiButton type="submit" variant="primary" size="md" :loading="busy" loading-text="">
          {{ last ? submitLabel || sendLabel || t('grani.quiz.send') : t('grani.quiz.next') }}
        </UiButton>
        <span
          v-if="keys !== 'none'"
          aria-hidden="true"
          class="flex items-center gap-1.5 text-xs text-fg-muted max-sm:hidden"
        >
          {{ t('grani.quiz.enter') }}
          <kbd :class="KEYCAP"><CornerDownLeft class="h-3 w-3" /></kbd>
        </span>
        <span class="ms-auto" />
        <UiButton
          v-if="!question.required"
          variant="ghost"
          size="md"
          :disabled="busy"
          @click="skip"
        >
          {{ t('grani.quiz.skip') }}
        </UiButton>
        <UiButton v-if="index > 0" variant="ghost" size="md" :disabled="busy" @click="back">
          {{ t('grani.quiz.back') }}
        </UiButton>
      </div>
    </template>
  </form>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, reactive, ref, useId, useSlots, watch } from 'vue'
import { CornerDownLeft } from '@lucide/vue'
import { useToast } from '../composables/useToast'
import { useUiT } from '../composables/useUiT'
import type { QuizAnswers, QuizKeys, QuizQuestion } from '../types/ui'
import { cardShellClass } from '../utils/cardShell'
import { isDev, warnOnce } from '../utils/dev'
import { TYPED_FIELD } from '../utils/focusInvalid'
import { isHeldPress } from '../utils/held'
import { isImeKey } from '../utils/ime'
import { useSlotsSeen } from '../utils/slotsSeen'
import UiButton from './UiButton.vue'
import UiInput from './UiInput.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** The questions, in the order they are asked. */
    questions: QuizQuestion[]
    /** The answers by question name (`v-model`): an answer or `null`, a list for a question with `multiple`. */
    modelValue: QuizAnswers
    /** The question shown, from 0 (`v-model:step`). Unset, the quiz keeps it itself and starts at the first. */
    step?: number
    /** The keys the answers answer to: the digits, the letters from A, or none, which also hides the caps. */
    keys?: QuizKeys
    /** Sends the answers from the last question. The quiz waits for it; a rejection keeps the question and raises a toast. */
    action?: (answers: QuizAnswers) => unknown
    /** The last question's button, the act itself: "Save plan" beats "Send". */
    submitLabel?: string
    /** @deprecated The name `submitLabel` had in 0.2.0: it still works, and goes in the next minor. */
    sendLabel?: string
    /** `outline` is a card of its own, its top edge the progress; `plain` draws no card and no edge, for a window or a drawer that already frames it. */
    variant?: 'outline' | 'plain'
  }>(),
  {
    step: undefined,
    keys: 'numbers',
    action: undefined,
    submitLabel: '',
    sendLabel: '',
    variant: 'outline',
  },
)

const emit = defineEmits<{
  /** An answer changed: all the answers, by question name. */
  'update:modelValue': [answers: QuizAnswers]
  /** Another question is shown: its index from 0. */
  'update:step': [step: number]
  /** The answers were sent: after `action` settled, or at once without one. */
  submit: [answers: QuizAnswers]
}>()

const slots = defineSlots<{
  /** What stands in place of the questions after a send: a thank-you, what happens next. */
  done(props: Record<string, never>): any
}>()
// Read again before every render: a `#done` that comes after the send is seen (utils/slotsSeen).
const seen = useSlotsSeen(slots ?? useSlots())

const { t } = useUiT()
const toast = useToast()
const uid = useId()

// The answers stand under the question's name and an answer is told by its value: two of either
// read as one. Said once per app and name, in development.
if (isDev()) {
  const app = getCurrentInstance()?.appContext.app
  if (props.sendLabel)
    warnOnce(
      app,
      'UiQuiz:sendLabel',
      '[grani] UiQuiz: `sendLabel` is `submitLabel` now, as a drawer names its button. The old name works in 0.2 and goes in the next minor.',
    )
  watch(
    () => props.questions,
    (questions) => {
      const names = new Set<string>()
      for (const q of questions) {
        if (names.has(q.name))
          warnOnce(
            app,
            `UiQuiz:name:${q.name}`,
            `[grani] UiQuiz has two questions named ${JSON.stringify(q.name)}: their answers stand under one key. Give each question its own name.`,
          )
        names.add(q.name)
        const values = new Set<string>()
        for (const o of q.options) {
          if (values.has(o.value))
            warnOnce(
              app,
              `UiQuiz:value:${q.name}:${o.value}`,
              `[grani] UiQuiz: the question ${JSON.stringify(q.name)} has two answers with the value ${JSON.stringify(o.value)}: choosing one chooses both. Give each answer its own value.`,
            )
          values.add(o.value)
          if (o.value === '')
            warnOnce(
              app,
              `UiQuiz:empty:${q.name}`,
              `[grani] UiQuiz: the question ${JSON.stringify(q.name)} has an answer with an empty value, which reads as no answer and cannot be chosen. Give the answer a value of its own.`,
            )
        }
      }
    },
    { immediate: true },
  )
}

// One definition of a key cap: the answer's key before its text, and Enter beside Next.
const KEYCAP =
  'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-badge border border-b-2 border-border bg-surface px-1 font-mono text-xs/none text-fg-muted'

const groupRef = ref<HTMLElement | null>(null)
const doneRef = ref<HTMLElement | null>(null)
const otherRef = ref<InstanceType<typeof UiInput> | null>(null)

const ownStep = ref(0)
const index = computed(() =>
  Math.min(Math.max(props.step ?? ownStep.value, 0), Math.max(props.questions.length - 1, 0)),
)
const question = computed(() => props.questions[index.value])
const last = computed(() => index.value === props.questions.length - 1)
// A segment per question while each is long enough to read as one.
const segmented = computed(() => props.questions.length <= 12)
const progressText = computed(() =>
  t('grani.quiz.progress', { n: index.value + 1, max: props.questions.length }),
)

const tried = ref(false)
// The error belongs to the question it was raised on, also when the app turns the page or puts
// another question in its place.
watch(
  () => question.value?.name,
  () => (tried.value = false),
)
// Which send is the current one: a restart leaves an earlier send's answer to nobody.
let run = 0
const busy = ref(false)
const sent = ref(false)
const finished = computed(() => sent.value && Boolean(seen.done))
// The edge stands in for the card's top border only while there is a question to count.
const edged = computed(
  () => props.variant === 'outline' && !finished.value && Boolean(question.value),
)

/** What the answers hold for a question, as a list, whatever its kind. */
function held(q: QuizQuestion, answers: QuizAnswers = props.modelValue): string[] {
  const answer = answers[q.name]
  if (Array.isArray(answer)) return answer
  return answer == null || answer === '' ? [] : [answer]
}
const offered = (q: QuizQuestion, value: string) => q.options.some((o) => o.value === value)
/**
 * The answer no option stands for, one's own: the first such value, and only where the question
 * takes one. Any other value no option has (an option the app removed since) is no answer.
 */
const ownOf = (q: QuizQuestion, answers: QuizAnswers = props.modelValue) =>
  (q.other && held(q, answers).find((value) => !offered(q, value))) || ''
/** The answers that count: the options chosen and the answer of one's own. */
function picked(q: QuizQuestion, answers: QuizAnswers = props.modelValue): string[] {
  const own = ownOf(q, answers)
  return held(q, answers).filter((value) => offered(q, value) || value === own)
}

// What stands in the field while it is not the answer: the text typed before a tile was chosen.
const drafts = reactive<Record<string, string>>({})
const draft = computed(() => {
  const q = question.value
  if (!q) return ''
  const own = ownOf(q)
  const typed = drafts[q.name]
  if (typed === undefined) return own
  // The app's answer wins over a draft it does not match: an answer restored, or set from outside.
  if (own) return typed.trim() === own ? typed : own
  // Not the answer: the text stays only beside a tile chosen after it, never beside no answer.
  return picked(q).length > 0 ? typed : ''
})
const ownChosen = computed(() => Boolean(question.value && ownOf(question.value)))
const otherLabel = computed(() => {
  const other = question.value?.other
  return typeof other === 'string' && other ? other : t('grani.quiz.other')
})

const answered = (q: QuizQuestion, answers: QuizAnswers = props.modelValue) =>
  picked(q, answers).length > 0
const failed = computed(
  () => tried.value && Boolean(question.value?.required) && !answered(question.value!),
)
const describedBy = computed(() =>
  [
    `${uid}-count`,
    question.value?.description ? `${uid}-description` : '',
    `${uid}-hint`,
    failed.value ? `${uid}-error` : '',
  ]
    .filter(Boolean)
    .join(' '),
)

const chosen = (value: string) => Boolean(question.value && picked(question.value).includes(value))

function capOf(i: number): string {
  if (props.keys === 'none' || i > 8) return ''
  return props.keys === 'letters' ? String.fromCharCode(65 + i) : String(i + 1)
}

function set(q: QuizQuestion, answer: string | string[] | null) {
  emit('update:modelValue', { ...props.modelValue, [q.name]: answer })
}

// The browser checks a radio or a box before the app hears of it. If the app refuses the answer,
// nothing reactive moves, and the input would stay on what was pressed while the tile shows what
// is held: after the app's turn every mark goes back to the answers.
const marks = () => [
  ...(groupRef.value?.querySelectorAll<HTMLInputElement>(
    'input[type="radio"], input[type="checkbox"]',
  ) ?? []),
]
const settle = () =>
  void nextTick(() => {
    for (const mark of marks()) mark.checked = chosen(mark.value)
  })
// A form reset unchecks them too and fires no change: the browser writes after the event.
const onReset = () => setTimeout(settle)

function pick(value: string) {
  const q = question.value
  if (!q || busy.value) return
  settle()
  if (!q.multiple) return set(q, value)
  const now = held(q)
  set(q, now.includes(value) ? now.filter((v) => v !== value) : [...now, value])
}

function setOther(text: string) {
  const q = question.value
  if (!q || busy.value) return
  drafts[q.name] = text
  const own = text.trim()
  if (q.multiple) {
    // In the place of the text before it; whatever else the list holds stays as it is. Text that
    // names a value already there is that value, once.
    const was = ownOf(q)
    const rest = held(q).filter((value) => value !== was)
    const fresh = own && !rest.includes(own) ? [own] : []
    const at = was ? held(q).indexOf(was) : rest.length
    set(q, [...rest.slice(0, at), ...fresh, ...rest.slice(at)])
  } else if (own) set(q, own)
  else if (ownOf(q)) set(q, null)
}

// A press in a field that holds text, or its key: in a question of one answer the text is the
// answer again. Never the focus alone: on the way to Next by Tab it passes through the field.
function reclaim() {
  const q = question.value
  if (!q || q.multiple || busy.value) return
  const own = draft.value.trim()
  if (own && props.modelValue[q.name] !== own) set(q, own)
}

/** The focus goes to the chosen answer, the field while it is the answer, or the first answer. */
function focusAnswer() {
  const group = groupRef.value
  if (!group) return
  const on = marks().filter((input) => !input.disabled)
  const mark = on.find((input) => chosen(input.value))
  if (mark) mark.focus()
  else if (ownChosen.value) otherRef.value?.focus()
  else on[0]?.focus()
}

function go(to: number) {
  tried.value = false
  ownStep.value = to
  emit('update:step', to)
  void nextTick(focusAnswer)
}

async function send(held: QuizAnswers) {
  // What is sent names every question: `null`, or an empty list, where no answer was given.
  const answers: QuizAnswers = { ...held }
  for (const q of props.questions) answers[q.name] ??= q.multiple ? [] : null
  const mine = ++run
  busy.value = true
  try {
    await props.action?.(answers)
  } catch {
    if (mine !== run) return
    busy.value = false
    toast.error(t('grani.quiz.failed'))
    void nextTick(focusAnswer)
    return
  }
  if (mine !== run) return
  busy.value = false
  sent.value = true
  emit('submit', answers)
  // The answer that had the focus was off while the send ran, and the focus fell to the page.
  void nextTick(() => (finished.value ? doneRef.value?.focus() : focusAnswer()))
}

function advance(answers: QuizAnswers = props.modelValue) {
  if (!last.value) return go(index.value + 1)
  // A send answers for the whole quiz, not for the question it was pressed on: an app may open the
  // last question over an earlier one left empty.
  const empty = props.questions.findIndex((q) => q.required && !answered(q, answers))
  if (empty < 0) return void send(answers)
  if (empty !== index.value) go(empty)
  // After the page has turned: the turn itself clears the error of the question before.
  void nextTick(() => {
    tried.value = true
    void nextTick(focusAnswer)
  })
}

function onSubmit() {
  const q = question.value
  if (!q || busy.value || finished.value) return
  if (q.required && !answered(q)) {
    tried.value = true
    void nextTick(focusAnswer)
    return
  }
  advance()
}

function skip() {
  const q = question.value
  if (!q || busy.value) return
  delete drafts[q.name]
  if (!answered(q)) return advance()
  // The quiz reads the answers from its props, which Vue hands it on the next render: until then
  // they still hold the answer cleared here, so the send takes the cleared answers itself.
  const cleared = { ...props.modelValue, [q.name]: q.multiple ? [] : null }
  emit('update:modelValue', cleared)
  advance(cleared)
}

function back() {
  if (busy.value || index.value === 0) return
  go(index.value - 1)
}

/** Which answer a key names, by the physical key: a letter answers on any layout. */
function indexOfKey(e: KeyboardEvent): number {
  const match =
    props.keys === 'numbers'
      ? /^(?:Digit|Numpad)([1-9])$/.exec(e.code)
      : props.keys === 'letters'
        ? /^Key([A-I])$/.exec(e.code)
        : null
  if (!match) return -1
  // With NumLock off a numpad key is an arrow or Home under the same code: its key says which.
  if (e.code.startsWith('Numpad') && !/^[1-9]$/.test(e.key)) return -1
  return props.keys === 'numbers' ? Number(match[1]) - 1 : match[1]!.charCodeAt(0) - 65
}

function onKeydown(e: KeyboardEvent) {
  // A held Enter repeats the submit: its repeats press nothing.
  if (isHeldPress(e)) return e.preventDefault()
  const q = question.value
  if (!q || busy.value || finished.value || e.defaultPrevented) return
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || isImeKey(e)) return
  if ((e.target as HTMLElement).matches?.(TYPED_FIELD)) return
  const i = indexOfKey(e)
  if (i < 0) return
  if (i < q.options.length) {
    e.preventDefault()
    pick(q.options[i]!.value)
    marks()[i]?.focus()
  } else if (i === q.options.length && q.other) {
    // Prevented, or the key would be typed into the field it has just focused.
    e.preventDefault()
    otherRef.value?.focus()
    reclaim()
  }
}

defineExpose({
  /** Focuses the chosen answer of the question shown, or its first. */
  focus: () => focusAnswer(),
  /** Shows the first question again, after a send or during one, whose answer is then dropped: the step, the drafts, the error and the sent state go; the answers stay the app's. */
  restart: () => {
    run++
    for (const name of Object.keys(drafts)) delete drafts[name]
    busy.value = false
    sent.value = false
    go(0)
  },
})
</script>
