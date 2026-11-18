import { usePageTitle } from '../lib/usePageTitle'
import { ButtonLink } from '../components/Button'
import Illustration from '../components/Illustration'

// The story behind the app. Edit freely: it should sound like you.
export default function Story() {
  usePageTitle('Our story')
  return (
    <article className="mx-auto flex max-w-xl flex-col gap-5 text-[18px] leading-relaxed">
      <div className="flex justify-between border-b border-ink pb-2 text-sm">
        <span className="smallcaps">Notebook No. 4</span>
        <span className="smallcaps">Our story</span>
      </div>

      <Illustration name="notebooks" className="mx-auto w-44" />
      <h1 className="text-center text-5xl">The first three notebooks</h1>

      <p>
        When I was little, my father kept notebooks of words. He didn't copy them out of a dictionary. They were words he
        had met that day, in the newspaper or on the news, written down one by one with their meanings. And then he did
        what most of us never do: he went back to them, again and again, until they were his.
      </p>

      <p>He didn't keep them to himself, either. He made us learn them too. When he came home from the office, there would be a question waiting for us:</p>

      <p className="py-2 text-center font-hand text-3xl leading-snug text-green">
        “So, what does <span className="underline decoration-1 underline-offset-4">ubiquitous</span> mean?”
      </p>

      <p>
        We had to answer. I didn't understand it then, but he was teaching us more than words. He was teaching us to
        notice. To stop at a word we didn't know, to be curious enough to look it up, and to care enough to remember it.
      </p>

      <p>
        Somewhere along the way, that habit became mine. Whenever I meet an interesting word, in a book, a show or a
        conversation, I look it up and write it down. Only my notebook turned into a WhatsApp chat with myself, and I
        hardly ever opened it again. I was collecting words the way he did, but I had forgotten the part that mattered
        most: coming back to them.
      </p>

      <p>
        So I made this. A place to keep the words I find, and an evening quiz that asks me what they mean, the way he
        used to.
      </p>

      <p className="mt-4 border-t border-line pt-8 text-center font-display text-3xl font-semibold leading-snug text-green">
        <span className="block text-balance">He filled three notebooks.</span>
        <span className="block text-balance">This app is my fourth.</span>
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/add">Add a word</ButtonLink>
        <ButtonLink to="/quiz" variant="secondary">Take the evening quiz</ButtonLink>
      </div>
    </article>
  )
}
