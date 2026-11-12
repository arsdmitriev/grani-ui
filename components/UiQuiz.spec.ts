import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import UiQuiz from './UiQuiz.vue'
import { useToast } from '../composables/useToast'
import type { QuizAnswers, QuizKeys, QuizQuestion } from '../types/ui'

const QUESTIONS: QuizQuestion[] = [
  {
    name: 'use',
    title: 'What will you keep?',
    description: 'It sets the first table.',
    required: true,
    other: true,
    options: [
      { value: 'invoices', label: 'Invoices', description: 'What was paid.' },
      { value: 'orders', label: 'Orders' },
      { value: 'requests', label: 'Requests' },
    ],
  },
  {
    name: 'digest',
    title: 'Who gets the digest?',
    multiple: true,
    other: 'Someone else',
    options: [
      { value: 'owners', label: 'Owners' },
      { value: 'managers', label: 'Managers' },
    ],
  },
  {
    name: 'day',
    title: 'When does the week start?',
    required: true,
    options: [
      { value: 'monday', label: 'Monday' },
      { value: 'sunday', label: 'Sunday' },
    ],
  },
]

interface Setup {
  answers?: QuizAnswers
  step?: number
  keys?: QuizKeys
  action?: (answers: QuizAnswers) => unknown
  done?: boolean
  questions?: QuizQuestion[]
}

