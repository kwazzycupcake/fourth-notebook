import { usePageTitle } from '../lib/usePageTitle'
import { ButtonLink } from '../components/Button'
import Illustration from '../components/Illustration'

// Draft copy. Rewrite it in your own voice whenever you like.
export default function Story() {
  usePageTitle('Our story')
  return (
    <article className="mx-auto flex max-w-xl flex-col gap-5">
      <div className="flex justify-between border-b border-ink pb-2 text-sm">
        <span className="smallcaps">Notebook No. 4</span>
        <span className="smallcaps">Our story</span>
      </div>

      <Illustration name="notebooks" className="mx-auto w-44" />
      <h1 className="text-center text-5xl">The first three notebooks</h1>

      <p>
        When I was little, my father kept notebooks of words. He didn't copy them from the dictionary. He wrote down
        words he met that day in the newspaper or on the news, with their meanings, and revised them himself.
      </p>
      <p>He made us learn them too. When he came home from the office, he'd ask:</p>
      <p className="text-center font-hand text-3xl text-green">
        “So, what does <span className="underline decoration-1 underline-offset-4">ubiquitous</span> mean?”
      </p>
      <p>He filled three notebooks. This app is my fourth.</p>

      <div className="mt-4 flex flex-wrap justify-center gap-3 border-t border-line pt-6">
        <ButtonLink to="/add">Add a word</ButtonLink>
        <ButtonLink to="/quiz" variant="secondary">Take the evening quiz</ButtonLink>
      </div>
    </article>
  )
}
