import type { WordInput } from './types'

/** A few real words, for trying things out during development. */
export const SAMPLE_WORDS: WordInput[] = [
  {
    word: 'tirade',
    meanings: ['a long, angry speech criticizing somebody/something or blaming somebody for something'],
    partOfSpeech: 'noun',
    example: 'Feels like nowadays every conversation ends in a tirade.',
  },
  {
    word: 'atone',
    meanings: ['to show that you are sorry for doing something wrong'],
    partOfSpeech: 'verb',
    example: "You need to atone for the crimes that you've done.",
  },
  {
    word: 'forgo',
    meanings: ['to decide not to have or do something that you want'],
    partOfSpeech: 'verb',
    example: 'I gave myself ample time to make it to the office by nine if I forgo my workout.',
  },
  {
    word: 'ubiquitous',
    meanings: ['seeming to be everywhere or in several places at the same time; very common'],
    partOfSpeech: 'adjective',
    example: 'Public transport is ubiquitous.',
  },
  {
    word: 'discretion',
    meanings: [
      'the freedom and power to make decisions by yourself',
      'care in what you say and do so as not to cause embarrassment or difficulty for somebody',
    ],
    partOfSpeech: 'noun',
  },
  {
    word: 'predicament',
    meanings: ['an unpleasant and difficult situation that is hard to get out of'],
    partOfSpeech: 'noun',
    example: 'I found myself in a predicament when I lost my passport.',
  },
]