/** An app around the quiz: it keeps the answers and the step, as `v-model` asks. */
function host(setup: Setup = {}) {
  const answers = ref<QuizAnswers>(setup.answers ?? {})
  const step = ref(setup.step ?? 0)
  const submitted = vi.fn()
  const quiz = ref<{ restart: () => void; focus: () => void } | null>(null)
  const w = mount(
    defineComponent({
      setup: () => () =>
        h(
          UiQuiz,
          {
            ref: quiz,
            questions: setup.questions ?? QUESTIONS,
            modelValue: answers.value,
            'onUpdate:modelValue': (v: QuizAnswers) => (answers.value = v),
            step: step.value,
            'onUpdate:step': (v: number) => (step.value = v),
            keys: setup.keys,
            action: setup.action,
            onSubmit: submitted,
          },
          setup.done ? { done: () => h('p', { 'data-done': '' }, 'Thank you') } : undefined,
        ),
    }),
    { attachTo: document.body },
  )
  const marks = () => w.findAll<HTMLInputElement>('input[type=radio], input[type=checkbox]')
  const field = () => w.find<HTMLInputElement>('input:not([type=radio]):not([type=checkbox])')
  const button = (name: string) => w.findAll('button').find((b) => b.text() === name)
  const next = () => w.find('form').trigger('submit')
  const key = (code: string, init: KeyboardEventInit = {}) =>
    (document.activeElement && w.element.contains(document.activeElement)
      ? (document.activeElement as HTMLElement)
      : marks()[0]!.element
    ).dispatchEvent(
      new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...init }),
    )
  return { w, answers, step, submitted, quiz, marks, field, button, next, key }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('UiQuiz', () => {
  it('shows one question: a named radiogroup of tiles, its progress, and one answer or several said', () => {
    const { w, marks } = host()
    const group = w.find('[role=radiogroup]')
    const title = document.getElementById(group.attributes('aria-labelledby')!)!
    expect(title.textContent).toContain('What will you keep?')
    const described = group.attributes('aria-describedby')!.split(' ')
    expect(described.map((id) => document.getElementById(id)!.textContent!.trim())).toEqual([
      'Question 1 of 3',
      'It sets the first table.',
      'Choose one',
    ])
    expect(group.attributes('aria-required')).toBe('true')
    expect(marks()).toHaveLength(3)
    expect(marks().every((m) => m.attributes('type') === 'radio')).toBe(true)
    const several = host({ step: 1 })
    expect(several.w.find('[role=group]').text()).toContain('Choose any that apply')
    expect(several.marks().every((m) => m.attributes('type') === 'checkbox')).toBe(true)
  })

  it('the whole tile is the target: the radio lives inside its label, description and cap included', async () => {
    const { w, answers, marks } = host()
    const tile = w.findAll('label')[0]!
    expect(tile.element.contains(marks()[0]!.element)).toBe(true)
    expect(tile.text()).toContain('What was paid.')
    expect(tile.find('kbd').text()).toBe('1')
    expect(tile.classes()).toContain('min-h-11')
    await marks()[0]!.setValue(true)
    expect(answers.value).toEqual({ use: 'invoices' })
    expect(w.findAll('label')[0]!.classes()).toContain('before:border-s-brand')
    expect(w.findAll('label')[1]!.classes()).not.toContain('before:border-s-brand')
  })

  it('a digit chooses and does not turn the page; in a question of several it sets and takes back', async () => {
    const { w, answers, step, key, marks } = host()
    key('Digit2')
    await w.vm.$nextTick()
    expect(answers.value).toEqual({ use: 'orders' })
    expect(step.value).toBe(0)
    expect(document.activeElement).toBe(marks()[1]!.element)
    key('Numpad3')
    await w.vm.$nextTick()
    expect(answers.value).toEqual({ use: 'requests' })
    const several = host({ step: 1 })
    several.key('Digit1')
    await several.w.vm.$nextTick()
    several.key('Digit2')
    await several.w.vm.$nextTick()
    expect(several.answers.value).toEqual({ digest: ['owners', 'managers'] })
    several.key('Digit1')
    await several.w.vm.$nextTick()
    expect(several.answers.value).toEqual({ digest: ['managers'] })
  })

  it('letters answer by the physical key, whatever the layout types; `none` draws no cap and hears no key', async () => {
    const lettered = host({ keys: 'letters' })
    expect(lettered.w.findAll('kbd').map((k) => k.text())).toEqual(['A', 'B', 'C', 'D', ''])
    // The Russian layout: the key A types another letter.
    lettered.key('KeyB', { key: 'и' })
    await lettered.w.vm.$nextTick()
    expect(lettered.answers.value).toEqual({ use: 'orders' })
    lettered.key('Digit1')
    await lettered.w.vm.$nextTick()
    expect(lettered.answers.value).toEqual({ use: 'orders' })
    const plain = host({ keys: 'none' })
    expect(plain.w.findAll('kbd')).toHaveLength(0)
    plain.key('Digit1')
    plain.key('KeyA')
    await plain.w.vm.$nextTick()
    expect(plain.answers.value).toEqual({})
  })

  it('the keys stay silent in the field, under a modifier, while a word is composed and on a repeat', async () => {
    const { w, answers, key, field, marks } = host()
    field().element.focus()
    key('Digit1')
    marks()[0]!.element.focus()
    key('Digit1', { metaKey: true })
    key('Digit1', { ctrlKey: true })
    key('Digit1', { altKey: true })
    key('Digit1', { isComposing: true })
    key('Digit1', { repeat: true })
    await w.vm.$nextTick()
    expect(answers.value).toEqual({})
  })

  it('the key after the last tile puts the caret in the field, and types nothing into it', async () => {
    const { w, key, field, marks } = host()
    marks()[0]!.element.focus()
    const event = new KeyboardEvent('keydown', { code: 'Digit4', bubbles: true, cancelable: true })
    marks()[0]!.element.dispatchEvent(event)
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(field().element)
    expect(event.defaultPrevented).toBe(true)
    void key
  })

  it("an answer of one's own is its text, trimmed; a tile chosen after keeps the text, and the focus back takes it again", async () => {
    const { w, answers, field, marks } = host()
    expect(field().attributes('aria-label')).toBe('Another answer')
    await field().setValue('  Contracts ')
    expect(answers.value).toEqual({ use: 'Contracts' })
    await marks()[1]!.setValue(true)
    expect(answers.value).toEqual({ use: 'orders' })
    expect(field().element.value).toBe('  Contracts ')
    await field().trigger('focus')
    expect(answers.value).toEqual({ use: 'Contracts' })
    await field().setValue('')
    expect(answers.value).toEqual({ use: null })
    void w
  })

  it("in a question of several an answer of one's own stands beside the tiles", async () => {
    const { answers, field, marks } = host({ step: 1 })
    expect(field().attributes('aria-label')).toBe('Someone else')
    await marks()[0]!.setValue(true)
    await field().setValue('Auditors')
    expect(answers.value).toEqual({ digest: ['owners', 'Auditors'] })
    await marks()[1]!.setValue(true)
    expect(answers.value).toEqual({ digest: ['owners', 'Auditors', 'managers'] })
    await field().setValue('')
    expect(answers.value).toEqual({ digest: ['owners', 'managers'] })
  })

  it('Next on a required question with no answer says so, marks the group, focuses the first answer and stays', async () => {
    const { w, step, next, marks, button } = host()
    expect(button('Next')!.attributes('disabled')).toBeUndefined()
    await next()
    await w.vm.$nextTick()
    expect(step.value).toBe(0)
    const alert = w.find('[role=alert]')
    expect(alert.text()).toBe('Choose an answer to continue.')
    const group = w.find('[role=radiogroup]')
    expect(group.attributes('aria-invalid')).toBe('true')
    expect(group.attributes('aria-describedby')).toContain(alert.attributes('id'))
    expect(document.activeElement).toBe(marks()[0]!.element)
    await marks()[2]!.setValue(true)
    expect(w.find('[role=alert]').exists()).toBe(false)
  })

  it('after a move the focus stands in the new question: on its chosen answer, else on its first', async () => {
    const { w, step, next, marks, button } = host({ answers: { use: 'orders' } })
    await next()
    await w.vm.$nextTick()
    expect(step.value).toBe(1)
    expect(document.activeElement).toBe(marks()[0]!.element)
    await button('Back')!.trigger('click')
    await w.vm.$nextTick()
    expect(step.value).toBe(0)
    expect(document.activeElement).toBe(marks()[1]!.element)
  })

  it('Skip stands only on a question that is not required, and clears its answer', async () => {
    const { w, answers, step, button } = host({ answers: { use: 'orders', digest: ['owners'] } })
    expect(button('Skip')).toBeUndefined()
    await w.find('form').trigger('submit')
    expect(step.value).toBe(1)
    await button('Skip')!.trigger('click')
    expect(answers.value).toEqual({ use: 'orders', digest: [] })
    expect(step.value).toBe(2)
  })

  it('Back checks nothing and clears nothing, and an earlier answer changed leaves the later ones', async () => {
    const { w, answers, step, button, marks } = host({
      answers: { use: 'orders', digest: ['owners'] },
      step: 2,
    })
    expect(button('Back')).toBeDefined()
    await button('Back')!.trigger('click')
    await button('Back')!.trigger('click')
    expect(step.value).toBe(0)
    expect(button('Back')).toBeUndefined()
    await marks()[0]!.setValue(true)
    expect(answers.value).toEqual({ use: 'invoices', digest: ['owners'] })
    void w
  })

  it("resumes where the app left it: the step, the answers, and an answer of one's own back in its field", async () => {
    const { w, field, button, step } = host({ answers: { use: 'Contracts' }, step: 1 })
    expect(w.text()).toContain('Who gets the digest?')
    await button('Back')!.trigger('click')
    expect(step.value).toBe(0)
    expect(field().element.value).toBe('Contracts')
  })

  it('a step past the last question shows the last; an answer under an unknown name is left alone', async () => {
    const { w, answers, marks } = host({ answers: { gone: 'x' }, step: 9 })
    expect(w.text()).toContain('When does the week start?')
    await marks()[0]!.setValue(true)
    expect(answers.value).toEqual({ gone: 'x', day: 'monday' })
  })

  it('keeps the step itself when the app gives none', async () => {
    const answers = ref<QuizAnswers>({ use: 'orders' })
    const w = mount(UiQuiz, {
      props: { questions: QUESTIONS, modelValue: answers.value },
      attachTo: document.body,
    })
    await w.find('form').trigger('submit')
    expect(w.text()).toContain('Who gets the digest?')
    expect(w.emitted('update:step')).toEqual([[1]])
  })

  it('the last question sends once: the button busy, the tiles still, a second press and a held Enter nothing', async () => {
    let release = () => {}
    const action = vi.fn(() => new Promise<void>((resolve) => (release = resolve)))
    const { w, answers, submitted, next, marks, key } = host({
      answers: { use: 'orders', day: 'monday' },
      step: 2,
      action,
      done: true,
    })
    await next()
    await next()
    expect(action).toHaveBeenCalledTimes(1)
    expect(action).toHaveBeenCalledWith({ use: 'orders', day: 'monday' })
    expect(w.find('form').attributes('aria-busy')).toBe('true')
    expect(w.find('button[type=submit]').attributes('aria-busy')).toBe('true')
    expect(marks().every((m) => m.element.disabled)).toBe(true)
    key('Digit2')
    await w.vm.$nextTick()
    expect(answers.value).toEqual({ use: 'orders', day: 'monday' })
    expect(submitted).not.toHaveBeenCalled()
    release()
    await flushPromises()
    expect(submitted).toHaveBeenCalledWith({ use: 'orders', day: 'monday' })
    expect(w.find('[data-done]').text()).toBe('Thank you')
    expect(w.find('[role=radiogroup]').exists()).toBe(false)
    expect(document.activeElement).toBe(w.find('[data-done]').element.parentElement)
  })

  it('a held Enter is one press: its repeats are prevented', () => {
    const { marks } = host()
    const repeat = new KeyboardEvent('keydown', {
      key: 'Enter',
      repeat: true,
      bubbles: true,
      cancelable: true,
    })
    marks()[0]!.element.dispatchEvent(repeat)
    expect(repeat.defaultPrevented).toBe(true)
    const first = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })
    marks()[0]!.element.dispatchEvent(first)
    expect(first.defaultPrevented).toBe(false)
  })

  it('a failed send keeps the last question and its answers, and says so in a toast', async () => {
    const toast = useToast()
    const { w, answers, submitted, next } = host({
      answers: { use: 'orders', day: 'monday' },
      step: 2,
      action: () => Promise.reject(new Error('offline')),
      done: true,
    })
    await next()
    await flushPromises()
    expect(toast.toasts.value.map((x) => [x.tone, x.title])).toEqual([
      ['danger', 'Could not send the answers'],
    ])
    toast.close()
    expect(submitted).not.toHaveBeenCalled()
    expect(w.text()).toContain('When does the week start?')
    expect(answers.value).toEqual({ use: 'orders', day: 'monday' })
    expect(w.find('form').attributes('aria-busy')).toBeUndefined()
    expect(w.find('[data-done]').exists()).toBe(false)
  })

  it('without an action it tells the app at once; without `#done` the last question stays', async () => {
    const { w, submitted, next } = host({ answers: { use: 'orders', day: 'sunday' }, step: 2 })
    await next()
    await flushPromises()
    expect(submitted).toHaveBeenCalledWith({ use: 'orders', day: 'sunday' })
    expect(w.text()).toContain('When does the week start?')
  })

  it('restart brings the first question back after a send', async () => {
    const { w, quiz, next, step } = host({
      answers: { use: 'orders', day: 'sunday' },
      step: 2,
      done: true,
    })
    await next()
    await flushPromises()
    expect(w.find('[data-done]').exists()).toBe(true)
    quiz.value!.restart()
    await w.vm.$nextTick()
    expect(step.value).toBe(0)
    expect(w.text()).toContain('What will you keep?')
  })

  it('Skip on the last question sends the answers without the one it cleared', async () => {
    const action = vi.fn()
    const optional: QuizQuestion[] = [
      { name: 'day', title: 'When?', options: [{ value: 'monday', label: 'Monday' }] },
    ]
    const { answers, submitted, button } = host({
      questions: optional,
      answers: { day: 'monday' },
      action,
    })
    await button('Skip')!.trigger('click')
    await flushPromises()
    expect(action).toHaveBeenCalledWith({ day: null })
    expect(submitted).toHaveBeenCalledWith({ day: null })
    expect(answers.value).toEqual({ day: null })
  })

  it('answers emptied by the app leave no text in the field, and restart forgets the drafts', async () => {
    const { w, answers, field, quiz } = host()
    await field().setValue('Contracts')
    expect(field().element.value).toBe('Contracts')
    answers.value = {}
    await w.vm.$nextTick()
    expect(field().element.value).toBe('')
    await field().setValue('Leases')
    await w.findAll<HTMLInputElement>('input[type=radio]')[0]!.setValue(true)
    expect(field().element.value).toBe('Leases')
    quiz.value!.restart()
    answers.value = {}
    await w.vm.$nextTick()
    expect(field().element.value).toBe('')
  })

  it("an answer of one's own that names a tile is that tile, once", async () => {
    const { answers, field, marks } = host({ step: 1 })
    await marks()[0]!.setValue(true)
    await field().setValue('owners')
    expect(answers.value).toEqual({ digest: ['owners'] })
  })

  it('a chosen answer of a question with one answer is not taken back by a second press', async () => {
    const { answers, marks } = host({ answers: { use: 'orders' } })
    await marks()[1]!.trigger('click')
    await marks()[1]!.trigger('change')
    expect(answers.value).toEqual({ use: 'orders' })
  })

  it('required and invalid are said on a radiogroup only: a group of several does not take them', async () => {
    const several: QuizQuestion[] = [
      {
        name: 'who',
        title: 'Who?',
        multiple: true,
        required: true,
        options: [{ value: 'owners', label: 'Owners' }],
      },
    ]
    const { w, next } = host({ questions: several })
    await next()
    await w.vm.$nextTick()
    const group = w.find('[role=group]')
    expect(group.attributes('aria-required')).toBeUndefined()
    expect(group.attributes('aria-invalid')).toBeUndefined()
    expect(group.attributes('aria-describedby')).toContain(w.find('[role=alert]').attributes('id'))
  })

  it('after a send with no `#done` the focus is back on the answer it fell from', async () => {
    const { w, next, marks } = host({
      answers: { use: 'orders', day: 'sunday' },
      step: 2,
      // A browser drops the focus of an answer turned off for the send; the test page does not.
      action: () => {
        ;(document.activeElement as HTMLElement).blur()
        return Promise.resolve()
      },
    })
    marks()[1]!.element.focus()
    await next()
    await flushPromises()
    await w.vm.$nextTick()
    expect(document.activeElement).toBe(marks()[1]!.element)
  })

  it('a step set by the app opens its question without the error of the one before', async () => {
    const { w, step, next } = host()
    await next()
    expect(w.find('[role=alert]').exists()).toBe(true)
    step.value = 2
    await w.vm.$nextTick()
    expect(w.text()).toContain('When does the week start?')
    expect(w.find('[role=alert]').exists()).toBe(false)
  })

  it("the count stands over the question, and the card's top edge fills a segment per question", async () => {
    const { w, next } = host({ answers: { use: 'orders' } })
    expect(w.find('form').classes()).toContain('rounded-card')
    expect(w.find('form').classes()).toContain('border-t-transparent')
    expect(w.text()).toContain('Question 1 of 3')
    const edge = () => w.find('.ui-progress')
    const lit = () =>
      edge()
        .findAll('span')
        .map((s) => s.attributes('data-filled') !== undefined)
    expect(lit()).toEqual([true, false, false])
    // For the eye: a reader has the count, and hears it once.
    expect(edge().element.parentElement!.getAttribute('aria-hidden')).toBe('true')
    expect(w.find('[role=progressbar]').exists()).toBe(false)
    await next()
    expect(lit()).toEqual([true, true, false])
    expect(w.text()).toContain('Question 2 of 3')
  })

  it('the edge keeps the hook forced colors draw a progress by, the reached part marked', () => {
    const { w } = host({ step: 1 })
    const edge = w.find('.ui-progress')
    expect(edge.findAll('[data-filled]')).toHaveLength(2)
    expect(edge.findAll('span')).toHaveLength(3)
  })

  it('past twelve questions the edge is one line, as long as the part done', () => {
    const many: QuizQuestion[] = Array.from({ length: 20 }, (_, i) => ({
      name: `q${i}`,
      title: `Question ${i}`,
      options: [{ value: 'a', label: 'A' }],
    }))
    const { w } = host({ questions: many, step: 4 })
    const fill = w.find('.ui-progress').findAll('span')
    expect(fill).toHaveLength(1)
    expect(fill[0]!.attributes('data-filled')).toBeDefined()
    expect(fill[0]!.attributes('style')).toContain('width: 25%')
  })

  it('`plain` draws no card and no edge, and keeps the count', () => {
    const w = mount(UiQuiz, {
      props: { questions: QUESTIONS, modelValue: {}, variant: 'plain' },
    })
    expect(w.find('form').classes()).not.toContain('rounded-card')
    expect(w.find('.ui-progress').exists()).toBe(false)
    expect(w.text()).toContain('Question 1 of 3')
  })

  it('after a send with `#done` the card has its top border back, the edge gone', async () => {
    const { w, next } = host({ answers: { use: 'orders', day: 'sunday' }, step: 2, done: true })
    await next()
    await flushPromises()
    expect(w.find('[data-done]').exists()).toBe(true)
    expect(w.find('.ui-progress').exists()).toBe(false)
    expect(w.find('form').classes()).not.toContain('border-t-transparent')
  })

  it('restart forgets a draft the answers do not hold: the field is empty beside the tile kept', async () => {
    const { w, answers, field, marks, quiz } = host()
    await field().setValue('Leases')
    await marks()[0]!.setValue(true)
    expect(field().element.value).toBe('Leases')
    quiz.value!.restart()
    await w.vm.$nextTick()
    expect(answers.value).toEqual({ use: 'invoices' })
    expect(field().element.value).toBe('')
  })

  it('a send checks every question: an earlier required one with no answer is opened, and nothing is sent', async () => {
    const action = vi.fn()
    const { w, step, submitted, next } = host({ answers: { day: 'monday' }, step: 2, action })
    await next()
    await flushPromises()
    expect(action).not.toHaveBeenCalled()
    expect(submitted).not.toHaveBeenCalled()
    expect(step.value).toBe(0)
    expect(w.text()).toContain('What will you keep?')
    expect(w.find('[role=alert]').text()).toBe('Choose an answer to continue.')
  })

  it('Skip on the last question goes through the same check', async () => {
    const action = vi.fn()
    const tail: QuizQuestion[] = [QUESTIONS[0]!, QUESTIONS[1]!]
    const { step, button } = host({ questions: tail, answers: {}, step: 1, action })
    await button('Skip')!.trigger('click')
    await flushPromises()
    expect(action).not.toHaveBeenCalled()
    expect(step.value).toBe(0)
  })

  it('a value no option has is an answer only where the question takes one of its own', async () => {
    const closed: QuizQuestion[] = [
      {
        name: 'day',
        title: 'When?',
        required: true,
        options: [{ value: 'monday', label: 'Monday' }],
      },
      { name: 'more', title: 'More?', options: [{ value: 'yes', label: 'Yes' }] },
    ]
    // An option the app has since removed: nothing is chosen, so nothing is answered.
    const { w, answers, step, next } = host({ questions: closed, answers: { day: 'friday' } })
    expect(w.findAll('input:checked')).toHaveLength(0)
    await next()
    expect(step.value).toBe(0)
    expect(w.find('[role=alert]').exists()).toBe(true)
    expect(answers.value).toEqual({ day: 'friday' })
  })

  it("only the first unknown value of a list is one's own: typing replaces it and keeps the rest", async () => {
    const { answers, field } = host({ answers: { digest: ['one', 'owners', 'two'] }, step: 1 })
    expect(field().element.value).toBe('one')
    await field().setValue('three')
    expect(answers.value).toEqual({ digest: ['three', 'owners', 'two'] })
    expect(field().element.value).toBe('three')
    await field().setValue('')
    expect(answers.value).toEqual({ digest: ['owners', 'two'] })
  })

  it('restart during a send drops it: the old answer shows nothing and tells the app nothing', async () => {
    let release = () => {}
    const { w, quiz, step, submitted, next } = host({
      answers: { use: 'orders', day: 'monday' },
      step: 2,
      action: () => new Promise<void>((resolve) => (release = resolve)),
      done: true,
    })
    await next()
    quiz.value!.restart()
    await w.vm.$nextTick()
    expect(step.value).toBe(0)
    expect(w.find('form').attributes('aria-busy')).toBeUndefined()
    release()
    await flushPromises()
    expect(w.find('[data-done]').exists()).toBe(false)
    expect(submitted).not.toHaveBeenCalled()
    expect(w.text()).toContain('What will you keep?')
  })

  it('a send that fails after a restart raises no toast', async () => {
    const toast = useToast()
    let fail = () => {}
    const { w, quiz, next } = host({
      answers: { use: 'orders', day: 'monday' },
      step: 2,
      action: () => new Promise<void>((_, reject) => (fail = () => reject(new Error('late')))),
    })
    await next()
    quiz.value!.restart()
    fail()
    await flushPromises()
    expect(toast.toasts.value).toHaveLength(0)
    void w
  })

  it('with no questions it draws nothing', () => {
    const { w } = host({ questions: [] })
    expect(w.find('form').exists()).toBe(false)
    expect(w.text()).toBe('')
  })

  it('a question replaced under the same step loses the error of the one before', async () => {
    const list = ref<QuizQuestion[]>([QUESTIONS[0]!])
    const w = mount(
      defineComponent({
        setup: () => () => h(UiQuiz, { questions: list.value, modelValue: {} }),
      }),
      { attachTo: document.body },
    )
    await w.find('form').trigger('submit')
    expect(w.find('[role=alert]').exists()).toBe(true)
    list.value = [QUESTIONS[2]!]
    await w.vm.$nextTick()
    expect(w.text()).toContain('When does the week start?')
    expect(w.find('[role=alert]').exists()).toBe(false)
  })

  it('in development it names questions that share a name and answers that share a value', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const twice: QuizQuestion[] = [
      {
        name: 'day',
        title: 'A',
        options: [
          { value: 'x', label: 'X' },
          { value: 'x', label: 'Again' },
        ],
      },
      { name: 'day', title: 'B', options: [{ value: 'y', label: 'Y' }] },
    ]
    host({ questions: twice })
    const said = warn.mock.calls.map((c) => String(c[0])).join('\n')
    expect(said).toContain('two questions named "day"')
    expect(said).toContain('"day" has two answers with the value "x"')
    warn.mockRestore()
  })

  it('caps stop at nine answers: the tenth has none and no key', () => {
    const many: QuizQuestion[] = [
      {
        name: 'n',
        title: 'Pick',
        options: Array.from({ length: 10 }, (_, i) => ({ value: `v${i}`, label: `Answer ${i}` })),
      },
    ]
    const { w } = host({ questions: many })
    expect(w.findAll('label kbd').map((k) => k.text())).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
    ])
  })
})
