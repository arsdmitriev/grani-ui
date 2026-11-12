<script lang="ts">
export const blurb =
  'Ask a few questions one at a time, such as a short survey or the setup of a new workspace, and answer each by a tile, a key or a line of your own.'
</script>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { QuizAnswers, QuizQuestion } from '../types/ui'

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
const refuse = async () => {
  await wait(900)
  throw new Error('offline')
}

const base = ref<QuizAnswers>({})
const baseRef = ref<{ restart: () => void } | null>(null)
function again() {
  base.value = {}
  baseRef.value?.restart()
}
const framed = ref<QuizAnswers>({})
const letters = ref<QuizAnswers>({})
const capless = ref<QuizAnswers>({})
// What an app saved yesterday: the second question, and an answer of the person's own.
const saved = ref<QuizAnswers>({ use: 'Contracts', digest: ['owners'] })
const savedStep = ref(1)
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
const windowed = ref(false)
const inWindow = ref<QuizAnswers>({})
function closeWindow() {
  windowed.value = false
  inWindow.value = {}
}
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
  <DemoBlock title="Base">
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
  </DemoBlock>
  <DemoBlock title="Plain">
    <!-- A window frames the quiz already: no card and no edge of its own, the count stays. -->
    <UiCard title="Set up the workspace" class="w-full max-w-xl">
      <UiQuiz v-model="framed" :questions="questions" variant="plain" />
    </UiCard>
  </DemoBlock>
  <DemoBlock title="Letters">
    <UiQuiz v-model="letters" :questions="questions" keys="letters" class="w-full max-w-xl" />
  </DemoBlock>
  <DemoBlock title="No keys">
    <UiQuiz v-model="capless" :questions="questions" keys="none" class="w-full max-w-xl" />
  </DemoBlock>
  <DemoBlock title="Resumed">
    <!-- The app keeps the answers and the step: the quiz opens on the second question, the answer
         of one's own back in its field on the first. -->
    <UiQuiz
      v-model="saved"
      v-model:step="savedStep"
      :questions="questions"
      class="w-full max-w-xl"
    />
  </DemoBlock>
  <DemoBlock title="Sending">
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
  </DemoBlock>
  <DemoBlock title="In a window">
    <!-- The window frames it and names it: `plain`, and a window with no form of its own, so
         Enter is the quiz's. -->
    <UiButton variant="outline" @click="windowed = true">Set up the workspace</UiButton>
    <UiModal v-model:open="windowed" title="Set up the workspace" size="md">
      <UiQuiz v-model="inWindow" :questions="questions" variant="plain" @submit="closeWindow" />
    </UiModal>
  </DemoBlock>
  <DemoBlock title="Long text">
    <UiQuiz v-model="longAnswers" :questions="long" class="w-full max-w-xl" />
  </DemoBlock>
</template>
