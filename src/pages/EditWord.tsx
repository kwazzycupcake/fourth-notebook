import { usePageTitle } from '../lib/usePageTitle'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ButtonLink } from '../components/Button'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import WordForm from '../components/WordForm'
import { usedTitles } from '../lib/titles'
import { formFromWord, formToInput, type FormValues } from '../lib/wordForm'
import { useNotebook } from '../store/context'

export default function EditWord() {
  usePageTitle('Edit word')
  const { id } = useParams()
  const navigate = useNavigate()
  const { words, updateWord } = useNotebook()
  const word = words.find((w) => w.id === id)
  const [values, setValues] = useState<FormValues | null>(() => (word ? formFromWord(word) : null))
  const titles = useMemo(() => usedTitles(words), [words])

  // Go back where you came from, or to the library if you opened this page directly.
  const leave = () => (window.history.length > 1 ? navigate(-1) : navigate('/library'))

  if (!word || !values) {
    return (
      <EmptyState illustration="book" title="This word isn't in your notebook" actions={<ButtonLink to="/library">Open library</ButtonLink>}>
        <p>It may have been deleted.</p>
      </EmptyState>
    )
  }

  return (
    <>
      <PageHeader kicker="Edit entry" title={word.word} />
      <WordForm
        values={values}
        onChange={setValues}
        onSubmit={() => {
          updateWord(word.id, formToInput(values))
          leave()
        }}
        submitLabel="Save changes"
        onCancel={leave}
        titleSuggestions={titles}
      />
    </>
  )
}
