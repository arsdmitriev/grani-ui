<script lang="ts">
export const blurb =
  'Ask a few questions one at a time, such as a short survey or the setup of a new workspace, and answer each by a tile, a key or a line of your own.'
</script>

<script setup lang="ts">
import { ref } from 'vue'
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
const failing = ref<QuizAnswers>({ use: 'orders', digest: [], day: 'monday' })
const failingStep = ref(2)
</script>

<template>
  <DemoBlock title="Base">
    <UiQuiz
      ref="baseRef"
      v-model="base"
      :questions="questions"
      :action="save"
      send-label="Create workspace"
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
  <DemoBlock title="Failed send">
    <UiQuiz
      v-model="failing"
      v-model:step="failingStep"
      :questions="questions"
      :action="refuse"
      class="w-full max-w-xl"
    />
  </DemoBlock>
</template>
